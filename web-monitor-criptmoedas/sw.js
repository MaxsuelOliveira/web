self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        const existingClient = clients[0];

        if (existingClient) {
          existingClient.focus();
          return existingClient.navigate(event.notification.data?.url ?? "./");
        }

        return self.clients.openWindow(event.notification.data?.url ?? "./");
      }),
  );
});
