import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TicketStatus } from "@prisma/client";

export async function POST() {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const tickets = await prisma.ticket.updateMany({
    where: {
      estatus: TicketStatus.PENDIENTE,
      fechaApartado: {
        lt: cutoff,
      },
    },
    data: {
      estatus: TicketStatus.DISPONIBLE,
      fechaApartado: null,
      participantId: null,
    },
  });
  console.log(`Reset ${tickets.count} tickets that were pending for more than 24 hours.`);

  return NextResponse.json({ reset: tickets.count });
}
