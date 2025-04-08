import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Divider,
  IconButton,
  Tab,
  Tabs,
  Chip,
  TextField,
  InputAdornment,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  CloudUpload as UploadIcon,
  Clear as ClearIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import DocumentUploader, { DocumentType, UploadedFile } from '../components/DocumentUploader';
import DocumentPreview from '../components/DocumentPreview';
import MainLayout from '../layout/MainLayout';
import AtlasTable, { AtlasColumn } from '../components/AtlasTable';
import { Annotation } from '../components/PDFAnnotator';

interface Document {
  id: string;
  name: string;
  type: DocumentType;
  size: string;
  uploadDate: string;
  uploadedBy: string;
  relatedEntity?: {
    type: "device" | "accessory" | "license" | "certificate" | "ticket";
    id: string;
    name: string;
  };
  description?: string;
  annotations?: Annotation[];
}

interface Entity {
  type: "device" | "license" | "certificate";
  id: string;
  name: string;
}

interface UploadedFileWithAnnotations extends UploadedFile {
  annotations?: Annotation[];
}

const DocumentManager: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [tabValue, setTabValue] = useState<number>(0);
  const [uploadDialogOpen, setUploadDialogOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<DocumentType | 'all'>('all');
  const [entityFilter, setEntityFilter] = useState<string>('all');

  // Für die Dokumentvorschau
  const [previewOpen, setPreviewOpen] = useState<boolean>(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

  // Neuer State für die Dokumenten-Annotationen
  const [documentAnnotations, setDocumentAnnotations] = useState<Record<string, Annotation[]>>({});

  // Demo-URLs für die Dokumente (in einer echten App würden diese vom Server kommen)
  const getDocumentUrl = (doc: Document) => {
    // Beispiel-URLs
    const fileExtension = doc.name.split('.').pop()?.toLowerCase() || '';

    if (fileExtension === 'pdf') {
      return '/sample-documents/sample.pdf';
    } else if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension)) {
      return '/sample-documents/sample-image.jpg';
    }

    return '#'; // Fallback URL
  };

  // Demo-Entitäten
  const entities: Entity[] = [
    { type: "device", id: '1001', name: 'HP EliteBook 850 G8' },
    { type: "device", id: '1002', name: 'Dell Latitude 7420' },
    { type: "license", id: '2001', name: 'Microsoft 365 E3' },
    { type: "certificate", id: '3001', name: 'SSL Zertifikat lbv-cloud.de' }
  ];

  // Generiere Demo-Dokumente
  useEffect(() => {
    const documentTypes: DocumentType[] = [
      'Rechnung', 'Lieferschein', 'Handbuch', 'Garantie',
      'Lizenzvertrag', 'Wartungsvertrag', 'Sonstiges'
    ];

    const users = ['Max Mustermann', 'Anna Schmidt', 'Thomas Müller', 'Maria Weber'];

    const generateDemoDocuments = () => {
      const docs: Document[] = [];

      for (let i = 0; i < 25; i++) {
        const entity = entities[Math.floor(Math.random() * entities.length)];
        const docType = documentTypes[Math.floor(Math.random() * documentTypes.length)];

        docs.push({
          id: `DOC-${1000 + i}`,
          name: `Dokument-${i + 1}.${['pdf', 'docx', 'jpg', 'xlsx'][Math.floor(Math.random() * 4)]}`,
          type: docType,
          size: `${Math.floor(Math.random() * 10) + 1} MB`,
          uploadDate: new Date(Date.now() - i * 86400000 * Math.floor(Math.random() * 30)).toLocaleDateString('de-DE'),
          uploadedBy: users[Math.floor(Math.random() * users.length)],
          relatedEntity: Math.random() > 0.2 ? entity : undefined,
          description: Math.random() > 0.5 ? `Beschreibung für ${docType} #${i+1}` : undefined,
          annotations: Math.random() > 0.5 ? [
            {
              id: `anno-${i+1}-1`,
              type: 'highlight',
              content: `Wichtiger Garantiezeitraum: 36 Monate`,
              color: '#ffeb3b',
              position: {
                pageIndex: 0,
                boundingRect: {
                  x1: 0.1,
                  y1: 0.2,
                  x2: 0.5,
                  y2: 0.22,
                  width: 0.4,
                  height: 0.02
                },
                rects: [{
                  x1: 0.1,
                  y1: 0.2,
                  x2: 0.5,
                  y2: 0.22,
                  width: 0.4,
                  height: 0.02
                }],
                pageId: 'page-0'
              },
              createdAt: new Date().toISOString(),
              author: users[Math.floor(Math.random() * users.length)]
            }
          ] : undefined
        });
      }

      return docs;
    };

    const demoDocuments = generateDemoDocuments();
    setDocuments(demoDocuments);
    setFilteredDocuments(demoDocuments);

    // Initialisiere Annotations-Map
    const annotationsMap: Record<string, Annotation[]> = {};
    demoDocuments.forEach(doc => {
      if (doc.annotations) {
        annotationsMap[doc.id] = doc.annotations;
      }
    });
    setDocumentAnnotations(annotationsMap);
  }, []);

  // Tab-Wechsel
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);

    if (newValue === 0) { // Alle Dokumente
      applyFilters(searchTerm, typeFilter, entityFilter);
    } else if (newValue === 1) { // Ohne Zuordnung
      const filtered = documents.filter(doc => !doc.relatedEntity);
      setFilteredDocuments(filtered);
    } else if (newValue === 2) { // Geräte-Dokumente
      const filtered = documents.filter(doc => doc.relatedEntity?.type === 'device');
      setFilteredDocuments(filtered);
    } else if (newValue === 3) { // Lizenz-Dokumente
      const filtered = documents.filter(doc => doc.relatedEntity?.type === 'license');
      setFilteredDocuments(filtered);
    } else if (newValue === 4) { // Zertifikats-Dokumente
      const filtered = documents.filter(doc => doc.relatedEntity?.type === 'certificate');
      setFilteredDocuments(filtered);
    }
  };

  // Such- und Filterlogik
  const applyFilters = (search: string, type: DocumentType | 'all', entity: string) => {
    let filtered = [...documents];

    // Suche
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(doc =>
        doc.name.toLowerCase().includes(searchLower) ||
        doc.description?.toLowerCase().includes(searchLower) ||
        doc.relatedEntity?.name.toLowerCase().includes(searchLower)
      );
    }

    // Typ-Filter
    if (type !== 'all') {
      filtered = filtered.filter(doc => doc.type === type);
    }

    // Entitäts-Filter
    if (entity !== 'all') {
      filtered = filtered.filter(doc =>
        doc.relatedEntity?.id === entity
      );
    }

    setFilteredDocuments(filtered);
  };

  // AtlasTable Spaltenfilterung
  const handleColumnFilter = (column: string, filterValue: string) => {
    if (!filterValue) {
      // Wenn der Filter geleert wird, setze nur diesen Filter zurück
      if (column === 'type') {
        setTypeFilter('all');
        applyFilters(searchTerm, 'all', entityFilter);
      } else if (column === 'uploadedBy') {
        // Bei anderen Spalten wie uploadedBy führen wir eine spezielle Filterung durch
        const filtered = documents.filter(doc => {
          // Andere Filter beibehalten
          const matchesType = typeFilter === 'all' || doc.type === typeFilter;
          const matchesEntity = entityFilter === 'all' || doc.relatedEntity?.id === entityFilter;
          const matchesSearch = !searchTerm ||
            doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doc.description?.toLowerCase().includes(searchTerm.toLowerCase());

          return matchesType && matchesEntity && matchesSearch;
        });
        setFilteredDocuments(filtered);
      } else if (column === 'relatedEntity') {
        setEntityFilter('all');
        applyFilters(searchTerm, typeFilter, 'all');
      }
      return;
    }

    // Filterwert anwenden
    const filterValueLower = filterValue.toLowerCase();

    if (column === 'type') {
      // Bei Dokumenttyp setzen wir den entsprechenden Select-Filter
      const matchingType = ['Rechnung', 'Lieferschein', 'Handbuch', 'Garantie',
        'Lizenzvertrag', 'Wartungsvertrag', 'Sonstiges'].find(
        type => type.toLowerCase().includes(filterValueLower)
      ) as DocumentType | undefined;

      if (matchingType) {
        setTypeFilter(matchingType);
        applyFilters(searchTerm, matchingType, entityFilter);
      }
    } else if (column === 'uploadedBy') {
      // Für den uploadedBy-Filter führen wir eine direkte Filterung durch
      const filtered = documents.filter(doc => {
        const matchesUploadedBy = doc.uploadedBy.toLowerCase().includes(filterValueLower);
        // Andere Filter beibehalten
        const matchesType = typeFilter === 'all' || doc.type === typeFilter;
        const matchesEntity = entityFilter === 'all' || doc.relatedEntity?.id === entityFilter;
        const matchesSearch = !searchTerm ||
          doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          doc.description?.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesUploadedBy && matchesType && matchesEntity && matchesSearch;
      });
      setFilteredDocuments(filtered);
    } else if (column === 'relatedEntity') {
      // Für den relatedEntity-Filter suchen wir nach passenden Entitäten
      const matchingEntity = entities.find(entity =>
        entity.name.toLowerCase().includes(filterValueLower)
      );

      if (matchingEntity) {
        setEntityFilter(matchingEntity.id);
        applyFilters(searchTerm, typeFilter, matchingEntity.id);
      } else if (filterValueLower.includes('nicht') || filterValueLower.includes('none')) {
        // Wenn "Nicht zugeordnet" gefiltert wird
        const filtered = documents.filter(doc => !doc.relatedEntity);
        setFilteredDocuments(filtered);
      }
    } else if (column === 'name') {
      // Für den Namen fügen wir diesen Teil zur Suche hinzu
      setSearchTerm(filterValue);
      applyFilters(filterValue, typeFilter, entityFilter);
    }
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchTerm(value);
    applyFilters(value, typeFilter, entityFilter);
  };

  const handleTypeFilterChange = (event: SelectChangeEvent<DocumentType | 'all'>) => {
    const value = event.target.value as DocumentType | 'all';
    setTypeFilter(value);
    applyFilters(searchTerm, value, entityFilter);
  };

  const handleEntityFilterChange = (event: SelectChangeEvent) => {
    const value = event.target.value as string;
    setEntityFilter(value);
    applyFilters(searchTerm, typeFilter, value);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setEntityFilter('all');
    setFilteredDocuments(documents);
  };

  // Upload-Logik
  const handleUploadClick = () => {
    setUploadDialogOpen(true);
  };

  const handleUploadComplete = (files: UploadedFile[]) => {
    console.log("Hochgeladene Dateien:", files);

    // In einer echten Anwendung würden wir die Dateien zum Server hochladen
    // und dann die lokale Dokumentenliste aktualisieren

    // Demo-Implementierung: Füge die Dateien zur Dokumentenliste hinzu
    const newDocuments: Document[] = files.map(file => ({
      id: file.id || `DOC-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: file.file.name,
      type: file.type,
      size: `${Math.round(file.file.size / 1024)} KB`,
      uploadDate: new Date().toLocaleDateString('de-DE'),
      uploadedBy: 'Aktueller Benutzer',
      description: file.description,
      // Type-sicher machen
      annotations: (file as UploadedFileWithAnnotations).annotations
    }));

    setDocuments(prev => [...newDocuments, ...prev]);
    setFilteredDocuments(prev => [...newDocuments, ...prev]);
  };

  // Dokument-Aktionen
  const handleDeleteDocument = (id: string) => {
    if (window.confirm('Sind Sie sicher, dass Sie dieses Dokument löschen möchten?')) {
      setDocuments(prev => prev.filter(doc => doc.id !== id));
      setFilteredDocuments(prev => prev.filter(doc => doc.id !== id));
    }
  };

  const handleDownloadDocument = (id: string) => {
    // In einer echten Anwendung würden wir hier den Download vom Server starten
    alert(`Download von Dokument ${id} gestartet...`);
  };

  const handleViewDocument = (id: string) => {
    // Finde das ausgewählte Dokument
    const doc = documents.find(doc => doc.id === id);
    if (doc) {
      setSelectedDocument(doc);
      setPreviewOpen(true);
    }
  };

  // Vorschau schließen
  const handleClosePreview = () => {
    setPreviewOpen(false);
  };

  // Neue Funktion zum Speichern von Annotationen
  const handleSaveAnnotations = (documentId: string, annotations: Annotation[]) => {
    // Update the document annotations
    setDocumentAnnotations(prev => ({
      ...prev,
      [documentId]: annotations
    }));

    // Update the documents array
    setDocuments(prev =>
      prev.map(doc =>
        doc.id === documentId
          ? { ...doc, annotations }
          : doc
      )
    );

    // Update filtered documents if necessary
    setFilteredDocuments(prev =>
      prev.map(doc =>
        doc.id === documentId
          ? { ...doc, annotations }
          : doc
      )
    );

    console.log(`Annotationen für Dokument ${documentId} gespeichert:`, annotations);
  };

  // Tabellenspaltendefinition für AtlasTable
  const columns: AtlasColumn<DocumentRow>[] = [
    {
      dataKey: 'name',
      label: 'Name',
      width: 200,
      sortable: true,
      tooltip: 'Dateiname des Dokuments'
    },
    {
      dataKey: 'type',
      label: 'Typ',
      width: 130,
      filterable: true,
      sortable: true,
      tooltip: 'Kategorie des Dokuments'
    },
    {
      dataKey: 'size',
      label: 'Größe',
      width: 80,
      sortable: true,
      tooltip: 'Größe der Datei'
    },
    {
      dataKey: 'uploadDate',
      label: 'Hochgeladen am',
      width: 120,
      sortable: true,
      tooltip: 'Datum des Uploads'
    },
    {
      dataKey: 'uploadedBy',
      label: 'Von',
      width: 150,
      filterable: true,
      sortable: true,
      tooltip: 'Person, die das Dokument hochgeladen hat'
    },
    {
      dataKey: 'relatedEntity',
      label: 'Zugeordnet zu',
      width: 200,
      filterable: true,
      sortable: true,
      tooltip: 'Verknüpftes Objekt'
    },
    {
      dataKey: 'actions',
      label: 'Aktionen',
      width: 120,
      tooltip: 'Verfügbare Aktionen'
    }
  ];

  // Format für AtlasTable
  interface DocumentRow {
    id: number;
    originalId: string;
    name: React.ReactNode;
    type: React.ReactNode;
    rawType?: string; // Raw-Wert für die Sortierung
    size: React.ReactNode;
    rawSize?: string; // Raw-Wert für die Sortierung
    uploadDate: React.ReactNode;
    uploadedBy: React.ReactNode;
    relatedEntity: React.ReactNode;
    rawRelatedEntity?: string; // Raw-Wert für die Sortierung
    actions: React.ReactNode;
  }

  // Sorting-Status
  const [sortConfig, setSortConfig] = useState<{column: string, direction: 'asc' | 'desc'}>({
    column: 'uploadDate',
    direction: 'desc'
  });

  // Sortierungslogik
  const handleSort = (column: string, direction: 'asc' | 'desc') => {
    setSortConfig({ column, direction });

    // Sortiere die Dokumente basierend auf den Original-Dokumenten, da die Tabellenzeilen
    // React-Komponenten enthalten, die nicht sortierbar sind
    const sortedDocs = [...filteredDocuments].sort((a, b) => {
      // Wähle die richtigen Felder zum Sortieren
      if (column === 'uploadDate') {
        // Datumsvergleich
        const dateA = new Date(a.uploadDate.split('.').reverse().join('-'));
        const dateB = new Date(b.uploadDate.split('.').reverse().join('-'));
        return direction === 'asc' ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
      } else if (column === 'name') {
        return direction === 'asc'
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else if (column === 'type') {
        return direction === 'asc'
          ? a.type.localeCompare(b.type)
          : b.type.localeCompare(a.type);
      } else if (column === 'size') {
        // Größenvergleich (Extraktion der numerischen Werte)
        const sizeA = parseFloat(a.size.replace(/[^0-9.]/g, ''));
        const sizeB = parseFloat(b.size.replace(/[^0-9.]/g, ''));
        return direction === 'asc' ? sizeA - sizeB : sizeB - sizeA;
      } else if (column === 'uploadedBy') {
        return direction === 'asc'
          ? a.uploadedBy.localeCompare(b.uploadedBy)
          : b.uploadedBy.localeCompare(a.uploadedBy);
      } else if (column === 'relatedEntity') {
        // Für die Entitäten vergleichen wir die Namen oder "Nicht zugeordnet" für null
        const entityNameA = a.relatedEntity ? a.relatedEntity.name : "Nicht zugeordnet";
        const entityNameB = b.relatedEntity ? b.relatedEntity.name : "Nicht zugeordnet";
        return direction === 'asc'
          ? entityNameA.localeCompare(entityNameB)
          : entityNameB.localeCompare(entityNameA);
      }
      return 0;
    });

    setFilteredDocuments(sortedDocs);
  };

  // Dokumente für die virtualisierte Tabelle aufbereiten
  const prepareDocumentsForTable = (docs: Document[]): DocumentRow[] => {
    return docs.map((doc, index) => ({
      id: index,
      originalId: doc.id, // Originale Dokument-ID für den Zugriff speichern
      name: doc.name,
      type: (
        <Chip
          label={doc.type}
          size="small"
          sx={{
            bgcolor: 'rgba(25, 118, 210, 0.2)',
            color: '#64b5f6',
            border: '1px solid #64b5f6'
          }}
        />
      ),
      rawType: doc.type, // Raw-Wert für die Sortierung
      size: doc.size,
      rawSize: doc.size, // Raw-Wert für die Sortierung
      uploadDate: doc.uploadDate,
      uploadedBy: doc.uploadedBy,
      relatedEntity: doc.relatedEntity ? (
        <Chip
          label={`${doc.relatedEntity.type === 'device' ? 'Gerät' :
                 doc.relatedEntity.type === 'license' ? 'Lizenz' :
                 doc.relatedEntity.type === 'certificate' ? 'Zertifikat' :
                 doc.relatedEntity.type}: ${doc.relatedEntity.name}`}
          size="small"
          sx={{
            maxWidth: 200,
            bgcolor: doc.relatedEntity.type === 'device' ? 'rgba(25, 118, 210, 0.15)' :
                  doc.relatedEntity.type === 'license' ? 'rgba(255, 152, 0, 0.15)' :
                  'rgba(76, 175, 80, 0.15)',
            color: doc.relatedEntity.type === 'device' ? '#42a5f5' :
                  doc.relatedEntity.type === 'license' ? '#ffb74d' :
                  '#81c784'
          }}
        />
      ) : (
        <Chip
          label="Nicht zugeordnet"
          size="small"
          sx={{ bgcolor: 'rgba(158, 158, 158, 0.15)', color: '#9e9e9e' }}
        />
      ),
      rawRelatedEntity: doc.relatedEntity ? doc.relatedEntity.name : "Nicht zugeordnet", // Raw-Wert für die Sortierung
      actions: (
        <Box sx={{ display: 'flex' }}>
          <IconButton
            size="small"
            color="primary"
            onClick={() => handleViewDocument(doc.id)}
          >
            <ViewIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color="primary"
            onClick={() => handleDownloadDocument(doc.id)}
          >
            <DownloadIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={() => handleDeleteDocument(doc.id)}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      )
    }));
  };

  // Render-Funktion für die Statistik-Karten
  const renderStatisticCards = () => {
    const totalCount = documents.length;
    const unassignedCount = documents.filter(doc => !doc.relatedEntity).length;
    const deviceCount = documents.filter(doc => doc.relatedEntity?.type === 'device').length;
    const licenseCount = documents.filter(doc => doc.relatedEntity?.type === 'license').length;
    const certificateCount = documents.filter(doc => doc.relatedEntity?.type === 'certificate').length;

    return (
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ bgcolor: '#1E1E1E', color: 'white', border: '1px solid #333' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="white">
                {totalCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Dokumente gesamt
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ bgcolor: '#1E1E1E', color: 'white', border: '1px solid #333' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="#9e9e9e">
                {unassignedCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Nicht zugeordnet
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ bgcolor: '#1E1E1E', color: 'white', border: '1px solid #333' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="#42a5f5">
                {deviceCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Gerätedokumente
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ bgcolor: '#1E1E1E', color: 'white', border: '1px solid #333' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="#ffb74d">
                {licenseCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Lizenzdokumente
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ bgcolor: '#1E1E1E', color: 'white', border: '1px solid #333' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="#81c784">
                {certificateCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Zertifikatsdokumente
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  return (
    <MainLayout>
      <Box sx={{ p: 3, bgcolor: '#121212', minHeight: '100vh' }}>
        {/* Header */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" sx={{ fontWeight: 500, color: 'white' }}>
            Dokumentenverwaltung
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<UploadIcon />}
            onClick={handleUploadClick}
          >
            Dokument hochladen
          </Button>
        </Box>

        {/* Statistik-Karten */}
        {renderStatisticCards()}

        {/* Tabs */}
        <Paper sx={{ bgcolor: '#1E1E1E', color: 'white' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            sx={{ borderBottom: '1px solid #333' }}
          >
            <Tab label="Alle Dokumente" />
            <Tab label="Nicht zugeordnet" />
            <Tab label="Geräte" />
            <Tab label="Lizenzen" />
            <Tab label="Zertifikate" />
          </Tabs>

          {/* Filter und Suche */}
          <Box sx={{ p: 2, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            <TextField
              placeholder="Dokumente durchsuchen..."
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={handleSearch}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#888' }} />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSearchTerm('');
                        applyFilters('', typeFilter, entityFilter);
                      }}
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                )
              }}
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.05)',
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  '& fieldset': { borderColor: '#444' },
                  '&:hover fieldset': { borderColor: '#666' },
                }
              }}
            />

            <FormControl
              variant="outlined"
              size="small"
              sx={{ minWidth: 150, bgcolor: 'rgba(255, 255, 255, 0.05)' }}
            >
              <InputLabel id="type-filter-label" sx={{ color: '#888' }}>Dokumenttyp</InputLabel>
              <Select
                labelId="type-filter-label"
                value={typeFilter}
                onChange={handleTypeFilterChange}
                label="Dokumenttyp"
                sx={{ color: 'white' }}
              >
                <MenuItem value="all">Alle Typen</MenuItem>
                <MenuItem value="Rechnung">Rechnung</MenuItem>
                <MenuItem value="Lieferschein">Lieferschein</MenuItem>
                <MenuItem value="Handbuch">Handbuch</MenuItem>
                <MenuItem value="Garantie">Garantie</MenuItem>
                <MenuItem value="Lizenzvertrag">Lizenzvertrag</MenuItem>
                <MenuItem value="Wartungsvertrag">Wartungsvertrag</MenuItem>
                <MenuItem value="Sonstiges">Sonstiges</MenuItem>
              </Select>
            </FormControl>

            <FormControl
              variant="outlined"
              size="small"
              sx={{ minWidth: 200, bgcolor: 'rgba(255, 255, 255, 0.05)' }}
            >
              <InputLabel id="entity-filter-label" sx={{ color: '#888' }}>Zugeordnet zu</InputLabel>
              <Select
                labelId="entity-filter-label"
                value={entityFilter}
                onChange={handleEntityFilterChange}
                label="Zugeordnet zu"
                sx={{ color: 'white' }}
              >
                <MenuItem value="all">Alle Zuordnungen</MenuItem>
                <MenuItem value="none">Nicht zugeordnet</MenuItem>
                {entities.map((entity) => (
                  <MenuItem key={entity.id} value={entity.id}>
                    {entity.type === 'device' ? 'Gerät' :
                    entity.type === 'license' ? 'Lizenz' :
                    entity.type === 'certificate' ? 'Zertifikat' :
                    entity.type}: {entity.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button
              variant="outlined"
              startIcon={<ClearIcon />}
              onClick={handleClearFilters}
              sx={{ ml: 'auto' }}
            >
              Filter zurücksetzen
            </Button>
          </Box>
        </Paper>

        {/* Dokumententabelle mit AtlasTable */}
        <Box sx={{ mt: 2 }}>
          <AtlasTable
            columns={columns}
            rows={prepareDocumentsForTable(filteredDocuments)}
            heightPx={500}
            densePadding={true}
            sortColumn={sortConfig.column}
            sortDirection={sortConfig.direction}
            onSort={handleSort}
            onFilter={handleColumnFilter}
            onRowClick={(row) => handleViewDocument(row.originalId)}
          />
        </Box>

        {/* Upload-Dialog */}
        <DocumentUploader
          open={uploadDialogOpen}
          onClose={() => setUploadDialogOpen(false)}
          onUploadComplete={handleUploadComplete}
          isModal={true}
        />

        {/* Vorschau-Dialog */}
        {selectedDocument && (
          <DocumentPreview
            isOpen={previewOpen}
            onClose={handleClosePreview}
            fileName={selectedDocument.name}
            fileUrl={getDocumentUrl(selectedDocument)}
            fileType={selectedDocument.type}
            fileSize={selectedDocument.size}
            uploadDate={selectedDocument.uploadDate}
            uploadedBy={selectedDocument.uploadedBy}
            documentId={selectedDocument.id}
            onAnnotationsSave={handleSaveAnnotations}
            annotations={documentAnnotations[selectedDocument.id] || []}
          />
        )}
      </Box>
    </MainLayout>
  );
};

export default DocumentManager;
