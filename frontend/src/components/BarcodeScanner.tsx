import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tooltip,
  CircularProgress,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Checkbox,
  SelectChangeEvent
} from '@mui/material';
import {
  Close as CloseIcon,
  QrCode as QrCodeIcon,
  History as HistoryIcon,
  Delete as DeleteIcon,
  CameraAlt as CameraIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  FlipCameraAndroid as FlipCameraIcon
} from '@mui/icons-material';
import { BrowserMultiFormatReader, BarcodeFormat } from '@zxing/browser';
import { Html5QrcodeScanner } from 'html5-qrcode';

// Anzeigename für Barcode-Typen
const barcodeTypeNames: Record<BarcodeFormat, string> = {
  [BarcodeFormat.AZTEC]: 'Aztec',
  [BarcodeFormat.CODABAR]: 'Codabar',
  [BarcodeFormat.CODE_39]: 'Code 39',
  [BarcodeFormat.CODE_93]: 'Code 93',
  [BarcodeFormat.CODE_128]: 'Code 128',
  [BarcodeFormat.DATA_MATRIX]: 'Data Matrix',
  [BarcodeFormat.EAN_8]: 'EAN-8',
  [BarcodeFormat.EAN_13]: 'EAN-13',
  [BarcodeFormat.ITF]: 'ITF',
  [BarcodeFormat.MAXICODE]: 'MaxiCode',
  [BarcodeFormat.PDF_417]: 'PDF 417',
  [BarcodeFormat.QR_CODE]: 'QR Code',
  [BarcodeFormat.RSS_14]: 'RSS 14',
  [BarcodeFormat.RSS_EXPANDED]: 'RSS Expanded',
  [BarcodeFormat.UPC_A]: 'UPC-A',
  [BarcodeFormat.UPC_E]: 'UPC-E',
  [BarcodeFormat.UPC_EAN_EXTENSION]: 'UPC/EAN Extension'
};

// Farbkodierung für Barcode-Typen
const barcodeColors: Record<BarcodeFormat, string> = {
  [BarcodeFormat.QR_CODE]: '#1976d2', // Blau für QR-Codes
  [BarcodeFormat.DATA_MATRIX]: '#388e3c', // Grün für Data Matrix
  [BarcodeFormat.EAN_13]: '#f57c00', // Orange für EAN-13
  [BarcodeFormat.EAN_8]: '#f57c00', // Orange für EAN-8
  [BarcodeFormat.UPC_A]: '#d32f2f', // Rot für UPC-A
  [BarcodeFormat.UPC_E]: '#d32f2f', // Rot für UPC-E
  [BarcodeFormat.CODE_128]: '#7b1fa2', // Lila für Code 128
  [BarcodeFormat.CODE_39]: '#7b1fa2', // Lila für Code 39
  [BarcodeFormat.CODE_93]: '#7b1fa2', // Lila für Code 93
  [BarcodeFormat.ITF]: '#5d4037', // Braun für ITF
  [BarcodeFormat.AZTEC]: '#00796b', // Türkis für Aztec
  [BarcodeFormat.CODABAR]: '#455a64', // Blaugrau für Codabar
  [BarcodeFormat.PDF_417]: '#827717', // Olivgrün für PDF 417
  [BarcodeFormat.MAXICODE]: '#ff5722', // Deep Orange für MaxiCode
  [BarcodeFormat.RSS_14]: '#795548', // Braun für RSS 14
  [BarcodeFormat.RSS_EXPANDED]: '#795548', // Braun für RSS Expanded
  [BarcodeFormat.UPC_EAN_EXTENSION]: '#9e9e9e' // Grau für UPC/EAN Extension
};

// Definition der ScanResult-Schnittstelle
interface ScanResult {
  code: string;
  timestamp: Date;
  format: BarcodeFormat;
}

// Verfügbare Barcode-Formate
const availableFormats: BarcodeFormat[] = [
  BarcodeFormat.QR_CODE,
  BarcodeFormat.DATA_MATRIX,
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
  BarcodeFormat.CODE_128,
  BarcodeFormat.CODE_39,
  BarcodeFormat.CODE_93
];

type BarcodeScannerProps = {
  onDetected: (code: string, format?: BarcodeFormat) => void;
  onClose: () => void;
  open?: boolean;
  title?: string;
  saveHistory?: boolean;
  showHistoryDefault?: boolean;
};

const LOCAL_STORAGE_KEY = 'atlas_barcode_history';
const MAX_HISTORY_ITEMS = 10;

// Prüfe, ob wir in der Entwicklungsumgebung sind
const isDevelopment = (): boolean => {
  return window.location.hostname === 'localhost' ||
         window.location.hostname === '127.0.0.1' ||
         window.location.hostname.includes('192.168.');
};

// Interface für das torch-Feature
interface MediaTrackCapabilitiesWithTorch extends MediaTrackCapabilities {
  torch?: boolean;
}

