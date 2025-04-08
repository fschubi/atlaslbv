import React, { useState, useEffect, useRef } from 'react';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import { highlightPlugin, RenderHighlightTargetProps, RenderHighlightsProps } from '@react-pdf-viewer/highlight';
import { toolbarPlugin } from '@react-pdf-viewer/toolbar';

// Stilblätter importieren
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import '@react-pdf-viewer/highlight/lib/styles/index.css';
import '@react-pdf-viewer/toolbar/lib/styles/index.css';

import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  Menu,
  MenuItem,
  CircularProgress,
  Stack,
  Popover,
  ThemeProvider,
  createTheme
} from '@mui/material';

import {
  Highlight as HighlightIcon,
  Comment as CommentIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  ColorLens as ColorLensIcon,
  TextFields as TextFieldsIcon,
  History as HistoryIcon,
  Close as CloseIcon
} from '@mui/icons-material';

// PDF-Marker-Farben
const HIGHLIGHT_COLORS = [
  { color: '#ffeb3b', name: 'Gelb' },
  { color: '#4caf50', name: 'Grün' },
  { color: '#f44336', name: 'Rot' },
  { color: '#2196f3', name: 'Blau' },
  { color: '#9c27b0', name: 'Lila' }
];

// Typ für Annotationen
export interface Annotation {
  id: string;
  type: 'highlight' | 'comment' | 'text';
  content: string;
  color: string;
  position: {
    pageIndex: number;
    boundingRect: {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      width: number;
      height: number;
    };
    rects: Array<{
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      width: number;
      height: number;
    }>;
    pageId: string;
  };
  createdAt: string;
  author?: string;
}

// Props für die Komponente
interface PDFAnnotatorProps {
  fileUrl: string;
  annotations?: Annotation[];
  onAnnotationsChange?: (annotations: Annotation[]) => void;
  readOnly?: boolean;
  userName?: string;
  height?: string | number;
  width?: string | number;
}

