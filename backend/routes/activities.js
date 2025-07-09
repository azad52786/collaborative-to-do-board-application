const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { getActivities } = require('../controllers/activityController');

router.get('/', authenticateToken, getActivities);

module.exports = router;
