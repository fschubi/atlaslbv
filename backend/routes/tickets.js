const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const ticketController = require('../controllers/ticketController');
const { authMiddleware, checkRole } = require('../middleware/auth');

// GET /api/tickets - Alle Tickets abrufen (Paginiert & gefiltert)
router.get('/', authMiddleware, ticketController.getAllTickets);

// GET /api/tickets/stats - Ticket-Statistiken abrufen
router.get('/stats', [
  authMiddleware,
  checkRole(['admin', 'manager', 'support'])
], ticketController.getTicketStats);

// GET /api/tickets/:id - Ticket nach ID abrufen
router.get('/:id', authMiddleware, ticketController.getTicketById);

// POST /api/tickets - Neues Ticket erstellen
router.post('/',
  [
    authMiddleware,
    check('title', 'Titel ist erforderlich').not().isEmpty(),
    check('description', 'Beschreibung ist erforderlich').not().isEmpty(),
    check('category', 'Kategorie ist erforderlich').not().isEmpty(),
    check('priority').optional().isIn(['niedrig', 'mittel', 'hoch']),
    check('status').optional().isIn(['offen', 'in_bearbeitung', 'wartend', 'geschlossen']),
    check('due_date').optional().isISO8601()
  ],
  ticketController.createTicket
);

// PUT /api/tickets/:id - Ticket aktualisieren
router.put('/:id',
  [
    authMiddleware,
    check('title', 'Titel ist erforderlich').not().isEmpty(),
    check('description', 'Beschreibung ist erforderlich').not().isEmpty(),
    check('category', 'Kategorie ist erforderlich').not().isEmpty(),
    check('priority').isIn(['niedrig', 'mittel', 'hoch']),
    check('status').isIn(['offen', 'in_bearbeitung', 'wartend', 'geschlossen']),
    check('due_date').optional().isISO8601()
  ],
  ticketController.updateTicket
);

// DELETE /api/tickets/:id - Ticket löschen
router.delete('/:id', [
  authMiddleware,
  checkRole(['admin', 'manager', 'support'])
], ticketController.deleteTicket);

// POST /api/tickets/:id/comments - Kommentar zu einem Ticket hinzufügen
router.post('/:id/comments',
  [
    authMiddleware,
    check('content', 'Kommentarinhalt ist erforderlich').not().isEmpty()
  ],
  ticketController.addComment
);

// DELETE /api/tickets/comments/:commentId - Kommentar löschen
router.delete('/comments/:commentId', authMiddleware, ticketController.deleteComment);

// POST /api/tickets/:id/attachments - Dateianhang hochladen
router.post('/:id/attachments', authMiddleware, ticketController.uploadAttachment);

// GET /api/tickets/attachments/:attachmentId - Dateianhang herunterladen
router.get('/attachments/:attachmentId', authMiddleware, ticketController.downloadAttachment);

// DELETE /api/tickets/attachments/:attachmentId - Dateianhang löschen
router.delete('/attachments/:attachmentId', authMiddleware, ticketController.deleteAttachment);

// PATCH /api/tickets/:id/status - Ticket-Status ändern
router.patch('/:id/status',
  [
    authMiddleware,
    check('status', 'Status ist erforderlich').isIn(['offen', 'in_bearbeitung', 'wartend', 'geschlossen'])
  ],
  ticketController.changeTicketStatus
);

// PATCH /api/tickets/:id/assign - Ticket zuweisen
router.patch('/:id/assign',
  [
    authMiddleware,
    check('assigned_to').optional().isUUID()
  ],
  ticketController.assignTicket
);

module.exports = router;
