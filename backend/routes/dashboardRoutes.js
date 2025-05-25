// routes/dashboard.js
const express = require('express');
const router = express.Router();

router.get('/admin/dashboard', (req, res) => {
    const agencyId = req.query.agency_id;

    // Render different views or fetch different data based on agencyId
    res.send(`<h1>Welcome to Admin Dashboard for Agency ${agencyId}</h1>`);
});

module.exports = router;
