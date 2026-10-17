"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Icon from "@/components/ui/Icon";
import { useOfflineStatus } from "./ServiceWorkerRegister";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

function subscribeDisplay(listener: () => void) {
  const media = window.matchMedia("(display-mode: standalone)");
  media.addEventListener("change", listener);
  window.addEventListener("appinstalled", listener);
  return () => {
    media.removeEventListener("change", listener);
    window.removeEventListener("appinstalled", listener);
  };
}

const offlineCopy = {
  preparing: "Preparing offline access… Keep this page open while the app files are saved.",
  ready: "Offline ready: Home and Check can be reloaded without a connection. Analysis stays on this device. Browser storage can be cleared or evicted.",
  unavailable: "Offline access is not confirmed. Reconnect and reload to retry; keep this page open until it says offline ready.",
  unsupported: "Offline saving is unavailable in this browser or connection. Use HTTPS and a browser with service worker support.",
  development: "Offline saving is disabled in development. Use a production build over HTTPS (or localhost) to check it.",
};

export default function InstallPrompt() {
  const offlineStatus = useOfflineStatus();
  const standalone = useSyncExternalStore(subscribeDisplay, isStandalone, () => false);
  const [installed, setInstalled] = useState(false);
  const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [installMessage, setInstallMessage] = useState("");

  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallEvent);
      setInstallMessage("");
    };
    const didInstall = () => {
      setInstalled(true);
      setInstallEvent(null);
      setInstallMessage("ClearCheck was added to this device.");
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", didInstall);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", didInstall);
    };
  }, []);

  async function install() {
    if (!installEvent || installing) return;
    const event = installEvent;
    setInstallEvent(null); // Browser install events are single use.
    setInstalling(true);
    try {
      await event.prompt();
      const { outcome } = await event.userChoice;
      setInstallMessage(outcome === "accepted" ? "Install request accepted. Your browser will finish adding ClearCheck." : "Install dismissed. You can still use ClearCheck in this browser.");
    } catch {
      setInstallMessage("The install prompt could not open. Use your browser menu to add ClearCheck instead.");
    } finally {
      setInstalling(false);
    }
  }

  if (dismissed) return null;

  return (
    <aside className="install-prompt" aria-label="ClearCheck offline access and installation">
      <span className="install-icon"><Icon name="shield-check" size={18} /></span>
      <span>
        <strong>{standalone || installed ? "ClearCheck on this device" : "Keep ClearCheck close"}</strong>
        <small role="status" aria-live="polite">{offlineCopy[offlineStatus]}</small>
      </span>
      {installEvent && !standalone && !installed && <button type="button" onClick={install} disabled={installing}>Install</button>}
      <button className="install-dismiss" type="button" onClick={() => setDismissed(true)} aria-label="Dismiss offline and install guidance"><Icon name="x" size={16} /></button>
      <div className="install-details">
        {installMessage && <p role="status">{installMessage}</p>}
        {!standalone && !installed && <details>
          <summary>Add to your home screen</summary>
          <p>Android: in Chrome, open the menu (⋮), then choose <strong>Install app</strong> or <strong>Add to Home screen</strong> when available.</p>
          <p>iPhone or iPad: open this site in Safari, tap <strong>Share</strong>, then <strong>Add to Home Screen</strong> and <strong>Add</strong>. You may need to scroll through the Share actions.</p>
          <p>Desktop: use your browser’s install icon or menu when offered. Options vary by browser. This installs the web app; no app store download is required. Installation alone does not confirm offline readiness.</p>
        </details>}
      </div>
    </aside>
  );
}
