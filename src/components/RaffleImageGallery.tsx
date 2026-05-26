"use client";

import * as React from "react";
import { Box, IconButton, MobileStepper } from "@mui/material";
import { KeyboardArrowLeft, KeyboardArrowRight } from "@mui/icons-material";

type Props = {
  images: { id: string; key: string }[];
};

export default function RaffleImageGallery({ images }: Props) {
  const [activeStep, setActiveStep] = React.useState(0);
  const maxSteps = images.length;

  if (images.length === 0) return null;

  const handleNext = () => setActiveStep((prev) => (prev + 1) % maxSteps);
  const handleBack = () => setActiveStep((prev) => (prev - 1 + maxSteps) % maxSteps);

  return (
    <Box sx={{ position: "relative", mb: 3 }}>
      {/* Main image */}
      <Box
        sx={{
          width: "100%",
          borderRadius: 3,
          overflow: "hidden",
          position: "relative",
          bgcolor: "grey.100",
        }}
      >
        <img
          src={`/api/images/${images[activeStep].key}`}
          alt=""
          style={{
            width: "100%",
            height: "auto",
            maxHeight: 400,
            objectFit: "cover",
            display: "block",
          }}
        />

        {/* Navigation arrows */}
        {maxSteps > 1 && (
          <>
            <IconButton
              onClick={handleBack}
              sx={{
                position: "absolute",
                top: "50%",
                left: 8,
                transform: "translateY(-50%)",
                bgcolor: "rgba(255,255,255,0.85)",
                "&:hover": { bgcolor: "rgba(255,255,255,0.95)" },
                boxShadow: 1,
              }}
              size="small"
            >
              <KeyboardArrowLeft />
            </IconButton>
            <IconButton
              onClick={handleNext}
              sx={{
                position: "absolute",
                top: "50%",
                right: 8,
                transform: "translateY(-50%)",
                bgcolor: "rgba(255,255,255,0.85)",
                "&:hover": { bgcolor: "rgba(255,255,255,0.95)" },
                boxShadow: 1,
              }}
              size="small"
            >
              <KeyboardArrowRight />
            </IconButton>
          </>
        )}
      </Box>

      {/* Dots indicator */}
      {maxSteps > 1 && (
        <MobileStepper
          steps={maxSteps}
          position="static"
          activeStep={activeStep}
          sx={{
            justifyContent: "center",
            bgcolor: "transparent",
            mt: 1,
            "& .MuiMobileStepper-dot": { mx: 0.5 },
          }}
          backButton={<span />}
          nextButton={<span />}
        />
      )}

      {/* Thumbnails */}
      {maxSteps > 1 && (
        <Box
          sx={{
            display: "flex",
            gap: 1,
            justifyContent: "center",
            mt: 1,
            flexWrap: "wrap",
          }}
        >
          {images.map((img, i) => (
            <Box
              key={img.id}
              onClick={() => setActiveStep(i)}
              sx={{
                width: 56,
                height: 56,
                borderRadius: 1.5,
                overflow: "hidden",
                cursor: "pointer",
                border: i === activeStep ? "2px solid" : "2px solid transparent",
                borderColor: i === activeStep ? "primary.main" : "transparent",
                opacity: i === activeStep ? 1 : 0.6,
                transition: "all 0.2s",
                "&:hover": { opacity: 1 },
              }}
            >
              <img
                src={`/api/images/${img.key}`}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
