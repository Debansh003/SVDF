// ============================================================
// routes/auth.routes.js - Authentication Routes
// ============================================================
// Base path: /api/v1/auth
// ============================================================

const express  = require('express');
const router   = express.Router();
const { body } = require('express-validator');

const { register, login, logout, getMe, getAllUsers } = require('../controllers/auth.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

// ---- Validation rules ----
const registerValidation = [
  body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

const loginValidation = [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];

// ---- Routes ----
// POST /api/v1/auth/register
router.post('/register', registerValidation, register);

// POST /api/v1/auth/login
router.post('/login', loginValidation, login);

// POST /api/v1/auth/logout
router.post('/logout', logout);

// GET /api/v1/auth/me  (protected - must be logged in)
router.get('/me', protect, getMe);

// GET /api/v1/auth/users  (admin only)
router.get('/users', protect, authorize('admin'), getAllUsers);

module.exports = router;
