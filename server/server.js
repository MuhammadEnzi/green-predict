import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

import cors from 'cors';
import analysisRoutes from './routes/analysisRoutes.js';
import timelineRoutes from './routes/timelineRoutes.js';
import evacuationRoutes from './routes/evacuationRoutes.js';

const app = express();
const corsOptions = {
  // Mengambil URL frontend dari environment variable, dengan fallback ke localhost
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
};
app.use(cors(corsOptions));


app.use(express.json());

app.get('/', (req, res) => {
  res.send('✅ GreenPredict API is running successfully!');
});

// API Routes
app.use('/api/analyze', analysisRoutes);
app.use('/api/timeline', timelineRoutes);
app.use('/api/evacuation', evacuationRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`🚀 Server is listening on http://localhost:${PORT}`));
