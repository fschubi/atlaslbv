import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Button,
  Typography,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  LinearProgress,
  Divider,
  Chip,
  Grid,
  FormHelperText,
  Modal,
  SelectChangeEvent,
  CircularProgress
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Description as FileIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  InsertDriveFile as DocumentIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  TableView as SpreadsheetIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { v4 as uuidv4 } from 'uuid';

export type DocumentType =
  | 'Rechnung'
  | 'Lieferschein'
  | 'Handbuch'
  | 'Garantie'
  | 'Lizenzvertrag'
  | 'Wartungsvertrag'
  | 'Sonstiges';

export interface UploadedFile {
  id?: string;
  file: File;
  type: DocumentType;
  description: string;
  progress: number;
  uploadedBy?: string;
  error?: string;
  status?: 'pending' | 'uploading' | 'success' | 'error';
}

interface DocumentUploaderProps {
  open?: boolean;
  onClose?: () => void;
  onUploadComplete?: (files: UploadedFile[]) => void;
  relatedEntityType?: 'device' | 'accessory' | 'license' | 'certificate' | 'ticket' | 'handover';
  relatedEntityId?: string | number;
  isModal?: boolean;
  maxFiles?: number;
  acceptedFileTypes?: string[];
  maxFileSize?: number; // in bytes
  defaultDocumentType?: DocumentType;
}

// Hilfsfunktion zum Ermitteln des Dateityp-Icons
const getFileIcon = (filename: string) => {
  const extension = filename.split('.').pop()?.toLowerCase() || '';

  if (['pdf'].includes(extension)) {
    return <PdfIcon color="error" />;
  } else if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'].includes(extension)) {
    return <ImageIcon color="primary" />;
  } else if (['xls', 'xlsx', 'csv'].includes(extension)) {
    return <SpreadsheetIcon color="success" />;
  } else {
    return <DocumentIcon color="info" />;
  }
};

