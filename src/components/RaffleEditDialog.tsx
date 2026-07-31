"use client";

import * as React from "react";
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
} from "@mui/material";
import { Edit } from "@mui/icons-material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { modifyRaffle } from "@/actions/raffles";
import { useRouter } from "next/navigation";

type Props = {
  raffleId: string;
  nombre: string;
  fechaSorteo: string; // ISO string
};

export default function RaffleEditDialog({ raffleId, nombre, fechaSorteo }: Props) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [name, setName] = React.useState(nombre);
  const [fecha, setFecha] = React.useState<Date | null>(new Date(fechaSorteo));

  function handleOpen() {
    setName(nombre);
    setFecha(new Date(fechaSorteo));
    setError(null);
    setOpen(true);
  }

  function handleClose() {
    if (loading) return;
    setOpen(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("El nombre del sorteo es obligatorio.");
      return;
    }
    if (!fecha || Number.isNaN(fecha.getTime())) {
      setError("Selecciona una fecha válida.");
      return;
    }

    setLoading(true);
    const result = await modifyRaffle(raffleId, name, fecha.toISOString());
    setLoading(false);

    if (!result.success) {
      setError(result.error ?? "No se pudo modificar el sorteo.");
      return;
    }

    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <IconButton size="small" onClick={handleOpen} aria-label="Editar sorteo">
        <Edit fontSize="small" />
      </IconButton>

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ fontWeight: 700 }}>Editar Sorteo</DialogTitle>
          <DialogContent
            sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1 }}
          >
            {error && <Alert severity="error">{error}</Alert>}

            <TextField
              label="Nombre del sorteo"
              required
              fullWidth
              disabled={loading}
              value={name}
              onChange={(e) => setName(e.target.value)}
              sx={{ mt: 1 }}
            />

            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Fecha del sorteo"
                value={fecha}
                onChange={setFecha}
                slotProps={{ textField: { required: true, fullWidth: true } }}
                disabled={loading}
              />
            </LocalizationProvider>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleClose} disabled={loading}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : null}
            >
              {loading ? "Guardando..." : "Guardar"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
}
