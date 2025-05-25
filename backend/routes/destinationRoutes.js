const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const oracledb = require('oracledb');
const multer = require('multer');
const db = require('../../db');
const uploadDir = path.join(__dirname, '../../uploads'); // Points to agency/uploads


// Configure Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `dest-${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

router.post('/', upload.single('destinationImage'), async (req, res) => {
  try {
    // 1. PROPERLY PARSE FORM DATA
    const formData = req.body;

    // 2. EXTRACT FIELDS WITH FALLBACKS
    const name = formData.destinationName;
    const country = formData.country;
    const description = formData.description;
    const status = formData.destinationStatus;

    // 3. VALIDATION
    if (!name || !country || !description || !status) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
        receivedFields: Object.keys(formData) // For debugging
      });
    }

    // 4. HANDLE FILE UPLOAD
    let imagePath = null;
    if (req.file) {
      imagePath = `/uploads/${req.file.filename}`;
    }

    // 5. DATABASE OPERATION
    const result = await db.executeQuery(
      `INSERT INTO DESTINATION (NAME, COUNTRY, DESCRIPTION, IMAGE_PATH, STATUS)
       VALUES (:name, :country, :description, :imagePath, :status)
       RETURNING ID INTO :id`,
      {
        name,
        country,
        description,
        imagePath: imagePath || null,
        status,
        id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
      }
    );

    // 6. SUCCESS RESPONSE
    res.status(201).json({
      success: true,
      destination: {
        id: result.outBinds.id[0],
        name,
        country,
        description,
        image_path: imagePath,
        status
      }
    });

  } catch (err) {
    console.error('COMPLETE ERROR LOG:', {
      error: err.message,
      stack: err.stack,
      body: req.body,
      file: req.file,
      headers: req.headers
    });

    res.status(500).json({
      success: false,
      message: 'Server error occurred',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Get all destinations
router.get('/', async (req, res) => {
  try {
    const result = await db.executeQuery(
      'SELECT * FROM destination ORDER BY created_at DESC'
    );
    res.json({ success: true, destinations: result.rows });
  } catch (err) {
    console.error('Error fetching destinations:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Add these routes to your server.js

// Update destination
router.put('/:id', upload.single('destinationImage'), async (req, res) => {
  try {
    const { id } = req.params;
    const { destinationName, country, description, destinationStatus } = req.body;
    const uploadDir = path.join(__dirname, '../../uploads');
    // 2. Ensure upload directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    // 3. Prepare update data
    const updateData = {
      NAME: destinationName,
      COUNTRY: country,
      DESCRIPTION: description,
      STATUS: destinationStatus
    };


    // Only handle image if new one was uploaded
    if (req.file) {
      updateData.IMAGE_PATH = `/uploads/${req.file.filename}`;

      // Delete old image if exists
      const oldResult = await db.executeQuery(
        'SELECT IMAGE_PATH FROM destination WHERE id = :id',
        { id }
      );
      if (oldResult.rows[0]?.IMAGE_PATH) {
        const oldPath = path.join(uploadDir, path.basename(oldResult.rows[0].IMAGE_PATH));
        try {
          await fs.promises.unlink(oldPath);
        } catch (err) {
          console.error('Error deleting old image:', err);
        }
      }
    }

    // Build the update query dynamically
    let updateQuery = 'UPDATE destination SET ';
    const bindVars = { id };
    let setClauses = [];

    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined) {
        setClauses.push(`${key.toUpperCase()} = :${key}`);
        bindVars[key] = value;
      }
    });

    updateQuery += setClauses.join(', ') + ' WHERE id = :id';

    await db.executeQuery(updateQuery, bindVars);

    // Return updated destination
    const updatedDest = await db.executeQuery(
      'SELECT * FROM destination WHERE id = :id',
      { id }
    );

    res.json({
      success: true,
      destination: updatedDest.rows[0]
    });

  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to update destination',
      error: err.message
    });
  }
});
// DELETE destination - /api/destinations/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // First get image path to delete the file
    const result = await db.executeQuery(
      'SELECT image_path FROM destination WHERE id = :id',
      { id }
    );

    if (result.rows[0]?.IMAGE_PATH) {
      const imagePath = path.join(__dirname, '..', '..', 'public', result.rows[0].IMAGE_PATH);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    // Then delete from database
    await db.executeQuery(
      'DELETE FROM destination WHERE id = :id',
      { id }
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Add this route to your destinations router (before module.exports)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.executeQuery(
      `SELECT id, name, country, description, 
              image_path as "imagePath", status 
       FROM destination 
       WHERE id = :id`,
      { id: Number(id) }  // Ensure ID is converted to NUMBER for Oracle
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Destination not found'
      });
    }

    res.json({
      success: true,
      destination: result.rows[0]
    });
  } catch (err) {
    console.error('Error fetching destination:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

module.exports = router;