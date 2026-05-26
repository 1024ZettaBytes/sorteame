import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { uploadToS3, getImageKey } from "@/lib/s3";
import { prisma } from "@/lib/prisma";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const formData = await req.formData();
  const raffleId = formData.get("raffleId") as string | null;

  if (!raffleId) {
    return NextResponse.json({ error: "raffleId requerido" }, { status: 400 });
  }

  // Verify raffle exists
  const raffle = await prisma.raffle.findUnique({ where: { id: raffleId } });
  if (!raffle) {
    return NextResponse.json({ error: "Sorteo no encontrado" }, { status: 404 });
  }

  const files = formData.getAll("files") as File[];

  if (files.length === 0) {
    return NextResponse.json({ error: "No se enviaron archivos" }, { status: 400 });
  }

  if (files.length > 10) {
    return NextResponse.json({ error: "Máximo 10 imágenes" }, { status: 400 });
  }

  const uploaded: { id: string; key: string }[] = [];

  // Get current max order
  const lastImage = await prisma.raffleImage.findFirst({
    where: { raffleId },
    orderBy: { order: "desc" },
  });
  let nextOrder = (lastImage?.order ?? -1) + 1;

  for (const file of files) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Tipo no permitido: ${file.type}. Usa JPG, PNG, WebP o GIF.` },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: `Archivo demasiado grande (máx 5MB): ${file.name}` },
        { status: 400 }
      );
    }

    const key = getImageKey(raffleId, file.name);
    const buffer = await file.arrayBuffer();

    await uploadToS3(key, buffer, file.type);

    const image = await prisma.raffleImage.create({
      data: {
        key,
        order: nextOrder++,
        raffleId,
      },
    });

    uploaded.push({ id: image.id, key: image.key });
  }

  return NextResponse.json({ success: true, images: uploaded });
}
