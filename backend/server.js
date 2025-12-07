
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const webpush = require('web-push');
const { db } = require('./database');
const settingsRoutes = require('./routes/settingsRoutes');
const { checkContentSafety } = require('./middleware/settingsGuard');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public')); // Serve demo frontend

// --- 1. Web Push Configuration (VAPID) ---
if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    console.warn("WARNING: VAPID keys are missing in .env. Push notifications won't work.");
} else {
    webpush.setVapidDetails(
        process.env.VAPID_SUBJECT || 'mailto:admin@example.com',
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
}

// --- REGISTER SETTINGS ROUTES ---
app.use('/api/settings', settingsRoutes);

// --- 2. API Endpoints ---

// A. Subscribe (Browser Web Push)
app.post('/api/subscribe', (req, res) => {
    const { user_id, subscription } = req.body;
    
    // Save to DB
    const sql = `INSERT INTO subscriptions (user_id, platform, endpoint, p256dh, auth) VALUES (?, 'web', ?, ?, ?)`;
    const params = [user_id, subscription.endpoint, subscription.keys.p256dh, subscription.keys.auth];
    
    db.run(sql, params, function(err) {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.status(201).json({ message: 'Subscribed successfully', id: this.lastID });
    });
});

// A.2 Unsubscribe API
app.post('/api/unsubscribe', (req, res) => {
    const { user_id, endpoint } = req.body;
    // Mark inactive in DB
    db.run(`UPDATE subscriptions SET is_active = 0 WHERE user_id = ? AND endpoint = ?`, [user_id, endpoint], (err) => {
        if(err) return res.status(500).json({error: err.message});
        res.json({success: true, message: 'Unsubscribed on server'});
    });
});

// B. Register FCM Token (Mobile)
app.post('/api/register-fcm', (req, res) => {
    const { user_id, token, platform } = req.body; 
    
    const sql = `INSERT INTO subscriptions (user_id, platform, endpoint) VALUES (?, ?, ?)`;
    db.run(sql, [user_id, platform || 'android', token], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'FCM Token Registered' });
    });
});

// D. Send Notification
app.post('/api/notify', (req, res) => {
    const { user_id, title, body, url, type } = req.body;
    
    const payload = JSON.stringify({ title, body, url, icon: '/icon.png' });
    
    const sql = `INSERT INTO notification_queue (user_id, type, channel, payload, status) VALUES (?, ?, 'push', ?, 'pending')`;
    
    db.run(sql, [user_id, type || 'info', payload], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(202).json({ message: 'Notification queued', queue_id: this.lastID });
    });
});

// E. VALIDATE CONTENT (Settings Guard)
// Frontend sends message here first. If it passes, frontend calls Gemini.
app.post('/api/validate', checkContentSafety, (req, res) => {
    // If middleware passed, content is safe
    res.json({ allowed: true, message: "Content is safe." });
});

// F. Admin: View Logs
app.get('/api/admin/logs', (req, res) => {
    db.all(`SELECT * FROM notification_logs ORDER BY id DESC LIMIT 50`, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// G. In-App Notifications (Fetch)
app.get('/api/notifications/:user_id', (req, res) => {
    db.all(`SELECT * FROM notification_queue WHERE user_id = ? AND status = 'completed' ORDER BY created_at DESC LIMIT 20`, 
    [req.params.user_id], (err, rows) => {
        res.json(rows);
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Backend Server running on port ${PORT}`);
});
