import React, { useState } from "react";
import { X, Sprout, Mail, User, ArrowRight, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    authModalMode,
    openAuthModal,
    closeAuthModal,
    login,
    signup,
    continueAsGuest,
  } = useAuth();
  const { tr } = useLanguage();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !email.includes("@")) {
      setError(tr("Please provide a valid email address."));
      return;
    }

    if (authModalMode === "signup" && !name.trim()) {
      setError(tr("Please enter your name."));
      return;
    }

    setLoading(true);
    try {
      if (authModalMode === "signup") {
        await signup(name, email);
      } else {
        await login(email, name);
      }
    } catch {
      setError(tr("Authentication failed. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-md bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-[#163A2D] dark:text-[#F1F7F3]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E4F0E7] dark:bg-[#1D3B2D] border border-[#DCE7DF] dark:border-[#244737] flex items-center justify-center text-[#176B4D] dark:text-[#8EAD9B]">
              <Sprout className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-[#163A2D] dark:text-[#F1F7F3]">
                {authModalMode === "signup" ? tr("Create Account") : tr("Sign In")}
              </h2>
              <p className="text-xs text-[#668074] dark:text-[#8EAD9B]">
                {authModalMode === "signup"
                  ? tr("Save your garden collection and synced diagnostics")
                  : tr("Access your personalized crop and plant records")}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeAuthModal}
            className="p-1.5 text-[#668074] hover:text-[#163A2D] dark:text-[#8EAD9B] dark:hover:text-[#F1F7F3] rounded-xl hover:bg-[#F0F6F1] dark:hover:bg-[#1D3B2D] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {authModalMode === "signup" && (
            <div>
              <label className="block text-xs font-semibold text-[#163A2D] dark:text-[#F1F7F3] mb-1.5">
                {tr("Full Name")}
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#668074] dark:text-[#8EAD9B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Maya Chen"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#DCE7DF] dark:border-[#244737] bg-[#F6F9F5] dark:bg-[#12281E] text-xs text-[#163A2D] dark:text-[#F1F7F3] placeholder:text-[#668074]/60 dark:placeholder:text-[#8EAD9B]/60 focus:outline-hidden focus:border-[#176B4D] dark:focus:border-[#8EAD9B]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#163A2D] dark:text-[#F1F7F3] mb-1.5">
              {tr("Email Address")}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#668074] dark:text-[#8EAD9B] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#DCE7DF] dark:border-[#244737] bg-[#F6F9F5] dark:bg-[#12281E] text-xs text-[#163A2D] dark:text-[#F1F7F3] placeholder:text-[#668074]/60 dark:placeholder:text-[#8EAD9B]/60 focus:outline-hidden focus:border-[#176B4D] dark:focus:border-[#8EAD9B]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-[#176B4D] hover:bg-[#12563D] text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
          >
            <span>{authModalMode === "signup" ? tr("Sign Up") : tr("Sign In")}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="flex flex-col items-center gap-3 pt-2 text-xs">
          <button
            type="button"
            onClick={() =>
              openAuthModal(authModalMode === "signup" ? "login" : "signup")
            }
            className="text-[#176B4D] dark:text-[#8EAD9B] hover:underline font-medium cursor-pointer"
          >
            {authModalMode === "signup"
              ? tr("Already have an account? Sign in")
              : tr("Need an account? Sign up")}
          </button>

          <button
            type="button"
            onClick={continueAsGuest}
            className="text-[#668074] dark:text-[#8EAD9B] hover:underline text-[11px] cursor-pointer"
          >
            {tr("Continue as Guest (offline storage only)")}
          </button>
        </div>
      </div>
    </div>
  );
};
