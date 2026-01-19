import express from 'express';
import cors from 'cors';
import { reminderCron } from './jobs/reminderCron.js';
import webhookRoutes from './routes/webhooks.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/webhooks', webhookRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 MedFlow Server running on port ${PORT}`);
    console.log(`📡 Webhook URL: http://localhost:${PORT}/api/webhooks/whatsapp-inbound`);

    // Initialize cron jobs
    reminderCron.start();
    console.log('⏰ Reminder cron job initialized');
});
