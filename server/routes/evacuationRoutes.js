import express from 'express';
import { getEvacuationPlan } from '../controllers/evacuationController.js';

const router = express.Router();

// Endpoint ini akan menangani permintaan untuk rencana evakuasi
router.post('/', getEvacuationPlan);

export default router;