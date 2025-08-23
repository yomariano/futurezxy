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
  console.log("Push data:", event.data ? event.data.text() : "No data");

  let notificationData = {};

  if (event.data) {
    try {
      notificationData = event.data.json();
      console.log("Parsed notification data:", notificationData);
    } catch (e) {
      console.warn("Failed to parse push data as JSON, using text:", e);
      notificationData = {
        title: "FutureZXY Alert",
        body: event.data.text() || "New trading signal available",
        icon: "/images/logo.png",
        badge: "/images/logo.png",
      };
    }
  } else {
    console.warn("No push data received, using defaults");
  }

  const options = {
    body: notificationData.body || "New trading signal available",
    icon: notificationData.icon || "/images/logo.png",
    badge: notificationData.badge || "/images/logo.png",
    tag: notificationData.tag || "trading-alert",
    requireInteraction: false, // Changed to false for better Chrome compatibility
    silent: false,
    vibrate: [200, 100, 200], // Add vibration for mobile devices
    data: {
      url: notificationData.url || "/signals",
      timestamp: Date.now(),
      ...notificationData.data,
    },
    actions: [
      {
        action: "view",
        title: "View Signals",
      },
      {
        action: "dismiss",
        title: "Dismiss",
      },
    ],
  };

  console.log("Showing notification with options:", options);
  const title = notificationData.title || "FutureZXY Alert";
  
  event.waitUntil(
    self.registration.showNotification(title, options)
      .then(() => {
        console.log("Notification shown successfully");
      })
      .catch((error) => {
        console.error("Error showing notification:", error);
        // Fallback: show simple notification
        return self.registration.showNotification(title, {
          body: notificationData.body || "New trading signal available",
          icon: "/images/logo.png",
        });
      })
  );
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



