# Production Notification System

यह सिस्टम Web Push, Mobile FCM, और Email Fallback को handle करता है।

## 1. Setup & Installation

1. फोल्डर में जाएँ:
   ```bash
   cd backend
   ```

2. Dependencies इनस्टॉल करें:
   ```bash
   npm install
   ```

3. `.env.example` को `.env` नाम से कॉपी करें।

4. **VAPID Keys** जनरेट करें (Web Push के लिए):
   ```bash
   npx web-push generate-vapid-keys
   ```
   जो Public और Private keys मिलें, उन्हें `.env` में `VAPID_PUBLIC_KEY` और `VAPID_PRIVATE_KEY` में डालें।
   **Important:** `public/client.js` फाइल में लाइन 3 पर `const VAPID_PUBLIC_KEY = '...'` को भी अपडेट करें।

5. **SMTP (Email)** Setup:
   अपने Gmail या SendGrid के credentials `.env` में डालें। Gmail के लिए "App Password" का उपयोग करें।

## 2. Running the System

Server और Worker दोनों को एक साथ चलाने के लिए:

```bash
npm run dev
```

- Server: http://localhost:5000 पर चलेगा।
- Worker: Background में हर 5 सेकंड में Queue चेक करेगा।

## 3. Testing Flow

1. Browser में `http://localhost:5000` खोलें।
2. "Enable Push Notifications" बटन दबाएं और Browser permission दें।
3. "Admin Testing" सेक्शन में जाकर "Send Notification" दबाएं।
4. आपको Desktop Notification आनी चाहिए।
5. **Fallback Test:** `.env` में `VAPID_PUBLIC_KEY` को गलत कर दें (simulate failure) और फिर notification भेजें। Worker इसे retry करेगा और अंत में Email भेजेगा (logs में चेक करें)।

## 4. API Endpoints

- `POST /api/subscribe`: Web push client save करने के लिए।
- `POST /api/notify`: Notification queue में डालने के लिए।
- `GET /api/notifications/:uid`: In-app notification history.

## 5. Security Notes

- `.env` को कभी git पर commit न करें।
- Production में `cors` settings को अपने frontend domain तक सीमित रखें।
- `notification_logs` टेबल को समय-समय पर clean करें।