// Hilfsfunktion zur Dateigröße-Formatierung
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  open = false,
  onClose,
  onUploadComplete,
  relatedEntityType,
  relatedEntityId,
  isModal = true,
  maxFiles = 5,
  acceptedFileTypes = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png', '.txt'],
  maxFileSize = 10 * 1024 * 1024, // 10MB
  defaultDocumentType = 'Sonstiges'
}) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [editingFile, setEditingFile] = useState<UploadedFile | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);

  // Verfügbare Dokumenttypen
  const documentTypes: DocumentType[] = [
    'Rechnung',
    'Lieferschein',
    'Handbuch',
    'Garantie',
    'Lizenzvertrag',
    'Wartungsvertrag',
    'Sonstiges'
  ];

  // Dateien hinzufügen
  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Limitiere die Anzahl der Dateien
    const availableSlots = maxFiles - files.length;
    const filesToAdd = acceptedFiles.slice(0, availableSlots);

    if (filesToAdd.length > 0) {
      const newFiles = filesToAdd.map(file => ({
        id: uuidv4(),
        file,
        type: defaultDocumentType,
        description: '',
        progress: 0,
        status: 'pending' as const
      }));

      setFiles(prevFiles => [...prevFiles, ...newFiles]);
    }
  }, [files, maxFiles, defaultDocumentType]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'text/plain': ['.txt']
    },
    maxSize: maxFileSize,
    maxFiles: maxFiles - files.length,
    disabled: files.length >= maxFiles || isUploading
  });

  // Datei entfernen
  const handleRemoveFile = (id: string) => {
    setFiles(prevFiles => prevFiles.filter(file => file.id !== id));
  };

  // Datei bearbeiten Dialog öffnen
  const handleEditFile = (file: UploadedFile) => {
    setEditingFile(file);
    setEditDialogOpen(true);
  };

  // Änderung des Dokumententyps
  const handleTypeChange = (event: SelectChangeEvent<DocumentType>, id: string) => {
    const value = event.target.value as DocumentType;
    setFiles(files.map(file =>
      file.id === id ? { ...file, type: value } : file
    ));
  };

  // Änderung der Beschreibung im Bearbeitungsdialog
  const handleDescriptionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (editingFile) {
      setEditingFile({
        ...editingFile,
        description: event.target.value
      });
    }
  };

  // Speichern der Änderungen aus dem Bearbeitungsdialog
  const handleSaveEdit = () => {
    if (editingFile) {
      setFiles(files.map(file =>
        file.id === editingFile.id ? { ...file, ...editingFile } : file
      ));
      setEditDialogOpen(false);
      setEditingFile(null);
    }
  };

  // Bearbeitungsdialog schließen
  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setEditingFile(null);
  };

  // Typ direkt ändern
  const handleDirectTypeChange = (event: SelectChangeEvent<DocumentType>, id: string) => {
    const value = event.target.value as DocumentType;
    setFiles(files.map(file =>
      file.id === id ? { ...file, type: value } : file
    ));
  };

  // Beschreibung direkt ändern
  const handleDirectDescriptionChange = (event: React.ChangeEvent<HTMLInputElement>, id: string) => {
    setFiles(files.map(file =>
      file.id === id ? { ...file, description: event.target.value } : file
    ));
  };

  // Dateien hochladen
  const handleUpload = async () => {
    if (files.length === 0) return;

    setIsUploading(true);

    // Setze alle Dateien auf "uploading"
    setFiles(files.map(file => ({ ...file, status: 'uploading' as const, progress: 0 })));

    // Simuliere einen Upload-Prozess mit Fortschritt für jede Datei
    files.forEach(file => {
      const fileId = file.id;

      const interval = setInterval(() => {
        setFiles(currentFiles => {
          const fileToUpdate = currentFiles.find(f => f.id === fileId);

          if (!fileToUpdate || fileToUpdate.progress === undefined || fileToUpdate.progress >= 100) {
            clearInterval(interval);
            return currentFiles;
          }

          // Erhöhe den Fortschritt
          const newProgress = Math.min(fileToUpdate.progress + Math.random() * 25, 100);

          // Setze Status auf 'success', wenn der Upload abgeschlossen ist
          const newStatus = newProgress >= 100 ? 'success' as const : 'uploading' as const;

          return currentFiles.map(f =>
            f.id === fileId
              ? { ...f, progress: newProgress, status: newStatus }
              : f
          );
        });
      }, 500 + Math.random() * 1000); // Zufällige Zeit zwischen 500ms und 1500ms
    });

    // Nach einem simulierten Upload alle Dateien als abgeschlossen markieren
    setTimeout(() => {
      setFiles(files => files.map(file => ({ ...file, progress: 100, status: 'success' as const })));
      setIsUploading(false);

      // Callback mit den hochgeladenen Dateien
      if (onUploadComplete) {
        onUploadComplete(files);
      }

      // Wenn es ein Modal ist, schließe es nach erfolgreicher Verarbeitung
      if (isModal && onClose) {
        setTimeout(() => {
          onClose();
        }, 1000);
      }
    }, 3000);
  };

  // Render-Funktion für die Dateiliste
  const renderFileList = () => {
    if (files.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', py: 2, color: '#888' }}>
          <Typography variant="body2">Keine Dateien ausgewählt</Typography>
        </Box>
      );
    }

    return (
      <List sx={{ width: '100%' }}>
        {files.map((file, index) => (
          <React.Fragment key={index}>
            {index > 0 && <Divider />}
            <ListItem alignItems="flex-start">
              <ListItemIcon>
                {getFileIcon(file.file.name)}
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography variant="subtitle2" noWrap>
                    {file.file.name}
                  </Typography>
                }
                secondary={
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth size="small">
                          <InputLabel id={`file-type-label-${index}`}>Dokumenttyp</InputLabel>
                          <Select
                            labelId={`file-type-label-${index}`}
                            value={file.type}
                            label="Dokumenttyp"
                            onChange={(e) => handleTypeChange(e as SelectChangeEvent<DocumentType>, file.id || '')}
                            disabled={isUploading || !!file.id}
                          >
                            {documentTypes.map((type) => (
                              <MenuItem key={type} value={type}>{type}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Beschreibung"
                          value={file.description}
                          onChange={(e) => handleDirectDescriptionChange(e, file.id || '')}
                          disabled={isUploading || !!file.id}
                        />
                      </Grid>
                    </Grid>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={formatFileSize(file.file.size)}
                        size="small"
                        variant="outlined"
                      />
                      {file.id && (
                        <Chip
                          label="Hochgeladen"
                          color="success"
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>

                    {isUploading && !file.id && (
                      <Box sx={{ width: '100%', mt: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={file.progress}
                          sx={{ height: 5, borderRadius: 5 }}
                        />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                          <Typography variant="caption">Uploading...</Typography>
                          <Typography variant="caption">{file.progress}%</Typography>
                        </Box>
                      </Box>
                    )}

                    {file.error && (
                      <Typography variant="caption" color="error">
                        Fehler: {file.error}
                      </Typography>
                    )}
                  </Box>
                }
              />

              <ListItemSecondaryAction>
                {!file.id && !isUploading && (
                  <IconButton edge="end" onClick={() => handleRemoveFile(file.id || '')}>
                    <DeleteIcon />
                  </IconButton>
                )}
              </ListItemSecondaryAction>
            </ListItem>
          </React.Fragment>
        ))}
      </List>
    );
  };

  // Content der Komponente
  const content = (
    <Box sx={{ width: '100%' }}>
      {/* Dropzone */}
      <Box
        {...getRootProps()}
        sx={{
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'divider',
          borderRadius: 1,
          p: 3,
          mb: 2,
          backgroundColor: isDragActive ? 'rgba(25, 118, 210, 0.04)' : 'background.paper',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: files.length >= maxFiles || isUploading ? 'not-allowed' : 'pointer',
          opacity: files.length >= maxFiles || isUploading ? 0.5 : 1
        }}
      >
        <input {...getInputProps()} />
        <UploadIcon fontSize="large" color="primary" sx={{ mb: 1 }} />

        <Typography variant="subtitle1" align="center" gutterBottom>
          {isDragActive ? 'Dateien hier ablegen...' : 'Dateien hierher ziehen oder klicken zum Auswählen'}
        </Typography>

        <Typography variant="body2" align="center" color="textSecondary">
          Unterstützte Formate: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, TXT
        </Typography>

        <Typography variant="caption" align="center" color="textSecondary" sx={{ mt: 1 }}>
          Maximale Dateigröße: {formatFileSize(maxFileSize)} (max. {maxFiles} Dateien)
        </Typography>

        {files.length >= maxFiles && (
          <Typography variant="caption" color="error" sx={{ mt: 1 }}>
            Maximale Anzahl an Dateien erreicht
          </Typography>
        )}
      </Box>

      {/* Dateiliste */}
      <Paper variant="outlined" sx={{ mb: 2 }}>
        {renderFileList()}
      </Paper>

      {/* Upload-Button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
        {isModal && onClose && (
          <Button
            variant="outlined"
            onClick={onClose}
            disabled={isUploading}
          >
            Abbrechen
          </Button>
        )}

        <Button
          variant="contained"
          color="primary"
          startIcon={<UploadIcon />}
          onClick={handleUpload}
          disabled={files.length === 0 || isUploading || uploadSuccess}
        >
          {isUploading ? 'Wird hochgeladen...' : uploadSuccess ? 'Hochgeladen' : 'Hochladen'}
        </Button>
      </Box>
    </Box>
  );

  // Wenn es als Modal gerendert werden soll
  if (isModal) {
    return (
      <Modal
        open={open}
        onClose={onClose}
        aria-labelledby="document-uploader-modal"
        aria-describedby="document-uploader-description"
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { xs: '90%', sm: '80%', md: '60%' },
            maxWidth: 800,
            maxHeight: '90vh',
            overflow: 'auto',
            bgcolor: 'background.paper',
            borderRadius: 1,
            boxShadow: 24,
            p: 4
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h5" component="h2">
              Dokumente hochladen
            </Typography>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>

          {content}
        </Box>
      </Modal>
    );
  }

  // Andernfalls eingebettet rendern
  return content;
};

export default DocumentUploader;
