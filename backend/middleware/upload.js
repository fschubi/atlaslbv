const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

// Stellen Sie sicher, dass der Upload-Ordner existiert
const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Unterverzeichnisse für verschiedene Upload-Typen
const deviceUploadsDir = path.join(uploadDir, 'devices');
const userUploadsDir = path.join(uploadDir, 'users');
const docsUploadsDir = path.join(uploadDir, 'documents');

// Stelle sicher, dass alle Unterverzeichnisse existieren
[deviceUploadsDir, userUploadsDir, docsUploadsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Speicheroptionen konfigurieren
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Verzeichnis basierend auf Upload-Typ auswählen
    let uploadPath = uploadDir;

    if (req.uploadType === 'device' || req.path.includes('/devices')) {
      uploadPath = deviceUploadsDir;
    } else if (req.uploadType === 'user' || req.path.includes('/users')) {
      uploadPath = userUploadsDir;
    } else if (req.uploadType === 'document' || req.path.includes('/documents')) {
      uploadPath = docsUploadsDir;
    }

    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generiere eindeutigen Dateinamen, behalte die Dateierweiterung bei
    const fileExt = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExt}`;
    cb(null, fileName);
  }
});

// Filteroptionen für Dateitypen
const fileFilter = (req, file, cb) => {
  // Akzeptiere nur bestimmte Dateitypen
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unzulässiger Dateityp: ${file.mimetype}`), false);
  }
};

// Multer-Upload-Konfiguration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB Maximalgröße
  }
});

// Fehlerbehandlung für Upload-Fehler
const handleUpload = (fieldName) => {
  return (req, res, next) => {
    const uploadMiddleware = upload.single(fieldName);

    uploadMiddleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        // Multer-Fehler (z.B. zu große Datei)
        logger.error(`Multer-Upload-Fehler: ${err.message}`);
        return res.status(400).json({
          message: 'Upload-Fehler',
          error: err.message
        });
      } else if (err) {
        // Andere Fehler (z.B. falscher Dateityp)
        logger.error(`Upload-Fehler: ${err.message}`);
        return res.status(400).json({
          message: 'Upload-Fehler',
          error: err.message
        });
      }

      // Upload erfolgreich
      if (req.file) {
        // Füge Dateiinformationen für spätere Verwendung hinzu
        req.uploadedFile = {
          filename: req.file.filename,
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          path: req.file.path,
          url: `/uploads/${path.basename(path.dirname(req.file.path))}/${req.file.filename}`
        };
      }

      next();
    });
  };
};

// Multipler Upload für mehrere Dateien
const handleMultipleUploads = (fieldName, maxCount = 5) => {
  return (req, res, next) => {
    const uploadMiddleware = upload.array(fieldName, maxCount);

    uploadMiddleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        logger.error(`Multer-Upload-Fehler: ${err.message}`);
        return res.status(400).json({
          message: 'Upload-Fehler',
          error: err.message
        });
      } else if (err) {
        logger.error(`Upload-Fehler: ${err.message}`);
        return res.status(400).json({
          message: 'Upload-Fehler',
          error: err.message
        });
      }

      // Upload erfolgreich
      if (req.files && req.files.length > 0) {
        // Füge Dateiinformationen für spätere Verwendung hinzu
        req.uploadedFiles = req.files.map(file => ({
          filename: file.filename,
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          path: file.path,
          url: `/uploads/${path.basename(path.dirname(file.path))}/${file.filename}`
        }));
      }

      next();
    });
  };
};

// Hilfsfunktion zum Löschen einer Datei
const deleteFile = async (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logger.info(`Datei gelöscht: ${filePath}`);
      return true;
    } else {
      logger.warn(`Datei nicht gefunden: ${filePath}`);
      return false;
    }
  } catch (error) {
    logger.error(`Fehler beim Löschen der Datei ${filePath}:`, error);
    return false;
  }
};

module.exports = {
  handleUpload,
  handleMultipleUploads,
  deleteFile,
  UPLOAD_DIRS: {
    DEVICE: deviceUploadsDir,
    USER: userUploadsDir,
    DOCUMENT: docsUploadsDir
  }
};
