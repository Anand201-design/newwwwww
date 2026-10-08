import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import { LanguageProvider } from "./context/LanguageContext";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Sidebar } from "./components/Sidebar";
import { OfflineBanner } from "./components/OfflineBanner";
import { PWAInstallBanner } from "./components/PWAInstallBanner";
import { AuthModal } from "./components/AuthModal";
import { Dashboard } from "./pages/Dashboard";
import { AnalyzePlant } from "./pages/AnalyzePlant";
import { PlantResult } from "./pages/PlantResult";
import { History } from "./pages/History";
import { MyPlants } from "./pages/MyPlants";
import { CareRecommendations } from "./pages/CareRecommendations";
import { PlantProfile } from "./pages/PlantProfile";
import { PlantTalk } from "./pages/PlantTalk";
import { PlantAssistant } from "./pages/PlantAssistant";
import { FarmerVoiceAssistant } from "./pages/FarmerVoiceAssistant";
import { Settings } from "./pages/Settings";
import { tts } from "./services/speechService";
import { Leaf, Menu, User, LogIn } from "lucide-react";

const AppContent: React.FC = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();
  const { user, isAuthenticated, openAuthModal } = useAuth();

  useEffect(() => {
    tts.stop();
  }, [location.pathname, location.search]);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F6F9F5] dark:bg-[#0F231B] text-[#163A2D] dark:text-[#F1F7F3] font-sans antialiased transition-colors duration-200">
      {/* Mobile Top Header (visible on < lg) */}
      <header className="lg:hidden sticky top-0 z-40 bg-white dark:bg-[#173126] border-b border-[#DCE7DF] dark:border-[#244737] px-4 py-3 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#E4F0E7] dark:bg-[#1D3B2D] border border-[#DCE7DF] dark:border-[#244737] flex items-center justify-center text-[#176B4D] dark:text-[#8EAD9B]">
            <Leaf className="w-4 h-4" />
          </div>
          <span className="font-display font-bold text-lg text-[#163A2D] dark:text-[#F1F7F3]">
            PlantCare <span className="text-[#176B4D] dark:text-[#8EAD9B]">AI</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {isAuthenticated && user ? (
            <Link
              to="/settings"
              className="w-8 h-8 rounded-full bg-[#E4F0E7] dark:bg-[#1D3B2D] text-[#176B4D] dark:text-[#8EAD9B] border border-[#DCE7DF] dark:border-[#244737] flex items-center justify-center text-xs font-bold"
              aria-label="User profile settings"
            >
              {user.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase() || "PL"}
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => openAuthModal("login")}
              className="p-1.5 rounded-xl text-[#176B4D] dark:text-[#8EAD9B] hover:bg-[#F0F6F1] dark:hover:bg-[#1D3B2D] transition-colors"
              aria-label="Sign in"
            >
              <LogIn className="w-5 h-5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            className="p-2 rounded-xl text-[#163A2D] dark:text-[#B0C9BA] hover:bg-[#F0F6F1] dark:hover:bg-[#1D3B2D] transition-colors cursor-pointer"
            aria-label="Open navigation menu"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Desktop Fixed Sidebar (visible on lg+) */}
      <div className="hidden lg:block sticky top-0 h-screen shrink-0 overflow-y-auto">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Drawer Overlay */}
      {mobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-[#163A2D]/30 backdrop-blur-xs"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative z-10 w-64 max-w-[85vw] h-full bg-white dark:bg-[#173126] shadow-xl overflow-y-auto">
            <Sidebar onCloseMobile={() => setMobileSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Network Offline Notice */}
        <OfflineBanner />

        <main className="flex-1 min-w-0 px-4 sm:px-7 lg:px-10 py-5 sm:py-7 lg:py-8 max-w-[1440px] mx-auto w-full">
          {/* PWA Install Notification */}
          <PWAInstallBanner />

          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/analyze" element={<AnalyzePlant />} />
            <Route path="/results/:id" element={<PlantResult />} />
            <Route path="/history" element={<History />} />
            <Route path="/plants" element={<MyPlants />} />
            <Route path="/plants/:id" element={<PlantProfile />} />
            <Route path="/care" element={<CareRecommendations />} />
            <Route path="/recommendations" element={<CareRecommendations />} />
            <Route path="/plant-talk" element={<PlantTalk />} />
            <Route path="/assistant" element={<PlantAssistant />} />
            <Route path="/farmer-voice" element={<FarmerVoiceAssistant />} />
            <Route path="/kisan-voice" element={<FarmerVoiceAssistant />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      {/* Auth Modal */}
      <AuthModal />
    </div>
  );
};

export function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
