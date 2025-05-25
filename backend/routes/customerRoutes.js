const express = require('express');
const router = express.Router();
const db = require('../../db'); // Import your DB

// GET route for fetching all bookings
router.get('/', async (req, res) => {
    try {
        const result = await db.executeQuery(
            'SELECT * FROM customer ORDER BY customer_id DESC'
        );
        res.json({ success: true, customers: result.rows });
    } catch (err) {
        console.error('Error fetching customers:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
