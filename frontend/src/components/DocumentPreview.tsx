import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  CircularProgress,
  IconButton,
  Paper,
  Divider,
  Chip,
  Tooltip,
  Tab,
  Tabs
} from '@mui/material';
import {
  Close as CloseIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Download as DownloadIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  InsertDriveFile as FileIcon,
  Code as CodeIcon,
  Description as TextIcon,
  Article as DocIcon,
  TableChart as SpreadsheetIcon,
  Print as PrintIcon,
  Edit as EditIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import PDFAnnotator, { Annotation } from './PDFAnnotator';

// Unterstützte Dateitypen
type SupportedFileType = 'pdf' | 'image' | 'text' | 'code' | 'spreadsheet' | 'document' | 'other';

interface DocumentPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  fileUrl: string;
  fileType?: string;
  fileSize?: string;
  uploadDate?: string;
  uploadedBy?: string;
  documentId?: string;
  onAnnotationsSave?: (documentId: string, annotations: Annotation[]) => void;
  annotations?: Annotation[];
}

const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  isOpen,
  onClose,
  fileName,
  fileUrl,
  fileType = '',
  fileSize,
  uploadDate,
  uploadedBy,
  documentId,
  onAnnotationsSave,
  annotations = []
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [currentTab, setCurrentTab] = useState<number>(0);
  const [currentAnnotations, setCurrentAnnotations] = useState<Annotation[]>(annotations);
  const [annotationsChanged, setAnnotationsChanged] = useState<boolean>(false);

  // Download-Funktion
  const handleDownload = useCallback(() => {
    // In einer echten Anwendung würde hier der Download gestartet werden
    // Für Demo-Zwecke nur ein Alert
    alert(`Dokument ${fileName} wird heruntergeladen...`);
  }, [fileName]);

  // Druck-Funktion
  const handlePrint = useCallback(() => {
    // In einer echten Anwendung würden wir hier drucken
    // Für Demo-Zwecke nur ein Alert
    alert(`Dokument ${fileName} wird gedruckt...`);
  }, [fileName]);

  // Dateityp bestimmen
  const getFileType = (): SupportedFileType => {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';

    // Dateitypen kategorisieren
    if (extension === 'pdf') {
      return 'pdf';
    } else if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'tiff'].includes(extension)) {
      return 'image';
    } else if (['txt', 'log', 'md', 'rtf'].includes(extension)) {
      return 'text';
    } else if (['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'json', 'xml', 'py', 'java', 'c', 'cpp', 'cs', 'php'].includes(extension)) {
      return 'code';
    } else if (['xls', 'xlsx', 'csv', 'ods'].includes(extension)) {
      return 'spreadsheet';
    } else if (['doc', 'docx', 'odt'].includes(extension)) {
      return 'document';
    }

    return 'other';
  };

  const fileTypeDisplay = getFileType();

  // Tab wechseln
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  // Annotationen aktualisieren
  const handleAnnotationsChange = (newAnnotations: Annotation[]) => {
    setCurrentAnnotations(newAnnotations);
    setAnnotationsChanged(true);
  };

  // Annotationen speichern
  const handleSaveAnnotations = () => {
    if (documentId && onAnnotationsSave) {
      onAnnotationsSave(documentId, currentAnnotations);
      setAnnotationsChanged(false);
      alert('Annotationen wurden erfolgreich gespeichert!');
    }
  };

  // Zoom-Funktionen
  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 0.2, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - 0.2, 0.5));
  }, []);

  // Reset Zoom beim Öffnen
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setLoading(true);
      setError(null);
      setCurrentTab(0);
      setCurrentAnnotations(annotations);
      setAnnotationsChanged(false);
    }
  }, [isOpen, annotations]);

  // Tastaturunterstützung
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case '+':
        case '=':
          handleZoomIn();
          break;
        case '-':
          handleZoomOut();
          break;
        case 'Escape':
          onClose();
          break;
        case 'p':
          if (event.ctrlKey) {
            event.preventDefault();
            handlePrint();
          }
          break;
        case 's':
          if (event.ctrlKey) {
            event.preventDefault();
            if (currentTab === 1 && annotationsChanged) {
              handleSaveAnnotations();
            } else {
              handleDownload();
            }
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleZoomIn, handleZoomOut, onClose, handlePrint, handleDownload, currentTab, annotationsChanged]);

  // Bild-Ladehandler
  const handleImageLoad = () => {
    setLoading(false);
  };

  const handleImageError = () => {
    setError('Bild konnte nicht geladen werden');
    setLoading(false);
  };

  // PDF Ladehandler
  const handlePdfLoad = () => {
    setLoading(false);
  };

  const handlePdfError = () => {
    setError('PDF konnte nicht geladen werden');
    setLoading(false);
  };

  // Dateitypicon auswählen
  const renderFileTypeIcon = () => {
    switch (fileTypeDisplay) {
      case 'pdf':
        return <PdfIcon fontSize="small" sx={{ color: '#f44336' }} />;
      case 'image':
        return <ImageIcon fontSize="small" sx={{ color: '#4caf50' }} />;
      case 'text':
        return <TextIcon fontSize="small" sx={{ color: '#9e9e9e' }} />;
      case 'code':
        return <CodeIcon fontSize="small" sx={{ color: '#ff9800' }} />;
      case 'spreadsheet':
        return <SpreadsheetIcon fontSize="small" sx={{ color: '#4caf50' }} />;
      case 'document':
        return <DocIcon fontSize="small" sx={{ color: '#2196f3' }} />;
      default:
        return <FileIcon fontSize="small" sx={{ color: '#9e9e9e' }} />;
    }
  };

  // Datei-Endung für die Anzeige
  const getFileExtension = () => {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    return extension ? `.${extension}` : '';
  };

  // Dokument-Viewer basierend auf Dateityp
  const renderDocumentViewer = () => {
    if (loading && currentTab === 0) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <CircularProgress />
        </Box>
      );
    }

    if (error && currentTab === 0) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <Typography color="error">{error}</Typography>
        </Box>
      );
    }

    if (currentTab === 1 && fileTypeDisplay === 'pdf') {
      return (
        <PDFAnnotator
          fileUrl={fileUrl}
          annotations={currentAnnotations}
          onAnnotationsChange={handleAnnotationsChange}
          userName={uploadedBy || 'Benutzer'}
          height="100%"
          width="100%"
        />
      );
    }

    switch (fileTypeDisplay) {
      case 'pdf':
        return (
          <Box
            component="iframe"
            src={fileUrl}
            title={fileName}
            onLoad={handlePdfLoad}
            onError={handlePdfError}
            sx={{
              width: '100%',
              height: '100%',
              border: 'none',
              transform: `scale(${zoom})`,
              transformOrigin: 'top center',
              transition: 'transform 0.2s',
              backgroundColor: '#fff'
            }}
          />
        );
      case 'image':
        return (
          <Box
            component="img"
            src={fileUrl}
            alt={fileName}
            onLoad={handleImageLoad}
            onError={handleImageError}
            sx={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              boxShadow: 3,
              transform: `scale(${zoom})`,
              transformOrigin: 'top center',
              transition: 'transform 0.2s'
            }}
          />
        );
      default:
        return (
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#1E1E1E' }}>
            {renderFileTypeIcon()}
            <Typography variant="h6" sx={{ mt: 2 }}>Vorschau nicht verfügbar</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Dateityp {getFileExtension()} kann nicht direkt angezeigt werden. Bitte laden Sie die Datei herunter.
            </Typography>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={handleDownload}
              sx={{ mt: 2 }}
            >
              Datei herunterladen
            </Button>
          </Paper>
        );
    }
  };

  // Tastaturkürzel-Info
  const keyboardShortcuts = [
    { key: '+/-', action: 'Zoom ein/aus' },
    { key: 'Esc', action: 'Schließen' },
    { key: 'Strg+S', action: 'Herunterladen' },
    { key: 'Strg+P', action: 'Drucken' }
  ];

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      fullScreen
      PaperProps={{
        sx: { bgcolor: '#121212' }
      }}
    >
      <DialogTitle sx={{ bgcolor: '#1A1A1A', color: 'white', p: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {renderFileTypeIcon()}
            <Typography variant="h6" sx={{ color: 'white' }}>
              {fileName}
            </Typography>
            <Chip
              label={fileSize || ''}
              size="small"
              sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)', color: '#aaa', ml: 1 }}
            />
          </Box>
          <IconButton color="inherit" onClick={onClose} edge="end">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      {/* Tabs nur für PDF anzeigen */}
      {fileTypeDisplay === 'pdf' && (
        <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: '#1E1E1E' }}>
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
          >
            <Tab label="Standard-Ansicht" />
            <Tab label="Bearbeiten & Kommentieren" />
          </Tabs>
        </Box>
      )}

      <Divider sx={{ bgcolor: '#333' }} />

      {/* Toolbar */}
      <Box sx={{ px: 2, py: 1, display: 'flex', justifyContent: 'space-between', bgcolor: '#1E1E1E' }}>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {keyboardShortcuts.map((shortcut) => (
            <Chip
              key={shortcut.key}
              size="small"
              label={`${shortcut.key}: ${shortcut.action}`}
              sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)', color: '#aaa', fontSize: '0.7rem' }}
            />
          ))}
        </Box>
        <Box>
          {currentTab === 0 && (
            <>
              <Tooltip title="Verkleinern (-)">
                <IconButton onClick={handleZoomOut} disabled={zoom <= 0.5}>
                  <ZoomOutIcon />
                </IconButton>
              </Tooltip>
              <Typography component="span" sx={{ mx: 1, color: 'white' }}>
                {Math.round(zoom * 100)}%
              </Typography>
              <Tooltip title="Vergrößern (+)">
                <IconButton onClick={handleZoomIn} disabled={zoom >= 3}>
                  <ZoomInIcon />
                </IconButton>
              </Tooltip>
            </>
          )}

          {currentTab === 1 && annotationsChanged && (
            <Tooltip title="Änderungen speichern">
              <IconButton onClick={handleSaveAnnotations} color="primary">
                <SaveIcon />
              </IconButton>
            </Tooltip>
          )}

          <Tooltip title="Herunterladen (Strg+S)">
            <IconButton onClick={handleDownload} sx={{ ml: 1 }}>
              <DownloadIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Drucken (Strg+P)">
            <IconButton onClick={handlePrint} sx={{ ml: 1 }}>
              <PrintIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <DialogContent
        sx={{
          flexGrow: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          bgcolor: '#121212',
          overflow: 'auto',
          p: 0
        }}
      >
        <Box
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          {renderDocumentViewer()}
        </Box>
      </DialogContent>

      <Divider sx={{ bgcolor: '#333' }} />

      <DialogActions sx={{ p: 1, bgcolor: '#1E1E1E', color: 'white' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
          {uploadDate && (
            <Typography variant="body2" color="text.secondary">
              Hochgeladen am: {uploadDate}
            </Typography>
          )}
          {uploadedBy && (
            <Typography variant="body2" color="text.secondary">
              Von: {uploadedBy}
            </Typography>
          )}
        </Box>
        <Button onClick={onClose} color="primary">
          Schließen
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DocumentPreview;
