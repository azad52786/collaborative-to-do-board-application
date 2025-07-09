const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getTasks,
  createTask,
  updateTask,
  deleteTask
} = require('../controllers/taskController');

// All task routes require authentication
router.use(authenticateToken);

router.get('/', getTasks);
router.post('/', createTask);
router.put('/:taskId', updateTask);
router.delete('/:taskId', deleteTask);

module.exports = router;
