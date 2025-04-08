import React, { useRef, useState } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Box,
  Grid,
  Typography,
  CircularProgress,
  Paper,
  Divider,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  PictureAsPdf as PDFIcon,
  Print as PrintIcon,
  Settings as SettingsIcon,
  Download as DownloadIcon,
  Close as CloseIcon,
  Preview as PreviewIcon
} from '@mui/icons-material';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import autoTable from 'jspdf-autotable';
import { AtlasColumn } from './AtlasTable';

// Typdefinitionen
interface PDFExportProps<T = any> {
  filename?: string;
  title?: string;
  subtitle?: string;
  columns: AtlasColumn<T>[];
  data: T[];
  logo?: string;
  footerText?: string;
  orientation?: 'portrait' | 'landscape';
  pageSize?: 'a4' | 'a3' | 'letter' | 'legal';
  includeTimestamp?: boolean;
  customFields?: {
    label: string;
    value: string;
  }[];
}

interface PDFExportOptionsProps<T = any> extends PDFExportProps<T> {
  isOpen: boolean;
  onClose: () => void;
  onExport: (options: PDFExportProps<T>) => void;
}

// Component für die PDF Export Optionen
export const PDFExportOptions = <T extends Object>({
  isOpen,
  onClose,
  onExport,
  columns,
  data,
  ...initialOptions
}: PDFExportOptionsProps<T>) => {
  const [filename, setFilename] = useState(initialOptions.filename || 'atlas-export');
  const [title, setTitle] = useState(initialOptions.title || 'ATLAS Export');
  const [subtitle, setSubtitle] = useState(initialOptions.subtitle || '');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(initialOptions.orientation || 'landscape');
  const [pageSize, setPageSize] = useState<'a4' | 'a3' | 'letter' | 'legal'>(initialOptions.pageSize || 'a4');
  const [includeLogo, setIncludeLogo] = useState(true);
  const [includeTimestamp, setIncludeTimestamp] = useState(initialOptions.includeTimestamp !== false);
  const [footerText, setFooterText] = useState(initialOptions.footerText || 'Vertrauliches Dokument - ATLAS Asset Management System');
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    columns.map(col => col.dataKey)
  );

  const handleExport = () => {
    // Filter columns based on selection
    const filteredColumns = columns.filter(col => selectedColumns.includes(col.dataKey));

    onExport({
      filename,
      title,
      subtitle,
      orientation,
      pageSize,
      footerText,
      includeTimestamp,
      logo: includeLogo ? initialOptions.logo : undefined,
      columns: filteredColumns,
      data,
      customFields: initialOptions.customFields
    });

    onClose();
  };

  const handleSelectAllColumns = () => {
    setSelectedColumns(columns.map(col => col.dataKey));
  };

  const handleSelectNoColumns = () => {
    setSelectedColumns([]);
  };

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">PDF-Export konfigurieren</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Linke Spalte: Dokumenteigenschaften */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>Dokumenteigenschaften</Typography>

            <TextField
              label="Dateiname"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              fullWidth
              margin="normal"
              variant="outlined"
              size="small"
              InputProps={{
                endAdornment: <Box component="span" sx={{ color: 'text.secondary' }}>.pdf</Box>
              }}
            />

            <TextField
              label="Titel"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              fullWidth
              margin="normal"
              variant="outlined"
              size="small"
            />

            <TextField
              label="Untertitel"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              fullWidth
              margin="normal"
              variant="outlined"
              size="small"
            />

            <TextField
              label="Fußzeilentext"
              value={footerText}
              onChange={(e) => setFooterText(e.target.value)}
              fullWidth
              margin="normal"
              variant="outlined"
              size="small"
              multiline
              rows={2}
            />

            <Box sx={{ mt: 2 }}>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={includeLogo}
                      onChange={(e) => setIncludeLogo(e.target.checked)}
                    />
                  }
                  label="Logo einfügen"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={includeTimestamp}
                      onChange={(e) => setIncludeTimestamp(e.target.checked)}
                    />
                  }
                  label="Zeitstempel einfügen"
                />
              </FormGroup>
            </Box>
          </Grid>

          {/* Rechte Spalte: Format und Spaltenauswahl */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>Format und Inhalt</Typography>

            <FormControl fullWidth margin="normal" size="small">
              <InputLabel>Seitenformat</InputLabel>
              <Select
                value={pageSize}
                onChange={(e) => setPageSize(e.target.value as 'a4' | 'a3' | 'letter' | 'legal')}
                label="Seitenformat"
              >
                <MenuItem value="a4">A4</MenuItem>
                <MenuItem value="a3">A3</MenuItem>
                <MenuItem value="letter">Letter</MenuItem>
                <MenuItem value="legal">Legal</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth margin="normal" size="small">
              <InputLabel>Ausrichtung</InputLabel>
              <Select
                value={orientation}
                onChange={(e) => setOrientation(e.target.value as 'portrait' | 'landscape')}
                label="Ausrichtung"
              >
                <MenuItem value="portrait">Hochformat</MenuItem>
                <MenuItem value="landscape">Querformat</MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ mt: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="subtitle2">Spalten auswählen</Typography>
                <Box>
                  <Button size="small" onClick={handleSelectAllColumns}>Alle</Button>
                  <Button size="small" onClick={handleSelectNoColumns}>Keine</Button>
                </Box>
              </Box>

              <Paper variant="outlined" sx={{ p: 2, maxHeight: 200, overflow: 'auto' }}>
                <FormGroup>
                  {columns.map((column) => (
                    <FormControlLabel
                      key={column.dataKey}
                      control={
                        <Checkbox
                          checked={selectedColumns.includes(column.dataKey)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedColumns([...selectedColumns, column.dataKey]);
                            } else {
                              setSelectedColumns(selectedColumns.filter(col => col !== column.dataKey));
                            }
                          }}
                          size="small"
                        />
                      }
                      label={column.label}
                    />
                  ))}
                </FormGroup>
              </Paper>
            </Box>
          </Grid>
        </Grid>

        <Box mt={3}>
          <Divider>
            <Chip label="Vorschau" />
          </Divider>

          <Box mt={2} p={2} bgcolor="action.hover" borderRadius={1} minHeight={100} display="flex" justifyContent="center" alignItems="center">
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              Eine Vorschau wird beim Export generiert
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button
          startIcon={<PreviewIcon />}
          onClick={() => {}}
          variant="outlined"
          color="primary"
        >
          Vorschau
        </Button>
        <Button
          startIcon={<DownloadIcon />}
          onClick={handleExport}
          variant="contained"
          color="primary"
        >
          Exportieren
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Hauptkomponente für den PDF-Export
const PDFExport = <T extends Object>({
  filename = 'atlas-export',
  title = 'ATLAS Export',
  subtitle = '',
  columns,
  data,
  logo,
  footerText = 'Vertrauliches Dokument - ATLAS Asset Management System',
  orientation = 'landscape',
  pageSize = 'a4',
  includeTimestamp = true,
  customFields = []
}: PDFExportProps<T>) => {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Generierung des PDF-Dokuments
  const generatePDF = (options: PDFExportProps<T>): jsPDF => {
    // Konfiguration für das PDF
    const unit = 'mm';
    const doc = new jsPDF({
      orientation: options.orientation,
      unit,
      format: options.pageSize
    });

    // Setze Schriften und Farben
    doc.setFont('helvetica');
    doc.setTextColor(40, 40, 40);

    // Seitenränder
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);

    // Logo einfügen, wenn vorhanden
    let y = margin;
    if (options.logo) {
      // Logo würde hier eingefügt werden
      // doc.addImage(options.logo, 'PNG', margin, y, 40, 15);
      y += 20;
    }

    // Titel
    doc.setFontSize(18);
    doc.text(options.title || '', margin, y);
    y += 10;

    // Untertitel
    if (options.subtitle) {
      doc.setFontSize(12);
      doc.text(options.subtitle, margin, y);
      y += 8;
    }

    // Zeitstempel
    if (options.includeTimestamp) {
      doc.setFontSize(10);
      const timestamp = new Date().toLocaleString('de-DE');
      doc.text(`Erstellt am: ${timestamp}`, margin, y);
      y += 8;
    }

    // Benutzerdefinierte Felder
    if (options.customFields && options.customFields.length > 0) {
      doc.setFontSize(10);
      options.customFields.forEach(field => {
        doc.text(`${field.label}: ${field.value}`, margin, y);
        y += 5;
      });
      y += 3;
    }

    // Tabellendaten vorbereiten
    const tableColumns = options.columns.map(col => ({
      header: col.label,
      dataKey: col.dataKey
    }));

    const tableRows = options.data.map(row =>
      options.columns.map(col => {
        // Berücksichtigung von benutzerdefinierten Renderern für die Anzeige
        if (col.render) {
          const rendered = col.render(row[col.dataKey as keyof T], row);
          if (typeof rendered === 'string' || typeof rendered === 'number') {
            return rendered;
          }
          return row[col.dataKey as keyof T]?.toString() || '';
        }
        return row[col.dataKey as keyof T]?.toString() || '';
      })
    );

    // Tabelle mit AutoTable
    autoTable(doc, {
      startY: y,
      head: [tableColumns.map(col => col.header)],
      body: tableRows,
      margin: { top: y, bottom: 25, left: margin, right: margin },
      styles: { overflow: 'linebreak', cellPadding: 3, fontSize: 10 },
      headStyles: { fillColor: [37, 71, 161], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      tableLineColor: [200, 200, 200],
      tableLineWidth: 0.1,
    });

    // Fußzeile auf jeder Seite
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);

      // Fußzeilentext
      if (options.footerText) {
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(options.footerText, margin, pageHeight - 10);
      }

      // Seitenzahl
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`Seite ${i} von ${totalPages}`, pageWidth - margin - 25, pageHeight - 10, { align: 'right' });
    }

    return doc;
  };

  // Handler für den direkten Export
  const handleDirectExport = () => {
    setExporting(true);

    try {
      const doc = generatePDF({
        filename,
        title,
        subtitle,
        columns,
        data,
        logo,
        footerText,
        orientation,
        pageSize,
        includeTimestamp,
        customFields
      });

      doc.save(`${filename}.pdf`);
    } catch (error) {
      console.error('Fehler beim PDF-Export:', error);
      alert('Beim Export ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.');
    } finally {
      setExporting(false);
    }
  };

  // Handler für den Export mit Optionen
  const handleOptionsExport = (options: PDFExportProps<T>) => {
    setExporting(true);

    try {
      const doc = generatePDF(options);
      doc.save(`${options.filename}.pdf`);
    } catch (error) {
      console.error('Fehler beim PDF-Export:', error);
      alert('Beim Export ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <Box>
        <Tooltip title="PDF exportieren">
          <span>
            <Button
              variant="outlined"
              color="primary"
              startIcon={exporting ? <CircularProgress size={20} /> : <PDFIcon />}
              onClick={handleDirectExport}
              disabled={exporting || data.length === 0}
              size="small"
              sx={{ mr: 1 }}
            >
              Exportieren
            </Button>
          </span>
        </Tooltip>

        <Tooltip title="Exportoptionen">
          <span>
            <IconButton
              color="default"
              onClick={() => setOpen(true)}
              disabled={exporting || data.length === 0}
              size="small"
            >
              <SettingsIcon />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      <PDFExportOptions
        isOpen={open}
        onClose={() => setOpen(false)}
        onExport={handleOptionsExport}
        columns={columns}
        data={data}
        filename={filename}
        title={title}
        subtitle={subtitle}
        orientation={orientation}
        pageSize={pageSize}
        footerText={footerText}
        includeTimestamp={includeTimestamp}
        logo={logo}
        customFields={customFields}
      />
    </>
  );
};

export default PDFExport;
