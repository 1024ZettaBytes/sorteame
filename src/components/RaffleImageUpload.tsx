"use client";

import * as React from "react";
import {
  Alert,
  Box,
  CircularProgress,
  IconButton,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  Typography,
} from "@mui/material";
import { CloudUpload, Delete } from "@mui/icons-material";
import { deleteRaffleImage } from "@/actions/raffles";

type ExistingImage = {
  id: string;
  key: string;
};

type Props = {
  raffleId: string | null; // null when creating (images uploaded after creation)
  existingImages?: ExistingImage[];
  onUploadComplete?: () => void;
};

export default function RaffleImageUpload({ raffleId, existingImages = [], onUploadComplete }: Props) {
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [images, setImages] = React.useState<ExistingImage[]>(existingImages);
  const [previews, setPreviews] = React.useState<string[]>([]);
  const [pendingFiles, setPendingFiles] = React.useState<File[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // For new raffles: store files to upload after creation
  const isNewRaffle = !raffleId;

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setError(null);

    if (isNewRaffle) {
      // Store files for later upload
      setPendingFiles((prev) => [...prev, ...files]);
      const newPreviews = files.map((f) => URL.createObjectURL(f));
      setPreviews((prev) => [...prev, ...newPreviews]);
      return;
    }

    await uploadFiles(files);
  }

  async function uploadFiles(files: File[]) {
    if (!raffleId) return;
    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.set("raffleId", raffleId);
    for (const file of files) {
      formData.append("files", file);
    }

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Error al subir imágenes");
        return;
      }

      setImages((prev) => [...prev, ...data.images]);
      onUploadComplete?.();
    } catch {
      setError("Error de red al subir imágenes");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  // Expose pending files for parent to upload after creation
  React.useEffect(() => {
    if (isNewRaffle) {
      (window as unknown as Record<string, File[]>).__pendingRaffleFiles = pendingFiles;
    }
  }, [pendingFiles, isNewRaffle]);

  async function handleDelete(imageId: string) {
    const result = await deleteRaffleImage(imageId);
    if (result.success) {
      setImages((prev) => prev.filter((img) => img.id !== imageId));
    } else {
      setError(result.error ?? "Error al eliminar");
    }
  }

  function handleRemovePreview(index: number) {
    setPreviews((prev) => prev.filter((_, i) => i !== index));
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Upload area */}
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
          mb: 2,
        }}
      >
        {uploading ? (
          <CircularProgress size={32} />
        ) : (
          <>
            <CloudUpload sx={{ fontSize: 40, color: "grey.500", mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              Click para subir imágenes (JPG, PNG, WebP — máx 5MB c/u)
            </Typography>
          </>
        )}
      </Box>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        hidden
        onChange={handleFileSelect}
      />

      {/* Existing images */}
      {images.length > 0 && (
        <ImageList cols={3} gap={8} sx={{ mt: 2 }}>
          {images.map((img) => (
            <ImageListItem key={img.id}>
              <img
                src={`/api/images/${img.key}`}
                alt=""
                loading="lazy"
                style={{ borderRadius: 8, objectFit: "cover", height: 140 }}
              />
              <ImageListItemBar
                sx={{ background: "transparent" }}
                position="top"
                actionPosition="right"
                actionIcon={
                  <IconButton
                    size="small"
                    sx={{ bgcolor: "rgba(0,0,0,0.6)", color: "white", m: 0.5 }}
                    onClick={() => handleDelete(img.id)}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                }
              />
            </ImageListItem>
          ))}
        </ImageList>
      )}

      {/* Pending previews for new raffles */}
      {previews.length > 0 && (
        <ImageList cols={3} gap={8} sx={{ mt: 2 }}>
          {previews.map((src, i) => (
            <ImageListItem key={i}>
              <img
                src={src}
                alt=""
                style={{ borderRadius: 8, objectFit: "cover", height: 140 }}
              />
              <ImageListItemBar
                sx={{ background: "transparent" }}
                position="top"
                actionPosition="right"
                actionIcon={
                  <IconButton
                    size="small"
                    sx={{ bgcolor: "rgba(0,0,0,0.6)", color: "white", m: 0.5 }}
                    onClick={() => handleRemovePreview(i)}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                }
              />
            </ImageListItem>
          ))}
        </ImageList>
      )}
    </Box>
  );
}