const PDFAnnotator: React.FC<PDFAnnotatorProps> = ({
  fileUrl,
  annotations: initialAnnotations = [],
  onAnnotationsChange,
  readOnly = false,
  userName = 'Aktueller Benutzer',
  height = '100%',
  width = '100%',
}) => {
  // Zustände
  const [annotations, setAnnotations] = useState<Annotation[]>(initialAnnotations);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentColor, setCurrentColor] = useState<string>(HIGHLIGHT_COLORS[0].color);
  const [colorMenuAnchor, setColorMenuAnchor] = useState<null | HTMLElement>(null);
  const [commentDialogOpen, setCommentDialogOpen] = useState<boolean>(false);
  const [currentComment, setCurrentComment] = useState<string>('');
  const [selectedAnnotation, setSelectedAnnotation] = useState<Annotation | null>(null);
  const [annotationsVisible, setAnnotationsVisible] = useState<boolean>(true);
  const [highlightMenuPos, setHighlightMenuPos] = useState<{ top: number, left: number } | null>(null);
  const [tempHighlight, setTempHighlight] = useState<any>(null);
  const viewerRef = useRef<any>(null);

  // PDF Viewer Plugins
  const defaultLayoutPluginInstance = defaultLayoutPlugin({
    sidebarTabs: (defaultTabs) => defaultTabs.filter((tab) => tab.id !== 'thumbnail'),
  });

  // Highlight Plugin
  const handleHighlightClick = (annotation: Annotation) => {
    setSelectedAnnotation(annotation);
  };

  const renderHighlightTarget = (props: RenderHighlightTargetProps) => {
    return (
      <Box
        sx={{
          position: 'absolute',
          left: `${props.selectionRegion.left}%`,
          top: `${props.selectionRegion.top}%`,
          zIndex: 1,
          background: 'white',
          border: '1px solid rgba(0, 0, 0, 0.3)',
          borderRadius: '2px',
          p: 1,
          display: 'flex',
          gap: 1
        }}
      >
        <Tooltip title="Text hervorheben">
          <IconButton
            size="small"
            sx={{ color: currentColor }}
            onClick={() => {
              if (props.selectedText) {
                const newAnnotation: Annotation = {
                  id: `highlight-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                  type: 'highlight',
                  content: props.selectedText,
                  color: currentColor,
                  position: props.selectionRegion as any,
                  createdAt: new Date().toISOString(),
                  author: userName
                };

                setAnnotations(prev => [...prev, newAnnotation]);
                if (onAnnotationsChange) {
                  onAnnotationsChange([...annotations, newAnnotation]);
                }
                props.cancel();
              }
            }}
          >
            <HighlightIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Kommentar hinzufügen">
          <IconButton
            size="small"
            onClick={() => {
              setTempHighlight(props.selectionRegion);
              setCurrentComment('');
              setCommentDialogOpen(true);
              // Wir schließen die Auswahl nicht, bis der Kommentar gespeichert wird
            }}
          >
            <CommentIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Farbe wählen">
          <IconButton
            size="small"
            sx={{ color: currentColor }}
            onClick={(e) => setColorMenuAnchor(e.currentTarget)}
          >
            <ColorLensIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Abbrechen">
          <IconButton
            size="small"
            onClick={() => props.cancel()}
          >
            <CloseIcon />
          </IconButton>
        </Tooltip>
      </Box>
    );
  };

  // Darstellung von Hervorhebungen
  const renderHighlights = (props: RenderHighlightsProps) => {
    return (
      <div>
        {!annotationsVisible ? null : annotations
          .filter(annotation => annotation.position.pageIndex === props.pageIndex)
          .map(annotation => {
            const { position, color, id, type } = annotation;

            switch (type) {
              case 'highlight':
                return position.rects.map((rect, index) => (
                  <div
                    key={`${id}-${index}`}
                    style={{
                      background: `${color}80`, // 50% Transparenz
                      position: 'absolute',
                      left: `${rect.x1 * 100}%`,
                      top: `${rect.y1 * 100}%`,
                      width: `${(rect.x2 - rect.x1) * 100}%`,
                      height: `${(rect.y2 - rect.y1) * 100}%`,
                      cursor: 'pointer',
                    }}
                    onClick={() => handleHighlightClick(annotation)}
                    title={annotation.content}
                  />
                ));
              case 'comment':
                const mainRect = position.boundingRect;
                return (
                  <div
                    key={id}
                    style={{
                      position: 'absolute',
                      left: `${mainRect.x1 * 100}%`,
                      top: `${mainRect.y1 * 100}%`
                    }}
                  >
                    <div
                      style={{
                        background: `${color}80`, // 50% Transparenz
                        position: 'absolute',
                        left: 0,
                        width: `${(mainRect.x2 - mainRect.x1) * 100}%`,
                        height: `${(mainRect.y2 - mainRect.y1) * 100}%`,
                        cursor: 'pointer',
                      }}
                      onClick={() => handleHighlightClick(annotation)}
                    />
                    <Tooltip title={annotation.content}>
                      <CommentIcon
                        sx={{
                          position: 'absolute',
                          color,
                          transform: 'translateY(-100%)',
                          cursor: 'pointer'
                        }}
                        onClick={() => handleHighlightClick(annotation)}
                      />
                    </Tooltip>
                  </div>
                );
              default:
                return null;
            }
          })}
      </div>
    );
  };

  // Highlight-Plugin konfigurieren
  const highlightPluginInstance = highlightPlugin({
    renderHighlightTarget,
    renderHighlights,
  });

  // Toolbar-Plugin
  const toolbarPluginInstance = toolbarPlugin();

  // Farbmenü schließen
  const handleCloseColorMenu = () => {
    setColorMenuAnchor(null);
  };

  // Farbe ändern
  const handleColorChange = (color: string) => {
    setCurrentColor(color);
    handleCloseColorMenu();
  };

  // Kommentar speichern
  const handleSaveComment = () => {
    if (tempHighlight && currentComment.trim()) {
      const newAnnotation: Annotation = {
        id: `comment-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        type: 'comment',
        content: currentComment,
        color: currentColor,
        position: tempHighlight as any,
        createdAt: new Date().toISOString(),
        author: userName
      };

      setAnnotations(prev => [...prev, newAnnotation]);
      if (onAnnotationsChange) {
        onAnnotationsChange([...annotations, newAnnotation]);
      }
    }

    setCommentDialogOpen(false);
    setTempHighlight(null);
  };

  // Annotation löschen
  const handleDeleteAnnotation = (id: string) => {
    const newAnnotations = annotations.filter(annotation => annotation.id !== id);
    setAnnotations(newAnnotations);
    if (onAnnotationsChange) {
      onAnnotationsChange(newAnnotations);
    }
    setSelectedAnnotation(null);
  };

  // Effekt beim Ändern von initialAnnotations
  useEffect(() => {
    setAnnotations(initialAnnotations);
  }, [initialAnnotations]);

  // Dunkles Theme für MUI-Komponenten
  const darkTheme = createTheme({
    palette: {
      mode: 'dark',
    },
  });

  return (
    <ThemeProvider theme={darkTheme}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height,
          width,
          bgcolor: '#1E1E1E',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Toolbar */}
        <Paper
          elevation={1}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 1,
            mb: 1,
            bgcolor: '#2A2A2A',
          }}
        >
          <Typography variant="h6" sx={{ color: 'white' }}>
            PDF Annotator
          </Typography>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Annotationen anzeigen/ausblenden">
              <Chip
                icon={<HighlightIcon />}
                label={annotationsVisible ? 'Annotationen ausblenden' : 'Annotationen anzeigen'}
                onClick={() => setAnnotationsVisible(!annotationsVisible)}
                color={annotationsVisible ? 'primary' : 'default'}
                sx={{ cursor: 'pointer' }}
              />
            </Tooltip>

            <Tooltip title="Speichern">
              <IconButton
                onClick={() => {
                  if (onAnnotationsChange) {
                    onAnnotationsChange(annotations);
                  }
                  alert('Annotationen gespeichert!');
                }}
                disabled={readOnly}
              >
                <SaveIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Paper>

        {/* Hauptbereich */}
        <Box
          sx={{
            display: 'flex',
            height: '100%',
            overflow: 'hidden',
          }}
        >
          {/* PDF-Viewer */}
          <Box
            sx={{
              flex: 1,
              height: '100%',
              overflow: 'hidden',
              bgcolor: '#333',
              '& iframe': {
                border: 'none',
              },
            }}
          >
            {error ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="error">{error}</Typography>
              </Box>
            ) : (
              <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
                {loading && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      zIndex: 10,
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    }}
                  >
                    <CircularProgress />
                  </Box>
                )}

                <Viewer
                  fileUrl={fileUrl}
                  plugins={[
                    defaultLayoutPluginInstance,
                    highlightPluginInstance,
                    toolbarPluginInstance,
                  ]}
                  onDocumentLoad={() => setLoading(false)}
                  onError={(error) => {
                    setError(`Fehler beim Laden des PDFs: ${error.message}`);
                    setLoading(false);
                  }}
                  defaultScale={1}
                  theme={{ direction: 'rtl' }}
                  ref={viewerRef}
                />
              </Worker>
            )}
          </Box>

          {/* Annotations-Seitenleiste */}
          {annotationsVisible && annotations.length > 0 && (
            <Paper
              elevation={3}
              sx={{
                width: 300,
                overflow: 'auto',
                ml: 1,
                bgcolor: '#1A1A1A',
                borderLeft: '1px solid #444',
                display: { xs: 'none', md: 'block' },
              }}
            >
              <Box sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Annotationen ({annotations.length})
                </Typography>
                <Divider sx={{ mb: 2, bgcolor: '#444' }} />

                <List dense>
                  {annotations.map(annotation => (
                    <ListItem
                      key={annotation.id}
                      alignItems="flex-start"
                      sx={{
                        mb: 1,
                        bgcolor: selectedAnnotation?.id === annotation.id ? 'rgba(30, 144, 255, 0.1)' : 'transparent',
                        borderRadius: 1,
                        border: '1px solid #333',
                        '&:hover': {
                          bgcolor: 'rgba(30, 144, 255, 0.05)'
                        }
                      }}
                      onClick={() => setSelectedAnnotation(annotation)}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            {annotation.type === 'highlight' ? (
                              <HighlightIcon sx={{ color: annotation.color, fontSize: '1rem' }} />
                            ) : (
                              <CommentIcon sx={{ color: annotation.color, fontSize: '1rem' }} />
                            )}
                            <Typography variant="body2" color="textPrimary" fontWeight="bold">
                              {annotation.type === 'highlight' ? 'Hervorhebung' : 'Kommentar'}
                            </Typography>
                            <Typography variant="caption" color="textSecondary" ml="auto">
                              {new Date(annotation.createdAt).toLocaleString('de-DE', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <>
                            <Typography
                              component="span"
                              variant="body2"
                              color="text.primary"
                              sx={{
                                display: 'inline',
                                wordBreak: 'break-word'
                              }}
                            >
                              {annotation.content.length > 100
                                ? `${annotation.content.substring(0, 100)}...`
                                : annotation.content}
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                              <Typography variant="caption" color="textSecondary">
                                Seite {annotation.position.pageIndex + 1}
                              </Typography>
                              {!readOnly && (
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteAnnotation(annotation.id);
                                  }}
                                  sx={{ p: 0.3 }}
                                  color="error"
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              )}
                            </Box>
                          </>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            </Paper>
          )}
        </Box>

        {/* Farbauswahl-Menü */}
        <Menu
          anchorEl={colorMenuAnchor}
          open={Boolean(colorMenuAnchor)}
          onClose={handleCloseColorMenu}
        >
          <Box sx={{ p: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {HIGHLIGHT_COLORS.map(({ color, name }) => (
              <MenuItem
                key={color}
                onClick={() => handleColorChange(color)}
                sx={{ borderLeft: `4px solid ${color}`, pl: 2 }}
              >
                {name}
              </MenuItem>
            ))}
          </Box>
        </Menu>

        {/* Kommentar-Dialog */}
        <Dialog
          open={commentDialogOpen}
          onClose={() => setCommentDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Kommentar hinzufügen</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Kommentar"
              fullWidth
              variant="outlined"
              multiline
              rows={4}
              value={currentComment}
              onChange={(e) => setCurrentComment(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCommentDialogOpen(false)}>Abbrechen</Button>
            <Button onClick={handleSaveComment} variant="contained" color="primary">Speichern</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </ThemeProvider>
  );
};

export default PDFAnnotator;
