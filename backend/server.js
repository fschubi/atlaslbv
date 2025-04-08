const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const { rateLimit } = require('express-rate-limit');
const dotenv = require('dotenv');
const fs = require('fs');
const logger = require('./utils/logger');
const path = require('path');

// Routen
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const deviceRoutes = require('./routes/devices');
const licenseRoutes = require('./routes/licenses');
const certificateRoutes = require('./routes/certificates');
const accessoryRoutes = require('./routes/accessories');
const inventoryRoutes = require('./routes/inventory');
const todoRoutes = require('./routes/todos');
const ticketRoutes = require('./routes/tickets');
const reportRoutes = require('./routes/reports');
const documentRoutes = require('./routes/documents');
const userGroupRoutes = require('./routes/userGroupRoutes');

// Middleware
const { authMiddleware } = require('./middleware/auth');

// Konfiguration
dotenv.config();

const app = express();

// Middleware
app.use(helmet()); // Sicherheits-Header
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3003',
      'http://localhost:5173',
      process.env.FRONTEND_URL
    ].filter(Boolean);

    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy: Origin ' + origin + ' not allowed'));
    }
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  maxAge: 86400 // 24 Stunden
}));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minuten
  max: 100 // Maximal 100 Anfragen pro IP
});
app.use(limiter);

// Routen zuweisen
app.use('/api/auth', authRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/devices', authMiddleware, deviceRoutes);
app.use('/api/licenses', authMiddleware, licenseRoutes);
app.use('/api/certificates', authMiddleware, certificateRoutes);
app.use('/api/accessories', authMiddleware, accessoryRoutes);
app.use('/api/inventory', authMiddleware, inventoryRoutes);
app.use('/api/todos', authMiddleware, todoRoutes);
app.use('/api/tickets', authMiddleware, ticketRoutes);
app.use('/api/reports', authMiddleware, reportRoutes);
app.use('/api/documents', authMiddleware, documentRoutes);
app.use('/api/user-groups', userGroupRoutes);

// Statische Dateien (für Uploads)
const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// Statische Dateien servieren
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Standardroute (für API-Dokumentation oder Frontend)
app.get('/', (req, res) => {
  res.json({
    message: 'ATLAS API Server',
    version: '1.0.0',
    documentation: '/api/docs'
  });
});

// API-Dokumentation (optional)
app.get('/api/docs', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>ATLAS API Dokumentation</title>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css">
      </head>
      <body class="bg-dark text-light p-5">
        <div class="container">
          <h1>ATLAS API Dokumentation</h1>
          <p>Die vollständige API-Dokumentation finden Sie in der Datei '/docs/api_dokumentation.md'</p>
        </div>
      </body>
    </html>
  `);
});

// API-Status
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date(),
    version: '1.0.0'
  });
});

// Gesundheitscheck-Route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API-Dokumentationsroute
app.get('/api', (req, res) => {
  res.status(200).json({
    message: 'ATLAS API v1.0',
    endpoints: [
      { path: '/api/devices', description: 'Geräte-Management' },
      { path: '/api/licenses', description: 'Lizenz-Management' },
      { path: '/api/certificates', description: 'Zertifikats-Management' },
      { path: '/api/users', description: 'Benutzer-Management' },
      { path: '/api/tickets', description: 'Ticket-System' },
      { path: '/api/inventory', description: 'Inventarisierung' },
      { path: '/api/todos', description: 'Aufgaben-Management' }
    ]
  });
});

// 404 Not Found Handler
app.use((req, res, next) => {
  res.status(404).json({
    message: 'Route nicht gefunden',
    path: req.originalUrl
  });
});

// API-Routen
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API-Endpunkt nicht gefunden'
  });
});

// Alle anderen Anfragen an die Frontend-App weiterleiten (für Client-Side-Routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// Globaler Fehlerhandler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  logger.error(`Serverfehler: ${err.message}`, err);

  res.status(statusCode).json({
    message: process.env.NODE_ENV === 'production'
      ? 'Ein Serverfehler ist aufgetreten'
      : err.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });
});

// Server starten
const PORT = process.env.PORT || 3500;

const server = app.listen(PORT, () => {
  logger.info(`ATLAS-Server gestartet auf Port ${PORT} im ${process.env.NODE_ENV || 'development'}-Modus`);
  logger.info(`API-Dokumentation verfügbar unter http://localhost:${PORT}/api`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    const altPort = 35002; // Fester alternativer Port
    logger.warn(`Port ${PORT} ist bereits belegt. Versuche Port ${altPort}...`);

    // Auf alternativen Port wechseln
    server.close();
    app.listen(altPort, () => {
      logger.info(`ATLAS-Server gestartet auf alternativem Port ${altPort} im ${process.env.NODE_ENV || 'development'}-Modus`);
      logger.info(`API-Dokumentation verfügbar unter http://localhost:${altPort}/api`);
    }).on('error', (err) => {
      logger.error(`Konnte Server nicht starten: ${err.message}`);
    });
  } else {
    logger.error(`Konnte Server nicht starten: ${err.message}`);
  }
});

// Unbehandelte Promise-Rejections abfangen
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unbehandelte Promise-Rejection', { reason, promise });
});

// Unbehandelte Exceptions abfangen
process.on('uncaughtException', (error) => {
  logger.error('Unbehandelte Exception', error);
  // Server sauber beenden
  process.exit(1);
});

// Graceful Shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM-Signal empfangen, Server wird beendet');
  app.close(() => {
    logger.info('Server beendet');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT-Signal empfangen, Server wird beendet');
  app.close(() => {
    logger.info('Server beendet');
    process.exit(0);
  });
});

module.exports = app; // Für Tests exportieren
