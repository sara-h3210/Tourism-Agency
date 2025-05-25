const db = require('../../db');
const bcrypt = require('bcryptjs');

module.exports = {
  // Password hashing
  hashPassword: async (password) => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  },

  // Verify password
  comparePassword: async (password, hash) => {
    return await bcrypt.compare(password, hash);
  },

  // Authentication check middleware
  requireAuth: (req, res, next) => {
    if (!req.session.admin) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    next();
  },

  // Role-based access control (if needed)
  requireRole: (role) => {
    return (req, res, next) => {
      if (req.session.admin?.role !== role) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions'
        });
      }
      next();
    }
  }
};