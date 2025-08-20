// Service Worker for Push Notifications
const CACHE_NAME = "futurezxy-v1";
const urlsToCache = ["/", "/signals", "/analytics", "/settings", "/billing"];

// Install event - cache resources
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

// Fetch event - serve from cache when offline
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version or fetch from network
      return response || fetch(event.request);
    })
  );
});

// Push event - handle incoming push notifications
self.addEventListener("push", (event) => {
  console.log("Push event received:", event);

  let notificationData = {};

  if (event.data) {
    try {
      notificationData = event.data.json();
    } catch (e) {
      notificationData = {
        title: "FutureZXY Alert",
        body: event.data.text() || "New trading signal available",
        icon: "/images/logo.png",
        badge: "/images/logo.png",
      };
    }
  }

  const options = {
    title: notificationData.title || "FutureZXY Alert",
    body: notificationData.body || "New trading signal available",
    icon: notificationData.icon || "/images/logo.png",
    badge: notificationData.badge || "/images/logo.png",
    tag: notificationData.tag || "trading-alert",
    requireInteraction: true,
    data: {
      url: notificationData.url || "/signals",
      timestamp: Date.now(),
      ...notificationData.data,
    },
    actions: [
      {
        action: "view",
        title: "View Signals",
        icon: "/images/logo.png",
      },
      {
        action: "dismiss",
        title: "Dismiss",
      },
    ],
  };

  event.waitUntil(self.registration.showNotification(options.title, options));
});

// Notification click event
self.addEventListener("notificationclick", (event) => {
  console.log("Notification click received:", event);

  event.notification.close();

  if (event.action === "dismiss") {
    return;
  }

  const urlToOpen = event.notification.data?.url || "/signals";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && "focus" in client) {
            return client.focus();
          }
        }

        // Open new window/tab if app not open
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Background sync for offline actions
self.addEventListener("sync", (event) => {
  if (event.tag === "background-sync") {
    event.waitUntil(doBackgroundSync());
  }
});

function doBackgroundSync() {
  // Handle any pending actions when coming back online
  return Promise.resolve();
}



