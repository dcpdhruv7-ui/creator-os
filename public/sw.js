self.addEventListener("push", (event) => {
  let payload = {
    title: "Creator OS",
    body: "You have a new Creator OS reminder.",
    url: "/dashboard",
  };

  if (event.data) {
    try {
      payload = { ...payload, ...event.data.json() };
    } catch {
      payload.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/creator-os-icon.svg",
      badge: "/creator-os-icon.svg",
      data: {
        url: payload.url || "/dashboard",
      },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const existingClient = clients.find((client) => client.url.includes(self.location.origin));

      if (existingClient) {
        existingClient.focus();
        existingClient.navigate(url);
        return;
      }

      return self.clients.openWindow(url);
    }),
  );
});
