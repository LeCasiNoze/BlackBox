import * as React from "react";
import { Download } from "lucide-react";

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type InstallAppButtonProps = {
  appName: string;
  startUrl: string;
  className?: string;
};

function manifestHref(appName: string, startUrl: string) {
  const params = new URLSearchParams({
    name: appName,
    shortName: appName,
    startUrl,
  });
  return `/api/pwa/manifest?${params.toString()}`;
}

export function InstallAppButton({
  appName,
  startUrl,
  className = "bb-button-ghost",
}: InstallAppButtonProps) {
  const [installPrompt, setInstallPrompt] =
    React.useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = React.useState(false);

  React.useEffect(() => {
    let link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "manifest";
      document.head.appendChild(link);
    }
    link.href = manifestHref(appName, startUrl);
  }, [appName, startUrl]);

  React.useEffect(() => {
    function handleBeforeInstallPrompt(event: BeforeInstallPromptEvent) {
      event.preventDefault();
      setInstallPrompt(event);
    }

    function handleInstalled() {
      setInstalled(true);
      setInstallPrompt(null);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  if (installed || !installPrompt) {
    return null;
  }

  return (
    <button
      className={className}
      onClick={async () => {
        await installPrompt.prompt();
        const choice = await installPrompt.userChoice;
        if (choice.outcome !== "dismissed") {
          setInstalled(true);
        }
        setInstallPrompt(null);
      }}
      type="button"
    >
      <Download className="mr-2 h-4 w-4" />
      Installer
    </button>
  );
}
