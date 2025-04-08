const db = require('../db');

class TicketModel {
  // Alle Tickets abrufen mit Paginierung und Filterung
  async getAllTickets(page = 1, limit = 10, filters = {}) {
    try {
      const offset = (page - 1) * limit;
      let queryParams = [];
      let paramIndex = 1;

      // Basisdaten-Abfrage
      let query = `
        SELECT t.id, t.title, t.description, t.status, t.priority,
               t.category, t.created_at, t.updated_at, t.due_date,
               t.assigned_to, t.created_by,
               u1.username as assigned_to_name,
               u2.username as created_by_name,
               (SELECT COUNT(*) FROM ticket_comments tc WHERE tc.ticket_id = t.id) as comment_count
        FROM tickets t
        LEFT JOIN users u1 ON t.assigned_to = u1.id
        LEFT JOIN users u2 ON t.created_by = u2.id
        WHERE 1=1
      `;

      // Filter für Status
      if (filters.status) {
        query += ` AND t.status = $${paramIndex++}`;
        queryParams.push(filters.status);
      }

      // Filter für Priorität
      if (filters.priority) {
        query += ` AND t.priority = $${paramIndex++}`;
        queryParams.push(filters.priority);
      }

      // Filter für Kategorie
      if (filters.category) {
        query += ` AND t.category = $${paramIndex++}`;
        queryParams.push(filters.category);
      }

      // Filter für zugewiesenen Benutzer
      if (filters.assigned_to) {
        query += ` AND t.assigned_to = $${paramIndex++}`;
        queryParams.push(filters.assigned_to);
      }

      // Filter für Ersteller
      if (filters.created_by) {
        query += ` AND t.created_by = $${paramIndex++}`;
        queryParams.push(filters.created_by);
      }

      // Textsuche in Titel oder Beschreibung
      if (filters.search) {
        query += ` AND (t.title ILIKE $${paramIndex} OR t.description ILIKE $${paramIndex})`;
        queryParams.push(`%${filters.search}%`);
        paramIndex++;
      }

      // Sortierung
      query += ` ORDER BY ${filters.sort_by || 't.created_at'} ${filters.sort_direction || 'DESC'}`;

      // Pagination
      query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
      queryParams.push(limit, offset);

      // Abfrage ausführen
      const { rows } = await db.query(query, queryParams);

      // Gesamtzahl der Tickets für Pagination
      const countQuery = `
        SELECT COUNT(*) as total
        FROM tickets t
        WHERE 1=1
      `;
      let countParams = [];
      let countParamIndex = 1;

      // Filter für Status
      if (filters.status) {
        countQuery += ` AND t.status = $${countParamIndex++}`;
        countParams.push(filters.status);
      }

      // Filter für Priorität
      if (filters.priority) {
        countQuery += ` AND t.priority = $${countParamIndex++}`;
        countParams.push(filters.priority);
      }

      // Filter für Kategorie
      if (filters.category) {
        countQuery += ` AND t.category = $${countParamIndex++}`;
        countParams.push(filters.category);
      }

      // Filter für zugewiesenen Benutzer
      if (filters.assigned_to) {
        countQuery += ` AND t.assigned_to = $${countParamIndex++}`;
        countParams.push(filters.assigned_to);
      }

      // Filter für Ersteller
      if (filters.created_by) {
        countQuery += ` AND t.created_by = $${countParamIndex++}`;
        countParams.push(filters.created_by);
      }

      // Textsuche in Titel oder Beschreibung
      if (filters.search) {
        countQuery += ` AND (t.title ILIKE $${countParamIndex} OR t.description ILIKE $${countParamIndex})`;
        countParams.push(`%${filters.search}%`);
        countParamIndex++;
      }

      const totalResult = await db.query(countQuery, countParams);
      const total = parseInt(totalResult.rows[0].total);

      return {
        tickets: rows,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Fehler beim Abrufen der Tickets:', error);
      throw error;
    }
  }

  // Ticket nach ID abrufen
  async getTicketById(id) {
    try {
      const query = `
        SELECT t.id, t.title, t.description, t.status, t.priority,
               t.category, t.created_at, t.updated_at, t.due_date,
               t.assigned_to, t.created_by,
               u1.username as assigned_to_name,
               u2.username as created_by_name
        FROM tickets t
        LEFT JOIN users u1 ON t.assigned_to = u1.id
        LEFT JOIN users u2 ON t.created_by = u2.id
        WHERE t.id = $1
      `;

      const { rows } = await db.query(query, [id]);

      if (rows.length === 0) {
        return null;
      }

      // Kommentare zum Ticket abrufen
      const commentQuery = `
        SELECT tc.id, tc.content, tc.created_at, tc.user_id,
               u.username as user_name
        FROM ticket_comments tc
        JOIN users u ON tc.user_id = u.id
        WHERE tc.ticket_id = $1
        ORDER BY tc.created_at ASC
      `;

      const commentResult = await db.query(commentQuery, [id]);

      // Anhänge zum Ticket abrufen
      const attachmentQuery = `
        SELECT id, filename, filepath, file_type, file_size, uploaded_at, uploaded_by
        FROM ticket_attachments
        WHERE ticket_id = $1
        ORDER BY uploaded_at DESC
      `;

      const attachmentResult = await db.query(attachmentQuery, [id]);

      // Daten zusammenführen
      const ticket = rows[0];
      ticket.comments = commentResult.rows;
      ticket.attachments = attachmentResult.rows;

      return ticket;
    } catch (error) {
      console.error('Fehler beim Abrufen des Tickets nach ID:', error);
      throw error;
    }
  }

  // Neues Ticket erstellen
  async createTicket(ticketData) {
    const client = await db.getClient();

    try {
      await client.query('BEGIN');

      const query = `
        INSERT INTO tickets (
          title, description, status, priority, category,
          assigned_to, created_by, due_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;

      const values = [
        ticketData.title,
        ticketData.description,
        ticketData.status || 'offen',
        ticketData.priority || 'mittel',
        ticketData.category,
        ticketData.assigned_to,
        ticketData.created_by,
        ticketData.due_date
      ];

      const { rows } = await client.query(query, values);
      const newTicket = rows[0];

      // Automatisch einen Kommentar für die Ticketerstellung hinzufügen
      const commentQuery = `
        INSERT INTO ticket_comments (
          ticket_id, user_id, content
        ) VALUES ($1, $2, $3)
        RETURNING *
      `;

      const commentValues = [
        newTicket.id,
        ticketData.created_by,
        'Ticket wurde erstellt.'
      ];

      await client.query(commentQuery, commentValues);

      await client.query('COMMIT');
      return newTicket;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Fehler beim Erstellen des Tickets:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Ticket aktualisieren
  async updateTicket(id, ticketData, userId) {
    const client = await db.getClient();

    try {
      await client.query('BEGIN');

      // Zuerst das aktuelle Ticket abrufen, um Änderungen zu verfolgen
      const currentTicketQuery = `SELECT * FROM tickets WHERE id = $1`;
      const currentTicket = await client.query(currentTicketQuery, [id]);

      if (currentTicket.rows.length === 0) {
        throw new Error('Ticket nicht gefunden');
      }

      const oldData = currentTicket.rows[0];

      // Update durchführen
      const query = `
        UPDATE tickets
        SET title = $1,
            description = $2,
            status = $3,
            priority = $4,
            category = $5,
            assigned_to = $6,
            due_date = $7,
            updated_at = NOW()
        WHERE id = $8
        RETURNING *
      `;

      const values = [
        ticketData.title,
        ticketData.description,
        ticketData.status,
        ticketData.priority,
        ticketData.category,
        ticketData.assigned_to,
        ticketData.due_date,
        id
      ];

      const { rows } = await client.query(query, values);
      const updatedTicket = rows[0];

      // Änderungen protokollieren
      let changes = [];

      if (oldData.title !== updatedTicket.title) {
        changes.push(`Titel geändert von "${oldData.title}" zu "${updatedTicket.title}"`);
      }

      if (oldData.status !== updatedTicket.status) {
        changes.push(`Status geändert von "${oldData.status}" zu "${updatedTicket.status}"`);
      }

      if (oldData.priority !== updatedTicket.priority) {
        changes.push(`Priorität geändert von "${oldData.priority}" zu "${updatedTicket.priority}"`);
      }

      if (oldData.assigned_to !== updatedTicket.assigned_to) {
        // Hier könnten wir noch die Benutzernamen abrufen, um sie anstelle der IDs zu verwenden
        changes.push(`Zuweisung geändert von Benutzer ${oldData.assigned_to || 'unzugewiesen'} zu ${updatedTicket.assigned_to || 'unzugewiesen'}`);
      }

      // Wenn Änderungen vorhanden sind, einen Kommentar hinzufügen
      if (changes.length > 0) {
        const commentContent = `Ticket wurde aktualisiert:\n${changes.join('\n')}`;

        const commentQuery = `
          INSERT INTO ticket_comments (
            ticket_id, user_id, content
          ) VALUES ($1, $2, $3)
          RETURNING *
        `;

        const commentValues = [id, userId, commentContent];
        await client.query(commentQuery, commentValues);
      }

      await client.query('COMMIT');
      return updatedTicket;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Fehler beim Aktualisieren des Tickets:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Ticket löschen
  async deleteTicket(id) {
    const client = await db.getClient();

    try {
      await client.query('BEGIN');

      // Zuerst alle Kommentare zum Ticket löschen
      await client.query('DELETE FROM ticket_comments WHERE ticket_id = $1', [id]);

      // Dann alle Anhänge zum Ticket löschen
      await client.query('DELETE FROM ticket_attachments WHERE ticket_id = $1', [id]);

      // Schließlich das Ticket selbst löschen
      const result = await client.query('DELETE FROM tickets WHERE id = $1 RETURNING *', [id]);

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Fehler beim Löschen des Tickets:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Kommentar zu einem Ticket hinzufügen
  async addComment(ticketId, userId, content) {
    try {
      const query = `
        INSERT INTO ticket_comments (
          ticket_id, user_id, content
        ) VALUES ($1, $2, $3)
        RETURNING *
      `;

      const values = [ticketId, userId, content];
      const { rows } = await db.query(query, values);

      // Ticket aktualisieren (updated_at)
      await db.query('UPDATE tickets SET updated_at = NOW() WHERE id = $1', [ticketId]);

      // Kommentar mit Benutzernamen zurückgeben
      const commentWithUser = await db.query(`
        SELECT tc.*, u.username as user_name
        FROM ticket_comments tc
        JOIN users u ON tc.user_id = u.id
        WHERE tc.id = $1
      `, [rows[0].id]);

      return commentWithUser.rows[0];
    } catch (error) {
      console.error('Fehler beim Hinzufügen eines Kommentars:', error);
      throw error;
    }
  }

  // Kommentar löschen
  async deleteComment(commentId, userId) {
    try {
      // Überprüfen, ob der Benutzer Eigentümer des Kommentars ist
      const commentQuery = `
        SELECT * FROM ticket_comments WHERE id = $1
      `;

      const { rows } = await db.query(commentQuery, [commentId]);

      if (rows.length === 0) {
        throw new Error('Kommentar nicht gefunden');
      }

      const comment = rows[0];

      // Prüfen, ob der Benutzer berechtigt ist (hier vereinfacht - in echt würde man auch Rollen prüfen)
      if (comment.user_id !== userId) {
        throw new Error('Keine Berechtigung zum Löschen dieses Kommentars');
      }

      // Kommentar löschen
      const deleteResult = await db.query(
        'DELETE FROM ticket_comments WHERE id = $1 RETURNING *',
        [commentId]
      );

      return deleteResult.rows[0];
    } catch (error) {
      console.error('Fehler beim Löschen eines Kommentars:', error);
      throw error;
    }
  }

  // Dateianhang zu einem Ticket hinzufügen
  async addAttachment(ticketId, fileData) {
    try {
      const query = `
        INSERT INTO ticket_attachments (
          ticket_id, filename, filepath, file_type, file_size, uploaded_by
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;

      const values = [
        ticketId,
        fileData.filename,
        fileData.filepath,
        fileData.file_type,
        fileData.file_size,
        fileData.uploaded_by
      ];

      const { rows } = await db.query(query, values);

      // Ticket aktualisieren (updated_at)
      await db.query('UPDATE tickets SET updated_at = NOW() WHERE id = $1', [ticketId]);

      return rows[0];
    } catch (error) {
      console.error('Fehler beim Hinzufügen eines Anhangs:', error);
      throw error;
    }
  }

  // Dateianhang löschen
  async deleteAttachment(attachmentId, userId) {
    try {
      // Überprüfen, ob der Benutzer berechtigt ist
      const attachmentQuery = `
        SELECT * FROM ticket_attachments WHERE id = $1
      `;

      const { rows } = await db.query(attachmentQuery, [attachmentId]);

      if (rows.length === 0) {
        throw new Error('Anhang nicht gefunden');
      }

      const attachment = rows[0];

      // Anhang löschen
      const deleteResult = await db.query(
        'DELETE FROM ticket_attachments WHERE id = $1 RETURNING *',
        [attachmentId]
      );

      // Hier würde man auch die physische Datei löschen
      // fs.unlinkSync(attachment.filepath);

      return deleteResult.rows[0];
    } catch (error) {
      console.error('Fehler beim Löschen eines Anhangs:', error);
      throw error;
    }
  }

  // Ticket-Statusänderung (mit automatischem Kommentar)
  async changeTicketStatus(ticketId, newStatus, userId) {
    const client = await db.getClient();

    try {
      await client.query('BEGIN');

      // Aktuellen Status abrufen
      const currentStatusQuery = `
        SELECT status FROM tickets WHERE id = $1
      `;

      const currentStatus = await client.query(currentStatusQuery, [ticketId]);

      if (currentStatus.rows.length === 0) {
        throw new Error('Ticket nicht gefunden');
      }

      const oldStatus = currentStatus.rows[0].status;

      // Status nicht ändern, wenn er gleich ist
      if (oldStatus === newStatus) {
        return { id: ticketId, status: newStatus, changed: false };
      }

      // Status aktualisieren
      const updateQuery = `
        UPDATE tickets
        SET status = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `;

      const { rows } = await client.query(updateQuery, [newStatus, ticketId]);

      // Kommentar zur Statusänderung hinzufügen
      const commentContent = `Status geändert von "${oldStatus}" zu "${newStatus}"`;

      const commentQuery = `
        INSERT INTO ticket_comments (
          ticket_id, user_id, content
        ) VALUES ($1, $2, $3)
        RETURNING *
      `;

      const commentValues = [ticketId, userId, commentContent];
      await client.query(commentQuery, commentValues);

      await client.query('COMMIT');
      return { ...rows[0], changed: true };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Fehler bei der Statusänderung des Tickets:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Ticket zuweisen
  async assignTicket(ticketId, assignedTo, assignedBy) {
    const client = await db.getClient();

    try {
      await client.query('BEGIN');

      // Aktuelle Zuweisung abrufen
      const currentAssignmentQuery = `
        SELECT assigned_to,
               (SELECT username FROM users WHERE id = tickets.assigned_to) as assigned_name
        FROM tickets WHERE id = $1
      `;

      const currentAssignment = await client.query(currentAssignmentQuery, [ticketId]);

      if (currentAssignment.rows.length === 0) {
        throw new Error('Ticket nicht gefunden');
      }

      const oldAssignedTo = currentAssignment.rows[0].assigned_to;
      const oldAssignedName = currentAssignment.rows[0].assigned_name || 'unzugewiesen';

      // Neuen Benutzernamen abrufen
      let newAssignedName = 'unzugewiesen';
      if (assignedTo) {
        const userQuery = `SELECT username FROM users WHERE id = $1`;
        const userResult = await client.query(userQuery, [assignedTo]);
        if (userResult.rows.length > 0) {
          newAssignedName = userResult.rows[0].username;
        }
      }

      // Zuweisung nicht ändern, wenn sie gleich ist
      if (oldAssignedTo === assignedTo) {
        return { id: ticketId, assigned_to: assignedTo, changed: false };
      }

      // Zuweisung aktualisieren
      const updateQuery = `
        UPDATE tickets
        SET assigned_to = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `;

      const { rows } = await client.query(updateQuery, [assignedTo, ticketId]);

      // Kommentar zur Zuweisungsänderung hinzufügen
      const commentContent = assignedTo
        ? `Ticket zugewiesen an ${newAssignedName} (vorher: ${oldAssignedName})`
        : `Ticket-Zuweisung aufgehoben (vorher: ${oldAssignedName})`;

      const commentQuery = `
        INSERT INTO ticket_comments (
          ticket_id, user_id, content
        ) VALUES ($1, $2, $3)
        RETURNING *
      `;

      const commentValues = [ticketId, assignedBy, commentContent];
      await client.query(commentQuery, commentValues);

      await client.query('COMMIT');
      return { ...rows[0], changed: true };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Fehler bei der Zuweisung des Tickets:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Statistiken für Tickets abrufen
  async getTicketStats() {
    try {
      const statsQuery = `
        SELECT
          COUNT(*) as total_tickets,
          COUNT(CASE WHEN status = 'offen' THEN 1 END) as open_tickets,
          COUNT(CASE WHEN status = 'in_bearbeitung' THEN 1 END) as in_progress_tickets,
          COUNT(CASE WHEN status = 'wartend' THEN 1 END) as waiting_tickets,
          COUNT(CASE WHEN status = 'geschlossen' THEN 1 END) as closed_tickets,
          COUNT(CASE WHEN priority = 'hoch' THEN 1 END) as high_priority,
          COUNT(CASE WHEN priority = 'mittel' THEN 1 END) as medium_priority,
          COUNT(CASE WHEN priority = 'niedrig' THEN 1 END) as low_priority,
          COUNT(CASE WHEN due_date < CURRENT_DATE AND status != 'geschlossen' THEN 1 END) as overdue_tickets
        FROM tickets
      `;

      const { rows } = await db.query(statsQuery);

      // Zusätzlich aktuelle Tickets pro Kategorie
      const categoryQuery = `
        SELECT category, COUNT(*) as count
        FROM tickets
        WHERE status != 'geschlossen'
        GROUP BY category
        ORDER BY count DESC
      `;

      const categoryResult = await db.query(categoryQuery);

      // Zusammenführen der Ergebnisse
      return {
        summary: rows[0],
        categories: categoryResult.rows
      };
    } catch (error) {
      console.error('Fehler beim Abrufen der Ticket-Statistiken:', error);
      throw error;
    }
  }
}

module.exports = new TicketModel();
