const express = require('express');
const router = express.Router();
const db = require('../../db'); // your DB utility

// POST /api/agency
router.post('/', async (req, res) => {
  const { name, email, phone, street, city, country, postal_code, profile_description } = req.body;

  // Define the SQL query using bind variables for the address_type object
  const sql = `
    INSERT INTO agency (name, email, phone, address_obj, profile_description)
    VALUES (:name, :email, :phone, address_type(:street, :city, :country, :postal_code), :profile_description)
  `;

  // Set the parameters for the SQL query
  const params = {
    name,
    email,
    phone,
    street,
    city,
    country,
    postal_code,
    profile_description
  };

  try {
    // Execute the query with the parameters
    await db.executeQuery(sql, params);
    res.status(201).json({ message: 'Agency created successfully' });
  } catch (error) {
    console.error('DB Error:', error);
    res.status(500).json({ error: 'Failed to create agency' });
  }
});

module.exports = router;
