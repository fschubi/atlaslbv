import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Divider,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Alert,
  Snackbar,
  Grid,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
  Badge,
  Stack,
  FormControlLabel
} from '@mui/material';
import {
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Cancel as CancelIcon,
  ArrowBack as ArrowBackIcon,
  QrCodeScanner as QrCodeScannerIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  OfflinePin as OfflinePinIcon,
  SyncProblem as SyncProblemIcon,
  CloudOff as CloudOffIcon,
  Close as CloseIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon
} from '@mui/icons-material';
import BarcodeScanner from '../components/BarcodeScanner';
import { inventoryApi, devicesApi } from '../utils/api';
import { BarcodeFormat } from '@zxing/browser';
import { alpha } from '@mui/material/styles';
import AtlasTable, { AtlasColumn } from '../components/AtlasTable';

interface SessionDevice {
  id: string;
  name: string;
  serialNumber: string;
  inventoryNumber: string;
  status: string;
  lastSeen: string;
  location: string;
  checked: boolean;
}

interface SessionDetails {
  id: string;
  name: string;
  description: string;
  location: string;
  status: string;
  startDate: string;
  endDate: string | null;
  progress: number;
  totalDevices: number;
  checkedDevices: number;
}

interface BatchScanItem {
  code: string;
  timestamp: Date;
  deviceId?: string;
  deviceName?: string;
  valid: boolean;
  processed: boolean;
}

