const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const adminMiddleware = require('../middlewares/adminMiddleware');

router.get('/stats', adminMiddleware, dashboardController.getStats);

module.exports = router; 