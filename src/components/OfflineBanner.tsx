import React, { useState, useEffect } from "react";
import { WifiOff, RefreshCw } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export const OfflineBanner: React.FC = () => {
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== "undefined" ? !navigator.onLine : false
  );
  const { tr } = useLanguage();

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <aside
      aria-label="Offline Mode Notification"
      className="bg-amber-500 dark:bg-amber-600 text-white px-4 py-2 text-xs sm:text-sm font-medium flex items-center justify-between gap-3 shadow-md z-30"
    >
      <div className="flex items-center gap-2">
        <WifiOff className="w-4 h-4 shrink-0" />
        <span>
          {tr("You are currently offline. Viewing cached plant profiles and diagnostic history.")}
        </span>
      </div>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-semibold cursor-pointer shrink-0 transition-colors"
      >
        <RefreshCw className="w-3 h-3" />
        <span>{tr("Reconnect")}</span>
      </button>
    </aside>
  );
};