const InventorySession: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [sessionDetails, setSessionDetails] = useState<SessionDetails | null>(null);
  const [devices, setDevices] = useState<SessionDevice[]>([]);
  const [filteredDevices, setFilteredDevices] = useState<SessionDevice[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [scannerOpen, setScannerOpen] = useState<boolean>(false);
  const [missingDevicesOpen, setMissingDevicesOpen] = useState<boolean>(false);
  const [missingDevices, setMissingDevices] = useState<SessionDevice[]>([]);

  // Neue Zustände für Batch-Scan-Modus
  const [batchScanMode, setBatchScanMode] = useState<boolean>(false);
  const [batchScannedItems, setBatchScannedItems] = useState<BatchScanItem[]>([]);
  const [isSavingBatch, setIsSavingBatch] = useState<boolean>(false);
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);
  const [offlineScans, setOfflineScans] = useState<BatchScanItem[]>([]);

  // Neuer Zustand zur Überprüfung, ob die Session gesperrt ist
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [userIsAdmin, setUserIsAdmin] = useState<boolean>(false);
  const [lockMessage, setLockMessage] = useState<string | null>(null);

  useEffect(() => {
    if (sessionId) {
      loadSessionData();

      // Überprüfe den Benutzer-Typ (simuliert für Demo)
      // In einer realen Anwendung würde das aus dem Authentication-System kommen
      const userRole = localStorage.getItem('userRole') || 'user';
      setUserIsAdmin(userRole === 'admin');
    }

    // Versuche, offline gespeicherte Scans zu laden
    const savedOfflineScans = localStorage.getItem(`inventory_offline_scans_${sessionId}`);
    if (savedOfflineScans) {
      try {
        const parsedScans = JSON.parse(savedOfflineScans) as BatchScanItem[];
        setOfflineScans(parsedScans);
      } catch (e) {
        console.error('Fehler beim Laden der Offline-Scans:', e);
      }
    }
  }, [sessionId]);

  // Überprüfe, ob die Session gesperrt werden soll, wenn sich der Status ändert
  useEffect(() => {
    if (sessionDetails) {
      // Session ist gesperrt, wenn sie aktiv ist und der Benutzer kein Admin ist
      const shouldLock = sessionDetails.status === 'Aktiv' && !userIsAdmin;
      setIsLocked(shouldLock);

      if (shouldLock) {
        setLockMessage(
          'Diese Inventursitzung ist aktiv. Nur Admins können Änderungen vornehmen. ' +
          'Sie können nur Geräte scannen und überprüfen, aber keine strukturellen Änderungen durchführen.'
        );
      } else {
        setLockMessage(null);
      }
    }
  }, [sessionDetails, userIsAdmin]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredDevices(devices);
    } else {
      const searchTermLower = searchTerm.toLowerCase();
      setFilteredDevices(
        devices.filter(
          (device) =>
            device.name.toLowerCase().includes(searchTermLower) ||
            device.serialNumber.toLowerCase().includes(searchTermLower) ||
            device.inventoryNumber.toLowerCase().includes(searchTermLower)
        )
      );
    }
  }, [searchTerm, devices]);

  const loadSessionData = async (): Promise<void> => {
    try {
      setIsLoading(true);
      if (!sessionId) return;

      // Laden der Sitzungsdetails
      const sessionResponse = await inventoryApi.getInventorySession(sessionId);
      setSessionDetails(sessionResponse);

      // Laden der Geräte in dieser Sitzung
      const devicesResponse = await devicesApi.getSessionDevices(sessionId);
      setDevices(devicesResponse);
      setFilteredDevices(devicesResponse);

      setIsLoading(false);
    } catch (error) {
      console.error('Fehler beim Laden der Inventursitzungsdaten:', error);
      setMessage({
        type: 'error',
        text: 'Fehler beim Laden der Inventursitzungsdaten. Bitte versuchen Sie es später erneut.'
      });
      setIsLoading(false);
    }
  };

  const handleDeviceCheck = async (deviceId: string): Promise<void> => {
    try {
      if (!sessionId) return;

      // Alle Benutzer können Geräte markieren, auch wenn die Session gesperrt ist

      // Wenn Offline-Modus aktiviert ist, speichere lokal
      if (isOfflineMode) {
        const device = devices.find(d => d.id === deviceId);
        if (device) {
          const offlineScan: BatchScanItem = {
            code: device.serialNumber || device.inventoryNumber,
            timestamp: new Date(),
            deviceId: device.id,
            deviceName: device.name,
            valid: true,
            processed: false
          };

          const updatedOfflineScans = [...offlineScans, offlineScan];
          setOfflineScans(updatedOfflineScans);

          // Auch in localStorage speichern
          localStorage.setItem(
            `inventory_offline_scans_${sessionId}`,
            JSON.stringify(updatedOfflineScans)
          );

          // Optimistisches UI-Update
          setDevices(prev =>
            prev.map(d =>
              d.id === deviceId
                ? { ...d, checked: true }
                : d
            )
          );

          setMessage({
            type: 'success',
            text: 'Gerät offline gespeichert. Wird bei Netzwerkverbindung synchronisiert.'
          });
          return;
        }
      }

      // Markieren des Geräts als überprüft
      await devicesApi.markDeviceAsChecked(sessionId, deviceId);

      // Aktualisieren der lokalen Daten
      setDevices(prev =>
        prev.map(device =>
          device.id === deviceId
            ? { ...device, checked: true }
            : device
        )
      );

      // Aktualisieren des Fortschritts
      const progressResponse = await devicesApi.updateSessionProgress(sessionId);

      if (sessionDetails) {
        setSessionDetails({
          ...sessionDetails,
          progress: progressResponse.progress,
          checkedDevices: progressResponse.checkedDevices
        });
      }

      setMessage({ type: 'success', text: 'Gerät erfolgreich überprüft' });
    } catch (error) {
      console.error('Fehler beim Markieren des Geräts als überprüft:', error);
      setMessage({
        type: 'error',
        text: 'Fehler beim Markieren des Geräts als überprüft. Bitte versuchen Sie es später erneut.'
      });
    }
  };

  const handleBarcodeDetected = async (code: string, format?: BarcodeFormat): Promise<void> => {
    // Wenn Batch-Scan-Modus aktiv ist, Scanner nicht schließen
    if (!batchScanMode) {
      setScannerOpen(false);
    }

    // Suchen nach dem Gerät mit dem gescannten Code
    const foundDevice = devices.find(
      device =>
        device.serialNumber === code ||
        device.inventoryNumber === code
    );

    // Im Batch-Modus zur Batch-Liste hinzufügen
    if (batchScanMode) {
      const newScanItem: BatchScanItem = {
        code,
        timestamp: new Date(),
        valid: !!foundDevice,
        processed: false,
      };

      if (foundDevice) {
        newScanItem.deviceId = foundDevice.id;
        newScanItem.deviceName = foundDevice.name;
      }

      // Nur hinzufügen, wenn das Gerät noch nicht gescannt wurde
      const alreadyScanned = batchScannedItems.some(item =>
        item.code === code || (foundDevice && item.deviceId === foundDevice.id)
      );

      if (!alreadyScanned) {
        setBatchScannedItems([...batchScannedItems, newScanItem]);

        // Ton abspielen für Feedback (optional)
        const isSuccess = !!foundDevice && !foundDevice.checked;
        const audio = new Audio(isSuccess ? '/assets/success-beep.mp3' : '/assets/error-beep.mp3');
        audio.play().catch(e => console.error('Audio konnte nicht abgespielt werden:', e));
      }

      return;
    }

    // Standardverhalten für Einzelscan
    if (foundDevice) {
      if (!foundDevice.checked) {
        await handleDeviceCheck(foundDevice.id);
        setSearchTerm(code); // Zeigt das gefundene Gerät an
      } else {
        setMessage({
          type: 'info',
          text: `Gerät "${foundDevice.name}" wurde bereits überprüft`
        });
      }
    } else {
      setMessage({
        type: 'error',
        text: `Kein Gerät mit Code ${code} in dieser Inventursitzung gefunden`
      });
    }
  };

  const handleToggleBatchMode = (): void => {
    if (batchScanMode && batchScannedItems.length > 0) {
      // Fragen, ob Batch-Daten gespeichert werden sollen
      if (window.confirm('Es sind noch ungespeicherte Scan-Daten vorhanden. Möchten Sie diese speichern?')) {
        handleSaveBatchScans();
      }
    }

    setBatchScanMode(!batchScanMode);
    setBatchScannedItems([]);
  };

  const handleSaveBatchScans = async (): Promise<void> => {
    if (isLocked && !userIsAdmin) {
      setMessage({
        type: 'error',
        text: 'Sie haben keine Berechtigung, Batch-Scans während einer aktiven Inventur zu speichern. Bitte kontaktieren Sie einen Administrator.'
      });
      return;
    }

    if (!sessionId || batchScannedItems.length === 0) return;

    setIsSavingBatch(true);

    try {
      // Nur gültige und unverarbeitete Scans speichern
      const validItems = batchScannedItems.filter(item => item.valid && !item.processed);

      if (validItems.length === 0) {
        setMessage({ type: 'info', text: 'Keine gültigen, unverarbeiteten Scans zum Speichern vorhanden' });
        setIsSavingBatch(false);
        return;
      }

      // Sammle alle Device-IDs
      const deviceIds = validItems
        .map(item => item.deviceId)
        .filter((id): id is string => id !== undefined);

      // Sende Batch-Update-Anfrage an API
      await devicesApi.markDevicesBatchAsChecked(sessionId, deviceIds);

      // Markiere Scans als verarbeitet
      setBatchScannedItems(prev =>
        prev.map(item =>
          deviceIds.includes(item.deviceId as string)
            ? { ...item, processed: true }
            : item
        )
      );

      // Aktualisiere Lokale Geräteliste
      setDevices(prev =>
        prev.map(device =>
          deviceIds.includes(device.id)
            ? { ...device, checked: true }
            : device
        )
      );

      // Aktualisiere Fortschritt
      const progressResponse = await devicesApi.updateSessionProgress(sessionId);

      if (sessionDetails) {
        setSessionDetails({
          ...sessionDetails,
          progress: progressResponse.progress,
          checkedDevices: progressResponse.checkedDevices
        });
      }

      setMessage({
        type: 'success',
        text: `${deviceIds.length} Geräte erfolgreich als überprüft markiert`
      });

      // Option: Nach dem Speichern die Liste leeren
      setBatchScannedItems([]);

    } catch (error) {
      console.error('Fehler beim Batch-Speichern der Geräte:', error);
      setMessage({
        type: 'error',
        text: 'Fehler beim Speichern der gescannten Geräte. Bitte versuchen Sie es später erneut.'
      });
    } finally {
      setIsSavingBatch(false);
    }
  };

  const handleRemoveBatchItem = (index: number): void => {
    setBatchScannedItems(prev => {
      const updated = [...prev];
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleToggleOfflineMode = (): void => {
    setIsOfflineMode(!isOfflineMode);

    if (isOfflineMode) {
      // Wenn Offline-Modus deaktiviert wird, frage nach Synchronisierung
      if (offlineScans.length > 0) {
        if (window.confirm('Möchten Sie die offline gespeicherten Scans jetzt synchronisieren?')) {
          handleSyncOfflineScans();
        }
      }
    } else {
      setMessage({
        type: 'info',
        text: 'Offline-Modus aktiviert. Scans werden lokal gespeichert.'
      });
    }
  };

  const handleSyncOfflineScans = async (): Promise<void> => {
    if (isLocked && !userIsAdmin) {
      setMessage({
        type: 'error',
        text: 'Sie haben keine Berechtigung, Offline-Scans während einer aktiven Inventur zu synchronisieren. Bitte kontaktieren Sie einen Administrator.'
      });
      return;
    }

    if (!sessionId || offlineScans.length === 0) return;

    setIsSavingBatch(true);

    try {
      // Nur unverarbeitete Offline-Scans
      const unprocessedScans = offlineScans.filter(scan => !scan.processed);

      if (unprocessedScans.length === 0) {
        setMessage({ type: 'info', text: 'Keine unverarbeiteten Offline-Scans zum Synchronisieren' });
        setIsSavingBatch(false);
        return;
      }

      // Sammle alle Device-IDs
      const deviceIds = unprocessedScans
        .map(item => item.deviceId)
        .filter((id): id is string => id !== undefined);

      // Sende Batch-Update-Anfrage an API
      await devicesApi.markDevicesBatchAsChecked(sessionId, deviceIds);

      // Markiere Offline-Scans als verarbeitet
      setOfflineScans(prev =>
        prev.map(item =>
          deviceIds.includes(item.deviceId as string)
            ? { ...item, processed: true }
            : item
        )
      );

      // Aktualisiere lokalen Speicher
      localStorage.setItem(
        `inventory_offline_scans_${sessionId}`,
        JSON.stringify(offlineScans.map(item =>
          deviceIds.includes(item.deviceId as string)
            ? { ...item, processed: true }
            : item
        ))
      );

      // Aktualisiere Fortschritt
      const progressResponse = await devicesApi.updateSessionProgress(sessionId);

      if (sessionDetails) {
        setSessionDetails({
          ...sessionDetails,
          progress: progressResponse.progress,
          checkedDevices: progressResponse.checkedDevices
        });
      }

      setMessage({
        type: 'success',
        text: `${deviceIds.length} Offline-Scans erfolgreich synchronisiert`
      });

    } catch (error) {
      console.error('Fehler beim Synchronisieren der Offline-Scans:', error);
      setMessage({
        type: 'error',
        text: 'Fehler beim Synchronisieren. Ihre Scans bleiben gespeichert und können später erneut synchronisiert werden.'
      });
    } finally {
      setIsSavingBatch(false);
    }
  };

  const handleCompleteSession = async (): Promise<void> => {
    if (!sessionId || !sessionDetails) return;

    // Erst prüfen, ob es ungespeicherte Batch-Scans gibt
    if (batchScannedItems.length > 0 && batchScannedItems.some(item => item.valid && !item.processed)) {
      if (window.confirm('Es gibt noch ungespeicherte Scan-Daten. Möchten Sie diese vor dem Abschluss speichern?')) {
        await handleSaveBatchScans();
      }
    }

    // Dann prüfen, ob es unsynchronisierte Offline-Scans gibt
    if (offlineScans.length > 0 && offlineScans.some(scan => !scan.processed)) {
      if (window.confirm('Es gibt noch nicht synchronisierte Offline-Scans. Möchten Sie diese vor dem Abschluss synchronisieren?')) {
        await handleSyncOfflineScans();
      }
    }

    try {
      // Überprüfen fehlender Geräte
      const missingResponse = await devicesApi.findMissingDevices(sessionId);

      if (missingResponse.length > 0) {
        setMissingDevices(missingResponse);
        setMissingDevicesOpen(true);
      } else {
        // Wenn keine Geräte fehlen, Sitzung abschließen
        await inventoryApi.completeInventorySession(sessionId);
        setMessage({ type: 'success', text: 'Inventursitzung erfolgreich abgeschlossen' });

        // Nach erfolgreichem Abschluss zur Inventurübersicht zurückleiten
        setTimeout(() => {
          navigate('/inventory');
        }, 2000);
      }
    } catch (error) {
      console.error('Fehler beim Abschließen der Inventursitzung:', error);
      setMessage({
        type: 'error',
        text: 'Fehler beim Abschließen der Inventursitzung. Bitte versuchen Sie es später erneut.'
      });
    }
  };

  const handleForcedComplete = async (): Promise<void> => {
    if (!sessionId) return;

    try {
      await inventoryApi.forceCompleteInventorySession(sessionId);
      setMissingDevicesOpen(false);
      setMessage({ type: 'success', text: 'Inventursitzung trotz fehlender Geräte abgeschlossen' });

      setTimeout(() => {
        navigate('/inventory');
      }, 2000);
    } catch (error) {
      console.error('Fehler beim erzwungenen Abschließen der Inventursitzung:', error);
      setMessage({
        type: 'error',
        text: 'Fehler beim Abschließen der Inventursitzung. Bitte versuchen Sie es später erneut.'
      });
    }
  };

  const handleCloseMessage = (): void => {
    setMessage(null);
  };

  // Stapel-Scan-Dialog
  const BatchScanDialog = () => {
    const [scanCount, setScanCount] = useState<number>(0);
    const [barcodes, setBarcodes] = useState<string[]>([]);
    const [scanning, setScanning] = useState<boolean>(false);

    const handleScanStart = () => {
      setScanning(true);
      setBarcodes([]);
      setScanCount(0);
    };

    const handleBarcodeDetected = (barcode: string) => {
      if (!barcodes.includes(barcode)) {
        setBarcodes(prev => [...prev, barcode]);
        setScanCount(prev => prev + 1);
        // Feedback-Sound oder Vibration hinzufügen
        if ('vibrate' in navigator) {
          navigator.vibrate(200);
        }
      } else {
        // Fehlerton für doppelten Scan
        if ('vibrate' in navigator) {
          navigator.vibrate([100, 50, 100]);
        }
      }
    };

    const handleScanComplete = async () => {
      setScanning(false);
      setBatchScanMode(false);

      // Verarbeite alle gescannten Barcodes
      if (barcodes.length > 0) {
        try {
          setIsLoading(true);

          // Hier würden wir normalerweise einen API-Aufruf machen, um alle Geräte auf einmal zu validieren
          // Für Demo-Zwecke simulieren wir die Überprüfung
          for (const barcode of barcodes) {
            const deviceToCheck = devices.find(d =>
              d.inventoryNumber === barcode ||
              d.serialNumber === barcode);

            if (deviceToCheck && !deviceToCheck.checked) {
              await handleDeviceCheck(deviceToCheck.id);

              // Kurze Pause zwischen den Aktualisierungen
              await new Promise(resolve => setTimeout(resolve, 300));
            }
          }

          setMessage({
            type: 'success',
            text: `${scanCount} Geräte erfolgreich überprüft!`
          });
        } catch (error) {
          setMessage({
            type: 'error',
            text: 'Fehler beim Batch-Scannen: ' + (error as Error).message
          });
        } finally {
          setIsLoading(false);
        }
      }
    };

    return (
      <Dialog
        open={batchScanMode}
        onClose={() => !scanning && setBatchScanMode(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          Batch-Scan von Geräten
          <IconButton
            aria-label="Schließen"
            onClick={() => !scanning && setBatchScanMode(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
            disabled={scanning}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {!scanning ? (
            <>
              <Typography variant="body1" gutterBottom>
                Mit dem Batch-Scan können Sie mehrere Geräte nacheinander scannen.
                Jedes gescannte Gerät wird automatisch als überprüft markiert.
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Unterstützt werden Inventarnummern und Seriennummern.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<QrCodeScannerIcon />}
                onClick={handleScanStart}
                fullWidth
              >
                Batch-Scan starten
              </Button>
            </>
          ) : (
            <>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Scanner aktiv
                </Typography>
                <BarcodeScanner
                  onDetected={handleBarcodeDetected}
                  onClose={() => setScanning(false)}
                />
                <Typography variant="h4" sx={{ mt: 2, mb: 1 }}>
                  {scanCount}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Gescannte Geräte
                </Typography>

                {barcodes.length > 0 && (
                  <Paper
                    variant="outlined"
                    sx={{
                      mt: 2,
                      width: '100%',
                      maxHeight: '200px',
                      overflow: 'auto',
                      p: 1
                    }}
                  >
                    <List dense>
                      {barcodes.map((code, index) => (
                        <ListItem key={index}>
                          <ListItemText primary={code} />
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                )}
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() => setScanning(false)}
                >
                  Abbrechen
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleScanComplete}
                  disabled={scanCount === 0}
                >
                  {scanCount} Geräte verarbeiten
                </Button>
              </Box>
            </>
          )}
        </DialogContent>
      </Dialog>
    );
  };

  // Offline-Modus und Synchronisierung
  const toggleOfflineMode = () => {
    setIsOfflineMode(!isOfflineMode);
    setMessage({
      type: 'info',
      text: !isOfflineMode
        ? 'Offline-Modus aktiviert. Änderungen werden lokal gespeichert.'
        : 'Offline-Modus deaktiviert.'
    });
  };

  const syncOfflineScans = async () => {
    if (isLocked && !userIsAdmin) {
      setMessage({
        type: 'error',
        text: 'Sie haben keine Berechtigung, Offline-Scans während einer aktiven Inventur zu synchronisieren. Bitte kontaktieren Sie einen Administrator.'
      });
      return;
    }

    if (offlineScans.length === 0 || !navigator.onLine) return;

    try {
      setIsLoading(true);

      // Filtern nach unverarbeiteten Scans
      const unprocessedScans = offlineScans.filter(scan => !scan.processed);

      if (unprocessedScans.length === 0) {
        setMessage({
          type: 'info',
          text: 'Keine unverarbeiteten Offline-Scans zum Synchronisieren.'
        });
        setIsLoading(false);
        return;
      }

      // Für jeden Scan einen API-Aufruf durchführen
      let successCount = 0;

      for (const scan of unprocessedScans) {
        if (scan.deviceId) {
          try {
            await inventoryApi.checkDevice(sessionId!, scan.deviceId, {
              scannedAt: scan.timestamp.toISOString(),
              scannedBy: 'offline_user',
              method: 'barcode'
            });

            // Als verarbeitet markieren
            successCount++;
            scan.processed = true;
          } catch (err) {
            console.error(`Fehler beim Synchronisieren von Scan für Gerät ${scan.deviceId}:`, err);
          }
        }
      }

      // Aktualisiere die offlineScans mit den verarbeiteten Flags
      setOfflineScans([...offlineScans]);
      localStorage.setItem(`inventory_offline_scans_${sessionId}`, JSON.stringify(offlineScans));

      // Aktualisiere die Sitzungsdaten
      await loadSessionData();

      setMessage({
        type: 'success',
        text: `${successCount} von ${unprocessedScans.length} Offline-Scans erfolgreich synchronisiert.`
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Fehler bei der Synchronisierung: ' + (error as Error).message
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Offline-Daten löschen
  const clearOfflineData = () => {
    setOfflineScans([]);
    localStorage.removeItem(`inventory_offline_scans_${sessionId}`);
    setMessage({
      type: 'success',
      text: 'Offline-Daten gelöscht.'
    });
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!sessionDetails) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Inventursitzung nicht gefunden oder nicht zugänglich.</Alert>
        <Button
          variant="contained"
          sx={{ mt: 2 }}
          onClick={() => navigate('/inventory')}
          startIcon={<ArrowBackIcon />}
        >
          Zurück zur Übersicht
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header & Aktionen */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/inventory')}
            variant="outlined"
          >
            Zurück
          </Button>

          <Typography variant="h5" component="h1">
            {sessionDetails?.name}
          </Typography>

          <Chip
            label={sessionDetails?.status}
            color={
              sessionDetails?.status === 'Aktiv'
                ? 'primary'
                : sessionDetails?.status === 'Abgeschlossen'
                  ? 'success'
                  : 'default'
            }
            size="small"
          />

          <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title="Offline-Modus">
              <FormControlLabel
                control={
                  <Switch
                    checked={isOfflineMode}
                    onChange={toggleOfflineMode}
                    color="primary"
                    size="small"
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <CloudOffIcon fontSize="small" />
                    <Typography variant="body2">Offline</Typography>
                  </Box>
                }
                sx={{ mr: 2 }}
              />
            </Tooltip>

            {isOfflineMode && (
              <>
                <Badge
                  badgeContent={offlineScans.filter(s => !s.processed).length}
                  color="error"
                  sx={{ mr: 1 }}
                >
                  <Tooltip title="Offline-Scans synchronisieren">
                    <span>
                      <IconButton
                        color="primary"
                        onClick={syncOfflineScans}
                        disabled={!navigator.onLine || offlineScans.filter(s => !s.processed).length === 0}
                      >
                        <SyncProblemIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Badge>

                <Tooltip title="Offline-Daten löschen">
                  <IconButton
                    color="error"
                    onClick={clearOfflineData}
                    disabled={offlineScans.length === 0}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </Box>
        </Box>
      </Box>

      {/* Sperrmeldung */}
      {lockMessage && (
        <Alert
          severity="warning"
          sx={{ mb: 3 }}
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={() => setLockMessage(null)}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
        >
          {lockMessage}
        </Alert>
      )}

      {/* Fortschrittsanzeige */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle1">
              Fortschritt: {sessionDetails?.checkedDevices || 0} von {sessionDetails?.totalDevices || 0} Geräten
            </Typography>
          </Grid>
          <Grid item xs={12} md={8}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <LinearProgress
                variant="determinate"
                value={sessionDetails?.progress || 0}
                sx={{ flexGrow: 1, height: 10, borderRadius: 5 }}
              />
              <Typography variant="body2" sx={{ ml: 1, minWidth: 40 }}>
                {Math.round(sessionDetails?.progress || 0)}%
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Hauptinhalt */}
      <Grid container spacing={3}>
        {/* Linke Seite - Geräteliste oder Batch-Scan-Liste */}
        <Grid item xs={12} md={batchScanMode || offlineScans.length > 0 ? 7 : 12}>
          <Paper sx={{ p: 2, mb: 3 }}>
            {/* Suchleiste und Scanner-Button */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              {/* Suchfeld */}
              <TextField
                variant="outlined"
                size="small"
                placeholder="Suche nach Gerät..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm ? (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearchTerm('')}>
                        <CancelIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : undefined
                }}
                sx={{ width: 250 }}
              />
              <Tooltip title={batchScanMode ? "Batch-Scan starten" : "Gerät scannen"}>
                <IconButton
                  color="primary"
                  onClick={() => setScannerOpen(true)}
                  sx={{ bgcolor: theme => alpha(theme.palette.primary.main, 0.1) }}
                >
                  <Badge
                    badgeContent={batchScannedItems.length > 0 ? batchScannedItems.length : undefined}
                    color="primary"
                  >
                    <QrCodeScannerIcon />
                  </Badge>
                </IconButton>
              </Tooltip>
            </Box>

            {/* Geräteliste */}
            {!batchScanMode && (
              <>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  {filteredDevices.length} {filteredDevices.length === 1 ? 'Gerät' : 'Geräte'} gefunden
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <AtlasTable
                  columns={[
                    {
                      dataKey: 'name',
                      label: 'Gerät',
                      width: 220,
                      render: (value: any, row: SessionDevice) => (
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {row.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {row.inventoryNumber ? `Inv.Nr.: ${row.inventoryNumber}` : ''}
                            {row.inventoryNumber && row.serialNumber ? ' • ' : ''}
                            {row.serialNumber ? `S/N: ${row.serialNumber}` : ''}
                          </Typography>
                        </Box>
                      )
                    },
                    {
                      dataKey: 'type',
                      label: 'Typ',
                      width: 120
                    },
                    {
                      dataKey: 'location',
                      label: 'Standort',
                      width: 150
                    },
                    {
                      dataKey: 'status',
                      label: 'Status',
                      width: 120,
                      render: (value: any, row: SessionDevice) => (
                        <Chip
                          size="small"
                          label={row.checked ? 'Überprüft' : 'Ausstehend'}
                          color={row.checked ? 'success' : 'warning'}
                          sx={{ minWidth: 100 }}
                        />
                      )
                    },
                    {
                      dataKey: 'lastSeen',
                      label: 'Zuletzt gesehen',
                      width: 160,
                      render: (value: any) => (
                        value ? new Date(value).toLocaleDateString('de-DE', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        }) : 'Nie'
                      )
                    },
                    {
                      dataKey: 'actions',
                      label: 'Aktionen',
                      width: 120,
                      render: (value: any, row: SessionDevice) => {
                        if (!row.checked && sessionDetails?.status !== 'Abgeschlossen') {
                          return (
                            <Button
                              variant="contained"
                              size="small"
                              onClick={() => handleDeviceCheck(row.id)}
                              disabled={isOfflineMode && !navigator.onLine}
                            >
                              Überprüfen
                            </Button>
                          );
                        }
                        return "";
                      }
                    }
                  ]}
                  rows={filteredDevices}
                  heightPx={500}
                  emptyMessage="Keine Geräte in dieser Inventursitzung"
                />
              </>
            )}
          </Paper>
        </Grid>

        {/* Rechte Seite - Batch-Scan-Panel oder Offline-Scans */}
        {(batchScanMode || offlineScans.length > 0) && (
          <Grid item xs={12} md={5}>
            {/* Batch-Scan-Panel */}
            {batchScanMode && (
              <Paper sx={{ p: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Batch-Scan-Modus</Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    disabled={batchScannedItems.length === 0 || isSavingBatch}
                    onClick={handleSaveBatchScans}
                    startIcon={<SaveIcon />}
                  >
                    {isSavingBatch ? <CircularProgress size={24} /> : "Speichern"}
                  </Button>
                </Box>

                <Typography variant="body2" sx={{ mb: 2 }}>
                  Im Batch-Modus können Sie mehrere Geräte nacheinander scannen und dann alle gemeinsam speichern.
                </Typography>

                {batchScannedItems.length > 0 ? (
                  <List>
                    {batchScannedItems.map((item, index) => (
                      <ListItem
                        key={`${item.code}-${index}`}
                        sx={{
                          mb: 1,
                          borderLeft: '4px solid',
                          borderColor: item.valid
                            ? item.processed
                              ? 'success.main'
                              : 'primary.main'
                            : 'error.main',
                          bgcolor: alpha(
                            item.valid
                              ? item.processed
                                ? '#e8f5e9'
                                : '#e3f2fd'
                              : '#ffebee',
                            0.1
                          ),
                        }}
                      >
                        <ListItemText
                          primary={item.deviceName || item.code}
                          secondary={
                            <>
                              {`Code: ${item.code}`}<br />
                              {`Gescannt: ${item.timestamp.toLocaleTimeString()}`}<br />
                              {item.valid
                                ? item.processed
                                  ? 'Status: Gespeichert'
                                  : 'Status: Bereit zum Speichern'
                                : 'Status: Gerät nicht gefunden'
                              }
                            </>
                          }
                        />
                        <ListItemSecondaryAction>
                          {item.processed ? (
                            <CheckCircleIcon color="success" />
                          ) : (
                            <IconButton
                              edge="end"
                              onClick={() => handleRemoveBatchItem(index)}
                              disabled={isSavingBatch}
                            >
                              <DeleteIcon />
                            </IconButton>
                          )}
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography align="center" color="text.secondary" sx={{ py: 4 }}>
                    Noch keine Geräte gescannt. Drücken Sie auf den Scan-Button, um zu beginnen.
                  </Typography>
                )}
              </Paper>
            )}

            {/* Offline-Scans Panel */}
            {offlineScans.length > 0 && (
              <Paper sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <OfflinePinIcon sx={{ mr: 1 }} />
                      Offline-Scans
                    </Box>
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    disabled={offlineScans.every(scan => scan.processed) || isSavingBatch}
                    onClick={handleSyncOfflineScans}
                    startIcon={isSavingBatch ? <CircularProgress size={24} /> : <SyncProblemIcon />}
                  >
                    Synchronisieren
                  </Button>
                </Box>

                <Typography variant="body2" sx={{ mb: 2 }}>
                  {offlineScans.filter(scan => !scan.processed).length} ungespeicherte Offline-Scans vorhanden.
                </Typography>

                <List>
                  {offlineScans.slice(0, 5).map((item, index) => (
                    <ListItem
                      key={`offline-${item.code}-${index}`}
                      sx={{
                        mb: 1,
                        borderLeft: '4px solid',
                        borderColor: item.processed ? 'success.main' : 'warning.main',
                        bgcolor: alpha(item.processed ? '#e8f5e9' : '#fff3e0', 0.1),
                      }}
                    >
                      <ListItemText
                        primary={item.deviceName || item.code}
                        secondary={
                          <>
                            {`Code: ${item.code}`}<br />
                            {`Gescannt: ${new Date(item.timestamp).toLocaleString()}`}<br />
                            {item.processed
                              ? 'Status: Synchronisiert'
                              : 'Status: Noch nicht synchronisiert'
                            }
                          </>
                        }
                      />
                      <ListItemSecondaryAction>
                        {item.processed ? (
                          <CheckCircleIcon color="success" />
                        ) : (
                          <SyncProblemIcon color="warning" />
                        )}
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}

                  {offlineScans.length > 5 && (
                    <Typography variant="body2" align="center">
                      +{offlineScans.length - 5} weitere Scans
                    </Typography>
                  )}
                </List>
              </Paper>
            )}
          </Grid>
        )}
      </Grid>

      {/* Scanner Dialog */}
      {scannerOpen && (
        <BarcodeScanner
          onDetected={handleBarcodeDetected}
          onClose={() => batchScanMode ? setScannerOpen(false) : setScannerOpen(false)}
          title={batchScanMode ? "Batch-Scan" : "Geräte-Scanner"}
          saveHistory={true}
          open={scannerOpen}
        />
      )}

      {/* Dialog für fehlende Geräte */}
      <Dialog open={missingDevicesOpen} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <WarningIcon color="warning" sx={{ mr: 1 }} />
            Fehlende Geräte
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            Die folgenden {missingDevices.length} Geräte wurden während dieser Inventursitzung nicht überprüft:
          </Typography>

          <List>
            {missingDevices.map((device) => (
              <ListItem key={device.id} divider>
                <ListItemText
                  primary={device.name}
                  secondary={
                    <>
                      {device.serialNumber && `S/N: ${device.serialNumber}`}
                      {device.serialNumber && device.inventoryNumber && ' • '}
                      {device.inventoryNumber && `Inv: ${device.inventoryNumber}`}
                      <br />
                      Standort: {device.location}
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>

          <Typography variant="body1" sx={{ mt: 2 }} color="error">
            Möchten Sie die Inventur trotzdem abschließen? Diese Aktion kann nicht rückgängig gemacht werden.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMissingDevicesOpen(false)} color="primary">
            Abbrechen
          </Button>
          <Button onClick={handleForcedComplete} color="error" variant="contained" startIcon={<WarningIcon />}>
            Trotzdem abschließen
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar für Nachrichten */}
      <Snackbar
        open={message !== null}
        autoHideDuration={6000}
        onClose={handleCloseMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {message ? (
          <Alert onClose={handleCloseMessage} severity={message.type} sx={{ width: '100%' }}>
            {message.text}
          </Alert>
        ) : undefined}
      </Snackbar>

      {/* Batch-Scan-Dialog */}
      <BatchScanDialog />

      {/* Steuerelemente für die Sitzung - nur für Admins oder wenn nicht gesperrt */}
      <Box sx={{
        mt: 3,
        display: 'flex',
        gap: 2,
        flexWrap: 'wrap',
        opacity: isLocked && !userIsAdmin ? 0.6 : 1,
        pointerEvents: isLocked && !userIsAdmin ? 'none' : 'auto'
      }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<QrCodeScannerIcon />}
          onClick={() => setScannerOpen(true)}
        >
          Gerät scannen
        </Button>

        <Button
          variant="outlined"
          startIcon={batchScanMode ? <CancelIcon /> : <QrCodeScannerIcon />}
          onClick={() => setBatchScanMode(!batchScanMode)}
          color={batchScanMode ? "error" : "primary"}
        >
          {batchScanMode ? "Batch-Modus beenden" : "Batch-Scan starten"}
        </Button>

        {/* Weitere Steuerelemente */}

        {userIsAdmin && (
          <Tooltip title={isLocked ? "Bearbeitung freischalten" : "Bearbeitung sperren"}>
            <Button
              variant="outlined"
              color={isLocked ? "success" : "warning"}
              startIcon={isLocked ? <LockOpenIcon /> : <LockIcon />}
              onClick={() => setIsLocked(!isLocked)}
            >
              {isLocked ? "Entsperren" : "Sperren"}
            </Button>
          </Tooltip>
        )}
      </Box>
    </Box>
  );
};

export default InventorySession;
