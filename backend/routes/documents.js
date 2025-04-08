const express = require('express');
const { pool } = require('../db');
const logger = require('../utils/logger');

const router = express.Router();

// GET /api/documents
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM documents ORDER BY uploaded_at DESC');
    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/documents/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM documents WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error fetching document:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/documents
router.post('/', async (req, res) => {
  try {
    const {
      file_name,
      file_type,
      file_url,
      related_device_id,
      related_license_id,
      related_certificate_id,
      note
    } = req.body;

    const result = await pool.query(
      `INSERT INTO documents (
        file_name,
        file_type,
        file_url,
        related_device_id,
        related_license_id,
        related_certificate_id,
        note
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [file_name, file_type, file_url, related_device_id, related_license_id, related_certificate_id, note]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Error creating document:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/documents/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM documents WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    logger.error('Error deleting document:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
