// routes/login.js
const express = require('express');
const router = express.Router();
const oracledb = require('oracledb');
const bcrypt = require('bcrypt');
const dbConfig = require('../../db');
const { requireAuth } = require('../middleware/auth');


router.post('/admin/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const connection = await oracledb.getConnection(dbConfig);

        const result = await connection.execute(
            `SELECT admin_id, name, email, password_hash, agency_id FROM admin WHERE email = :email`,
            [email],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        await connection.close();

        if (result.rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const admin = result.rows[0];
        const match = await bcrypt.compare(password, admin.PASSWORD_HASH);

        if (!match) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Set session data
        req.session.admin = {
            id: admin.ADMIN_ID,
            name: admin.NAME,
            email: admin.EMAIL,
            agency_id: admin.AGENCY_ID
        };

        // Return success response with redirect URL
        return res.status(200).json({
            success: true,
            redirectUrl: `/admin/dashboard?agency_id=${admin.AGENCY_ID}`
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// In your adminRoutes.js or similar
router.get('/admin/me', requireAuth, (req, res) => {
    res.json({
        admin_id: req.session.admin.admin_id,
        agency_id: req.session.admin.agency_id,
        name: req.session.admin.name,
        email: req.session.admin.email
    });
});

module.exports = router;