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
  Divider,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import ShuffleIcon from "@mui/icons-material/Shuffle";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import DeleteIcon from "@mui/icons-material/Delete";
import { apartarNumeros, getRandomAvailableTickets } from "@/actions/tickets";
import { buildWhatsAppLink, DISCOUNT_TIERS, calcBulkTotal, getDiscountPct } from "@/lib/utils";
import { useRouter } from "next/navigation";

type Props = {
  raffleId: string;
  raffleName: string;
  whatsapp: string;
  precioBoleto: number;
};

type ParticipantData = {
  nombreCompleto: string;
  telefono: string;
  domicilio: string;
};

export default function QuickPurchase({ raffleId, raffleName, whatsapp, precioBoleto }: Props) {
  const router = useRouter();
  const [selectedTickets, setSelectedTickets] = React.useState<string[]>([]);
  const [loadingCount, setLoadingCount] = React.useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [successData, setSuccessData] = React.useState<{
    whatsappLink: string;
    tickets: string[];
  } | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [participant, setParticipant] = React.useState<ParticipantData>({
    nombreCompleto: "",
    telefono: "",
    domicilio: "",
  });

  async function handleQuickSelect(count: number) {
    setLoadingCount(count);
    setError(null);
    try {
      const tickets = await getRandomAvailableTickets(raffleId, count);
      if (tickets.length < count) {
        setError(`Solo hay ${tickets.length} números disponibles.`);
      }
      setSelectedTickets((prev) => {
        const existing = new Set(prev);
        return [...prev, ...tickets.filter((t) => !existing.has(t))];
      });
    } catch {
      setError("Error al obtener números aleatorios.");
    } finally {
      setLoadingCount(null);
    }
  }

  function removeTicket(numero: string) {
    setSelectedTickets((prev) => prev.filter((t) => t !== numero));
  }

  function handleOpenDialog() {
    if (selectedTickets.length === 0) {
      setError("Selecciona al menos un número.");
      return;
    }
    setDialogOpen(true);
  }

  async function handleSubmit() {
    if (!participant.nombreCompleto.trim() || !participant.telefono.trim() || !participant.domicilio.trim()) {
      setError("Completa todos los campos.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const result = await apartarNumeros({ raffleId, numeros: selectedTickets, participant });
    setSubmitting(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    const waLink = buildWhatsAppLink(whatsapp, raffleName, selectedTickets, participant.nombreCompleto, precioBoleto);
    setSuccessData({ whatsappLink: waLink, tickets: [...selectedTickets] });
    setDialogOpen(false);
    setSelectedTickets([]);
    setParticipant({ nombreCompleto: "", telefono: "", domicilio: "" });
    router.refresh();
  }

  return (
    <Box>
      <Typography variant="subtitle1" sx={{ fontWeight: 600 }} gutterBottom>
        Selección rápida
      </Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 1.5, mb: 2 }}>
        {DISCOUNT_TIERS.map(({ count, discountPct }) => (
          <Button
            key={count}
            variant="outlined"
            onClick={() => handleQuickSelect(count)}
            disabled={loadingCount !== null}
            sx={{ flexDirection: "column", alignItems: "center", py: 1.5, gap: 0.5 }}
          >
            {loadingCount === count ? (
              <CircularProgress size={20} />
            ) : (
              <>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <ShuffleIcon sx={{ fontSize: 16 }} />
                  <Typography component="span" sx={{ fontWeight: 700, fontSize: 15 }}>
                    {count} {count === 1 ? "boleto" : "boletos"}
                  </Typography>
                </Box>
                {precioBoleto > 0 && (
                  <Typography component="span" variant="body2" sx={{ fontWeight: 600, color: "primary.main" }}>
                    {calcBulkTotal(count, precioBoleto).toLocaleString("es-MX", {
                      style: "currency",
                      currency: "MXN",
                    })}
                  </Typography>
                )}
                {discountPct > 0 && (
                  <Chip label={`-${discountPct}%`} color="success" size="small" sx={{ height: 18, fontSize: 11 }} />
                )}
              </>
            )}
          </Button>
        ))}
      </Box>

      {error && (
        <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {selectedTickets.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Números seleccionados ({selectedTickets.length}):
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
            {selectedTickets.map((ticket) => (
              <Box
                key={ticket}
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.5,
                  bgcolor: "primary.light",
                  color: "primary.contrastText",
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 2,
                  fontWeight: 700,
                  fontSize: 14,
                }}
              >
                {ticket}
                <IconButton
                  size="small"
                  onClick={() => removeTicket(ticket)}
                  sx={{ color: "inherit", p: 0.25 }}
                >
                  <DeleteIcon fontSize="inherit" />
                </IconButton>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      <Button
        variant="contained"
        size="large"
        fullWidth
        onClick={handleOpenDialog}
        disabled={selectedTickets.length === 0 || loadingCount !== null}
      >
        Apartar{" "}
        {selectedTickets.length > 0 ? `${selectedTickets.length} número(s)` : "números"}
      </Button>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Tus datos de contacto</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <Typography variant="body2" color="text.secondary">
              Números a apartar: <strong>{selectedTickets.join(", ")}</strong>
            </Typography>
            {precioBoleto > 0 && (
              <Box sx={{ bgcolor: "grey.100", borderRadius: 1, p: 1.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                  <Typography variant="body1" sx={{ fontWeight: 700, color: "primary.main" }}>
                    Total a pagar:{" "}
                    {calcBulkTotal(selectedTickets.length, precioBoleto).toLocaleString("es-MX", {
                      style: "currency",
                      currency: "MXN",
                    })}
                  </Typography>
                  {getDiscountPct(selectedTickets.length) > 0 && (
                    <Chip
                      label={`-${getDiscountPct(selectedTickets.length)}%`}
                      color="success"
                      size="small"
                    />
                  )}
                </Box>
                {getDiscountPct(selectedTickets.length) > 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ textDecoration: "line-through" }}>
                    Sin descuento:{" "}
                    {(selectedTickets.length * precioBoleto).toLocaleString("es-MX", {
                      style: "currency",
                      currency: "MXN",
                    })}
                  </Typography>
                )}
                <Typography variant="caption" color="text.secondary">
                  {selectedTickets.length} boleto{selectedTickets.length !== 1 ? "s" : ""} ×{" "}
                  {precioBoleto.toLocaleString("es-MX", { style: "currency", currency: "MXN" })} c/u
                </Typography>
              </Box>
            )}
            <Divider />
            <TextField
              label="Nombre completo"
              value={participant.nombreCompleto}
              onChange={(e) => setParticipant((p) => ({ ...p, nombreCompleto: e.target.value }))}
              required
              fullWidth
              disabled={submitting}
            />
            <TextField
              label="Teléfono"
              value={participant.telefono}
              onChange={(e) => setParticipant((p) => ({ ...p, telefono: e.target.value }))}
              required
              fullWidth
              type="tel"
              disabled={submitting}
            />
            <TextField
              label="Domicilio"
              value={participant.domicilio}
              onChange={(e) => setParticipant((p) => ({ ...p, domicilio: e.target.value }))}
              required
              fullWidth
              multiline
              rows={2}
              disabled={submitting}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={submitting}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : null}
          >
            {submitting ? "Apartando..." : "Confirmar"}
          </Button>
        </DialogActions>
      </Dialog>

      {successData && (
        <Box
          sx={{
            mt: 3,
            p: 2,
            bgcolor: "success.light",
            borderRadius: 2,
            display: "flex",
            flexDirection: "column",
            gap: 1.5,
          }}
        >
          <Typography sx={{ fontWeight: 700 }} color="success.dark">
            ¡Números apartados con éxito!
          </Typography>
          <Typography variant="body2">
            Tus números: <strong>{successData.tickets.join(", ")}</strong>
          </Typography>
          {precioBoleto > 0 && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Total a pagar:{" "}
                {calcBulkTotal(successData.tickets.length, precioBoleto).toLocaleString("es-MX", {
                  style: "currency",
                  currency: "MXN",
                })}
              </Typography>
              {getDiscountPct(successData.tickets.length) > 0 && (
                <Chip
                  label={`-${getDiscountPct(successData.tickets.length)}%`}
                  color="success"
                  size="small"
                />
              )}
            </Box>
          )}
          <Button
            variant="contained"
            color="success"
            size="large"
            startIcon={<WhatsAppIcon />}
            href={successData.whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            component="a"
          >
            Confirmar por WhatsApp
          </Button>
        </Box>
      )}
    </Box>
  );
}
