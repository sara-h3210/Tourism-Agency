const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const oracledb = require('oracledb');
const multer = require('multer');
const db = require('../../db');
const uploadDir = path.join(__dirname, '../../uploads'); // Points to agency/uploads

// Protect all tour routes


// Configure Multers
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

// POST - Create a new package
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const agency_id = req.body.agency_id || 1; // Fallback to agency_id=1
    const formData = req.body;

    const title = formData.title;
    const destination = formData.destination;
    const itinerary = formData.itinerary;
    const duration = formData.duration;
    const price = formData.price;
    const slots_available = formData.slots_available;
    const description = formData.description;

    // 3. Validation (all required fields)
    if (!title || !destination || !itinerary ||
      !duration || !price || !slots_available || !description) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
        receivedFields: Object.keys(formData)
      });
    }

    // 4. Handle file upload
    let imagePath = null;
    if (req.file) {
      imagePath = `/uploads/${req.file.filename}`;
    }

    // 5. Database operation (using RETURNING ID like destinationRoutes)
    const result = await db.executeQuery(
      `INSERT INTO package (
        agency_id, title, destination, itinerary, 
        duration, price, slots_available, description, image_path
      ) VALUES (
        :agency_id, :title, :destination, :itinerary, 
        :duration, :price, :slots_available, :description, :imagePath
      ) RETURNING package_id INTO :id`,
      {
        agency_id,
        title,
        destination,
        itinerary,
        duration,
        price,
        slots_available,
        description,
        imagePath: imagePath || null,
        id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
      }
    );

    // 6. Success response (consistent structure)
    res.status(201).json({
      success: true,
      package: {
        package_id: result.outBinds.id[0],
        agency_id,
        title,
        destination,
        itinerary,
        duration,
        price,
        slots_available,
        description,
        image_path: imagePath
      }
    });

  } catch (err) {
    console.error('Error creating package:', {
      error: err.message,
      stack: err.stack,
      body: req.body,
      file: req.file
    });

    res.status(500).json({
      success: false,
      message: 'Server error occurred',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// GET all packages

// Updated GET /api/tours endpoint
router.get('/', async (req, res) => {
  try {
    const result = await db.executeQuery(
      `SELECT 
        package_id AS "package_id",
        title AS "title",
        destination AS "destination",
        itinerary AS "itinerary",
        duration AS "duration",
        price AS "price",
        slots_available AS "slots_available",
        description AS "description",
        image_path AS "imageUrl",
        CASE WHEN slots_available > 0 THEN 'active' ELSE 'inactive' END as "status"
       FROM package 
       ORDER BY package_id`
    );

    res.json({
      success: true,
      packages: result.rows
    });

  } catch (err) {
    console.error('Error fetching tours:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve tours',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// GET single package by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.executeQuery(
      `SELECT 
        package_id AS "package_id",
        title AS "title",
        destination AS "destination",
        itinerary AS "itinerary",
        duration AS "duration",
        price AS "price",
        slots_available AS "slots_available",
        description AS "description",
        image_path AS "imageUrl",
        CASE WHEN slots_available > 0 THEN 'active' ELSE 'inactive' END as "status"
       FROM package 
       WHERE package_id = :id`,
      { id }
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }

    res.json({
      success: true,
      ...result.rows[0] // Spread the first row's data
    });

  } catch (err) {
    console.error('Error fetching package:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT - Update a package
router.put('/:id', upload.single('packageImage'), async (req, res) => {
  try {
    const { id } = req.params;
    const formData = req.body;

    // Extract fields
    const title = formData.title;
    const destination = formData.destination;
    const itinerary = formData.itinerary;
    const duration = formData.duration;
    const price = formData.price;
    const slots_available = formData.slots_available;
    const description = formData.description;

    // Validation
    if (!title || !destination || !itinerary || !duration ||
      !price || !slots_available || !description) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Handle file upload if new image is provided
    let imagePath = null;
    if (req.file) {
      imagePath = `/uploads/${req.file.filename}`;
    }

    // Build the update query
    let sql = `UPDATE package SET 
               title = :title, 
               destination = :destination,
               itinerary = :itinerary,
               duration = :duration,
               price = :price,
               slots_available = :slots_available,
               description = :description`;

    // Add image_path to update if new image was uploaded
    if (imagePath) {
      sql += `, image_path = :imagePath`;
    }

    sql += ` WHERE package_id = :id`;

    const params = {
      id,
      title,
      destination,
      itinerary,
      duration,
      price,
      slots_available,
      description
    };

    if (imagePath) {
      params.imagePath = imagePath;
    }

    const result = await db.executeQuery(sql, params);

    if (result.rowsAffected === 0) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }

    res.json({
      success: true,
      message: 'Package updated successfully',
      package: {
        package_id: id,
        title,
        destination,
        itinerary,
        duration,
        price,
        slots_available,
        description,
        image_path: imagePath
      }
    });

  } catch (err) {
    console.error('Error updating package:', err);
    res.status(500).json({
      success: false,
      message: 'Server error occurred',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// DELETE a package
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.executeQuery(
      'DELETE FROM package WHERE package_id = :id',
      { id }
    );

    if (result.rowsAffected === 0) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }

    res.json({ success: true, message: 'Package deleted successfully' });
  } catch (err) {
    console.error('Error deleting package:', err);
    res.status(500).json({
      success: false,
      message: 'Server error occurred',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});





module.exports = router;