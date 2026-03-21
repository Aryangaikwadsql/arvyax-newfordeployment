const express = require('express');
const router = express.Router();
const {
  createEntry,
  getEntries,
  analyze,
  getInsights
} = require('../controllers/journalController');

router.post('/journal', createEntry);
router.get('/journal', getEntries);
router.get('/journal/:userId', getEntries);
router.post('/journal/analyze', analyze);
router.get('/journal/insights/:userId', getInsights);

module.exports = router;
