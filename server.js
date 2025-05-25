require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simplified CORS - adjust origins as needed
app.use(cors({
  origin: 'http://localhost:5502',
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));

// Static files
app.use('/uploads', express.static('uploads'));

// Routes - assuming you've modified them to not use sessions
app.use('/api', require('./backend/routes/loginRoutes'));
app.use('/api/destinations', require('./backend/routes/destinationRoutes'));
app.use('/api/tours', require('./backend/routes/tourRoutes'));
app.use('/api/bookings', require('./backend/routes/bookingRoutes'));
app.use('/api/customers', require('./backend/routes/customerRoutes'));


// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});