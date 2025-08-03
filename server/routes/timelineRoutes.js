import express from 'express';
import { getTimelineData } from '../controllers/timelineController.js';
const router = express.Router();
router.get('/', getTimelineData);
export default router;