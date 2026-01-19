import cron from 'node-cron';
import { ycloudService } from '../services/ycloudService.js';
import fs from 'fs';
import path from 'path';

// Path to localStorage simulation file (shared with frontend)
// In production, this should be a proper database
const DATA_DIR = path.join(process.cwd(), 'data');
const APPOINTMENTS_FILE = path.join(DATA_DIR, 'appointments.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

/**
 * Load appointments from JSON file (simulates localStorage)
 */
function loadAppointments() {
    try {
        if (fs.existsSync(APPOINTMENTS_FILE)) {
            const data = fs.readFileSync(APPOINTMENTS_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error loading appointments:', error);
    }
    return [];
}

/**
 * Save appointments to JSON file
 */
function saveAppointments(appointments) {
    try {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        fs.writeFileSync(APPOINTMENTS_FILE, JSON.stringify(appointments, null, 2));
    } catch (error) {
        console.error('Error saving appointments:', error);
    }
}

/**
 * Load settings from JSON file
 */
function loadSettings() {
    try {
        if (fs.existsSync(SETTINGS_FILE)) {
            const data = fs.readFileSync(SETTINGS_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error loading settings:', error);
    }
    return null;
}

/**
 * Get today's date in YYYY-MM-DD format
 */
function getTodayDate() {
    return new Date().toISOString().split('T')[0];
}

/**
 * Get current hour (0-23) in specified timezone
 */
function getCurrentHour(timezone = 'America/Mexico_City') {
    const now = new Date();
    const options = { hour: 'numeric', hour12: false, timeZone: timezone };
    return parseInt(new Intl.DateTimeFormat('en-US', options).format(now), 10);
}

/**
 * Main reminder job function
 * Runs every hour and checks if it's time to send reminders
 */
async function sendDailyReminders() {
    console.log(`\n📅 [${new Date().toISOString()}] Running reminder check...`);

    // Load settings
    const settings = loadSettings();
    if (!settings || !settings.whatsapp) {
        console.log('⚠️ WhatsApp settings not configured. Skipping reminders.');
        return;
    }

    const { ycloudApiKey, senderNumber, templateName, reminderHour, timezone } = settings.whatsapp;

    // Check if reminders are disabled
    if (!reminderHour || reminderHour === 'disabled') {
        console.log('⚠️ Reminders disabled in settings.');
        return;
    }

    // Check if current hour matches configured reminder hour (using configured timezone)
    const tz = timezone || 'America/Mexico_City';
    const currentHour = getCurrentHour(tz);
    const configuredHour = parseInt(reminderHour, 10);

    console.log(`🕐 Timezone: ${tz}, Current hour: ${currentHour}, Configured hour: ${configuredHour}`);

    if (currentHour !== configuredHour) {
        console.log(`⏰ Current hour (${currentHour}) doesn't match reminder hour (${configuredHour}). Skipping.`);
        return;
    }


    // Check if we have the required config
    if (!ycloudApiKey || !senderNumber || !templateName) {
        console.log('⚠️ Missing YCloud configuration (API Key, Sender Number, or Template Name).');
        return;
    }

    const config = {
        apiKey: ycloudApiKey,
        senderNumber,
        templateName
    };

    // Load today's appointments
    const appointments = loadAppointments();
    const today = getTodayDate();
    const todayAppointments = appointments.filter(apt =>
        apt.date === today &&
        apt.status !== 'cancelled' &&
        !apt.reminderSent
    );

    if (todayAppointments.length === 0) {
        console.log('📭 No appointments to remind today.');
        return;
    }

    console.log(`📬 Found ${todayAppointments.length} appointments to remind.`);

    // Send reminders for each appointment
    for (const appointment of todayAppointments) {
        try {
            const phone = appointment.phone;
            const clientName = appointment.patientName || 'Paciente';
            const appointmentTime = appointment.time || 'hora programada';

            if (!phone) {
                console.log(`⚠️ Skipping appointment ${appointment.id}: No phone number`);
                continue;
            }

            await ycloudService.sendTemplateReminder(phone, clientName, appointmentTime, config);

            // Mark as reminder sent
            appointment.reminderSent = true;
            appointment.reminderSentAt = new Date().toISOString();

            console.log(`✅ Reminder sent to ${clientName} (${phone})`);
        } catch (error) {
            console.error(`❌ Failed to send reminder for appointment ${appointment.id}:`, error.message);
            // Continue with next appointment even if one fails
        }
    }

    // Save updated appointments
    saveAppointments(appointments);
    console.log('💾 Appointments updated with reminder status.');
}

/**
 * Cron job that runs every hour at minute 0
 * Schedule: "0 * * * *" = At minute 0 of every hour
 */
export const reminderCron = cron.schedule('0 * * * *', sendDailyReminders, {
    scheduled: false, // Don't start immediately, we'll start it manually
    timezone: 'America/Mexico_City'
});

// Export for testing
export { sendDailyReminders, loadAppointments, saveAppointments, loadSettings };
