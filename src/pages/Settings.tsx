import React, { useState, useEffect } from "react";
import {
  Settings as SettingsIcon,
  User,
  Sun,
  Moon,
  Globe,
  Volume2,
  Trash2,
  Shield,
  CheckCircle2,
  Save,
  RotateCcw,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import {
  useLanguage,
  LANGUAGE_OPTIONS,
  SupportedLanguage,
} from "../context/LanguageContext";
import {
  tts,
  getStoredSpeechSettings,
  saveStoredSpeechSettings,
  VoiceTonePreset,
} from "../services/speechService";

export const Settings: React.FC = () => {
  const { user, updateProfile, logout, isAuthenticated, openAuthModal } = useAuth();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, tr } = useLanguage();

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Speech settings state
  const [speechSettings, setSpeechSettings] = useState(() =>
    getStoredSpeechSettings()
  );
  const [isTestingVoice, setIsTestingVoice] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ name, email });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleVoiceToneChange = (tone: VoiceTonePreset) => {
    const updated = { ...speechSettings, voiceTone: tone };
    saveStoredSpeechSettings(updated);
    setSpeechSettings(updated);
  };

  const handleTestVoice = () => {
    setIsTestingVoice(true);
    tts.speak(
      language === "ta"
        ? "வணக்கம்! தாவர பராமரிப்பு குரல் உதவி சரியாக இயங்குகிறது."
        : "Hello! Botanical voice assistance is configured and ready.",
      {
        lang: language,
        onEnd: () => setIsTestingVoice(false),
        onError: () => setIsTestingVoice(false),
      }
    );
  };

  const handleClearCache = () => {
    if (
      window.confirm(
        tr("Clear local plant diagnostic history and cached offline data?")
      )
    ) {
      localStorage.removeItem("plantcare_cached_plants");
      localStorage.removeItem("plantcare_cached_history");
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E4F0E7] dark:bg-[#1D3B2D] text-[#176B4D] dark:text-[#8EAD9B] text-xs font-semibold mb-2">
          <SettingsIcon className="w-3.5 h-3.5" />
          <span>{tr("Preferences & Profile")}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#163A2D] dark:text-[#F1F7F3]">
          {tr("App Settings")}
        </h1>
        <p className="text-xs sm:text-sm text-[#668074] dark:text-[#8EAD9B] mt-1">
          {tr(
            "Customize interface language, speech prosody, theme, and profile data."
          )}
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{tr("Settings updated successfully!")}</span>
        </div>
      )}

      {/* Profile Section */}
      <div className="bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E4F0E7] dark:bg-[#1D3B2D] text-[#176B4D] dark:text-[#8EAD9B] flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-base text-[#163A2D] dark:text-[#F1F7F3]">
                {tr("Account & User Profile")}
              </h2>
              <p className="text-xs text-[#668074] dark:text-[#8EAD9B]">
                {isAuthenticated
                  ? tr("Manage your garden profile details")
                  : tr("Sign in to sync your diagnostic records across devices")}
              </p>
            </div>
          </div>

          {!isAuthenticated && (
            <button
              type="button"
              onClick={() => openAuthModal("login")}
              className="px-3.5 py-1.5 rounded-xl bg-[#176B4D] text-white text-xs font-semibold hover:bg-[#12563D] transition-colors cursor-pointer"
            >
              {tr("Sign In")}
            </button>
          )}
        </div>

        {isAuthenticated ? (
          <form onSubmit={handleSaveProfile} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5">
                  {tr("Full Name")}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE7DF] dark:border-[#244737] bg-[#F6F9F5] dark:bg-[#12281E] text-xs text-[#163A2D] dark:text-[#F1F7F3] focus:outline-hidden focus:border-[#176B4D]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5">
                  {tr("Email Address")}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE7DF] dark:border-[#244737] bg-[#F6F9F5] dark:bg-[#12281E] text-xs text-[#163A2D] dark:text-[#F1F7F3] focus:outline-hidden focus:border-[#176B4D]"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={logout}
                className="text-xs text-rose-600 hover:underline cursor-pointer"
              >
                {tr("Sign Out")}
              </button>

              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#176B4D] text-white text-xs font-bold hover:bg-[#12563D] transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{tr("Save Changes")}</span>
              </button>
            </div>
          </form>
        ) : null}
      </div>

      {/* Language & Theme Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Language Selection */}
        <div className="bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5">
            <Globe className="w-5 h-5 text-[#176B4D] dark:text-[#8EAD9B]" />
            <div>
              <h2 className="font-display font-bold text-base text-[#163A2D] dark:text-[#F1F7F3]">
                {tr("Language / மொழி")}
              </h2>
              <p className="text-xs text-[#668074] dark:text-[#8EAD9B]">
                {tr("Select your preferred dialect and voice language")}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
            {LANGUAGE_OPTIONS.map((opt) => (
              <button
                key={opt.code}
                type="button"
                onClick={() => setLanguage(opt.code)}
                className={`p-3 rounded-2xl border text-left text-xs font-semibold transition-all cursor-pointer flex items-center justify-between ${
                  language === opt.code
                    ? "border-[#176B4D] dark:border-[#8EAD9B] bg-[#E4F0E7]/60 dark:bg-[#1D3B2D]/60 text-[#176B4D] dark:text-[#8EAD9B]"
                    : "border-[#DCE7DF] dark:border-[#244737] bg-[#F6F9F5] dark:bg-[#12281E] text-[#163A2D] dark:text-[#F1F7F3] hover:border-[#176B4D]/40"
                }`}
              >
                <span>{opt.label}</span>
                {language === opt.code && <span>✓</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Theme Preference */}
        <div className="bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5">
            <Sun className="w-5 h-5 text-[#176B4D] dark:text-[#8EAD9B]" />
            <div>
              <h2 className="font-display font-bold text-base text-[#163A2D] dark:text-[#F1F7F3]">
                {tr("Appearance & Theme")}
              </h2>
              <p className="text-xs text-[#668074] dark:text-[#8EAD9B]">
                {tr("Choose light, dark, or system mode")}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setTheme("light")}
              className={`p-3 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                theme === "light"
                  ? "border-[#176B4D] dark:border-[#8EAD9B] bg-[#E4F0E7]/60 text-[#176B4D]"
                  : "border-[#DCE7DF] dark:border-[#244737] bg-[#F6F9F5] dark:bg-[#12281E] text-[#163A2D] dark:text-[#F1F7F3]"
              }`}
            >
              <Sun className="w-4 h-4" />
              <span>{tr("Light Mode")}</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme("dark")}
              className={`p-3 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                theme === "dark"
                  ? "border-[#176B4D] dark:border-[#8EAD9B] bg-[#1D3B2D] text-[#8EAD9B]"
                  : "border-[#DCE7DF] dark:border-[#244737] bg-[#F6F9F5] dark:bg-[#12281E] text-[#163A2D] dark:text-[#F1F7F3]"
              }`}
            >
              <Moon className="w-4 h-4" />
              <span>{tr("Dark Mode")}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Voice Assistant Prosody & Testing */}
      <div className="bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E4F0E7] dark:bg-[#1D3B2D] text-[#176B4D] dark:text-[#8EAD9B] flex items-center justify-center">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-base text-[#163A2D] dark:text-[#F1F7F3]">
                {tr("Speech Synthesis & Voice Tone")}
              </h2>
              <p className="text-xs text-[#668074] dark:text-[#8EAD9B]">
                {tr("Configure speech rate, pitch, and soothing botanical voice tone")}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleTestVoice}
            disabled={isTestingVoice}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#E4F0E7] dark:bg-[#1D3B2D] text-[#176B4D] dark:text-[#8EAD9B] hover:bg-[#D4E8DA] text-xs font-semibold transition-colors cursor-pointer"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>{isTestingVoice ? tr("Playing...") : tr("Test Voice")}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {[
            { id: "soft-clear", label: "Soft & Clear", desc: "Default balanced tone" },
            { id: "warm-calm", label: "Warm & Calm", desc: "Slightly slower gentle pace" },
            { id: "natural-balanced", label: "Natural Dynamic", desc: "Standard speech rate" },
          ].map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleVoiceToneChange(preset.id as VoiceTonePreset)}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                speechSettings.voiceTone === preset.id
                  ? "border-[#176B4D] dark:border-[#8EAD9B] bg-[#E4F0E7]/60 dark:bg-[#1D3B2D]/60 ring-2 ring-[#176B4D]/30"
                  : "border-[#DCE7DF] dark:border-[#244737] bg-[#F6F9F5] dark:bg-[#12281E]"
              }`}
            >
              <span className="font-bold text-xs text-[#163A2D] dark:text-[#F1F7F3] block">
                {preset.label}
              </span>
              <span className="text-[11px] text-[#668074] dark:text-[#8EAD9B]">
                {preset.desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Storage Management */}
      <div className="bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] rounded-3xl p-6 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-sm text-[#163A2D] dark:text-[#F1F7F3]">
            {tr("Offline Cache & Temporary Diagnostics")}
          </h2>
          <p className="text-xs text-[#668074] dark:text-[#8EAD9B]">
            {tr("Reset local temporary storage if experiencing sync anomalies")}
          </p>
        </div>
        <button
          type="button"
          onClick={handleClearCache}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{tr("Reset Cache")}</span>
        </button>
      </div>
    </div>
  );
};