// Interface für torch-Constraints
interface MediaTrackConstraintSetWithTorch extends MediaTrackConstraintSet {
  torch?: boolean;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  onDetected,
  onClose,
  open = true,
  title = 'Barcode/QR-Code scannen',
  saveHistory = true,
  showHistoryDefault = false
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanning, setScanning] = useState<boolean>(true);
  const [selectedFormats, setSelectedFormats] = useState<BarcodeFormat[]>(availableFormats);
  const [showHistory, setShowHistory] = useState<boolean>(showHistoryDefault);
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
  const [flashlightAvailable, setFlashlightAvailable] = useState<boolean>(false);
  const [flashlightOn, setFlashlightOn] = useState<boolean>(false);
  const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastScan, setLastScan] = useState<ScanResult | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  // Lade die Scan-Historie aus dem Local Storage
  useEffect(() => {
    if (saveHistory) {
      try {
        const storedHistory = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedHistory) {
          const parsedHistory: ScanResult[] = JSON.parse(storedHistory, (key, value) => {
            if (key === 'timestamp') {
              return new Date(value);
            }
            return value;
          });
          setScanHistory(parsedHistory);
        }
      } catch (err) {
        console.error('Fehler beim Laden der Scan-Historie:', err);
      }
    }
  }, [saveHistory]);

  // Speichere die Scan-Historie im Local Storage
  useEffect(() => {
    if (saveHistory && scanHistory.length > 0) {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(scanHistory));
      } catch (err) {
        console.error('Fehler beim Speichern der Scan-Historie:', err);
      }
    }
  }, [scanHistory, saveHistory]);

  // Lade verfügbare Kameras
  useEffect(() => {
    const loadCameras = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter(device => device.kind === 'videoinput');
        setCameraDevices(cameras);

        // Wähle standardmäßig die Rückkamera (falls verfügbar)
        const backCamera = cameras.find(camera =>
          camera.label.toLowerCase().includes('back') ||
          camera.label.toLowerCase().includes('rück') ||
          camera.label.toLowerCase().includes('hinten')
        );

        if (backCamera) {
          setSelectedCamera(backCamera.deviceId);
        } else if (cameras.length > 0) {
          setSelectedCamera(cameras[0].deviceId);
        }
      } catch (err) {
        console.error('Fehler beim Laden der Kameras:', err);
      }
    };

    if (open) {
      loadCameras();
    }
  }, [open]);

  // Starte den Scanner
  useEffect(() => {
    if (!open) return;

    const scanner = new Html5QrcodeScanner(
      'reader',
      {
        qrbox: {
          width: 250,
          height: 250,
        },
        fps: 10,
      },
      false
    );

    scanner.render(
      (decodedText) => {
        setScanning(false);
        onDetected(decodedText);
      },
      (error) => {
        setError(error);
      }
    );

    scannerRef.current = scanner;

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
    };
  }, [onDetected]);

  // Flashlight umschalten
  const toggleFlashlight = async () => {
    if (!videoRef.current || !videoRef.current.srcObject) return;

    try {
      const stream = videoRef.current.srcObject as MediaStream;
      const track = stream.getVideoTracks()[0];

      // Prüfe erneut, ob Flashlight unterstützt wird
      const capabilities = track.getCapabilities() as MediaTrackCapabilitiesWithTorch;
      if (!capabilities.torch) {
        console.log('Flashlight wird von diesem Gerät nicht unterstützt');
        return;
      }

      const newState = !flashlightOn;
      const constraints: MediaTrackConstraintSetWithTorch = {
        advanced: [{ torch: newState } as MediaTrackConstraintSetWithTorch]
      };

      await track.applyConstraints(constraints);
      setFlashlightOn(newState);
    } catch (err) {
      console.error('Fehler beim Umschalten des Flashlights:', err);
    }
  };

  // Kamera wechseln
  const handleCameraChange = (event: SelectChangeEvent) => {
    const deviceId = event.target.value;
    setSelectedCamera(deviceId);
  };

  // Format-Auswahl ändern
  const handleFormatChange = (event: SelectChangeEvent<BarcodeFormat[]>) => {
    const formats = event.target.value as unknown as BarcodeFormat[];
    setSelectedFormats(formats);
  };

  // Test-Funktion für Entwicklungsumgebungen ohne Kamera
  const handleTestDetection = () => {
    const testFormats = [
      BarcodeFormat.QR_CODE,
      BarcodeFormat.EAN_13,
      BarcodeFormat.CODE_128
    ];
    const randomFormat = testFormats[Math.floor(Math.random() * testFormats.length)];
    const randomCode = `TEST-${randomFormat}-${Math.floor(Math.random() * 100000)}`;

    const newScanResult: ScanResult = {
      code: randomCode,
      timestamp: new Date(),
      format: randomFormat
    };

    // Letzte Scan speichern
    setLastScan(newScanResult);

    // Scan-Historie aktualisieren
    if (saveHistory) {
      setScanHistory(prev => [newScanResult, ...prev].slice(0, MAX_HISTORY_ITEMS));
    }

    onDetected(randomCode, randomFormat);
  };

  // Scan-Historie löschen
  const clearHistory = () => {
    if (saveHistory) {
      setScanHistory([]);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  };

  // Aus der Historie auswählen
  const selectFromHistory = (result: ScanResult) => {
    onDetected(result.code, result.format);
    // Optional: Schließen nach Auswahl
    // onClose();
  };

  const handleClose = () => {
    if (scannerRef.current) {
      scannerRef.current.clear();
    }
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          height: '80vh',
          maxHeight: 600,
        },
      }}
    >
      <DialogTitle>Barcode Scanner</DialogTitle>
      <DialogContent>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            height: '100%',
          }}
        >
          {scanning ? (
            <>
              <div id="reader" style={{ width: '100%' }} />
              {error && (
                <Typography color="error" variant="body2">
                  {error}
                </Typography>
              )}
            </>
          ) : (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <CircularProgress />
              <Typography>Verarbeite Barcode...</Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Abbrechen</Button>
      </DialogActions>
    </Dialog>
  );
};

export default BarcodeScanner;
