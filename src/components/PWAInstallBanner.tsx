import React, { useState } from "react";
import { Download, Share2, PlusSquare, X, Smartphone, Check } from "lucide-react";
import { usePWAInstall } from "../hooks/usePWAInstall";
import { useLanguage } from "../context/LanguageContext";
import { safeSessionStorage } from "../utils/safeStorage";

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, showIOSGuide, setShowIOSGuide, installApp } =
    usePWAInstall();
  const { tr } = useLanguage();
  const [dismissed, setDismissed] = useState(() => {
    try {
      return safeSessionStorage.getItem("plantcare_pwa_dismissed") === "true";
    } catch {
      return false;
    }
  });

  if (isInstalled || !isInstallable || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    try {
      safeSessionStorage.setItem("plantcare_pwa_dismissed", "true");
    } catch {
      // ignore
    }
  };

  return (
    <>
      {/* Non-intrusive Top/Bottom Floating Banner */}
      <div className="relative bg-gradient-to-r from-[#176B4D] to-[#12563D] text-white px-4 py-2.5 rounded-2xl mx-4 sm:mx-6 mb-4 shadow-lg flex flex-wrap items-center justify-between gap-3 border border-[#4EBA88]/30">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
            <Smartphone className="w-4.5 h-4.5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-semibold truncate">
              {tr("Install PlantCare AI on your device")}
            </p>
            <p className="text-[11px] text-white/80 hidden sm:block truncate">
              {tr("Instant access, offline diagnosis viewing, and native mobile experience")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-auto">
          <button
            type="button"
            onClick={installApp}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-[#176B4D] hover:bg-[#F0F6F1] text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isIOS ? tr("Install Guide") : tr("Install App")}</span>
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* iOS Safari Guided Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] rounded-3xl p-6 max-w-sm w-full space-y-5 shadow-2xl text-[#163A2D] dark:text-[#F1F7F3]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#E4F0E7] dark:bg-[#1D3B2D] text-[#176B4D] dark:text-[#8EAD9B] flex items-center justify-center font-bold">
                  🌱
                </div>
                <h3 className="font-display font-bold text-base">
                  {tr("Install on iOS / Safari")}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="p-1 text-[#668074] dark:text-[#B0C9BA] hover:text-[#163A2D] rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#668074] dark:text-[#B0C9BA]">
              {tr(
                "Follow these simple steps in Safari to add PlantCare AI to your iPhone or iPad home screen:"
              )}
            </p>

            <ol className="space-y-3 text-xs">
              <li className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[#F6F9F5] dark:bg-[#12281E]">
                <div className="w-6 h-6 rounded-lg bg-[#E4F0E7] dark:bg-[#1D3B2D] text-[#176B4D] dark:text-[#8EAD9B] flex items-center justify-center shrink-0 font-bold text-[11px]">
                  1
                </div>
                <div className="flex-1">
                  <span className="font-semibold block">{tr("Tap the Share button")}</span>
                  <span className="text-[#668074] dark:text-[#B0C9BA] inline-flex items-center gap-1 mt-0.5">
                    {tr("Located in your Safari toolbar:")} <Share2 className="w-3.5 h-3.5 inline text-[#176B4D]" />
                  </span>
                </div>
              </li>

              <li className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[#F6F9F5] dark:bg-[#12281E]">
                <div className="w-6 h-6 rounded-lg bg-[#E4F0E7] dark:bg-[#1D3B2D] text-[#176B4D] dark:text-[#8EAD9B] flex items-center justify-center shrink-0 font-bold text-[11px]">
                  2
                </div>
                <div className="flex-1">
                  <span className="font-semibold block">{tr("Select 'Add to Home Screen'")}</span>
                  <span className="text-[#668074] dark:text-[#B0C9BA] inline-flex items-center gap-1 mt-0.5">
                    {tr("Scroll down the menu:")} <PlusSquare className="w-3.5 h-3.5 inline text-[#176B4D]" />
                  </span>
                </div>
              </li>

              <li className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[#F6F9F5] dark:bg-[#12281E]">
                <div className="w-6 h-6 rounded-lg bg-[#E4F0E7] dark:bg-[#1D3B2D] text-[#176B4D] dark:text-[#8EAD9B] flex items-center justify-center shrink-0 font-bold text-[11px]">
                  3
                </div>
                <div className="flex-1">
                  <span className="font-semibold block">{tr("Tap 'Add' in the top right")}</span>
                  <span className="text-[#668074] dark:text-[#B0C9BA]">
                    {tr("PlantCare AI is now available as a full screen app.")}
                  </span>
                </div>
              </li>
            </ol>

            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2.5 rounded-xl bg-[#176B4D] text-white text-xs font-semibold cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{tr("Got it")}</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};
