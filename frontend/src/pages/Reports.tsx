import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tab,
  Tabs,
  LinearProgress,
  Divider,
  CircularProgress,
  Snackbar,
  Alert,
  SelectChangeEvent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  Print as PrintIcon,
  GetApp as GetAppIcon,
  Timeline as TimelineIcon,
  CalendarToday as CalendarTodayIcon,
  TextSnippet as TextSnippetIcon,
  PictureAsPdf as PdfIcon
} from '@mui/icons-material';
import { reportsApi } from '../utils/api';

// Interfaces für Berichte
interface StatItem {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

interface DeviceStats {
  total: number;
  byStatus: StatItem[];
  byCategory: StatItem[];
  byLocation: StatItem[];
  byDepartment?: StatItem[];
}

interface LicenseStats {
  total: number;
  byStatus: StatItem[];
  byType: StatItem[];
}

interface TicketStats {
  total: number;
  byStatus: StatItem[];
  byCategory: StatItem[];
  byPriority: StatItem[];
}

interface MonthlyData {
  month: string;
  count: number;
}

interface DashboardData {
  deviceStats: DeviceStats;
  licenseStats: LicenseStats;
  ticketStats: TicketStats;
  monthlyTickets: MonthlyData[];
}

// Neue Interfaces für Standort- und Abteilungsberichte
interface LocationOption {
  id: string;
  name: string;
  count: number;
}

interface DepartmentOption {
  id: string;
  name: string;
  count: number;
}

// TabPanel Komponente für die verschiedenen Berichtstypen
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
      style={{ paddingTop: 16 }}
    >
      {value === index && (
        <Box>{children}</Box>
      )}
    </div>
  );
};

const a11yProps = (index: number) => {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
};

