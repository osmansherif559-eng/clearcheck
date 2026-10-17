"use client";

import { useEffect, useSyncExternalStore } from "react";

type OfflineStatus = "preparing" | "ready" | "unavailable" | "unsupported" | "development";
let status: OfflineStatus = "preparing";
const listeners = new Set<() => void>();
const STATUS_MESSAGE = "CLEARCHECK_OFFLINE_STATUS";

function publish(next: OfflineStatus) {
  status = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function useOfflineStatus() {
  return useSyncExternalStore(subscribe, () => status, () => "preparing" as OfflineStatus);
}

export default function ServiceWorkerRegister() {
  useEffect(() => {
    // The shared layout currently declares an SVG Apple icon. Replace that link
    // with the real PNG, also available at Safari's conventional root URL.
    let appleIcon = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]');
    if (!appleIcon) {
      appleIcon = document.createElement("link");
      appleIcon.rel = "apple-touch-icon";
      document.head.appendChild(appleIcon);
    }
    appleIcon.href = "/apple-touch-icon.png";
    appleIcon.type = "image/png";
    appleIcon.sizes.value = "180x180";

    if (process.env.NODE_ENV !== "production") {
      publish("development");
      return;
    }
    if (!window.isSecureContext || !("serviceWorker" in navigator)) {
      publish("unsupported");
      return;
    }

    let disposed = false;
    let attempt = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let channel: MessageChannel | undefined;
    const watched = new Set<ServiceWorker>();
    const update = (next: OfflineStatus) => { if (!disposed) publish(next); };
    const check = () => {
      clearTimeout(timer);
      channel?.port1.close();
      const controller = navigator.serviceWorker.controller;
      if (!controller || new URL(controller.scriptURL).pathname !== "/sw.js") return;
      const currentAttempt = ++attempt;
      channel = new MessageChannel();
      channel.port1.onmessage = (event: MessageEvent) => {
        if (disposed || currentAttempt !== attempt) return;
        clearTimeout(timer);
        channel?.port1.close();
        const data = event.data;
        update(data?.type === STATUS_MESSAGE && data.version === "v2" && data.ready === true &&
          data.routes?.includes("/") && data.routes?.includes("/check") ? "ready" : "unavailable");
      };
      timer = setTimeout(() => update("unavailable"), 8000);
      controller.postMessage({ type: STATUS_MESSAGE }, [channel.port2]);
    };
    const stateChanged = () => {
      if ([...watched].some((worker) => worker.state === "redundant")) update("unavailable");
      check();
    };
    const watch = (worker: ServiceWorker | null) => {
      if (!worker || watched.has(worker)) return;
      watched.add(worker);
      worker.addEventListener("statechange", stateChanged);
    };
    let registration: ServiceWorkerRegistration | undefined;
    const updateFound = () => { if (registration) watch(registration.installing); };

    update("preparing");
    timer = setTimeout(() => update("unavailable"), 20000);
    navigator.serviceWorker.addEventListener("controllerchange", check);
    window.addEventListener("online", check);
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).then((result) => {
      if (disposed) return;
      registration = result;
      watch(result.installing);
      watch(result.waiting);
      registration.addEventListener("updatefound", updateFound);
      check();
    }).catch(() => update("unavailable"));

    return () => {
      disposed = true;
      clearTimeout(timer);
      channel?.port1.close();
      navigator.serviceWorker.removeEventListener("controllerchange", check);
      window.removeEventListener("online", check);
      registration?.removeEventListener("updatefound", updateFound);
      watched.forEach((worker) => worker.removeEventListener("statechange", stateChanged));
    };
  }, []);
  return null;
}
