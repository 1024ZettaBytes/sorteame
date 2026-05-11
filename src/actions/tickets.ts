"use server";

import { prisma } from "@/lib/prisma";
import { formatTicketNumber } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { TicketStatus } from "@prisma/client";

export type ApartarNumerosInput = {
  raffleId: string;
  numeros: string[];
  participant: {
    nombreCompleto: string;
    telefono: string;
    domicilio: string;
  };
};

export type ApartarNumerosResult =
  | { success: true; participantId: string }
  | { success: false; error: string };

/**
 * Reserves selected ticket numbers for a participant using a transaction
 * to prevent race conditions.
 */
export async function apartarNumeros(
  input: ApartarNumerosInput
): Promise<ApartarNumerosResult> {
  const { raffleId, numeros, participant } = input;

  if (!numeros || numeros.length === 0) {
    return { success: false, error: "Debes seleccionar al menos un número." };
  }

  if (
    !participant.nombreCompleto.trim() ||
    !participant.telefono.trim() ||
    !participant.domicilio.trim()
  ) {
    return { success: false, error: "Todos los datos del participante son requeridos." };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Lock and verify availability within the transaction
      const tickets = await tx.ticket.findMany({
        where: {
          raffleId,
          numero: { in: numeros },
        },
      });

      if (tickets.length !== numeros.length) {
        throw new Error("Algunos números no existen en este sorteo.");
      }

      const unavailable = tickets.filter((t) => t.estatus !== TicketStatus.DISPONIBLE);
      if (unavailable.length > 0) {
        const nums = unavailable.map((t) => t.numero).join(", ");
        throw new Error(`Los siguientes números ya no están disponibles: ${nums}`);
      }

      // Create participant and update tickets atomically
      const newParticipant = await tx.participant.create({
        data: {
          nombreCompleto: participant.nombreCompleto.trim(),
          telefono: participant.telefono.trim(),
          domicilio: participant.domicilio.trim(),
        },
      });

      await tx.ticket.updateMany({
        where: {
          raffleId,
          numero: { in: numeros },
          estatus: TicketStatus.DISPONIBLE,
        },
        data: {
          estatus: TicketStatus.PENDIENTE,
          fechaApartado: new Date(),
          participantId: newParticipant.id,
        },
      });

      return newParticipant;
    });

    revalidatePath(`/raffle/${raffleId}`);
    revalidatePath(`/admin/raffles/${raffleId}`);
    return { success: true, participantId: result.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al apartar números.";
    return { success: false, error: message };
  }
}

/**
 * Gets N random available ticket numbers for a given raffle.
 */
export async function getRandomAvailableTickets(
  raffleId: string,
  count: number
): Promise<string[]> {
  // Fetch all available ticket IDs and randomly select N using raw SQL shuffle
  const tickets = await prisma.$queryRaw<{ numero: string }[]>`
    SELECT numero FROM "Ticket"
    WHERE "raffleId" = ${raffleId}
      AND estatus = 'DISPONIBLE'
    ORDER BY RANDOM()
    LIMIT ${count}
  `;

  return tickets.map((t) => t.numero);
}

/**
 * Marks a PENDIENTE ticket as PAGADO (admin only).
 */
export async function marcarComoPagado(
  ticketId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.ticket.update({
      where: { id: ticketId, estatus: TicketStatus.PENDIENTE },
      data: { estatus: TicketStatus.PAGADO },
    });
    return { success: true };
  } catch {
    return { success: false, error: "No se pudo actualizar el ticket." };
  }
}

/**
 * Checks availability of a specific ticket number.
 */
export async function checkTicketAvailability(
  raffleId: string,
  numero: string
): Promise<{ available: boolean; estatus?: string }> {
  const ticket = await prisma.ticket.findUnique({
    where: { raffleId_numero: { raffleId, numero } },
  });

  if (!ticket) return { available: false, estatus: "NO_EXISTE" };
  return {
    available: ticket.estatus === TicketStatus.DISPONIBLE,
    estatus: ticket.estatus,
  };
}
