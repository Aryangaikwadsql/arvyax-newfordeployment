import express from 'express';
const router = express.Router();
import {
  createEntry,
  getEntries,
  analyze,
  getInsights
} from '../controllers/journalController.js';

router.post('/journal', createEntry);
router.get('/journal', getEntries);
router.get('/journal/:userId', getEntries);
router.post('/journal/analyze', analyze);
router.get('/journal/insights/:userId', getInsights);

export default router;
