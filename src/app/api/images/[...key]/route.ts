import { NextRequest, NextResponse } from "next/server";
import { getFromS3 } from "@/lib/s3";

type Props = {
  params: Promise<{ key: string[] }>;
};

export async function GET(_req: NextRequest, { params }: Props) {
  const { key } = await params;
  const objectKey = key.join("/");

  try {
    const res = await getFromS3(objectKey);
    const body = await res.Body?.transformToByteArray();

    if (!body) {
      return NextResponse.json({ error: "Imagen no encontrada" }, { status: 404 });
    }

    return new NextResponse(Buffer.from(body), {
      headers: {
        "Content-Type": res.ContentType || "image/jpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Imagen no encontrada" }, { status: 404 });
  }
}
