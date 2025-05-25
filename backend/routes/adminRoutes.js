const express = require('express');
const router = express.Router();
const db = require('../../db'); // your DB utility

// POST /api/admin
router.post('/', async (req, res) => {
  const {  agency_id, username, password_hash, full_name } = req.body;

  // Define the SQL query using bind variables for the address_type object
  const sql = `
    INSERT INTO admin (agency_id,username, password_hash, full_name)
   VALUES (:agency_id, :username, :password_hash, :full_name)  `;

  // Set the parameters for the SQL query
   const params = [agency_id, username, password_hash, full_name];

  try {
    // Execute the query with the parameters
    await db.executeQuery(sql, params);
    res.status(201).json({ message: 'Admin created successfully' });
  } catch (error) {
    console.error('DB Error:', error);
    res.status(500).json({ error: 'Failed to create Admin' });
  }
});

module.exports = router;
