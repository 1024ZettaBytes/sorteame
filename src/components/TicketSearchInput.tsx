"use client";

import * as React from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddCircleOutlinedIcon from "@mui/icons-material/AddCircleOutlined";
import { checkTicketAvailability } from "@/actions/tickets";

type Props = {
  raffleId: string;
  totalNumeros: number;
  onAdd: (numero: string) => void;
};

const statusLabels: Record<string, { label: string; color: "default" | "warning" | "success" | "error" }> = {
  DISPONIBLE: { label: "Disponible", color: "success" },
  PENDIENTE: { label: "Apartado", color: "warning" },
  PAGADO: { label: "Pagado", color: "error" },
  NO_EXISTE: { label: "No existe", color: "error" },
};

export default function TicketSearchInput({ raffleId, totalNumeros, onAdd }: Props) {
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<{
    available: boolean;
    estatus?: string;
    numero: string;
  } | null>(null);

  const digits = String(totalNumeros - 1).length;

  async function handleSearch() {
    if (!input.trim()) return;
    const padded = input.trim().padStart(digits, "0");
    setLoading(true);
    setResult(null);
    const res = await checkTicketAvailability(raffleId, padded);
    setResult({ ...res, numero: padded });
    setLoading(false);
  }

  function handleAdd() {
    if (result?.available) {
      onAdd(result.numero);
      setInput("");
      setResult(null);
    }
  }

  return (
    <Box>
      <Typography variant="subtitle1" sx={{ fontWeight: 600 }} gutterBottom>
        Buscar número específico
      </Typography>
      <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
        <TextField
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder={`Ej: ${"0".repeat(digits)}`}
          size="small"
          type="number"
          disabled={loading}
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
          disabled={loading || !input.trim()}
          sx={{ whiteSpace: "nowrap" }}
        >
          {loading ? <CircularProgress size={20} /> : "Buscar"}
        </Button>
      </Box>

      {result && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            #{result.numero}
          </Typography>
          <Chip
            label={statusLabels[result.estatus ?? "NO_EXISTE"]?.label ?? result.estatus}
            color={statusLabels[result.estatus ?? "NO_EXISTE"]?.color ?? "default"}
            size="small"
          />
          {result.available && (
            <Button
              size="small"
              variant="contained"
              startIcon={<AddCircleOutlinedIcon />}
              onClick={handleAdd}
            >
              Agregar
            </Button>
          )}
        </Box>
      )}
    </Box>
  );
}
