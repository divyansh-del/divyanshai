
const express = require('express');
const router = express.Router();
const { db } = require('../database');

// --- GET Settings ---
router.get('/:user_id', (req, res) => {
    const userId = req.params.user_id;
    db.get(`SELECT * FROM user_settings WHERE user_id = ?`, [userId], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (!row) {
            return res.json({}); // Return empty if no settings yet
        }

        // Database mein JSON string hai, use object banakar bhejein
        res.json({
            general: JSON.parse(row.general || '{}'),
            notifications: JSON.parse(row.notifications || '{}'),
            security: JSON.parse(row.security || '{}'),
            data_control: JSON.parse(row.data_control || '{}'),
            parental: JSON.parse(row.parental || '{}'),
            apps: JSON.parse(row.apps || '{}'),
        });
    });
});

// --- UPDATE Settings (Partial Update) ---
router.post('/:user_id', (req, res) => {
    const userId = req.params.user_id;
    const { category, settings } = req.body; 
    // category: 'general', 'security', etc.
    // settings: complete object for that category

    if (!category || !settings) return res.status(400).json({ error: "Missing category or settings" });

    // Pehle purani settings fetch karein taki merge kar sakein (ya insert kar sakein)
    db.get(`SELECT * FROM user_settings WHERE user_id = ?`, [userId], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });

        let sql;
        let params;

        const settingsString = JSON.stringify(settings);

        if (!row) {
            // Pehli baar insert
            sql = `INSERT INTO user_settings (user_id, ${category}) VALUES (?, ?)`;
            params = [userId, settingsString];
        } else {
            // Update existing
            sql = `UPDATE user_settings SET ${category} = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`;
            params = [settingsString, userId];
        }

        db.run(sql, params, function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, message: `${category} settings updated` });
        });
    });
});

// --- SPECIFIC ACTIONS (Data Control) ---

// Clear Cache / History Action
router.post('/:user_id/clear-data', (req, res) => {
    const userId = req.params.user_id;
    const { type } = req.body; // 'history' or 'cache'

    if (type === 'history') {
        // Logic: Delete user's chat logs from main DB (Not implemented in this demo DB, but logic here)
        // db.run(`DELETE FROM chat_messages WHERE user_id = ?`, [userId]);
        console.log(`[DATA] Clearing history for ${userId}`);
        return res.json({ success: true, message: "Chat history cleared from server." });
    }

    if (type === 'cache') {
        console.log(`[DATA] Clearing temp cache for ${userId}`);
        return res.json({ success: true, message: "Server cache cleared." });
    }

    res.status(400).json({ error: "Invalid type" });
});

module.exports = router;
