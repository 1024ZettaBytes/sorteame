import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  Typography,
} from "@mui/material";
import AdminTicketTable from "@/components/AdminTicketTable";
import { TicketStatus } from "@prisma/client";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function RaffleDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;

  const raffle = await prisma.raffle.findUnique({
    where: { id },
    include: {
      tickets: {
        include: { participant: true },
        orderBy: { numero: "asc" },
      },
    },
  });

  if (!raffle) notFound();

  const total = raffle.tickets.length;
  const apartados = raffle.tickets.filter((t) => t.estatus === TicketStatus.PENDIENTE).length;
  const pagados = raffle.tickets.filter((t) => t.estatus === TicketStatus.PAGADO).length;
  const disponibles = raffle.tickets.filter((t) => t.estatus === TicketStatus.DISPONIBLE).length;
  const precioBoleto = raffle.precioBoleto;

  const ticketRows = raffle.tickets.map((t) => ({
    id: t.id,
    numero: t.numero,
    estatus: t.estatus,
    fechaApartado: t.fechaApartado,
    participantName: t.participant?.nombreCompleto ?? null,
    participantPhone: t.participant?.telefono ?? null,
  }));

  const publicUrl = `/raffle/${raffle.id}`;

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
        <Link href="/admin" style={{ textDecoration: "none" }}>
          <Typography variant="body2" color="text.secondary">
            ← Mis Sorteos
          </Typography>
        </Link>
      </Box>

      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
        {raffle.nombre}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Fecha: {new Date(raffle.fechaSorteo).toLocaleDateString("es-MX", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
        {" · "}
        <a href={publicUrl} target="_blank" rel="noreferrer" style={{ color: "#1976d2" }}>
          Ver vista pública
        </a>
      </Typography>
      {precioBoleto > 0 && (
        <Typography variant="body1" sx={{ fontWeight: 700, color: "primary.main", mb: 3 }}>
          Precio por boleto: {precioBoleto.toLocaleString("es-MX", { style: "currency", currency: "MXN" })}
        </Typography>
      )}

      {/* Metrics */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {[
          { label: "Total", value: total, color: "default" as const },
          { label: "Disponibles", value: disponibles, color: "default" as const },
          { label: "Apartados", value: apartados, color: "warning" as const },
          { label: "Pagados", value: pagados, color: "success" as const },
        ].map(({ label, value, color }) => (
          <Grid size={{ xs: 6, sm: 3 }} key={label}>
            <Card>
              <CardContent sx={{ textAlign: "center", py: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {value}
                </Typography>
                <Chip label={label} color={color} size="small" sx={{ mt: 0.5 }} />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Ticket table */}
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
        Boletos apartados y pagados
      </Typography>
      <AdminTicketTable raffleId={raffle.id} raffleName={raffle.nombre} tickets={ticketRows} />
    </Box>
  );
}
