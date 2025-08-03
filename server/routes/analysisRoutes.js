import express from 'express';
import { getAnalysis, getFollowUp } from '../controllers/analysisController.js';

const router = express.Router();

// @route   POST /api/analyze
// @desc    Mendapatkan analisis risiko iklim dari AI
// @access  Public
router.post('/', getAnalysis);
router.post('/follow-up', getFollowUp);

export default router;


