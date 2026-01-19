import { ycloudService } from '../services/ycloudService.js';
import { loadAppointments, saveAppointments, loadSettings } from '../jobs/reminderCron.js';

/**
 * Webhook Controller for YCloud WhatsApp inbound messages
 * Handles button responses from appointment reminders
 */

/**
 * Find appointment by phone number (most recent pending appointment)
 */
function findAppointmentByPhone(phone, appointments) {
    // Normalize phone number (remove + and spaces)
    const normalizedPhone = phone.replace(/[\s+\-]/g, '');

    // Find pending appointments for this phone number
    const pendingAppointments = appointments.filter(apt => {
        const aptPhone = (apt.phone || '').replace(/[\s+\-]/g, '');
        return aptPhone.includes(normalizedPhone) || normalizedPhone.includes(aptPhone);
    }).filter(apt =>
        apt.status !== 'cancelled' &&
        apt.status !== 'confirmed'
    );

    // Return the most recent one (by date/time)
    if (pendingAppointments.length > 0) {
        return pendingAppointments.sort((a, b) => {
            const dateA = new Date(`${a.date}T${a.time || '00:00'}`);
            const dateB = new Date(`${b.date}T${b.time || '00:00'}`);
            return dateB - dateA;
        })[0];
    }

    return null;
}

/**
 * Handle inbound WhatsApp webhook from YCloud
 * POST /api/webhooks/whatsapp-inbound
 */
export async function handleWhatsAppInbound(req, res) {
    console.log('\n📨 Received YCloud webhook:', JSON.stringify(req.body, null, 2));

    try {
        // TODO: Verify X-YCloud-Signature using YCLOUD_WEBHOOK_SECRET
        // const signature = req.headers['x-ycloud-signature'];
        // if (!verifySignature(signature, req.body, process.env.YCLOUD_WEBHOOK_SECRET)) {
        //     return res.status(401).json({ error: 'Invalid signature' });
        // }

        const webhookData = req.body;

        // Extract message data
        // YCloud sends different structures, handle both whatsappInboundMessage and whatsappMessage
        const message = webhookData.whatsappInboundMessage || webhookData.whatsappMessage || webhookData;

        // Get sender phone number
        const from = message.from || message.chat_id;
        if (!from) {
            console.log('⚠️ No sender phone number in webhook');
            return res.status(200).json({ status: 'ok', message: 'No sender found' });
        }

        // Check if this is an interactive button response
        const interactive = message.interactive;
        if (!interactive || interactive.type !== 'button_reply') {
            console.log('ℹ️ Not a button reply, ignoring');
            return res.status(200).json({ status: 'ok', message: 'Not a button reply' });
        }

        // Extract button payload
        const buttonReply = interactive.button_reply;
        const payload = buttonReply?.id || buttonReply?.payload;

        console.log(`🔘 Button pressed by ${from}: ${payload}`);

        // Load appointments and settings
        const appointments = loadAppointments();
        const settings = loadSettings();

        const config = settings?.whatsapp ? {
            apiKey: settings.whatsapp.ycloudApiKey,
            senderNumber: settings.whatsapp.senderNumber
        } : null;

        // Find the appointment for this phone number
        const appointment = findAppointmentByPhone(from, appointments);

        if (!appointment) {
            console.log(`⚠️ No pending appointment found for ${from}`);
            return res.status(200).json({ status: 'ok', message: 'No appointment found' });
        }

        // Handle button actions
        switch (payload) {
            case 'CONFIRMA_ASISTENCIA':
                console.log(`✅ Confirming appointment ${appointment.id} for ${from}`);
                appointment.status = 'confirmed';
                appointment.confirmedAt = new Date().toISOString();
                appointment.confirmedVia = 'whatsapp';

                // Send confirmation response
                if (config?.apiKey && config?.senderNumber) {
                    try {
                        await ycloudService.sendConfirmationResponse(from, config);
                    } catch (err) {
                        console.error('Error sending confirmation response:', err.message);
                    }
                }
                break;

            case 'CANCELA_CITA':
                console.log(`❌ Cancelling appointment ${appointment.id} for ${from}`);
                appointment.status = 'cancelled';
                appointment.cancelledAt = new Date().toISOString();
                appointment.cancelledVia = 'whatsapp';

                // Send cancellation response
                if (config?.apiKey && config?.senderNumber) {
                    try {
                        await ycloudService.sendCancellationResponse(from, config);
                    } catch (err) {
                        console.error('Error sending cancellation response:', err.message);
                    }
                }
                break;

            default:
                console.log(`⚠️ Unknown button payload: ${payload}`);
        }

        // Save updated appointments
        saveAppointments(appointments);
        console.log('💾 Appointment status updated');

        // Always return 200 to acknowledge webhook receipt
        return res.status(200).json({
            status: 'ok',
            action: payload,
            appointmentId: appointment.id
        });

    } catch (error) {
        console.error('❌ Error processing webhook:', error);
        // Still return 200 to prevent YCloud from retrying
        return res.status(200).json({ status: 'error', message: error.message });
    }
}

export default { handleWhatsAppInbound };
