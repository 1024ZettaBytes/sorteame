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
  const [pendingFiles, setPendingFiles] = React.useState<File[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = React.useState<string[]>([]);

  function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setPendingFiles((prev) => [...prev, ...files]);
    setPreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removePreview(index: number) {
    setPreviews((prev) => prev.filter((_, i) => i !== index));
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  }

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

    if (!result.success) {
      setLoading(false);
      setError(result.error);
      return;
    }

    // Upload pending images
    if (pendingFiles.length > 0) {
      const uploadForm = new FormData();
      uploadForm.set("raffleId", result.raffleId);
      for (const file of pendingFiles) {
        uploadForm.append("files", file);
      }
      await fetch("/api/upload", { method: "POST", body: uploadForm });
    }

    setLoading(false);
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

            {/* Image upload section */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Imágenes del sorteo
              </Typography>
              <Box
                onClick={() => fileInputRef.current?.click()}
                sx={{
                  border: "2px dashed",
                  borderColor: "grey.400",
                  borderRadius: 2,
                  p: 3,
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "border-color 0.2s",
                  "&:hover": { borderColor: "primary.main" },
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Click para seleccionar imágenes (JPG, PNG, WebP — máx 5MB c/u)
                </Typography>
              </Box>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                hidden
                onChange={handleFilesSelected}
              />
              {previews.length > 0 && (
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 1.5 }}>
                  {previews.map((src, i) => (
                    <Box key={i} sx={{ position: "relative", width: 80, height: 80 }}>
                      <img
                        src={src}
                        alt=""
                        style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8 }}
                      />
                      <Box
                        onClick={() => removePreview(i)}
                        sx={{
                          position: "absolute",
                          top: -6,
                          right: -6,
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          bgcolor: "error.main",
                          color: "white",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 12,
                          cursor: "pointer",
                        }}
                      >
                        ✕
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>

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
