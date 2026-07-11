"use client";

import { useEffect } from "react";
import { trackEvent } from "../../../lib/analytics";

export default function CoffeeClient() {
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;

      const message = event.data;

      if (
        !message ||
        message.source !== "coffee-game" ||
        typeof message.event !== "string"
      ) {
        return;
      }

      trackEvent(message.event, message.data ?? {});
    }

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  return (
    <main className="fixed inset-0 overflow-hidden bg-black">
      <iframe
        src="/coffee/index.html"
        title="Coffee Barista Simulator"
        className="h-full w-full border-0"
        allow="autoplay"
      />
    </main>
  );
}