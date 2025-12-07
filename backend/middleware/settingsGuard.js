
const { db } = require('../database');

/**
 * यह Middleware हर Chat Request पर check करेगा कि User की settings क्या हैं।
 * अगर "Restricted Mode" ON है या "Blocked Words" हैं, तो यह request को रोक देगा।
 */
const checkContentSafety = (req, res, next) => {
    const userId = req.body.user_id || req.headers['x-user-id'] || 'default_user';
    const content = req.body.message || req.body.prompt || '';

    // Database se user settings fetch karein
    db.get(`SELECT * FROM user_settings WHERE user_id = ?`, [userId], (err, row) => {
        if (err || !row) {
            // Agar settings nahi milti, to default behavior (allow)
            return next();
        }

        try {
            const security = JSON.parse(row.security || '{}');
            const parental = JSON.parse(row.parental || '{}');

            // 1. SECURITY CHECK: Safe Mode
            // Agar Safe Mode ON है और content में SQL Injection या script tags दिखें
            if (security.safe_mode) {
                const suspiciousPatterns = /<script>|SELECT \*|DROP TABLE/i;
                if (suspiciousPatterns.test(content)) {
                    // Alert log karein (Security Alert Feature)
                    if (security.suspicious_login_alert) {
                        console.log(`[SECURITY ALERT] Suspicious content from User ${userId}`);
                        // Yahan hum notification queue mein alert daal sakte hain
                    }
                    return res.status(403).json({ 
                        error: "Security Risk Detected", 
                        message: "Your message contains blocked patterns (Safe Mode is ON)." 
                    });
                }
            }

            // 2. PARENTAL CONTROL: Blocked Words
            // Agar Restricted Mode ON है
            if (parental.restricted_mode) {
                // Default blocked words + user defined custom blocked words
                const defaultBadWords = ['abuse', 'violence', 'hate'];
                const customBadWords = (parental.blocked_words || '').split(',').map(w => w.trim());
                const allBadWords = [...defaultBadWords, ...customBadWords];

                const foundBadWord = allBadWords.find(word => word && content.toLowerCase().includes(word.toLowerCase()));

                if (foundBadWord) {
                    return res.status(406).json({ 
                        error: "Content Restricted", 
                        message: `Message contains blocked content: "${foundBadWord}" (Parental Control is ON).` 
                    });
                }
            }

            // 3. PARENTAL CONTROL: Time Limit
            // Agar chat_time_limit set hai (e.g., "22:00" - 10 PM)
            if (parental.chat_time_limit) {
                const currentHour = new Date().getHours();
                const limitHour = parseInt(parental.chat_time_limit.split(':')[0]); // Extract hour
                
                // Agar abhi ka waqt limit ke baad hai (Simple logic: after limit, before 6 AM)
                if (currentHour >= limitHour || currentHour < 6) {
                    return res.status(403).json({
                        error: "Time Limit Reached",
                        message: "Chat is disabled during restricted hours."
                    });
                }
            }

            // Sab sahi hai, aage badhein
            next();

        } catch (parseErr) {
            console.error("Settings parse error:", parseErr);
            next();
        }
    });
};

module.exports = { checkContentSafety };
