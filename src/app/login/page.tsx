"use client";

import * as React from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Alert,
  CircularProgress,
} from "@mui/material";
import { loginAction } from "@/actions/auth";
import { useActionState } from "react";

type LoginState = { error?: string } | null;

function LoginForm() {
  const [state, formAction, isPending] = useActionState<LoginState, FormData>(
    async (_prev, formData) => {
      try {
        await loginAction(formData);
        return null;
      } catch (err: unknown) {
        const message =
          err instanceof Error && err.message.includes("CredentialsSignin")
            ? "Usuario o contraseña incorrectos."
            : "Error al iniciar sesión. Inténtalo de nuevo.";
        return { error: message };
      }
    },
    null
  );

  return (
    <Box
      component="form"
      action={formAction}
      sx={{ display: "flex", flexDirection: "column", gap: 2 }}
    >
      {state?.error && <Alert severity="error">{state.error}</Alert>}

      <TextField
        name="username"
        label="Usuario"
        type="text"
        autoComplete="username"
        required
        fullWidth
        disabled={isPending}
      />

      <TextField
        name="password"
        label="Contraseña"
        type="password"
        autoComplete="current-password"
        required
        fullWidth
        disabled={isPending}
      />

      <Button
        type="submit"
        variant="contained"
        size="large"
        fullWidth
        disabled={isPending}
        startIcon={isPending ? <CircularProgress size={20} color="inherit" /> : null}
      >
        {isPending ? "Ingresando..." : "Ingresar"}
      </Button>
    </Box>
  );
}

export default function LoginPage() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "grey.100",
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 420, width: "100%" }} elevation={4}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700, textAlign: "center" }}>
            🎟 SórtéaMe
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", mb: 3 }}>
            Panel de Administración
          </Typography>
          <LoginForm />
        </CardContent>
      </Card>
    </Box>
  );
}
