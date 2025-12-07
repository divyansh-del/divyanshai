const { db } = require('./database');
const webpush = require('web-push');
const nodemailer = require('nodemailer');
const axios = require('axios');
require('dotenv').config();

// --- Config ---
const MAX_RETRIES = process.env.NOTIFY_RETRY_MAX || 3;
const RETRY_BASE_MS = process.env.NOTIFY_RETRY_BASE_MS || 5000;

// --- Email Transporter ---
const mailTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

// --- Worker Loop (Polling) ---
console.log("Worker started. Polling for jobs...");
setInterval(processQueue, 5000); // Poll every 5 seconds

function processQueue() {
    const now = new Date().toISOString();
    
    // 1. Fetch pending jobs ready for attempt
    const sql = `SELECT * FROM notification_queue WHERE status IN ('pending', 'failed') AND attempts < ? AND next_attempt_at <= ? LIMIT 5`;
    
    db.all(sql, [MAX_RETRIES, now], (err, jobs) => {
        if (err) return console.error("Queue fetch error:", err);
        if (jobs.length === 0) return; // No jobs

        jobs.forEach(job => {
            processJob(job);
        });
    });
}

async function processJob(job) {
    console.log(`Processing Job #${job.id} for User ${job.user_id} via ${job.channel}`);
    
    // Mark as processing
    db.run(`UPDATE notification_queue SET status = 'processing', attempts = attempts + 1 WHERE id = ?`, [job.id]);

    try {
        // 1. Check Preferences
        const prefs = await getUserPreferences(job.user_id);
        
        // If channel is Push
        if (job.channel === 'push') {
            if (!prefs.allow_push) {
                // User disabled push -> Fallback to email directly
                return switchToEmail(job, "User disabled push");
            }

            const success = await sendPushNotification(job.user_id, job.payload);
            if (success) {
                markComplete(job.id, 'push', 'Sent successfully');
            } else {
                handleFailure(job, "Push failed (No valid subs or error)");
            }
        } 
        // If channel is Email
        else if (job.channel === 'email') {
            if (!prefs.allow_email) {
                return markFailed(job.id, "User disabled email");
            }
            const success = await sendEmailNotification(job.user_id, job.payload);
            if (success) markComplete(job.id, 'email', 'Email Sent');
            else handleFailure(job, "SMTP Error");
        }

    } catch (error) {
        console.error(`Job ${job.id} Exception:`, error);
        handleFailure(job, error.message);
    }
}

// --- Helper Functions ---

function getUserPreferences(userId) {
    return new Promise((resolve) => {
        db.get(`SELECT * FROM preferences WHERE user_id = ?`, [userId], (err, row) => {
            // Default to allowed if no record
            resolve(row || { allow_push: 1, allow_email: 1 });
        });
    });
}

async function sendPushNotification(userId, payloadStr) {
    return new Promise((resolve) => {
        db.all(`SELECT * FROM subscriptions WHERE user_id = ? AND is_active = 1`, [userId], async (err, subs) => {
            if (err || !subs || subs.length === 0) return resolve(false);

            const payload = JSON.parse(payloadStr);
            let sentCount = 0;

            for (const sub of subs) {
                try {
                    if (sub.platform === 'web') {
                        // Web Push Logic
                        const pushConfig = {
                            endpoint: sub.endpoint,
                            keys: { p256dh: sub.p256dh, auth: sub.auth }
                        };
                        await webpush.sendNotification(pushConfig, payloadStr);
                        sentCount++;
                    } else if (sub.platform === 'android' || sub.platform === 'ios') {
                        // FCM Logic (Legacy)
                        // Note: For production use HTTP v1 API using firebase-admin SDK
                        if (process.env.FCM_SERVER_KEY) {
                            await axios.post('https://fcm.googleapis.com/fcm/send', {
                                to: sub.endpoint,
                                notification: { title: payload.title, body: payload.body },
                                data: payload
                            }, {
                                headers: { 'Authorization': `key=${process.env.FCM_SERVER_KEY}` }
                            });
                            sentCount++;
                        }
                    }
                } catch (e) {
                    console.error(`Send error for sub ${sub.id}:`, e.statusCode);
                    // 410 Gone means subscription is dead -> cleanup
                    if (e.statusCode === 410 || e.statusCode === 404) {
                        db.run(`UPDATE subscriptions SET is_active = 0 WHERE id = ?`, [sub.id]);
                        console.log(`Subscription ${sub.id} marked inactive.`);
                    }
                }
            }
            resolve(sentCount > 0);
        });
    });
}

async function sendEmailNotification(userId, payloadStr) {
    // Mock: Get email from users table (Not implemented fully in schema for brevity, using dummy)
    // In real app: SELECT email FROM users WHERE id = userId
    const userEmail = "test_user@example.com"; 
    const payload = JSON.parse(payloadStr);

    try {
        await mailTransporter.sendMail({
            from: '"Notification System" <noreply@system.com>',
            to: userEmail,
            subject: payload.title,
            text: `${payload.body}\n\nLink: ${payload.url}`,
            html: `<h3>${payload.title}</h3><p>${payload.body}</p><a href="${payload.url}">View</a>`
        });
        return true;
    } catch (e) {
        console.error("Email error:", e);
        return false;
    }
}

function handleFailure(job, reason) {
    const nextRetry = job.attempts + 1;
    
    // Exponential Backoff: 5s, 10s, 20s...
    const delay = RETRY_BASE_MS * Math.pow(2, job.attempts);
    const nextTime = new Date(Date.now() + delay).toISOString();

    if (nextRetry > MAX_RETRIES) {
        if (job.channel === 'push') {
            // Retry limit reached for Push -> Switch to Email
            switchToEmail(job, "Max push retries reached");
        } else {
            // Email also failed -> Mark permanently failed
            markFailed(job.id, reason);
        }
    } else {
        // Schedule Retry
        db.run(`UPDATE notification_queue SET status = 'failed', next_attempt_at = ? WHERE id = ?`, [nextTime, job.id]);
        logResult(job.id, job.channel, 'retry_scheduled', reason);
    }
}

function switchToEmail(job, reason) {
    console.log(`Switching Job ${job.id} to EMAIL fallback. Reason: ${reason}`);
    // Reset attempts for the new channel
    db.run(`UPDATE notification_queue SET channel = 'email', status = 'pending', attempts = 0, next_attempt_at = ? WHERE id = ?`, 
           [new Date().toISOString(), job.id]);
    logResult(job.id, 'push', 'fallback_to_email', reason);
}

function markComplete(id, channel, response) {
    db.run(`UPDATE notification_queue SET status = 'completed' WHERE id = ?`, [id]);
    logResult(id, channel, 'success', response);
}

function markFailed(id, reason) {
    db.run(`UPDATE notification_queue SET status = 'dead' WHERE id = ?`, [id]);
    logResult(id, 'system', 'permanent_fail', reason);
}

function logResult(queueId, channel, status, response) {
    db.run(`INSERT INTO notification_logs (queue_id, status, response) VALUES (?, ?, ?)`, 
           [queueId, `${channel}:${status}`, response]);
}