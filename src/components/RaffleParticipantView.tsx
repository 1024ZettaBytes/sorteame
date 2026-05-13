"use client";

import * as React from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  TextField,
  Typography,
  InputAdornment,
  Chip,
} from "@mui/material";
import ShuffleIcon from "@mui/icons-material/Shuffle";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import AddCircleOutlinedIcon from "@mui/icons-material/AddCircleOutlined";
import { apartarNumeros, getRandomAvailableTickets, checkTicketAvailability } from "@/actions/tickets";
import { buildWhatsAppLink, DISCOUNT_TIERS, calcBulkTotal, getDiscountPct } from "@/lib/utils";
import { useRouter } from "next/navigation";

type Props = {
  raffleId: string;
  raffleName: string;
  whatsapp: string;
  totalNumeros: number;
  precioBoleto: number;
};

type ParticipantData = {
  nombreCompleto: string;
  telefono: string;
  domicilio: string;
};

const STATUS_CHIP: Record<string, { label: string; color: "default" | "warning" | "success" | "error" }> = {
  DISPONIBLE: { label: "Disponible", color: "success" },
  PENDIENTE: { label: "Apartado", color: "warning" },
  PAGADO: { label: "Pagado", color: "error" },
  NO_EXISTE: { label: "No existe", color: "error" },
};

export default function RaffleParticipantView({
  raffleId,
  raffleName,
  whatsapp,
  totalNumeros,
  precioBoleto,
}: Props) {
  const router = useRouter();
  const digits = String(totalNumeros - 1).length;

  const [selectedTickets, setSelectedTickets] = React.useState<string[]>([]);
  const [loadingCount, setLoadingCount] = React.useState<number | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const [searchInput, setSearchInput] = React.useState("");
  const [searching, setSearching] = React.useState(false);
  const [searchResult, setSearchResult] = React.useState<{
    available: boolean;
    estatus?: string;
    numero: string;
  } | null>(null);

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [participant, setParticipant] = React.useState<ParticipantData>({
    nombreCompleto: "",
    telefono: "",
    domicilio: "",
  });

  const [successData, setSuccessData] = React.useState<{
    whatsappLink: string;
    tickets: string[];
  } | null>(null);

  async function handleQuickSelect(count: number) {
    setLoadingCount(count);
    setError(null);
    try {
      const tickets = await getRandomAvailableTickets(raffleId, count);
      if (tickets.length === 0) {
        setError("No hay números disponibles.");
        return;
      }
      if (tickets.length < count) {
        setError(`Solo hay ${tickets.length} número(s) disponible(s).`);
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

  async function handleSearch() {
    if (!searchInput.trim()) return;
    const padded = searchInput.trim().padStart(digits, "0");
    setSearching(true);
    setSearchResult(null);
    const res = await checkTicketAvailability(raffleId, padded);
    setSearchResult({ ...res, numero: padded });
    setSearching(false);
  }

  function addFromSearch() {
    if (!searchResult?.available) return;
    const { numero } = searchResult;
    setSelectedTickets((prev) => (prev.includes(numero) ? prev : [...prev, numero]));
    setSearchInput("");
    setSearchResult(null);
  }

  function removeTicket(numero: string) {
    setSelectedTickets((prev) => prev.filter((t) => t !== numero));
  }

  async function handleSubmit() {
    setError(null);
    if (!participant.nombreCompleto.trim() || !participant.telefono.trim() || !participant.domicilio.trim()) {
      setError("Completa todos los campos.");
      return;
    }
    setSubmitting(true);
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
      {/* Search */}
      <Typography variant="subtitle1" sx={{ fontWeight: 600 }} gutterBottom>
        Buscar número específico
      </Typography>
      <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start", mb: 1 }}>
        <TextField
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder={`Ej: ${"0".repeat(digits)}`}
          size="small"
          type="number"
          disabled={searching}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
        <Button
          variant="outlined"
          onClick={handleSearch}
          disabled={searching || !searchInput.trim()}
        >
          {searching ? <CircularProgress size={20} /> : "Buscar"}
        </Button>
      </Box>

      {searchResult && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            #{searchResult.numero}
          </Typography>
          <Chip
            label={STATUS_CHIP[searchResult.estatus ?? "NO_EXISTE"]?.label}
            color={STATUS_CHIP[searchResult.estatus ?? "NO_EXISTE"]?.color}
            size="small"
          />
          {searchResult.available && (
            <Button
              size="small"
              variant="contained"
              startIcon={<AddCircleOutlinedIcon />}
              onClick={addFromSearch}
            >
              Agregar
            </Button>
          )}
        </Box>
      )}

      <Divider sx={{ my: 2 }} />

      {/* Quick select */}
      <Typography variant="subtitle1" sx={{ fontWeight: 600 }} gutterBottom>
        Selección rápida aleatoria
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

      {/* Selected tickets */}
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
                  bgcolor: "primary.main",
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
                  <DeleteIcon sx={{ fontSize: 14 }} />
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
        onClick={() => setDialogOpen(true)}
        disabled={selectedTickets.length === 0 || loadingCount !== null}
      >
        Apartar{" "}
        {selectedTickets.length > 0 ? `${selectedTickets.length} número(s)` : "números"}
      </Button>

      {/* Participant dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Tus datos de contacto</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <Typography variant="body2" color="text.secondary">
              Números: <strong>{selectedTickets.join(", ")}</strong>
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
            {submitting ? "Apartando..." : "Confirmar y apartar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success block */}
      {successData && (
        <Box
          sx={{
            mt: 3,
            p: 2.5,
            bgcolor: "success.light",
            borderRadius: 2,
            display: "flex",
            flexDirection: "column",
            gap: 1.5,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700 }} color="success.dark">
            ¡Números apartados! 🎉
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
          <Typography variant="body2" color="text.secondary">
            Ahora envía tu comprobante de pago por WhatsApp para asegurar tu lugar.
          </Typography>
          <Button
            variant="contained"
            color="success"
            size="large"
            startIcon={<WhatsAppIcon />}
            href={successData.whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            component="a"
            sx={{ alignSelf: "flex-start" }}
          >
            Confirmar por WhatsApp
          </Button>
        </Box>
      )}
    </Box>
  );
}
