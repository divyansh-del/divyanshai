self.addEventListener('push', function(event) {
    console.log('[Service Worker] Push Received.');
    console.log(`[Service Worker] Push had this data: "${event.data.text()}"`);
  
    let data = {};
    try {
        data = event.data.json();
    } catch (e) {
        data = { title: 'New Notification', body: event.data.text() };
    }
  
    const title = data.title || 'Notification';
    const options = {
        body: data.body || 'You have a new update.',
        icon: data.icon || 'https://via.placeholder.com/128',
        badge: data.badge || 'https://via.placeholder.com/32',
        data: {
            url: data.url || '/'
        },
        actions: [
            {action: 'open_url', title: 'Open'}
        ]
    };
  
    event.waitUntil(self.registration.showNotification(title, options));
});
  
self.addEventListener('notificationclick', function(event) {
    console.log('[Service Worker] Notification click received.');
    
    event.notification.close();
  
    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    );
});