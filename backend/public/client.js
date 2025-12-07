// Configuration (Public Key from .env)
// IMPORTANT: Replace this with your generated VAPID Public Key
const VAPID_PUBLIC_KEY = 'BKP_YOUR_GENERATED_PUBLIC_KEY_HERE'; 

const enablePushBtn = document.getElementById('enablePushBtn');
const pushStatus = document.getElementById('pushStatus');

// --- 1. Service Worker Registration ---
if ('serviceWorker' in navigator && 'PushManager' in window) {
    navigator.serviceWorker.register('/sw.js')
    .then(swReg => {
        console.log('SW Registered', swReg);
        checkSubscription(swReg);
    })
    .catch(err => console.error('SW Error', err));
} else {
    pushStatus.textContent = "Not Supported";
    enablePushBtn.disabled = true;
}

// --- 2. Check Subscription ---
async function checkSubscription(swReg) {
    const subscription = await swReg.pushManager.getSubscription();
    if (subscription) {
        pushStatus.textContent = "Active";
        pushStatus.className = "status active";
        enablePushBtn.textContent = "Already Subscribed";
        enablePushBtn.disabled = true;
        
        // Sync with backend (optional, ensures backend has it)
        sendSubscriptionToBackend(subscription);
    } else {
        // Bind button
        enablePushBtn.addEventListener('click', () => subscribeUser(swReg));
    }
}

// --- 3. Subscribe Flow ---
async function subscribeUser(swReg) {
    try {
        const applicationServerKey = urlB64ToUint8Array(VAPID_PUBLIC_KEY);
        const subscription = await swReg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: applicationServerKey
        });

        console.log('User is subscribed:', subscription);
        
        const success = await sendSubscriptionToBackend(subscription);
        if (success) {
            pushStatus.textContent = "Active";
            pushStatus.className = "status active";
            enablePushBtn.disabled = true;
        }
    } catch (err) {
        console.error('Failed to subscribe user: ', err);
        alert("Failed to subscribe: " + err.message);
    }
}

// --- 4. Backend Calls ---

async function sendSubscriptionToBackend(subscription) {
    const userId = document.getElementById('userId').value;
    const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, subscription })
    });
    return res.ok;
}

async function savePreferences() {
    const userId = document.getElementById('userId').value;
    const allowPush = document.getElementById('prefPush').checked;
    const allowEmail = document.getElementById('prefEmail').checked;

    await fetch('/api/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, allow_push: allowPush, allow_email: allowEmail })
    });
    alert("Preferences Saved");
}

async function triggerNotification() {
    const userId = document.getElementById('userId').value;
    const title = document.getElementById('notifTitle').value;
    const body = document.getElementById('notifBody').value;

    await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            user_id: userId, 
            title, 
            body, 
            url: window.location.href,
            type: 'promo' 
        })
    });
    alert("Notification Queued! Check console or worker logs.");
}

async function fetchHistory() {
    const userId = document.getElementById('userId').value;
    const res = await fetch(`/api/notifications/${userId}`);
    const data = await res.json();
    
    const list = document.getElementById('historyList');
    list.innerHTML = '';
    data.forEach(item => {
        const li = document.createElement('li');
        const payload = JSON.parse(item.payload);
        li.textContent = `${new Date(item.created_at).toLocaleTimeString()} - ${payload.title}: ${payload.body}`;
        list.appendChild(li);
    });
}

// --- Helper: Convert VAPID Key ---
function urlB64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}