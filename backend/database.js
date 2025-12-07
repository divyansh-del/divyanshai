
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const dbPath = process.env.DATABASE_URL || './notifications.db';

// Database connection create karein
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Database opening error: ', err);
    } else {
        console.log('Connected to SQLite database.');
        initDB(); // Ensure tables exist
    }
});

// Tables create karne ka function
function initDB() {
    db.serialize(() => {
        // 1. Subscriptions Table (Web Push & FCM Tokens)
        db.run(`CREATE TABLE IF NOT EXISTS subscriptions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            platform TEXT DEFAULT 'web', -- 'web', 'android', 'ios'
            endpoint TEXT NOT NULL, -- FCM Token or Web Endpoint
            p256dh TEXT, -- Web Push Key
            auth TEXT, -- Web Push Auth Secret
            is_active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // 2. Preferences Table (Legacy - ab hum user_settings use karenge detailed control ke liye)
        db.run(`CREATE TABLE IF NOT EXISTS preferences (
            user_id TEXT PRIMARY KEY,
            allow_push INTEGER DEFAULT 1,
            allow_email INTEGER DEFAULT 1,
            categories TEXT DEFAULT 'all', 
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // 3. Notification Queue
        db.run(`CREATE TABLE IF NOT EXISTS notification_queue (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            type TEXT DEFAULT 'info',
            channel TEXT DEFAULT 'push',
            payload TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            attempts INTEGER DEFAULT 0,
            next_attempt_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // 4. Logs
        db.run(`CREATE TABLE IF NOT EXISTS notification_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            queue_id INTEGER,
            status TEXT,
            response TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // 5. USER SETTINGS (NEW TABLE for Complete Settings System)
        // Hum settings को JSON format में store करेंगे ताकि future में नए toggles आसानी से add हो सकें
        db.run(`CREATE TABLE IF NOT EXISTS user_settings (
            user_id TEXT PRIMARY KEY,
            general TEXT,        -- JSON: {theme, accent, speed}
            notifications TEXT,  -- JSON: {enabled, channels...}
            security TEXT,       -- JSON: {safe_mode, suspicious_alert...}
            data_control TEXT,   -- JSON: {save_history, auto_delete...}
            parental TEXT,       -- JSON: {restricted_mode, blocked_words...}
            apps TEXT,           -- JSON: {linked_apps_status...}
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
        
        console.log('Database tables initialized (including user_settings).');
    });
}

module.exports = { db, initDB };
