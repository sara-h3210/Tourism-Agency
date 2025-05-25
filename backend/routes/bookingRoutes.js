const express = require('express');
const router = express.Router();
const db = require('../../db');

// Get bookings with pagination and filtering
router.get('/', (req, res) => {
  db.executeQuery(`
      SELECT 
          BOOKING_ID as booking_id,
          CUSTOMER_ID as customer_id,
          PACKAGE_ID as package_id,
          TO_CHAR(BOOKING_DATE, 'YYYY-MM-DD') as booking_date,
          TO_CHAR(TRAVEL_DATE, 'YYYY-MM-DD') as travel_date,
          PARTICIPANTS as participants,
          TOTAL_AMOUNT as total_amount,
          LOWER(STATUS) as status
      FROM bookings
  `, (err, results) => {
    res.json({
      success: true,
      bookings: results.rows,
      totalCount: results.rows.length
    });
  });
});

// Update booking status


module.exports = router;