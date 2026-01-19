import express from 'express';
import { handleWhatsAppInbound } from '../controllers/webhookController.js';

const router = express.Router();

/**
 * POST /api/webhooks/whatsapp-inbound
 * Receives inbound WhatsApp messages from YCloud
 * Configure this URL in your YCloud dashboard webhook settings
 */
router.post('/whatsapp-inbound', handleWhatsAppInbound);

export default router;
