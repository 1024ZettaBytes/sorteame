"use client";

import * as React from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
  Tooltip,
  Typography,
} from "@mui/material";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import { marcarComoPagado } from "@/actions/tickets";
import { useRouter } from "next/navigation";

type TicketStatus = "DISPONIBLE" | "PENDIENTE" | "PAGADO";

type TicketRow = {
  id: string;
  numero: string;
  estatus: TicketStatus;
  fechaApartado: Date | null;
  participantName: string | null;
  participantPhone: string | null;
};

type Props = {
  raffleId: string;
  raffleName: string;
  tickets: TicketRow[];
};

const statusColors: Record<TicketStatus, "default" | "warning" | "success"> = {
  DISPONIBLE: "default",
  PENDIENTE: "warning",
  PAGADO: "success",
};

export default function AdminTicketTable({ raffleName, tickets }: Props) {
  const router = useRouter();
  const [loadingId, setLoadingId] = React.useState<string | null>(null);
  const [snack, setSnack] = React.useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  });
  const [waModal, setWaModal] = React.useState<{
    open: boolean;
    participantName: string;
    waLink: string;
  }>({ open: false, participantName: "", waLink: "" });

  async function handleMarkPaid(ticketId: string) {
    setLoadingId(ticketId);
    const result = await marcarComoPagado(ticketId);
    setLoadingId(null);
    if (result.success) {
      setSnack({ open: true, message: "Ticket marcado como PAGADO.", severity: "success" });
      if (result.allPaid && result.participant) {
        const { name, phone, tickets: nums } = result.participant;
        const ticketList = nums.join(", ");
        const msg = encodeURIComponent(
          `Hola ${name}! Tus boletos ${ticketList} del sorteo "${raffleName}" han sido registrados como pagados satisfactoriamente. ¡Muchas gracias y mucha suerte!`
        );
        const cleanPhone = phone.replace(/\D/g, "");
        setWaModal({
          open: true,
          participantName: name,
          waLink: `https://wa.me/+52${cleanPhone}?text=${msg}`,
        });
      } else {
        router.refresh();
      }
    } else {
      setSnack({ open: true, message: result.error ?? "Error.", severity: "error" });
    }
  }

  const columns: GridColDef[] = [
    { field: "numero", headerName: "Número", width: 110, sortable: true },
    {
      field: "estatus",
      headerName: "Estatus",
      width: 130,
      renderCell: (params: GridRenderCellParams<TicketRow, TicketStatus>) => (
        <Chip
          label={params.value}
          color={statusColors[params.value!]}
          size="small"
        />
      ),
    },
    { field: "participantName", headerName: "Participante", flex: 1, minWidth: 160 },
    { field: "participantPhone", headerName: "Teléfono", width: 140 },
    {
      field: "fechaApartado",
      headerName: "Fecha apartado",
      width: 170,
      valueFormatter: (value: Date | null) =>
        value ? new Date(value).toLocaleString("es-MX") : "—",
    },
    {
      field: "actions",
      headerName: "Acciones",
      width: 150,
      sortable: false,
      renderCell: (params: GridRenderCellParams<TicketRow>) => {
        if (params.row.estatus !== "PENDIENTE") return null;
        return (
          <Tooltip title="Marcar como pagado">
            <span>
              <Button
                size="small"
                variant="contained"
                color="success"
                startIcon={
                  loadingId === params.row.id ? (
                    <CircularProgress size={14} color="inherit" />
                  ) : (
                    <CheckCircleIcon />
                  )
                }
                onClick={() => handleMarkPaid(params.row.id)}
                disabled={loadingId === params.row.id}
              >
                Pagado
              </Button>
            </span>
          </Tooltip>
        );
      },
    },
  ];

  const rows = tickets.filter((t) => t.estatus !== "DISPONIBLE");

  return (
    <>
      <Box sx={{ height: 520, width: "100%" }}>
        <DataGrid
          rows={rows}
          columns={columns}
          initialState={{
            pagination: { paginationModel: { pageSize: 25 } },
            sorting: { sortModel: [{ field: "numero", sort: "asc" }] },
          }}
          pageSizeOptions={[10, 25, 50, 100]}
          disableRowSelectionOnClick
        />
      </Box>

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
      >
        <Alert severity={snack.severity} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
          {snack.message}
        </Alert>
      </Snackbar>

      {/* WhatsApp notification modal */}
      <Dialog
        open={waModal.open}
        onClose={() => { setWaModal((m) => ({ ...m, open: false })); router.refresh(); }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <CheckCircleIcon color="success" />
          Todos los boletos pagados
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 1 }}>
            Todos los boletos de <strong>{waModal.participantName}</strong> han sido marcados como pagados.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ¿Deseas enviar una notificación al cliente por WhatsApp confirmándole el pago?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            onClick={() => { setWaModal((m) => ({ ...m, open: false })); router.refresh(); }}
            color="inherit"
          >
            Ahora no
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<WhatsAppIcon />}
            href={waModal.waLink}
            target="_blank"
            rel="noopener noreferrer"
            component="a"
            onClick={() => { setTimeout(() => { setWaModal((m) => ({ ...m, open: false })); router.refresh(); }, 500); }}
          >
            Enviar notificación
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