const Reports: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [timeRange, setTimeRange] = useState('month');
  const [reportType, setReportType] = useState('device');
  const [deviceStats, setDeviceStats] = useState<DeviceStats>({} as DeviceStats);
  const [licenseStats, setLicenseStats] = useState<LicenseStats>({} as LicenseStats);
  const [ticketStats, setTicketStats] = useState<TicketStats>({} as TicketStats);
  const [monthlyTickets, setMonthlyTickets] = useState<MonthlyData[]>([]);

  // Neue States für Standort- und Abteilungsberichte
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [locationReport, setLocationReport] = useState<any>(null);
  const [departmentReport, setDepartmentReport] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Snackbar-Zustände
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });

  // Neuer State für den Export-Dialog
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleTimeRangeChange = (event: any) => {
    setTimeRange(event.target.value);
  };

  const handleReportTypeChange = (event: any) => {
    setReportType(event.target.value);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await reportsApi.getDashboardData();

        // Annahme: Die Antwort enthält ein 'data'-Objekt mit allen Statistiken
        if (response && response.data) {
          setDeviceStats(response.data.deviceStats || {});
          setLicenseStats(response.data.licenseStats || {});
          setTicketStats(response.data.ticketStats || {});
          setMonthlyTickets(response.data.monthlyTickets || []);
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Fehler beim Laden der Daten');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Neue Funktionen zum Laden der Standorte und Abteilungen
  useEffect(() => {
    const fetchLocationsAndDepartments = async () => {
      try {
        const response = await reportsApi.getLocationsAndDepartments();
        if (response?.data) {
          setLocations(response.data.locations || []);
          setDepartments(response.data.departments || []);
        }
      } catch (err) {
        console.error('Error fetching locations and departments:', err);
      }
    };

    fetchLocationsAndDepartments();
  }, []);

  // Handler für Standort-Änderungen
  const handleLocationChange = async (event: SelectChangeEvent<string>) => {
    const locationId = event.target.value;
    setSelectedLocation(locationId);

    if (!locationId) {
      setLocationReport(null);
      return;
    }

    setLoading(true);
    try {
      const response = await reportsApi.getDevicesByLocation(locationId);
      if (response?.data) {
        setLocationReport(response.data);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching location report:', err);
      setError('Fehler beim Laden der Standortdaten');
      setLoading(false);
    }
  };

  // Handler für Abteilungs-Änderungen
  const handleDepartmentChange = async (event: SelectChangeEvent<string>) => {
    const departmentId = event.target.value;
    setSelectedDepartment(departmentId);

    if (!departmentId) {
      setDepartmentReport(null);
      return;
    }

    setLoading(true);
    try {
      const response = await reportsApi.getDevicesByDepartment(departmentId);
      if (response?.data) {
        setDepartmentReport(response.data);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching department report:', err);
      setError('Fehler beim Laden der Abteilungsdaten');
      setLoading(false);
    }
  };

  // Snackbar anzeigen
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  // Snackbar schließen
  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  // Exportfunktionen
  const handleExportReport = () => {
    // Öffne den Dialog zur Auswahl des Exportformats
    setExportDialogOpen(true);
  };

  // Funktion zum Exportieren als Textdatei
  const exportAsText = () => {
    showSnackbar('Bericht wird als Textdatei exportiert...', 'info');
    setExportDialogOpen(false);

    // Erzeuge eine Datei basierend auf dem aktuellen Bericht
    const generateReportContent = () => {
      let content = 'ATLAS Bericht\n';
      content += `Datum: ${new Date().toLocaleDateString()}\n`;
      content += `Berichtstyp: ${reportType === 'device' ? 'Geräte' : reportType === 'license' ? 'Lizenzen' : 'Tickets'}\n\n`;

      if (reportType === 'device') {
        content += `Geräte Gesamtzahl: ${deviceStats.total}\n\n`;
        content += 'GERÄTE NACH STATUS:\n';
        deviceStats.byStatus?.forEach(item => {
          content += `${item.name}: ${item.count} (${Math.round(item.percentage)}%)\n`;
        });

        content += '\nGERÄTE NACH KATEGORIE:\n';
        deviceStats.byCategory?.forEach(item => {
          content += `${item.name}: ${item.count} (${Math.round(item.percentage)}%)\n`;
        });

        content += '\nGERÄTE NACH STANDORT:\n';
        deviceStats.byLocation?.forEach(item => {
          content += `${item.name}: ${item.count} (${Math.round(item.percentage)}%)\n`;
        });

        if (deviceStats.byDepartment) {
          content += '\nGERÄTE NACH ABTEILUNG:\n';
          deviceStats.byDepartment?.forEach(item => {
            content += `${item.name}: ${item.count} (${Math.round(item.percentage)}%)\n`;
          });
        }
      } else if (reportType === 'license') {
        content += `Lizenzen Gesamtzahl: ${licenseStats.total}\n\n`;
        content += 'LIZENZEN NACH STATUS:\n';
        licenseStats.byStatus?.forEach(item => {
          content += `${item.name}: ${item.count} (${Math.round(item.percentage)}%)\n`;
        });

        content += '\nLIZENZEN NACH TYP:\n';
        licenseStats.byType?.forEach(item => {
          content += `${item.name}: ${item.count} (${Math.round(item.percentage)}%)\n`;
        });
      } else if (reportType === 'ticket') {
        content += `Tickets Gesamtzahl: ${ticketStats.total}\n\n`;
        content += 'TICKETS NACH STATUS:\n';
        ticketStats.byStatus?.forEach(item => {
          content += `${item.name}: ${item.count} (${Math.round(item.percentage)}%)\n`;
        });

        content += '\nTICKETS NACH KATEGORIE:\n';
        ticketStats.byCategory?.forEach(item => {
          content += `${item.name}: ${item.count} (${Math.round(item.percentage)}%)\n`;
        });

        content += '\nTICKETS NACH PRIORITÄT:\n';
        ticketStats.byPriority?.forEach(item => {
          content += `${item.name}: ${item.count} (${Math.round(item.percentage)}%)\n`;
        });
      }

      // Spezifische Berichte für Standort oder Abteilung
      if (selectedLocation && locationReport) {
        content += `\n\nSTANDORTBERICHT: ${locationReport.location}\n`;
        content += `Gesamtzahl der Geräte: ${locationReport.totalDevices}\n\n`;
        content += 'GERÄTE NACH KATEGORIE:\n';
        locationReport.devicesByCategory?.forEach((item: StatItem) => {
          content += `${item.name}: ${item.count} (${Math.round(item.percentage)}%)\n`;
        });
      }

      if (selectedDepartment && departmentReport) {
        content += `\n\nABTEILUNGSBERICHT: ${departmentReport.department}\n`;
        content += `Gesamtzahl der Geräte: ${departmentReport.totalDevices}\n\n`;
        content += 'GERÄTE NACH KATEGORIE:\n';
        departmentReport.devicesByCategory?.forEach((item: StatItem) => {
          content += `${item.name}: ${item.count} (${Math.round(item.percentage)}%)\n`;
        });

        content += '\nGERÄTE NACH STATUS:\n';
        departmentReport.deviceStatus?.forEach((item: StatItem) => {
          content += `${item.name}: ${item.count} (${Math.round(item.percentage)}%)\n`;
        });
      }

      return content;
    };

    const content = generateReportContent();

    // Erzeuge einen Blob und einen Download-Link
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    // Erzeuge einen temporären Link zum Herunterladen
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ATLAS_Bericht_${reportType}_${new Date().toISOString().split('T')[0]}.txt`);
    document.body.appendChild(link);

    // Klicke auf den Link um den Download zu starten
    link.click();

    // Entferne den Link wieder
    document.body.removeChild(link);

    // Bereinige die URL
    URL.revokeObjectURL(url);

    // Zeige Erfolgsmeldung nach kurzer Verzögerung
    setTimeout(() => {
      showSnackbar('Bericht erfolgreich als Textdatei exportiert', 'success');
    }, 500);
  };

  // Komponentendefinition für ein verbessertes Tortendiagramm
  const PieChartDisplay = ({ items }: { items: StatItem[] }) => {
    // Sicherstellen, dass items ein Array ist
    const safeItems = Array.isArray(items) ? items : [];

    // Wenn keine Items vorhanden sind, zeige eine leere Anzeige
    if (safeItems.length === 0) {
      return (
        <Box sx={{
          position: 'relative',
          width: 200,
          height: 200,
          margin: '0 auto',
          mt: 2,
          mb: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px dashed rgba(255,255,255,0.2)',
          borderRadius: '50%'
        }}>
          <Typography variant="caption" color="text.secondary">
            Keine Daten
          </Typography>
        </Box>
      );
    }

    const totalCount = safeItems.reduce((acc, item) => acc + item.count, 0);
    const calculateStartAngle = (index: number) => {
      let angle = 0;
      for (let i = 0; i < index; i++) {
        angle += (safeItems[i].count / totalCount) * 360;
      }
      return angle;
    };

    return (
      <Box sx={{ position: 'relative', width: 200, height: 200, margin: '0 auto', mt: 2, mb: 4 }}>
        {safeItems.map((item, index) => {
          const startAngle = calculateStartAngle(index);
          const angle = (item.count / totalCount) * 360;
          return (
            <Box
              key={index}
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: `conic-gradient(${item.color} ${startAngle}deg, ${item.color} ${startAngle + angle}deg, transparent ${startAngle + angle}deg)`,
                borderRadius: '50%',
                transform: 'rotate(-90deg)',
              }}
            />
          );
        })}
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '70%',
          height: '70%',
          borderRadius: '50%',
          backgroundColor: '#1a1a1a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          boxShadow: 'inset 0 0 10px rgba(0, 0, 0, 0.5)'
        }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'white' }}>
            {totalCount}
          </Typography>
          <Typography variant="caption" sx={{ color: '#aaa' }}>
            Gesamt
          </Typography>
        </Box>
      </Box>
    );
  };

  // Komponentendefinition für verbesserte horizontale Balken mit Beschriftung
  const EnhancedHorizontalBar = ({ name, count, percentage, color }: { name: string, count: number, percentage: number, color: string }) => (
    <Box sx={{ width: '100%', mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="body2" color="white" sx={{ fontWeight: 'medium' }}>
          {name}
        </Typography>
        <Typography variant="body2" color="white" sx={{ fontWeight: 'bold' }}>
          {count}
        </Typography>
      </Box>
      <Box sx={{
        width: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 2,
        height: 16,
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        position: 'relative'
      }}>
        <Box
          sx={{
            width: `${percentage}%`,
            backgroundColor: color,
            borderRadius: 1,
            height: '100%',
            transition: 'width 1s ease-in-out',
            boxShadow: `0 0 10px ${color}80`,
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(to bottom, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%)',
              pointerEvents: 'none',
            }
          }}
        />
        <Typography
          variant="caption"
          sx={{
            position: 'absolute',
            top: '50%',
            left: `${Math.min(percentage + 2, 97)}%`,
            transform: 'translateY(-50%)',
            color: percentage > 50 ? 'white' : color,
            fontWeight: 'bold',
            textShadow: '0 0 2px rgba(0,0,0,0.7)'
          }}
        >
          {`${Math.round(percentage)}%`}
        </Typography>
      </Box>
    </Box>
  );

  // Funktion zum Exportieren als PDF (via Drucken)
  const exportAsPdf = () => {
    showSnackbar('Bericht wird als PDF vorbereitet...', 'info');
    setExportDialogOpen(false);

    // Zeige Titel und Datum an
    const titleElement = document.getElementById('report-title');
    const dateElement = document.getElementById('report-date');
    if (titleElement) titleElement.style.display = 'block';
    if (dateElement) dateElement.style.display = 'block';

    // Bereite alle grafischen Elemente vor und verbessere die Sichtbarkeit
    const prepareGraphicsForPrint = () => {
      // Füge Tortendiagramme hinzu wo nötig
      const categoryContainers = document.querySelectorAll('.category-distribution');
      categoryContainers.forEach((container) => {
        if (!container.querySelector('.pie-chart-container')) {
          const dataItems = Array.from(container.querySelectorAll('.bar-item')).map(item => {
            const name = item.getAttribute('data-name') || '';
            const count = parseInt(item.getAttribute('data-count') || '0', 10);
            const percentage = parseInt(item.getAttribute('data-percentage') || '0', 10);
            const color = item.getAttribute('data-color') || '#ccc';
            return { name, count, percentage, color };
          });

          if (dataItems.length > 0) {
            const pieContainer = document.createElement('div');
            pieContainer.className = 'pie-chart-container';
            pieContainer.style.width = '200px';
            pieContainer.style.height = '200px';
            pieContainer.style.margin = '20px auto';
            pieContainer.style.position = 'relative';
            container.prepend(pieContainer);

            // Füge einfaches SVG-Tortendiagramm ein
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('width', '200');
            svg.setAttribute('height', '200');
            svg.setAttribute('viewBox', '0 0 100 100');
            pieContainer.appendChild(svg);

            let startAngle = 0;
            const total = dataItems.reduce((acc, item) => acc + item.count, 0);

            dataItems.forEach(item => {
              const slice = document.createElementNS('http://www.w3.org/2000/svg', 'path');
              const angle = (item.count / total) * 360;
              const endAngle = startAngle + angle;

              // Konvertiere Winkel zu Radianten
              const startRad = (startAngle - 90) * Math.PI / 180;
              const endRad = (endAngle - 90) * Math.PI / 180;

              // Berechne Punkte
              const x1 = 50 + 50 * Math.cos(startRad);
              const y1 = 50 + 50 * Math.sin(startRad);
              const x2 = 50 + 50 * Math.cos(endRad);
              const y2 = 50 + 50 * Math.sin(endRad);

              // Erstelle Pfad
              const largeArcFlag = angle > 180 ? 1 : 0;
              const d = `M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

              slice.setAttribute('d', d);
              slice.setAttribute('fill', item.color);
              slice.setAttribute('stroke', '#333');
              slice.setAttribute('stroke-width', '0.5');

              svg.appendChild(slice);
              startAngle = endAngle;
            });

            // Füge Mittelpunkt hinzu
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', '50');
            circle.setAttribute('cy', '50');
            circle.setAttribute('r', '30');
            circle.setAttribute('fill', '#1a1a1a');
            circle.setAttribute('stroke', '#333');
            circle.setAttribute('stroke-width', '1');
            svg.appendChild(circle);

            // Füge Gesamtzahl in die Mitte
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', '50');
            text.setAttribute('y', '45');
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('dominant-baseline', 'middle');
            text.setAttribute('fill', 'white');
            text.setAttribute('font-weight', 'bold');
            text.setAttribute('font-size', '12');
            text.textContent = total.toString();
            svg.appendChild(text);

            // "Gesamt" Label
            const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            label.setAttribute('x', '50');
            label.setAttribute('y', '60');
            label.setAttribute('text-anchor', 'middle');
            label.setAttribute('dominant-baseline', 'middle');
            label.setAttribute('fill', '#aaa');
            label.setAttribute('font-size', '7');
            label.textContent = 'Gesamt';
            svg.appendChild(label);
          }
        }
      });

      // Verbessere die Balkendiagramme
      const progressBars = document.querySelectorAll('.MuiBox-root [style*="background-color"]');
      progressBars.forEach(bar => {
        if (bar instanceof HTMLElement) {
          // Füge Glanzeffekt hinzu
          bar.style.backgroundImage = 'linear-gradient(to bottom, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%)';
          // Erhöhe Kontrast und Sichtbarkeit
          bar.style.boxShadow = `0 0 5px ${bar.style.backgroundColor}`;
        }
      });
    };

    // Wir erstellen temporäre Styles, um nur den Bereich zu drucken, den wir wollen
    const style = document.createElement('style');
    style.id = 'print-style';
    style.innerHTML = `
      @media print {
        body * {
          visibility: hidden;
        }

        .MuiAppBar-root, .MuiDrawer-root, button, .print-hidden {
          display: none !important;
        }

        #report-content, #report-content * {
          visibility: visible;
        }

        #report-content {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          background-color: white !important;
          color: black !important;
          padding: 20px;
        }

        #report-content .MuiCard-root,
        #report-content .MuiPaper-root {
          background-color: white !important;
          color: black !important;
          border: 1px solid #ddd;
          break-inside: avoid;
          margin-bottom: 15px;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1) !important;
          border-radius: 8px;
          overflow: hidden;
        }

        #report-content .MuiCardHeader-root {
          border-bottom: 1px solid #ddd;
          background-color: #f5f5f5 !important;
          padding: 12px 16px;
        }

        #report-content .MuiCardHeader-title {
          font-weight: bold !important;
          color: #1976d2 !important;
        }

        #report-content .MuiTypography-root {
          color: black !important;
        }

        #report-title {
          display: block !important;
          text-align: center;
          margin-bottom: 15px;
          font-size: 24px;
          font-weight: bold;
          color: #1976d2 !important;
          border-bottom: 2px solid #1976d2;
          padding-bottom: 10px;
        }

        #report-date {
          display: block !important;
          text-align: center;
          margin-bottom: 30px;
          font-size: 14px;
          color: #666 !important;
        }

        /* Verbesserte Fortschrittsbalken und Diagramme */
        #report-content .MuiLinearProgress-root {
          border: 1px solid #ddd;
          background-color: #f0f0f0 !important;
          height: 16px !important;
          border-radius: 8px !important;
          overflow: hidden;
        }

        #report-content .MuiLinearProgress-bar {
          background-color: #1976d2 !important;
          background-image: linear-gradient(to right, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%) !important;
        }

        /* Vertikale Fortschrittsbalken */
        #report-content [style*="background-color: rgba(255, 255, 255, 0.1)"] {
          background-color: #f0f0f0 !important;
          border: 1px solid #ddd !important;
          border-radius: 4px !important;
        }

        /* Stelle sicher, dass alle farbigen Balken angezeigt werden */
        #report-content [style*="background-color"] {
          print-color-adjust: exact !important;
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
        }

        /* Verbesserte Darstellung der Kärtchen */
        #report-content .MuiCard-root {
          page-break-inside: avoid;
          margin-bottom: 20px;
          padding-bottom: 10px;
        }

        /* Verbesserter Kontrast für Text */
        #report-content .MuiCardContent-root {
          color: #333 !important;
          padding: 16px !important;
        }

        /* Anpassung der Trendkarte */
        #report-content [style*="height: 250px"] {
          height: auto !important;
          min-height: 200px;
        }

        /* Verbesserte Tortendiagramme */
        .pie-chart-container {
          page-break-inside: avoid;
          margin: 20px auto !important;
        }

        /* Legende für Diagramme */
        .chart-legend {
          display: flex !important;
          flex-wrap: wrap !important;
          justify-content: center !important;
          margin-top: 15px !important;
          gap: 10px !important;
        }

        .legend-item {
          display: flex !important;
          align-items: center !important;
          margin-right: 15px !important;
        }

        .legend-color {
          width: 12px !important;
          height: 12px !important;
          margin-right: 5px !important;
          border-radius: 2px !important;
          display: inline-block !important;
        }

        .legend-text {
          font-size: 12px !important;
          color: #333 !important;
        }

        /* Kategorie-Verteilungsvisualisierung */
        .category-distribution {
          margin-top: 20px !important;
          padding: 10px !important;
        }
      }
    `;

    document.head.appendChild(style);

    // Timeout, um sicherzustellen, dass das DOM aktualisiert ist
    setTimeout(() => {
      // Verbessere die grafischen Elemente für den Druck
      prepareGraphicsForPrint();

      // Starte den Druckvorgang
      window.print();

      // Nach dem Drucken die Styles wieder entfernen und die Elemente verstecken
      setTimeout(() => {
        const styleElement = document.getElementById('print-style');
        if (styleElement) {
          styleElement.remove();
        }
        if (titleElement) titleElement.style.display = 'none';
        if (dateElement) dateElement.style.display = 'none';

        // Entferne die hinzugefügten Tortendiagramme
        const pieContainers = document.querySelectorAll('.pie-chart-container');
        pieContainers.forEach(container => {
          container.remove();
        });

        showSnackbar('PDF-Export abgeschlossen', 'success');
      }, 1000);
    }, 500);
  };

  const handlePrintReport = () => {
    // Verwende die gleiche Logik wie beim PDF-Export
    exportAsPdf();
    showSnackbar('Druckansicht wurde geöffnet', 'info');
  };

  // Berichtsdaten für bestimmten Zeitraum laden
  const handleLoadReportData = () => {
    setLoading(true);

    const fetchFilteredData = async () => {
      try {
        let params = { timeRange };

        // Je nach Berichtstyp unterschiedliche API-Anfragen
        switch (reportType) {
          case 'device':
            const deviceData = await reportsApi.getDeviceReport(params);
            setDeviceStats(deviceData.data[0] || {});
            break;
          case 'license':
            const licenseData = await reportsApi.getLicenseReport(params);
            setLicenseStats(licenseData.data[0] || {});
            break;
          case 'ticket':
            // Da es keine spezifische Ticket-Report-Funktion gibt, verwenden wir getDashboardData()
            // und extrahieren den Ticket-Teil
            const dashboardTicketData = await reportsApi.getDashboardData();
            if (dashboardTicketData && dashboardTicketData.data) {
              setTicketStats(dashboardTicketData.data.ticketStats || {});
            }
            break;
          default:
            // Dashboard-Daten (Kombination)
            const dashboardData = await reportsApi.getDashboardData();
            if (dashboardData && dashboardData.data) {
              setDeviceStats(dashboardData.data.deviceStats || {});
              setLicenseStats(dashboardData.data.licenseStats || {});
              setTicketStats(dashboardData.data.ticketStats || {});
              setMonthlyTickets(dashboardData.data.monthlyTickets || []);
            }
        }

        setLoading(false);
        showSnackbar('Berichtsdaten aktualisiert', 'success');
      } catch (err) {
        console.error('Error loading filtered report data:', err);
        setError('Fehler beim Laden der gefilterten Daten');
        setLoading(false);
        showSnackbar('Fehler beim Laden der Berichtsdaten', 'error');
      }
    };

    fetchFilteredData();
  };

  // In der Verteilungsansicht, ersetze den Standard VerticalProgressBar durch eine erweiterte Version
  // Ersetze diese Komponente:
  const EnhancedVerticalProgressBar = ({ percentage, color, height = 120, name, count }: { percentage: number, color: string, height?: number, name: string, count: number }) => (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      height: `${height}px`,
      width: '80px'
    }} className="bar-item" data-name={name} data-count={count} data-percentage={percentage} data-color={color}>
      <Box sx={{
        height: '100%',
        width: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 2,
        position: 'relative',
        my: 1,
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <Box sx={{
          position: 'absolute',
          bottom: 0,
          width: '100%',
          height: `${percentage}%`,
          backgroundColor: color,
          borderRadius: 2,
          transition: 'height 1s ease-in-out',
          backgroundImage: 'linear-gradient(to bottom, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 100%)',
          boxShadow: `0 0 10px ${color}80`
        }} />
      </Box>
      <Typography variant="body2" color="white" sx={{ mt: 0.5, fontWeight: 'bold' }}>
        {`${Math.round(percentage)}%`}
      </Typography>
      <Typography variant="body2" align="center" sx={{ mt: 0.5, fontSize: '0.75rem' }}>
        {name}
      </Typography>
      <Typography variant="body2" align="center" sx={{ color: '#aaa', fontSize: '0.75rem' }}>
        {count}
      </Typography>
    </Box>
  );

  // Verwende nun EnhancedHorizontalBar und EnhancedVerticalProgressBar in der Render-Funktion anstelle der ursprünglichen Komponenten

  // Beispiel für eine Card mit erweiterten Komponenten:
  // (Dieser Code kann als Vorlage dienen, um die existierenden Karten zu erweitern)
  const EnhancedCategoryDistributionCard = ({ title, items = [], totalLabel = "Gesamt" }: { title: string, items: StatItem[], totalLabel?: string }) => {
    // Füge eine Null-Prüfung hinzu, um sicherzustellen, dass items ein Array ist
    const safeItems = Array.isArray(items) ? items : [];
    const totalCount = safeItems.reduce((acc, item) => acc + item.count, 0);

    return (
      <Card sx={{ bgcolor: '#1E1E1E', color: 'white', border: '1px solid #333' }}>
        <CardHeader
          title={title}
          sx={{
            borderBottom: '1px solid #333',
            '& .MuiCardHeader-title': {
              fontSize: '1.1rem',
              fontWeight: 500
            }
          }}
        />
        <CardContent className="category-distribution">
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="h3" sx={{ color: '#1976d2', mb: 1 }}>
              {totalCount}
            </Typography>
            <Typography variant="body2" color="#aaa">
              {totalLabel}
            </Typography>
          </Box>

          {/* Tortendiagramm für den PDF-Export */}
          {safeItems.length > 0 ? (
            <>
              <PieChartDisplay items={safeItems} />

              {/* Vertikale Balkendiagramme */}
              <Box sx={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 2, py: 3 }}>
                {safeItems.map((item, index) => (
                  <EnhancedVerticalProgressBar
                    key={index}
                    percentage={item.percentage}
                    color={item.color}
                    name={item.name}
                    count={item.count}
                  />
                ))}
              </Box>
            </>
          ) : (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">Keine Daten verfügbar</Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Box sx={{ p: 2, bgcolor: '#121212', minHeight: '100vh' }}>
      <Paper
        elevation={0}
        sx={{
          bgcolor: '#1976d2',
          color: 'white',
          p: 1,
          pl: 2,
          borderRadius: '4px 4px 0 0',
          mb: 2
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 500 }}>
          Berichte & Statistiken
        </Typography>
      </Paper>

      <div id="report-content">
        <div id="report-title" style={{ display: 'none' }}>
          ATLAS Bericht - {reportType === 'device' ? 'Geräte' : reportType === 'license' ? 'Lizenzen' : 'Tickets'}
        </div>
        <div id="report-date" style={{ display: 'none' }}>
          Generiert am: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
        </div>

        <Grid container spacing={3}>
          {/* Filter-Bereich */}
          <Grid item xs={12} className="print-hidden">
            <Paper sx={{ p: 2, bgcolor: '#1a1a1a', color: 'white', borderRadius: 1 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={3}>
                  <FormControl fullWidth size="small" sx={{ bgcolor: '#333', borderRadius: 1 }}>
                    <InputLabel id="report-type-label" sx={{ color: '#aaa' }}>Berichtstyp</InputLabel>
                    <Select
                      labelId="report-type-label"
                      id="report-type"
                      value={reportType}
                      label="Berichtstyp"
                      onChange={handleReportTypeChange}
                      sx={{
                        color: 'white',
                        '.MuiOutlinedInput-notchedOutline': { border: 0 },
                        '&:hover .MuiOutlinedInput-notchedOutline': { border: 0 },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { border: 0 },
                      }}
                    >
                      <MenuItem value="device">Geräteberichte</MenuItem>
                      <MenuItem value="license">Lizenzberichte</MenuItem>
                      <MenuItem value="ticket">Ticketberichte</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <FormControl fullWidth size="small" sx={{ bgcolor: '#333', borderRadius: 1 }}>
                    <InputLabel id="time-range-label" sx={{ color: '#aaa' }}>Zeitraum</InputLabel>
                    <Select
                      labelId="time-range-label"
                      id="time-range"
                      value={timeRange}
                      label="Zeitraum"
                      onChange={handleTimeRangeChange}
                      sx={{
                        color: 'white',
                        '.MuiOutlinedInput-notchedOutline': { border: 0 },
                        '&:hover .MuiOutlinedInput-notchedOutline': { border: 0 },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { border: 0 },
                      }}
                    >
                      <MenuItem value="week">Letzte Woche</MenuItem>
                      <MenuItem value="month">Letzter Monat</MenuItem>
                      <MenuItem value="quarter">Letztes Quartal</MenuItem>
                      <MenuItem value="year">Letztes Jahr</MenuItem>
                      <MenuItem value="all">Alle Daten</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <Button
                      variant="outlined"
                      startIcon={<PrintIcon />}
                      onClick={handlePrintReport}
                      sx={{
                        borderColor: '#1976d2',
                        color: '#1976d2',
                        bgcolor: 'transparent',
                        '&:hover': {
                          borderColor: '#1976d2',
                          bgcolor: 'rgba(25, 118, 210, 0.1)',
                        }
                      }}
                    >
                      Drucken
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<GetAppIcon />}
                      onClick={handleExportReport}
                      sx={{
                        bgcolor: '#1976d2',
                        color: 'white',
                        '&:hover': {
                          bgcolor: '#1565c0',
                        }
                      }}
                    >
                      Exportieren
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Bericht-Tabs */}
          <Grid item xs={12}>
            <Paper sx={{ bgcolor: '#1a1a1a', color: 'white', borderRadius: 1 }}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs
                  value={tabValue}
                  onChange={handleTabChange}
                  variant="fullWidth"
                  sx={{
                    '& .MuiTabs-indicator': {
                      backgroundColor: '#1976d2',
                    },
                    '& .MuiTab-root': {
                      color: '#aaa',
                      '&.Mui-selected': {
                        color: '#1976d2',
                      },
                    },
                  }}
                >
                  <Tab
                    icon={<BarChartIcon />}
                    label="Statistiken"
                    iconPosition="start"
                    {...a11yProps(0)}
                  />
                  <Tab
                    icon={<PieChartIcon />}
                    label="Verteilung"
                    iconPosition="start"
                    {...a11yProps(1)}
                  />
                  <Tab
                    icon={<TimelineIcon />}
                    label="Trends"
                    iconPosition="start"
                    {...a11yProps(2)}
                  />
                  <Tab
                    icon={<CalendarTodayIcon />}
                    label="Zeitlicher Verlauf"
                    iconPosition="start"
                    {...a11yProps(3)}
                  />
                </Tabs>
              </Box>

              {/* Statistiken Tab */}
              <TabPanel value={tabValue} index={0}>
                <Box sx={{ p: 2 }}>
                  <Grid container spacing={3}>
                    {/* Übersichtskarten */}
                    <Grid item xs={12} md={4}>
                      <EnhancedCategoryDistributionCard title="Geräteübersicht" items={deviceStats.byStatus} />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <EnhancedCategoryDistributionCard title="Lizenzübersicht" items={licenseStats.byStatus} />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <EnhancedCategoryDistributionCard title="Ticketübersicht" items={ticketStats.byStatus} />
                    </Grid>
                  </Grid>
                </Box>
              </TabPanel>

              {/* Verteilung Tab */}
              <TabPanel value={tabValue} index={1}>
                <Box sx={{ p: 2 }}>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <Paper sx={{ p: 2, bgcolor: '#1a1a1a', color: 'white', borderRadius: 1 }}>
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={4}>
                            <FormControl fullWidth size="small" sx={{ bgcolor: '#333', borderRadius: 1 }}>
                              <InputLabel id="report-type-select-label" sx={{ color: '#aaa' }}>Berichtstyp</InputLabel>
                              <Select
                                labelId="report-type-select-label"
                                id="report-type-select"
                                value={reportType}
                                label="Berichtstyp"
                                onChange={handleReportTypeChange}
                                sx={{
                                  color: 'white',
                                  '.MuiOutlinedInput-notchedOutline': { border: 0 },
                                  '&:hover .MuiOutlinedInput-notchedOutline': { border: 0 },
                                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { border: 0 },
                                }}
                              >
                                <MenuItem value="device">Geräteberichte</MenuItem>
                                <MenuItem value="license">Lizenzberichte</MenuItem>
                                <MenuItem value="ticket">Ticketberichte</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <FormControl fullWidth size="small" sx={{ bgcolor: '#333', borderRadius: 1 }}>
                              <InputLabel id="location-select-label" sx={{ color: '#aaa' }}>Nach Standort</InputLabel>
                              <Select
                                labelId="location-select-label"
                                id="location-select"
                                value={selectedLocation}
                                label="Nach Standort"
                                onChange={handleLocationChange}
                                sx={{
                                  color: 'white',
                                  '.MuiOutlinedInput-notchedOutline': { border: 0 },
                                  '&:hover .MuiOutlinedInput-notchedOutline': { border: 0 },
                                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { border: 0 },
                                }}
                              >
                                <MenuItem value="">
                                  <em>Alle Standorte</em>
                                </MenuItem>
                                {locations.map((location) => (
                                  <MenuItem key={location.id} value={location.id}>
                                    {location.name} ({location.count} Geräte)
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <FormControl fullWidth size="small" sx={{ bgcolor: '#333', borderRadius: 1 }}>
                              <InputLabel id="department-select-label" sx={{ color: '#aaa' }}>Nach Abteilung</InputLabel>
                              <Select
                                labelId="department-select-label"
                                id="department-select"
                                value={selectedDepartment}
                                label="Nach Abteilung"
                                onChange={handleDepartmentChange}
                                sx={{
                                  color: 'white',
                                  '.MuiOutlinedInput-notchedOutline': { border: 0 },
                                  '&:hover .MuiOutlinedInput-notchedOutline': { border: 0 },
                                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { border: 0 },
                                }}
                              >
                                <MenuItem value="">
                                  <em>Alle Abteilungen</em>
                                </MenuItem>
                                {departments.map((department) => (
                                  <MenuItem key={department.id} value={department.id}>
                                    {department.name} ({department.count} Geräte)
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Grid>
                        </Grid>
                      </Paper>
                    </Grid>

                    {/* Standortbericht */}
                    {selectedLocation && locationReport && (
                      <Grid item xs={12}>
                        <EnhancedCategoryDistributionCard title={`Geräteverteilung am Standort ${locationReport.location}`} items={locationReport.devicesByCategory} />
                      </Grid>
                    )}

                    {/* Abteilungsbericht */}
                    {selectedDepartment && departmentReport && (
                      <Grid item xs={12}>
                        <EnhancedCategoryDistributionCard title={`Geräteverteilung in der Abteilung ${departmentReport.department}`} items={departmentReport.devicesByCategory} />
                      </Grid>
                    )}

                    {/* Standard-Verteilungsbericht (falls kein Standort oder Abteilung ausgewählt) */}
                    {!selectedLocation && !selectedDepartment && (
                      <Grid item xs={12}>
                        <EnhancedCategoryDistributionCard title={`Verteilung nach Kategorie (${reportType === 'device' ? 'Geräte' : reportType === 'license' ? 'Lizenzen' : 'Tickets'})`} items={(reportType === 'device' ? deviceStats?.byCategory :
                          reportType === 'license' ? licenseStats?.byType :
                          ticketStats?.byCategory) || []} />
                      </Grid>
                    )}

                    {/* Verteilung nach Standort */}
                    {reportType === 'device' && !selectedLocation && !selectedDepartment && (
                      <Grid item xs={12} mt={3}>
                        <EnhancedCategoryDistributionCard title="Geräteverteilung nach Standort" items={deviceStats?.byLocation || []} />
                      </Grid>
                    )}

                    {/* Verteilung nach Abteilung */}
                    {reportType === 'device' && !selectedLocation && !selectedDepartment && (
                      <Grid item xs={12} mt={3}>
                        <EnhancedCategoryDistributionCard title="Geräteverteilung nach Abteilung" items={deviceStats?.byDepartment || []} />
                      </Grid>
                    )}
                  </Grid>
                </Box>
              </TabPanel>

              {/* Trends Tab */}
              <TabPanel value={tabValue} index={2}>
                <Box sx={{ p: 2 }}>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <EnhancedCategoryDistributionCard title="Ticket-Eingang nach Monat" items={
                        Array.isArray(monthlyTickets) ? monthlyTickets.map(item => ({
                          name: item.month,
                          count: item.count,
                          percentage: (item.count / (monthlyTickets.length ? Math.max(...monthlyTickets.map(i => i.count)) : 1)) * 100,
                          color: '#1976d2'
                        })) : []
                      } />
                    </Grid>
                  </Grid>
                </Box>
              </TabPanel>

              {/* Zeitlicher Verlauf Tab */}
              <TabPanel value={tabValue} index={3}>
                <Box sx={{ p: 2 }}>
                  <Typography color="white" align="center" sx={{ py: 10 }}>
                    Daten für zeitlichen Verlauf werden geladen...
                  </Typography>
                  <LinearProgress />
                </Box>
              </TabPanel>
            </Paper>
          </Grid>
        </Grid>
      </div>

      {/* Export-Format-Dialog */}
      <Dialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: '#1a1a1a',
            color: 'white',
            width: '400px',
            maxWidth: '90vw'
          }
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid #333' }}>
          Exportformat wählen
        </DialogTitle>
        <DialogContent>
          <List sx={{ pt: 1 }}>
            <ListItem button onClick={exportAsText} sx={{ '&:hover': { bgcolor: 'rgba(25, 118, 210, 0.1)' } }}>
              <ListItemIcon>
                <TextSnippetIcon sx={{ color: '#1976d2' }} />
              </ListItemIcon>
              <ListItemText
                primary="Als Textdatei exportieren"
                secondary="Einfache Textdatei mit allen Daten (.txt)"
                secondaryTypographyProps={{ sx: { color: '#aaa' } }}
              />
            </ListItem>
            <ListItem button onClick={exportAsPdf} sx={{ '&:hover': { bgcolor: 'rgba(25, 118, 210, 0.1)' } }}>
              <ListItemIcon>
                <PdfIcon sx={{ color: '#f44336' }} />
              </ListItemIcon>
              <ListItemText
                primary="Als PDF exportieren"
                secondary="Grafischer Bericht mit Layout (.pdf)"
                secondaryTypographyProps={{ sx: { color: '#aaa' } }}
              />
            </ListItem>
          </List>
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid #333', p: 2 }}>
          <Button
            onClick={() => setExportDialogOpen(false)}
            sx={{ color: '#aaa' }}
          >
            Abbrechen
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar für Benachrichtigungen */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Reports;
