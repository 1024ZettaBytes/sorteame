"use client";

import * as React from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { createRaffle } from "@/actions/raffles";
import { useRouter } from "next/navigation";

export default function NewRafflePage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [fecha, setFecha] = React.useState<Date | null>(null);
  const [whatsapp, setWhatsapp] = React.useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!fecha) {
      setError("Selecciona la fecha del sorteo.");
      return;
    }

    const form = new FormData(e.currentTarget);
    setLoading(true);

    const result = await createRaffle({
      nombre: form.get("nombre") as string,
      fechaSorteo: fecha.toISOString(),
      whatsapp: `52${whatsapp.replace(/\D/g, "")}`,
      totalNumeros: parseInt(form.get("totalNumeros") as string, 10),
      precioBoleto: parseFloat(form.get("precioBoleto") as string),
    });

    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    router.push(`/admin/raffles/${result.raffleId}`);
  }

  return (
    <Box sx={{ maxWidth: 520, mx: "auto" }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
        Nuevo Sorteo
      </Typography>

      <Card>
        <CardContent sx={{ p: 3 }}>
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}
          >
            {error && <Alert severity="error">{error}</Alert>}

            <TextField
              name="nombre"
              label="Nombre del sorteo"
              required
              fullWidth
              disabled={loading}
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

            <TextField
              name="whatsapp"
              label="WhatsApp del organizador"
              required
              fullWidth
              disabled={loading}
              placeholder="1XXXXXXXXXX"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, ""))}
              helperText="Sin código de país — se agrega +52 automáticamente"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">+52</InputAdornment>
                  ),
                },
              }}
            />

            <TextField
              name="precioBoleto"
              label="Precio por boleto"
              type="number"
              required
              fullWidth
              disabled={loading}
              slotProps={{
                htmlInput: { min: 0, step: 0.01 },
                input: {
                  startAdornment: (
                    <InputAdornment position="start">$</InputAdornment>
                  ),
                },
              }}
              helperText="Precio en pesos MXN"
            />

            <TextField
              name="totalNumeros"
              label="Total de números"
              type="number"
              required
              fullWidth
              disabled={loading}
              slotProps={{ htmlInput: { min: 1, max: 100000 } }}
              helperText="Máximo 100,000 números"
            />

            <Box sx={{ display: "flex", gap: 2 }}>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading}
                startIcon={loading ? <CircularProgress size={18} color="inherit" /> : null}
              >
                {loading ? "Creando..." : "Crear Sorteo"}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
