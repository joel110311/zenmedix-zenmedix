import axios from 'axios';

const YCLOUD_API_BASE = 'https://api.ycloud.com/v2/whatsapp/messages';

/**
 * YCloud WhatsApp Service
 * Handles sending template messages and direct messages via YCloud API
 */
export const ycloudService = {
    /**
     * Send appointment reminder using WhatsApp template
     * @param {string} phone - Client phone number with country code (e.g., +521234567890)
     * @param {string} clientName - Client's name
     * @param {string} appointmentTime - Appointment time (e.g., "10:00 AM")
     * @param {Object} config - Configuration object with apiKey, senderNumber, templateName
     */
    async sendTemplateReminder(phone, clientName, appointmentTime, config) {
        const { apiKey, senderNumber, templateName } = config;

        if (!apiKey || !senderNumber || !templateName) {
            throw new Error('Missing YCloud configuration (apiKey, senderNumber, or templateName)');
        }

        const payload = {
            to: phone.startsWith('+') ? phone : `+${phone}`,
            from: senderNumber,
            type: 'template',
            template: {
                name: templateName,
                language: { code: 'es_MX' },
                components: [
                    {
                        type: 'body',
                        parameters: [
                            { type: 'text', text: clientName },
                            { type: 'text', text: appointmentTime }
                        ]
                    },
                    {
                        type: 'button',
                        sub_type: 'quick_reply',
                        index: 0,
                        parameters: [{ type: 'payload', payload: 'CONFIRMA_ASISTENCIA' }]
                    },
                    {
                        type: 'button',
                        sub_type: 'quick_reply',
                        index: 1,
                        parameters: [{ type: 'payload', payload: 'CANCELA_CITA' }]
                    }
                ]
            }
        };

        try {
            const response = await axios.post(YCLOUD_API_BASE, payload, {
                headers: {
                    'X-API-Key': apiKey,
                    'Content-Type': 'application/json'
                }
            });

            console.log(`✅ Template reminder sent to ${phone}:`, response.data);
            return { success: true, data: response.data };
        } catch (error) {
            console.error(`❌ Failed to send template to ${phone}:`, error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Send direct text message (only works within 24-hour window after user interaction)
     * @param {string} phone - Client phone number
     * @param {string} message - Text message to send
     * @param {Object} config - Configuration with apiKey, senderNumber
     */
    async sendDirectMessage(phone, message, config) {
        const { apiKey, senderNumber } = config;

        if (!apiKey || !senderNumber) {
            throw new Error('Missing YCloud configuration (apiKey or senderNumber)');
        }

        const payload = {
            from: senderNumber,
            to: phone.startsWith('+') ? phone : `+${phone}`,
            type: 'text',
            text: {
                body: message
            }
        };

        try {
            const response = await axios.post(`${YCLOUD_API_BASE}/sendDirectly`, payload, {
                headers: {
                    'X-API-Key': apiKey,
                    'Content-Type': 'application/json'
                }
            });

            console.log(`✅ Direct message sent to ${phone}:`, response.data);
            return { success: true, data: response.data };
        } catch (error) {
            console.error(`❌ Failed to send direct message to ${phone}:`, error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Send confirmation response after user confirms appointment
     */
    async sendConfirmationResponse(phone, config) {
        return this.sendDirectMessage(
            phone,
            '¡Gracias! Tu asistencia ha sido confirmada ✅',
            config
        );
    },

    /**
     * Send cancellation response after user cancels appointment
     */
    async sendCancellationResponse(phone, config) {
        return this.sendDirectMessage(
            phone,
            'Lamentamos que no puedas asistir. Tu cita ha sido cancelada. Contáctanos si deseas reagendar 👋',
            config
        );
    }
};

export default ycloudService;
