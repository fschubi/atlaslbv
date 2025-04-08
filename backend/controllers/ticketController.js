const ticketModel = require('../models/ticketModel');
const db = require('../db');
const { validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');
const { pool } = require('../db');

// Konfiguration für den Datei-Upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'attachments');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  }
});

const fileFilter = (req, file, cb) => {
  // Erlaubte Dateiendungen
  const allowedFileTypes = ['.jpg', '.jpeg', '.png', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.zip'];
  const extension = path.extname(file.originalname).toLowerCase();

  if (allowedFileTypes.includes(extension)) {
    cb(null, true);
  } else {
    cb(new Error('Ungültiger Dateityp! Nur ' + allowedFileTypes.join(', ') + ' sind erlaubt.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
  fileFilter: fileFilter
});

// Simulierte Ticket-Daten
const mockTickets = [
  {
    id: '1',
    title: 'Server reagiert nicht',
    description: 'Der Hauptserver im Serverraum antwortet nicht mehr auf Anfragen.',
    category: 'Hardware',
    priority: 3, // Hoch
    status: 'Offen',
    device: 'SRV001',
    created_by: 'Max Mustermann',
    assigned_to: 'Thomas Schmidt',
    created_at: '2023-11-25T14:00:00Z',
    updated_at: '2023-11-25T14:00:00Z',
    comments: [
      {
        id: '101',
        content: 'Habe den Server neu gestartet, Problem besteht weiterhin.',
        user: 'Thomas Schmidt',
        created_at: '2023-11-25T15:30:00Z'
      }
    ],
    attachments: []
  },
  {
    id: '2',
    title: 'Benutzer kann sich nicht anmelden',
    description: 'Ein Benutzer in der Buchhaltung kann sich nicht am System anmelden, trotz korrektem Passwort.',
    category: 'Zugriffsrechte',
    priority: 2, // Mittel
    status: 'In Bearbeitung',
    device: '',
    created_by: 'Lisa Müller',
    assigned_to: 'Max Mustermann',
    created_at: '2023-11-28T09:15:00Z',
    updated_at: '2023-11-28T10:30:00Z',
    comments: [],
    attachments: []
  },
  {
    id: '3',
    title: 'Neue Software benötigt',
    description: 'Für die Marketingabteilung wird Adobe Creative Cloud auf 3 Workstations benötigt.',
    category: 'Software',
    priority: 1, // Niedrig
    status: 'Warten auf Antwort',
    device: '',
    created_by: 'Thomas Schmidt',
    assigned_to: 'Lisa Müller',
    created_at: '2023-11-30T11:45:00Z',
    updated_at: '2023-11-30T13:20:00Z',
    comments: [
      {
        id: '102',
        content: 'Lizenzen wurden bestellt, warte auf Bestätigung vom Management.',
        user: 'Lisa Müller',
        created_at: '2023-11-30T13:20:00Z'
      }
    ],
    attachments: []
  },
  {
    id: '4',
    title: 'Netzwerkdrucker funktioniert nicht',
    description: 'Der Netzwerkdrucker im 2. OG druckt keine Dokumente mehr aus.',
    category: 'Hardware',
    priority: 2, // Mittel
    status: 'Gelöst',
    device: 'PRN002',
    created_by: 'Max Mustermann',
    assigned_to: 'Thomas Schmidt',
    created_at: '2023-12-01T08:30:00Z',
    updated_at: '2023-12-01T10:45:00Z',
    comments: [
      {
        id: '103',
        content: 'Druckerwarteschlange war blockiert. Problem behoben.',
        user: 'Thomas Schmidt',
        created_at: '2023-12-01T10:45:00Z'
      }
    ],
    attachments: []
  },
  {
    id: '5',
    title: 'VPN-Verbindung instabil',
    description: 'Mehrere Mitarbeiter berichten von Problemen mit der VPN-Verbindung im Homeoffice.',
    category: 'Netzwerk',
    priority: 3, // Hoch
    status: 'In Bearbeitung',
    device: '',
    created_by: 'Lisa Müller',
    assigned_to: 'Max Mustermann',
    created_at: '2023-12-02T13:20:00Z',
    updated_at: '2023-12-02T14:30:00Z',
    comments: [
      {
        id: '104',
        content: 'Überprüfe die VPN-Server-Konfiguration.',
        user: 'Max Mustermann',
        created_at: '2023-12-02T14:30:00Z'
      }
    ],
    attachments: []
  }
];

// Zähler für neue IDs
let nextTicketId = 6;
let nextCommentId = 105;
let nextAttachmentId = 1;

const ticketController = {
  /**
   * Alle Tickets abrufen (mit Paginierung und Filterung)
   */
  getAllTickets: async (req, res) => {
    try {
      logger.info('Anfrage: Alle Tickets abrufen');

      // Simulierte Verzögerung
      await new Promise(resolve => setTimeout(resolve, 300));

      // Filter extrahieren
      const {
        search, status, priority, category,
        assigned_to, created_by, device,
        page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'desc'
      } = req.query;

      // Tickets filtern
      let filteredTickets = [...mockTickets];

      if (search) {
        const searchLower = search.toLowerCase();
        filteredTickets = filteredTickets.filter(ticket =>
          ticket.title.toLowerCase().includes(searchLower) ||
          ticket.description.toLowerCase().includes(searchLower) ||
          ticket.device.toLowerCase().includes(searchLower)
        );
      }

      if (status) {
        filteredTickets = filteredTickets.filter(ticket => ticket.status === status);
      }

      if (priority) {
        filteredTickets = filteredTickets.filter(ticket => ticket.priority === parseInt(priority));
      }

      if (category) {
        filteredTickets = filteredTickets.filter(ticket => ticket.category === category);
      }

      if (assigned_to) {
        filteredTickets = filteredTickets.filter(ticket => ticket.assigned_to === assigned_to);
      }

      if (created_by) {
        filteredTickets = filteredTickets.filter(ticket => ticket.created_by === created_by);
      }

      if (device) {
        filteredTickets = filteredTickets.filter(ticket => ticket.device === device);
      }

      // Sortieren
      filteredTickets.sort((a, b) => {
        if (sortBy === 'created_at') {
          return sortOrder === 'asc'
            ? new Date(a.created_at) - new Date(b.created_at)
            : new Date(b.created_at) - new Date(a.created_at);
        } else if (sortBy === 'updated_at') {
          return sortOrder === 'asc'
            ? new Date(a.updated_at) - new Date(b.updated_at)
            : new Date(b.updated_at) - new Date(a.updated_at);
        } else if (sortBy === 'priority') {
          return sortOrder === 'asc'
            ? a.priority - b.priority
            : b.priority - a.priority;
        }
        // Standardsortierung nach Titel
        return sortOrder === 'asc'
          ? a.title.localeCompare(b.title)
          : b.title.localeCompare(a.title);
      });

      // Paginierung
      const startIdx = (page - 1) * limit;
      const paginatedTickets = filteredTickets.slice(startIdx, startIdx + parseInt(limit));

      res.json({
        data: paginatedTickets,
        pagination: {
          total: filteredTickets.length,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(filteredTickets.length / limit)
        }
      });
    } catch (error) {
      logger.error('Fehler beim Abrufen der Tickets:', error);
      res.status(500).json({ message: 'Serverfehler beim Abrufen der Tickets' });
    }
  },

  /**
   * Ticket nach ID abrufen
   */
  getTicketById: async (req, res) => {
    try {
      const { id } = req.params;

      // Simulierte Verzögerung
      await new Promise(resolve => setTimeout(resolve, 200));

      const ticket = mockTickets.find(t => t.id === id);

      if (!ticket) {
        return res.status(404).json({ message: 'Ticket nicht gefunden' });
      }

      res.json({ data: ticket });
    } catch (error) {
      logger.error(`Fehler beim Abrufen des Tickets mit ID ${req.params.id}:`, error);
      res.status(500).json({ message: 'Serverfehler beim Abrufen des Tickets' });
    }
  },

  /**
   * Neues Ticket erstellen
   */
  createTicket: async (req, res) => {
    try {
      // Validierungsfehler prüfen
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validierungsfehler', errors: errors.array() });
      }

      // Simulierte Verzögerung
      await new Promise(resolve => setTimeout(resolve, 300));

      const {
        title, description, category, priority = 2,
        status = 'Offen', device = '', assigned_to = ''
      } = req.body;

      // Erstelle neues Ticket
      const newTicket = {
        id: String(nextTicketId++),
        title,
        description,
        category,
        priority: typeof priority === 'string' ? parseInt(priority) : priority,
        status,
        device,
        created_by: req.user?.username || 'Unbekannter Benutzer',
        assigned_to,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        comments: [],
        attachments: []
      };

      // Füge das Ticket zur simulierten Datenbank hinzu
      mockTickets.push(newTicket);

      res.status(201).json({
        message: 'Ticket erfolgreich erstellt',
        data: newTicket
      });
    } catch (error) {
      logger.error('Fehler beim Erstellen des Tickets:', error);
      res.status(500).json({ message: 'Serverfehler beim Erstellen des Tickets' });
    }
  },

  /**
   * Ticket aktualisieren
   */
  updateTicket: async (req, res) => {
    try {
      // Validierungsfehler prüfen
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validierungsfehler', errors: errors.array() });
      }

      const { id } = req.params;

      // Simulierte Verzögerung
      await new Promise(resolve => setTimeout(resolve, 300));

      // Finde Ticket-Index
      const ticketIndex = mockTickets.findIndex(t => t.id === id);

      if (ticketIndex === -1) {
        return res.status(404).json({ message: 'Ticket nicht gefunden' });
      }

      const {
        title, description, category, priority,
        status, device, assigned_to
      } = req.body;

      // Aktualisiere das Ticket
      const updatedTicket = {
        ...mockTickets[ticketIndex],
        title,
        description,
        category,
        priority: typeof priority === 'string' ? parseInt(priority) : priority,
        status,
        device,
        assigned_to,
        updated_at: new Date().toISOString()
      };

      // Speichere das aktualisierte Ticket
      mockTickets[ticketIndex] = updatedTicket;

      res.json({
        message: 'Ticket erfolgreich aktualisiert',
        data: updatedTicket
      });
    } catch (error) {
      logger.error(`Fehler beim Aktualisieren des Tickets mit ID ${req.params.id}:`, error);
      res.status(500).json({ message: 'Serverfehler beim Aktualisieren des Tickets' });
    }
  },

  /**
   * Ticket löschen
   */
  deleteTicket: async (req, res) => {
    try {
      const { id } = req.params;

      // Simulierte Verzögerung
      await new Promise(resolve => setTimeout(resolve, 200));

      // Finde Ticket-Index
      const ticketIndex = mockTickets.findIndex(t => t.id === id);

      if (ticketIndex === -1) {
        return res.status(404).json({ message: 'Ticket nicht gefunden' });
      }

      // Lösche das Ticket
      mockTickets.splice(ticketIndex, 1);

      res.json({ message: 'Ticket erfolgreich gelöscht' });
    } catch (error) {
      logger.error(`Fehler beim Löschen des Tickets mit ID ${req.params.id}:`, error);
      res.status(500).json({ message: 'Serverfehler beim Löschen des Tickets' });
    }
  },

  /**
   * Kommentar zu einem Ticket hinzufügen
   */
  addComment: async (req, res) => {
    try {
      // Validierungsfehler prüfen
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validierungsfehler', errors: errors.array() });
      }

      const { id } = req.params;
      const { content } = req.body;

      // Simulierte Verzögerung
      await new Promise(resolve => setTimeout(resolve, 200));

      // Finde Ticket-Index
      const ticketIndex = mockTickets.findIndex(t => t.id === id);

      if (ticketIndex === -1) {
        return res.status(404).json({ message: 'Ticket nicht gefunden' });
      }

      // Erstelle neuen Kommentar
      const newComment = {
        id: String(nextCommentId++),
        content,
        user: req.user?.username || 'Unbekannter Benutzer',
        created_at: new Date().toISOString()
      };

      // Füge Kommentar zum Ticket hinzu
      mockTickets[ticketIndex].comments.push(newComment);
      mockTickets[ticketIndex].updated_at = new Date().toISOString();

      res.status(201).json({
        message: 'Kommentar erfolgreich hinzugefügt',
        data: newComment
      });
    } catch (error) {
      logger.error(`Fehler beim Hinzufügen eines Kommentars zum Ticket mit ID ${req.params.id}:`, error);
      res.status(500).json({ message: 'Serverfehler beim Hinzufügen des Kommentars' });
    }
  },

  /**
   * Kommentar löschen
   */
  deleteComment: async (req, res) => {
    try {
      const { commentId } = req.params;

      // Simulierte Verzögerung
      await new Promise(resolve => setTimeout(resolve, 200));

      // Finde Ticket mit diesem Kommentar
      let foundTicket = null;
      let commentIndex = -1;

      for (const ticket of mockTickets) {
        commentIndex = ticket.comments.findIndex(c => c.id === commentId);
        if (commentIndex !== -1) {
          foundTicket = ticket;
          break;
        }
      }

      if (!foundTicket || commentIndex === -1) {
        return res.status(404).json({ message: 'Kommentar nicht gefunden' });
      }

      // Lösche den Kommentar
      foundTicket.comments.splice(commentIndex, 1);
      foundTicket.updated_at = new Date().toISOString();

      res.json({ message: 'Kommentar erfolgreich gelöscht' });
    } catch (error) {
      logger.error(`Fehler beim Löschen des Kommentars mit ID ${req.params.commentId}:`, error);
      res.status(500).json({ message: 'Serverfehler beim Löschen des Kommentars' });
    }
  },

  /**
   * Dateianhang hochladen (Dummy-Implementierung)
   */
  uploadAttachment: async (req, res) => {
    try {
      const { id } = req.params;

      // Simulierte Verzögerung
      await new Promise(resolve => setTimeout(resolve, 300));

      const ticketIndex = mockTickets.findIndex(t => t.id === id);

      if (ticketIndex === -1) {
        return res.status(404).json({ message: 'Ticket nicht gefunden' });
      }

      // Im echten System würde hier die Datei verarbeitet werden
      // Für das Mock erstellen wir einen simulierten Anhang
      const mockAttachment = {
        id: String(nextAttachmentId++),
        filename: req.body.filename || `attachment_${Date.now()}.pdf`,
        filepath: `/uploads/tickets/${id}/${Date.now()}_${req.body.filename || 'attachment.pdf'}`,
        file_type: req.body.file_type || 'application/pdf',
        file_size: req.body.file_size || 1024 * 1024, // 1MB als Beispiel
        uploaded_at: new Date().toISOString(),
        uploaded_by: req.user?.username || 'Unbekannter Benutzer'
      };

      // Anhang zum Ticket hinzufügen
      if (!mockTickets[ticketIndex].attachments) {
        mockTickets[ticketIndex].attachments = [];
      }

      mockTickets[ticketIndex].attachments.push(mockAttachment);
      mockTickets[ticketIndex].updated_at = new Date().toISOString();

      res.status(201).json({
        message: 'Dateianhang erfolgreich hochgeladen',
        data: mockAttachment
      });
    } catch (error) {
      logger.error(`Fehler beim Hochladen eines Anhangs zum Ticket mit ID ${req.params.id}:`, error);
      res.status(500).json({ message: 'Serverfehler beim Hochladen des Anhangs' });
    }
  },

  /**
   * Dateianhang herunterladen (Dummy-Implementierung)
   */
  downloadAttachment: async (req, res) => {
    try {
      const { attachmentId } = req.params;

      // Simulierte Verzögerung
      await new Promise(resolve => setTimeout(resolve, 200));

      // Finde Ticket mit diesem Anhang
      let foundAttachment = null;
      let ticketId = null;

      for (const ticket of mockTickets) {
        if (ticket.attachments) {
          const attachment = ticket.attachments.find(a => a.id === attachmentId);
          if (attachment) {
            foundAttachment = attachment;
            ticketId = ticket.id;
            break;
          }
        }
      }

      if (!foundAttachment) {
        return res.status(404).json({ message: 'Dateianhang nicht gefunden' });
      }

      // In einer echten Anwendung würden wir hier die Datei zurückgeben
      // Für das Mock senden wir nur die Metadaten
      res.json({
        message: 'Diese Funktion würde in einer echten Anwendung die Datei herunterladen',
        data: {
          attachment: foundAttachment,
          ticket_id: ticketId
        }
      });
    } catch (error) {
      logger.error(`Fehler beim Herunterladen des Anhangs mit ID ${req.params.attachmentId}:`, error);
      res.status(500).json({ message: 'Serverfehler beim Herunterladen des Anhangs' });
    }
  },

  /**
   * Dateianhang löschen
   */
  deleteAttachment: async (req, res) => {
    try {
      const { attachmentId } = req.params;

      // Simulierte Verzögerung
      await new Promise(resolve => setTimeout(resolve, 200));

      // Finde Ticket mit diesem Anhang
      let foundTicket = null;
      let attachmentIndex = -1;

      for (const ticket of mockTickets) {
        if (ticket.attachments) {
          attachmentIndex = ticket.attachments.findIndex(a => a.id === attachmentId);
          if (attachmentIndex !== -1) {
            foundTicket = ticket;
            break;
          }
        }
      }

      if (!foundTicket || attachmentIndex === -1) {
        return res.status(404).json({ message: 'Dateianhang nicht gefunden' });
      }

      // Lösche den Anhang
      foundTicket.attachments.splice(attachmentIndex, 1);
      foundTicket.updated_at = new Date().toISOString();

      res.json({ message: 'Dateianhang erfolgreich gelöscht' });
    } catch (error) {
      logger.error(`Fehler beim Löschen des Anhangs mit ID ${req.params.attachmentId}:`, error);
      res.status(500).json({ message: 'Serverfehler beim Löschen des Anhangs' });
    }
  },

  /**
   * Ticket-Status ändern
   */
  changeTicketStatus: async (req, res) => {
    try {
      // Validierungsfehler prüfen
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validierungsfehler', errors: errors.array() });
      }

      const { id } = req.params;
      const { status } = req.body;

      // Simulierte Verzögerung
      await new Promise(resolve => setTimeout(resolve, 200));

      // Finde Ticket-Index
      const ticketIndex = mockTickets.findIndex(t => t.id === id);

      if (ticketIndex === -1) {
        return res.status(404).json({ message: 'Ticket nicht gefunden' });
      }

      // Aktualisiere den Status
      mockTickets[ticketIndex].status = status;
      mockTickets[ticketIndex].updated_at = new Date().toISOString();

      res.json({
        message: 'Status erfolgreich geändert',
        data: mockTickets[ticketIndex]
      });
    } catch (error) {
      logger.error(`Fehler beim Ändern des Status für Ticket mit ID ${req.params.id}:`, error);
      res.status(500).json({ message: 'Serverfehler beim Ändern des Ticket-Status' });
    }
  },

  /**
   * Ticket zuweisen
   */
  assignTicket: async (req, res) => {
    try {
      const { id } = req.params;
      const { assigned_to } = req.body;

      // Simulierte Verzögerung
      await new Promise(resolve => setTimeout(resolve, 200));

      // Finde Ticket-Index
      const ticketIndex = mockTickets.findIndex(t => t.id === id);

      if (ticketIndex === -1) {
        return res.status(404).json({ message: 'Ticket nicht gefunden' });
      }

      // Aktualisiere die Zuweisung
      mockTickets[ticketIndex].assigned_to = assigned_to || '';
      mockTickets[ticketIndex].updated_at = new Date().toISOString();

      res.json({
        message: assigned_to ? 'Ticket erfolgreich zugewiesen' : 'Ticket-Zuweisung aufgehoben',
        data: mockTickets[ticketIndex]
      });
    } catch (error) {
      logger.error(`Fehler beim Zuweisen des Tickets mit ID ${req.params.id}:`, error);
      res.status(500).json({ message: 'Serverfehler beim Zuweisen des Tickets' });
    }
  },

  /**
   * Ticket-Statistiken abrufen
   */
  getTicketStats: async (req, res) => {
    try {
      // Simulierte Verzögerung
      await new Promise(resolve => setTimeout(resolve, 200));

      // Berechne Statistiken
      const totalTickets = mockTickets.length;
      const openTickets = mockTickets.filter(t => t.status === 'Offen').length;
      const inProgressTickets = mockTickets.filter(t => t.status === 'In Bearbeitung').length;
      const waitingTickets = mockTickets.filter(t => t.status === 'Warten auf Antwort').length;
      const solvedTickets = mockTickets.filter(t => t.status === 'Gelöst').length;
      const closedTickets = mockTickets.filter(t => t.status === 'Geschlossen').length;

      const highPriorityTickets = mockTickets.filter(t => t.priority === 3).length;
      const mediumPriorityTickets = mockTickets.filter(t => t.priority === 2).length;
      const lowPriorityTickets = mockTickets.filter(t => t.priority === 1).length;

      // Berechne Kategorie-Verteilung
      const categories = {};
      mockTickets.forEach(ticket => {
        if (!categories[ticket.category]) {
          categories[ticket.category] = 1;
        } else {
          categories[ticket.category]++;
        }
      });

      // Berechne Durchschnittszeit für gelöste Tickets (fiktives Beispiel)
      const avgResolutionTimeHours = 24.5;

      res.json({
        total: totalTickets,
        by_status: {
          open: openTickets,
          in_progress: inProgressTickets,
          waiting: waitingTickets,
          solved: solvedTickets,
          closed: closedTickets
        },
        by_priority: {
          high: highPriorityTickets,
          medium: mediumPriorityTickets,
          low: lowPriorityTickets
        },
        by_category: categories,
        performance: {
          avg_resolution_time_hours: avgResolutionTimeHours
        }
      });
    } catch (error) {
      logger.error('Fehler beim Abrufen der Ticket-Statistiken:', error);
      res.status(500).json({ message: 'Serverfehler beim Abrufen der Ticket-Statistiken' });
    }
  }
};

module.exports = ticketController;
