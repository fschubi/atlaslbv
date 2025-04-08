import React, { useRef, useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  IconButton,
  Divider,
  useTheme
} from '@mui/material';
import {
  Clear as ClearIcon,
  Save as SaveIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

interface SignatureCanvasProps {
  width?: number;
  height?: number;
  label?: string;
  existingSignature?: string | null;
  onSave: (signatureData: string) => void;
  onClear?: () => void;
  disabled?: boolean;
  showControls?: boolean;
}

const SignatureCanvas: React.FC<SignatureCanvasProps> = ({
  width = 400,
  height = 200,
  label = 'Unterschrift',
  existingSignature = null,
  onSave,
  onClear,
  disabled = false,
  showControls = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const theme = useTheme();

  // Effekt zum Einrichten des Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    // Canvas auf die richtige Größe und Auflösung setzen
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;

    // Canvas-Styling
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    // Skalieren für hochauflösende Displays
    context.scale(dpr, dpr);

    // Canvas zurücksetzen
    context.clearRect(0, 0, width, height);

    // Zeicheneinstellungen
    context.lineWidth = 2;
    context.lineCap = 'round';
    context.strokeStyle = theme.palette.primary.main;

    // Vorhandene Unterschrift anzeigen, falls vorhanden
    if (existingSignature) {
      const img = new Image();
      img.onload = () => {
        if (context && canvas) {
          context.drawImage(img, 0, 0, width, height);
          setHasSignature(true);
        }
      };
      img.src = existingSignature;
    }
  }, [width, height, existingSignature, theme]);

  // Startpunkt für Zeichnen
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (disabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    setIsDrawing(true);

    // Position bestimmen
    let clientX, clientY;

    if ('touches' in e) {
      // Touch-Event
      e.preventDefault(); // Verhindern von Scrollen während des Zeichnens
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      // Maus-Event
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    context.beginPath();
    context.moveTo(x, y);
  };

  // Während des Zeichnens
  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || disabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    // Position bestimmen
    let clientX, clientY;

    if ('touches' in e) {
      // Touch-Event
      e.preventDefault(); // Verhindern von Scrollen während des Zeichnens
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      // Maus-Event
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    context.lineTo(x, y);
    context.stroke();

    setHasSignature(true);
  };

  // Zeichnen beenden
  const endDrawing = () => {
    setIsDrawing(false);
  };

  // Canvas leeren
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);

    if (onClear) {
      onClear();
    }
  };

  // Unterschrift speichern
  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature) return;

    // Als Basis64-Bild speichern
    const signatureData = canvas.toDataURL('image/png');
    onSave(signatureData);
  };

  return (
    <Box sx={{ width: width, maxWidth: '100%' }}>
      <Typography variant="subtitle1" gutterBottom>
        {label}
      </Typography>

      <Paper
        elevation={2}
        sx={{
          width: width,
          height: height,
          backgroundColor: theme.palette.background.default,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 1
        }}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={endDrawing}
          onMouseLeave={endDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={endDrawing}
          style={{
            touchAction: 'none', // Verhindert das Scrollen auf Touch-Geräten
            cursor: disabled ? 'not-allowed' : 'crosshair'
          }}
        />
      </Paper>

      {showControls && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
          <Button
            startIcon={<ClearIcon />}
            onClick={clearCanvas}
            disabled={!hasSignature || disabled}
            size="small"
            color="secondary"
          >
            Löschen
          </Button>

          <Button
            startIcon={<SaveIcon />}
            onClick={saveSignature}
            disabled={!hasSignature || disabled}
            size="small"
            variant="contained"
            color="primary"
          >
            Speichern
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default SignatureCanvas;
