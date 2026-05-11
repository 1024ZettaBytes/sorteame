"use server";

import { prisma } from "@/lib/prisma";
import { formatTicketNumber } from "@/lib/utils";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export type CreateRaffleInput = {
  nombre: string;
  fechaSorteo: string; // ISO string
  whatsapp: string;
  totalNumeros: number;
  precioBoleto: number;
};

export type RaffleResult =
  | { success: true; raffleId: string }
  | { success: false; error: string };

/**
 * Creates a new raffle and generates all ticket numbers.
 */
export async function createRaffle(input: CreateRaffleInput): Promise<RaffleResult> {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "No autorizado." };
  }

  const { nombre, fechaSorteo, whatsapp, totalNumeros, precioBoleto } = input;

  if (!nombre.trim() || !whatsapp.trim() || totalNumeros < 1 || precioBoleto < 0) {
    return { success: false, error: "Datos inválidos." };
  }

  if (totalNumeros > 100000) {
    return { success: false, error: "El máximo de números es 100,000." };
  }

  try {
    const raffle = await prisma.raffle.create({
      data: {
        nombre: nombre.trim(),
        fechaSorteo: new Date(fechaSorteo),
        whatsapp: whatsapp.trim(),
        totalNumeros,
        precioBoleto,
      },
    });

    // Batch-insert all ticket numbers
    const BATCH_SIZE = 1000;
    for (let i = 0; i < totalNumeros; i += BATCH_SIZE) {
      const batch = [];
      const end = Math.min(i + BATCH_SIZE, totalNumeros);
      for (let n = i; n < end; n++) {
        batch.push({
          raffleId: raffle.id,
          numero: formatTicketNumber(n, totalNumeros),
        });
      }
      await prisma.ticket.createMany({ data: batch });
    }

    revalidatePath("/admin");
    revalidatePath("/admin/raffles");
    return { success: true, raffleId: raffle.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al crear el sorteo.";
    return { success: false, error: message };
  }
}

/**
 * Deletes a raffle and all its tickets (cascade).
 */
export async function deleteRaffle(
  raffleId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "No autorizado." };

  try {
    await prisma.raffle.delete({ where: { id: raffleId } });
    revalidatePath("/admin/raffles");
    return { success: true };
  } catch {
    return { success: false, error: "No se pudo eliminar el sorteo." };
  }
}
