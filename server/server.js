import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

import cors from 'cors';
import analysisRoutes from './routes/analysisRoutes.js';
import timelineRoutes from './routes/timelineRoutes.js';
import evacuationRoutes from './routes/evacuationRoutes.js'; // <-- 1. Impor route baru

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('✅ GreenPredict API is running successfully!');
});

// API Routes
app.use('/api/analyze', analysisRoutes);
app.use('/api/timeline', timelineRoutes);
app.use('/api/evacuation', evacuationRoutes); // <-- 2. Daftarkan route baru

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`🚀 Server is listening on http://localhost:${PORT}`));

