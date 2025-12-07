require('dotenv').config();
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const cookieParser = require('cookie-parser');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const canvaService = require('./services/canvaService');
const { encrypt, decrypt } = require('./utils/crypto');

const app = express();
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Database Setup (SQLite for local, switch to PG for prod)
let db;
(async () => {
    db = await open({
        filename: process.env.DB_URL || './tokens.db',
        driver: sqlite3.Database
    });
    await db.exec(`
        CREATE TABLE IF NOT EXISTS tokens (
            user_id TEXT PRIMARY KEY,
            app_id TEXT,
            access_token TEXT,
            refresh_token TEXT,
            expires_at INTEGER,
            scope TEXT,
            updated_at INTEGER
        )
    `);
    console.log('Database initialized');
})();

// Helper to save tokens
const saveTokens = async (userId, tokens) => {
    const expiresAt = Date.now() + (tokens.expires_in * 1000);
    const encAccess = encrypt(tokens.access_token);
    const encRefresh = tokens.refresh_token ? encrypt(tokens.refresh_token) : null;
    
    await db.run(`
        INSERT OR REPLACE INTO tokens (user_id, app_id, access_token, refresh_token, expires_at, scope, updated_at)
        VALUES (?, 'canva', ?, ?, ?, ?, ?)
    `, [userId, encAccess, encRefresh, expiresAt, tokens.scope, Date.now()]);
};

// Helper to get access token (auto-refresh)
const getAccessToken = async (userId) => {
    const row = await db.get('SELECT * FROM tokens WHERE user_id = ? AND app_id = ?', [userId, 'canva']);
    if (!row) return null;

    let accessToken = decrypt(row.access_token);
    
    // Refresh if expired or expiring soon (within 5 mins)
    if (Date.now() > (row.expires_at - 300000)) {
        if (!row.refresh_token) return null; // Cannot refresh
        console.log('Refreshing token for user', userId);
        const refreshToken = decrypt(row.refresh_token);
        
        try {
            const newTokens = await canvaService.refreshToken(refreshToken);
            await saveTokens(userId, { 
                ...newTokens, 
                refresh_token: newTokens.refresh_token || refreshToken // Reuse old if new not provided
            });
            accessToken = newTokens.access_token;
        } catch (e) {
            console.error('Refresh failed', e);
            return null; // Force re-auth
        }
    }
    return accessToken;
};

// --- ROUTES ---

// 1. Start OAuth Flow
app.get('/auth/canva', (req, res) => {
    // Generate state (user session id)
    // In production, verify this state maps to a logged-in user session
    const userId = req.query.user_id || 'default_user';
    const state = crypto.randomBytes(16).toString('hex') + ':' + userId;
    
    res.redirect(canvaService.buildAuthUrl(state));
});

// 2. OAuth Callback
app.get('/oauth/callback/canva', async (req, res) => {
    const { code, state, error } = req.query;
    
    if (error) return res.status(400).send(`Auth Error: ${error}`);
    if (!code) return res.status(400).send('No code provided');

    const [randomState, userId] = (state || '').split(':');
    
    try {
        const tokens = await canvaService.exchangeCode(code);
        await saveTokens(userId || 'default_user', tokens);
        
        // Redirect back to frontend success page
        res.redirect(`${process.env.FRONTEND_URL}?canva_connected=true`);
    } catch (e) {
        res.status(500).send(`Exchange Failed: ${e.message}`);
    }
});

// 3. API Proxy: List Templates
app.get('/api/canva/templates', async (req, res) => {
    const userId = req.headers['x-user-id'] || 'default_user';
    const accessToken = await getAccessToken(userId);
    
    if (!accessToken) return res.status(401).json({ error: 'Not connected or session expired' });
    
    try {
        const templates = await canvaService.listTemplates(accessToken, req.query.query || 'presentation');
        res.json(templates);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 4. API Proxy: Create Design
app.post('/api/canva/create', async (req, res) => {
    const userId = req.headers['x-user-id'] || 'default_user';
    const accessToken = await getAccessToken(userId);
    
    if (!accessToken) return res.status(401).json({ error: 'Not connected' });

    try {
        const result = await canvaService.createDesign(accessToken, req.body.type);
        res.json(result);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 5. Webhook Receiver
app.post('/webhook/canva', (req, res) => {
    // Verify Signature (Hypothetical, check Canva docs for X-Canva-Signature)
    const signature = req.headers['x-canva-signature'];
    // verifyHMAC(req.body, signature, process.env.CANVA_CLIENT_SECRET) ...
    
    console.log('Webhook received:', req.body);
    // Handle event (e.g. design_published)
    res.status(200).send('OK');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));