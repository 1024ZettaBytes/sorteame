import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  LinearProgress,
  Typography,
} from "@mui/material";
import { TicketStatus } from "@prisma/client";
import RaffleParticipantView from "@/components/RaffleParticipantView";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function PublicRafflePage({ params }: Props) {
  const { id } = await params;

  const raffle = await prisma.raffle.findUnique({
    where: { id },
    include: {
      _count: { select: { tickets: true } },
      tickets: { select: { estatus: true } },
    },
  });

  if (!raffle) notFound();

  const total = raffle.tickets.length;
  const disponibles = raffle.tickets.filter((t) => t.estatus === TicketStatus.DISPONIBLE).length;
  const vendidosPct = total > 0 ? Math.round(((total - disponibles) / total) * 100) : 0;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "grey.50",
        py: 4,
        px: 2,
      }}
    >
      <Box sx={{ maxWidth: 640, mx: "auto" }}>
        {/* Header */}
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 800 }}>
            🎟 {raffle.nombre}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Sorteo:{" "}
            {new Date(raffle.fechaSorteo).toLocaleDateString("es-MX", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </Typography>
        </Box>

        {/* Stats */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: "Total", value: total, color: "default" as const },
            { label: "Disponibles", value: disponibles, color: "default" as const },
          ].map(({ label, value, color }) => (
            <Grid size={{ xs: 6 }} key={label}>
              <Card>
                <CardContent sx={{ textAlign: "center", py: 1.5 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {value}
                  </Typography>
                  <Chip label={label} color={color} size="small" sx={{ mt: 0.5 }} />
                </CardContent>
              </Card>
            </Grid>
          ))}
          <Grid size={{ xs: 12 }}>
            <Card sx={{ bgcolor: "primary.main", color: "primary.contrastText" }}>
              <CardContent sx={{ textAlign: "center", py: 1.5 }}>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {raffle.precioBoleto.toLocaleString("es-MX", { style: "currency", currency: "MXN" })}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.85 }}>por boleto</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Progress */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              Progreso de ventas
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {vendidosPct}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={vendidosPct}
            sx={{ height: 10, borderRadius: 5 }}
          />
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Purchase section */}
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              ¡Aparta tus números!
            </Typography>
            <RaffleParticipantView
              raffleId={raffle.id}
              raffleName={raffle.nombre}
              whatsapp={raffle.whatsapp}
              totalNumeros={raffle.totalNumeros}
              precioBoleto={raffle.precioBoleto}
            />
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
