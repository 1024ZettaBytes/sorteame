import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import Link from "next/link";
import { TicketStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const raffles = await prisma.raffle.findMany({
    include: {
      _count: {
        select: {
          tickets: true,
        },
      },
      tickets: {
        select: { estatus: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Mis Sorteos
        </Typography>
        <Link href="/admin/raffles/new" style={{ textDecoration: "none" }}>
          <Button variant="contained" startIcon={<AddIcon />}>
            Nuevo Sorteo
          </Button>
        </Link>
      </Box>

      {raffles.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: "center", py: 6 }}>
            <Typography variant="h6" color="text.secondary">
              No tienes sorteos aún.
            </Typography>
            <Link href="/admin/raffles/new" style={{ textDecoration: "none" }}>
              <Button variant="contained" startIcon={<AddIcon />} sx={{ mt: 2 }}>
                Crear primer sorteo
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {raffles.map((raffle) => {
            const apartados = raffle.tickets.filter(
              (t) => t.estatus === TicketStatus.PENDIENTE
            ).length;
            const pagados = raffle.tickets.filter(
              (t) => t.estatus === TicketStatus.PAGADO
            ).length;

            return (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={raffle.id}>
                <Link href={`/admin/raffles/${raffle.id}`} style={{ textDecoration: "none", display: "block" }}>
                <Card
                  sx={{
                    height: "100%",
                    transition: "box-shadow 0.2s",
                    "&:hover": { boxShadow: 6 },
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" noWrap gutterBottom sx={{ fontWeight: 700 }}>
                      {raffle.nombre}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Sorteo:{" "}
                      {new Date(raffle.fechaSorteo).toLocaleDateString("es-MX", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1, mt: 1, flexWrap: "wrap" }}>
                      <Box
                        sx={{
                          bgcolor: "grey.200",
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 1,
                          fontSize: 13,
                        }}
                      >
                        Total: {raffle.totalNumeros}
                      </Box>
                      <Box
                        sx={{
                          bgcolor: "warning.light",
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 1,
                          fontSize: 13,
                        }}
                      >
                        Apartados: {apartados}
                      </Box>
                      <Box
                        sx={{
                          bgcolor: "success.light",
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 1,
                          fontSize: 13,
                        }}
                      >
                        Pagados: {pagados}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
                </Link>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
}
