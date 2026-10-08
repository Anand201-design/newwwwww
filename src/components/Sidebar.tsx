import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Sprout,
  Stethoscope,
  Leaf,
  History,
  Sparkles,
  Settings,
  Sun,
  Moon,
  ChevronDown,
  Globe,
  X,
  Download,
  LogIn,
  LogOut,
  User,
} from "lucide-react";
import { useLanguage, SupportedLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { usePWAInstall } from "../hooks/usePWAInstall";

interface SidebarProps {
  onCloseMobile?: () => void;
  onOpenCareModal?: () => void;
  onOpenMyPlantsModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { language, setLanguage, t, tr } = useLanguage();
  const { setTheme, resolvedTheme } = useTheme();
  const { user, isAuthenticated, logout, openAuthModal } = useAuth();
  const { isInstallable, isInstalled, installApp } = usePWAInstall();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const navItems = [
    {
      to: "/dashboard",
      label: t.navDashboard,
      icon: LayoutDashboard,
    },
    {
      to: "/analyze?mode=identify",
      label: t.navIdentify,
      icon: Sprout,
    },
    {
      to: "/analyze?mode=disease",
      label: t.navDisease,
      icon: Stethoscope,
    },
    {
      to: "/plants",
      label: t.navMyPlants,
      icon: Leaf,
    },
    {
      to: "/history",
      label: t.navHistory,
      icon: History,
    },
    {
      to: "/care",
      label: t.navCare,
      icon: Sparkles,
    },
    {
      to: "/plant-talk",
      label: t.navPlantTalk,
      icon: Sprout,
    },
    {
      to: "/farmer-voice",
      label: "Aira Voice Assistant",
      badge: "🌾 Aira",
      icon: Sprout,
    },
    {
      to: "/assistant",
      label: t.navAssistant,
      icon: Sprout,
    },
    {
      to: "/settings",
      label: t.navSettings,
      icon: Settings,
    },
  ];

  const handleItemClick = () => {
    if (onCloseMobile) onCloseMobile();
  };

  const renderNavIcon = (to: string, active: boolean) => {
    const baseClass = `w-7 h-7 shrink-0 transition-transform duration-200 group-hover/nav:scale-105 ${
      active
        ? "text-[#176B4D] dark:text-[#8EAD9B]"
        : "text-[#527062] dark:text-[#9AB8A8] group-hover/nav:text-[#176B4D] dark:group-hover/nav:text-[#F1F7F3]"
    }`;

    switch (to) {
      case "/dashboard":
        return (
          <svg
            viewBox="0 0 28 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={baseClass}
          >
            <rect
              x="1"
              y="1"
              width="26"
              height="26"
              rx="8"
              className={
                active
                  ? "fill-[#176B4D]/14 dark:fill-[#8EAD9B]/20 stroke-[#176B4D]/30 dark:stroke-[#8EAD9B]/35"
                  : "fill-[#F0F6F1] dark:fill-[#1D3B2D]/70 stroke-[#DCE7DF] dark:stroke-[#244737]"
              }
              strokeWidth="1"
            />
            <rect
              x="6.5"
              y="6.5"
              width="6.5"
              height="6.5"
              rx="2"
              fill="currentColor"
              fillOpacity={active ? "0.28" : "0.16"}
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <rect
              x="15"
              y="6.5"
              width="6.5"
              height="6.5"
              rx="2"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <rect
              x="6.5"
              y="15"
              width="6.5"
              height="6.5"
              rx="2"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M15.5 20.5C15.5 17.2 17.8 15.2 21.2 15.2C21.2 18.6 19.2 20.8 15.5 20.5Z"
              fill="currentColor"
              fillOpacity={active ? "0.3" : "0.18"}
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );

      case "/analyze?mode=identify":
        return (
          <svg
            viewBox="0 0 28 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={baseClass}
          >
            <rect
              x="1"
              y="1"
              width="26"
              height="26"
              rx="8"
              className={
                active
                  ? "fill-[#176B4D]/14 dark:fill-[#8EAD9B]/20 stroke-[#176B4D]/30 dark:stroke-[#8EAD9B]/35"
                  : "fill-[#F0F6F1] dark:fill-[#1D3B2D]/70 stroke-[#DCE7DF] dark:stroke-[#244737]"
              }
              strokeWidth="1"
            />
            {/* Viewfinder corners */}
            <path
              d="M6.5 9.5V8C6.5 7.17 7.17 6.5 8 6.5H9.5M18.5 6.5H20C20.83 6.5 21.5 7.17 21.5 8V9.5M21.5 18.5V20C21.5 20.83 20.83 21.5 20 21.5H18.5M9.5 21.5H8C7.17 21.5 6.5 20.83 6.5 20V18.5"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeOpacity="0.65"
            />
            {/* Botanical sprout */}
            <path
              d="M14 20V12.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d="M14 14.5C14 11.2 16.5 9.2 19.5 9.5C19.5 12.5 17.3 14.5 14 14.5Z"
              fill="currentColor"
              fillOpacity={active ? "0.3" : "0.18"}
              stroke="currentColor"
              strokeWidth="1.45"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M14 16C14 13.5 11.8 11.8 9 12C9 14.6 11.1 16 14 16Z"
              stroke="currentColor"
              strokeWidth="1.45"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );

      case "/analyze?mode=disease":
        return (
          <svg
            viewBox="0 0 28 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={baseClass}
          >
            <rect
              x="1"
              y="1"
              width="26"
              height="26"
              rx="8"
              className={
                active
                  ? "fill-[#176B4D]/14 dark:fill-[#8EAD9B]/20 stroke-[#176B4D]/30 dark:stroke-[#8EAD9B]/35"
                  : "fill-[#F0F6F1] dark:fill-[#1D3B2D]/70 stroke-[#DCE7DF] dark:stroke-[#244737]"
              }
              strokeWidth="1"
            />
            {/* Leaf silhouette */}
            <path
              d="M8.5 19.5C7.5 13.5 11.5 8 19.5 7.5C20 15.5 14.5 19.5 8.5 19.5Z"
              fill="currentColor"
              fillOpacity={active ? "0.26" : "0.15"}
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Vein + vital pulse */}
            <path
              d="M8 20L12.5 15.5L14.2 17L16.5 13.2L18 14.2"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Diagnostic indicator dot */}
            <circle
              cx="18.5"
              cy="18.5"
              r="2.5"
              className="fill-[#C96F62]/25 stroke-[#C96F62]"
              strokeWidth="1.4"
            />
          </svg>
        );

      case "/plants":
        return (
          <svg
            viewBox="0 0 28 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={baseClass}
          >
            <rect
              x="1"
              y="1"
              width="26"
              height="26"
              rx="8"
              className={
                active
                  ? "fill-[#176B4D]/14 dark:fill-[#8EAD9B]/20 stroke-[#176B4D]/30 dark:stroke-[#8EAD9B]/35"
                  : "fill-[#F0F6F1] dark:fill-[#1D3B2D]/70 stroke-[#DCE7DF] dark:stroke-[#244737]"
              }
              strokeWidth="1"
            />
            {/* Ceramic planter */}
            <path
              d="M9.5 16.5H18.5L17.4 21C17.25 21.6 16.7 22 16.1 22H11.9C11.3 22 10.75 21.6 10.6 21L9.5 16.5Z"
              fill="currentColor"
              fillOpacity={active ? "0.28" : "0.16"}
              stroke="currentColor"
              strokeWidth="1.45"
              strokeLinejoin="round"
            />
            {/* Left & right leaves */}
            <path
              d="M14 16.5V10.5M14 13.5C14 10.2 16.6 8 20 8.2C20 11.4 17.5 13.5 14 13.5ZM14 14.5C14 11.5 11.6 9.5 8.5 9.8C8.5 12.6 10.8 14.5 14 14.5Z"
              stroke="currentColor"
              strokeWidth="1.45"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );

      case "/history":
        return (
          <svg
            viewBox="0 0 28 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={baseClass}
          >
            <rect
              x="1"
              y="1"
              width="26"
              height="26"
              rx="8"
              className={
                active
                  ? "fill-[#176B4D]/14 dark:fill-[#8EAD9B]/20 stroke-[#176B4D]/30 dark:stroke-[#8EAD9B]/35"
                  : "fill-[#F0F6F1] dark:fill-[#1D3B2D]/70 stroke-[#DCE7DF] dark:stroke-[#244737]"
              }
              strokeWidth="1"
            />
            <circle
              cx="14"
              cy="14"
              r="7"
              fill="currentColor"
              fillOpacity={active ? "0.22" : "0.12"}
            />
            <path
              d="M8.2 10.5C9.4 8.4 11.5 7 14 7C17.87 7 21 10.13 21 14C21 17.87 17.87 21 14 21C10.6 21 7.77 18.58 7.14 15.36"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d="M7 7.5V10.8H10.3"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M14 10.5V14.2L16.6 15.8"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );

      case "/care":
        return (
          <svg
            viewBox="0 0 28 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={baseClass}
          >
            <rect
              x="1"
              y="1"
              width="26"
              height="26"
              rx="8"
              className={
                active
                  ? "fill-[#176B4D]/14 dark:fill-[#8EAD9B]/20 stroke-[#176B4D]/30 dark:stroke-[#8EAD9B]/35"
                  : "fill-[#F0F6F1] dark:fill-[#1D3B2D]/70 stroke-[#DCE7DF] dark:stroke-[#244737]"
              }
              strokeWidth="1"
            />
            {/* Botanical water droplet */}
            <path
              d="M12.5 7.5C12.5 7.5 17.5 12.6 17.5 16.2C17.5 18.96 15.26 21.2 12.5 21.2C9.74 21.2 7.5 18.96 7.5 16.2C7.5 12.6 12.5 7.5 12.5 7.5Z"
              fill="currentColor"
              fillOpacity={active ? "0.28" : "0.16"}
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Aesthetic sparkle star */}
            <path
              d="M19.5 6.8L20.1 8.6L21.9 9.2L20.1 9.8L19.5 11.6L18.9 9.8L17.1 9.2L18.9 8.6L19.5 6.8Z"
              fill="currentColor"
            />
          </svg>
        );

      case "/plant-talk":
        return (
          <svg
            viewBox="0 0 28 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={baseClass}
          >
            <rect
              x="1"
              y="1"
              width="26"
              height="26"
              rx="8"
              className={
                active
                  ? "fill-[#176B4D]/14 dark:fill-[#8EAD9B]/20 stroke-[#176B4D]/30 dark:stroke-[#8EAD9B]/35"
                  : "fill-[#F0F6F1] dark:fill-[#1D3B2D]/70 stroke-[#DCE7DF] dark:stroke-[#244737]"
              }
              strokeWidth="1"
            />
            {/* Friendly leaf with speech wave */}
            <path
              d="M8.5 19.5C8 13.8 11.5 8.5 18.5 8C19 15 14 19.5 8.5 19.5Z"
              fill="currentColor"
              fillOpacity={active ? "0.28" : "0.16"}
              stroke="currentColor"
              strokeWidth="1.45"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M8.5 19.5L13.5 14.5"
              stroke="currentColor"
              strokeWidth="1.35"
              strokeLinecap="round"
            />
            {/* Soft voice arcs */}
            <path
              d="M19.2 13.5C20.2 14.3 20.2 15.8 19.2 16.6M21.2 12C22.8 13.5 22.8 16.6 21.2 18.1"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
        );

      case "/farmer-voice":
        return (
          <svg
            viewBox="0 0 28 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={baseClass}
          >
            <rect
              x="1"
              y="1"
              width="26"
              height="26"
              rx="8"
              className={
                active
                  ? "fill-[#176B4D]/14 dark:fill-[#8EAD9B]/20 stroke-[#176B4D]/30 dark:stroke-[#8EAD9B]/35"
                  : "fill-[#F0F6F1] dark:fill-[#1D3B2D]/70 stroke-[#DCE7DF] dark:stroke-[#244737]"
              }
              strokeWidth="1"
            />
            {/* Microphone glyph */}
            <path
              d="M14 6.5C12.34 6.5 11 7.84 11 9.5V14C11 15.66 12.34 17 14 17C15.66 17 17 15.66 17 14V9.5C17 7.84 15.66 6.5 14 6.5Z"
              fill="currentColor"
              fillOpacity={active ? "0.3" : "0.18"}
              stroke="currentColor"
              strokeWidth="1.45"
            />
            <path
              d="M8.5 13C8.5 16 10.96 18.5 14 18.5C17.04 18.5 19.5 16 19.5 13M14 18.5V21.5M11 21.5H17"
              stroke="currentColor"
              strokeWidth="1.45"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );

      case "/assistant":
        return (
          <svg
            viewBox="0 0 28 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={baseClass}
          >
            <rect
              x="1"
              y="1"
              width="26"
              height="26"
              rx="8"
              className={
                active
                  ? "fill-[#176B4D]/14 dark:fill-[#8EAD9B]/20 stroke-[#176B4D]/30 dark:stroke-[#8EAD9B]/35"
                  : "fill-[#F0F6F1] dark:fill-[#1D3B2D]/70 stroke-[#DCE7DF] dark:stroke-[#244737]"
              }
              strokeWidth="1"
            />
            {/* Chat bubble with botanical sprout */}
            <path
              d="M7 10C7 8.34 8.34 7 10 7H18C19.66 7 21 8.34 21 10V15.5C21 17.16 19.66 18.5 18 18.5H12.2L8.5 21.2V18.5C7.67 18.15 7 17.3 7 15.5V10Z"
              fill="currentColor"
              fillOpacity={active ? "0.26" : "0.14"}
              stroke="currentColor"
              strokeWidth="1.45"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M14 15.8V11.5M14 13.2C14 11.1 15.6 9.8 17.5 10C17.5 11.9 16 13.2 14 13.2ZM14 13.8C14 12 12.6 10.9 10.8 11.1C10.8 12.7 12.1 13.8 14 13.8Z"
              stroke="currentColor"
              strokeWidth="1.35"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );

      case "/settings":
      default:
        return (
          <svg
            viewBox="0 0 28 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={baseClass}
          >
            <rect
              x="1"
              y="1"
              width="26"
              height="26"
              rx="8"
              className={
                active
                  ? "fill-[#176B4D]/14 dark:fill-[#8EAD9B]/20 stroke-[#176B4D]/30 dark:stroke-[#8EAD9B]/35"
                  : "fill-[#F0F6F1] dark:fill-[#1D3B2D]/70 stroke-[#DCE7DF] dark:stroke-[#244737]"
              }
              strokeWidth="1"
            />
            {/* Aesthetic tuning sliders */}
            <path
              d="M7.5 10.5H11.5M15.5 10.5H20.5M7.5 17.5H12.5M16.5 17.5H20.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <circle
              cx="13.5"
              cy="10.5"
              r="2.2"
              fill="currentColor"
              fillOpacity={active ? "0.35" : "0.2"}
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <circle
              cx="14.5"
              cy="17.5"
              r="2.2"
              fill="currentColor"
              fillOpacity={active ? "0.35" : "0.2"}
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
        );
    }
  };

  const isCurrentActive = (item: (typeof navItems)[0]) => {
    const searchParams = new URLSearchParams(location.search);
    const mode = searchParams.get("mode");

    if (item.to === "/dashboard") {
      return location.pathname === "/" || location.pathname === "/dashboard";
    }
    if (item.to === "/analyze?mode=identify") {
      return location.pathname === "/analyze" && mode === "identify";
    }
    if (item.to === "/analyze?mode=disease") {
      return (
        location.pathname === "/analyze" &&
        (mode === "disease" || (!mode && location.pathname === "/analyze"))
      );
    }
    return location.pathname.startsWith(item.to);
  };

  return (
    <aside className="w-[244px] shrink-0 flex flex-col justify-between bg-gradient-to-b from-[#FBFCFB] via-[#F3F8F5] to-[#EAF2ED] dark:from-[#152E23] dark:via-[#11251C] dark:to-[#0D1D16] border-r border-[#D7E4DA]/90 dark:border-[#224535] shadow-[inset_-1px_0_0_rgba(255,255,255,0.8),2px_0_12px_rgba(22,58,45,0.03)] dark:shadow-[inset_-1px_0_0_rgba(255,255,255,0.04),2px_0_16px_rgba(0,0,0,0.3)] min-h-screen p-5 select-none font-sans relative overflow-hidden transition-colors duration-300">
      {/* Ambient Lighting & Atmosphere */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden select-none z-0" aria-hidden="true">
        {/* Soft top-right emerald glow */}
        <div className="absolute -top-16 -right-16 w-52 h-52 rounded-full bg-gradient-to-br from-[#176B4D]/10 via-[#8EAD9B]/10 to-transparent dark:from-[#8EAD9B]/16 dark:via-[#176B4D]/10 dark:to-transparent blur-2xl" />
        {/* Subtle mid-left botanical aura */}
        <div className="absolute top-[38%] -left-20 w-48 h-64 rounded-full bg-gradient-to-r from-[#176B4D]/6 to-transparent dark:from-[#248260]/12 dark:to-transparent blur-3xl" />
        {/* Bottom sage glow */}
        <div className="absolute -bottom-14 -right-12 w-56 h-56 rounded-full bg-gradient-to-tl from-[#8EAD9B]/14 via-[#176B4D]/8 to-transparent dark:from-[#1D3B2D]/45 dark:to-transparent blur-2xl" />
        {/* Delicate right edge shimmer */}
        <div className="absolute top-0 right-0 w-[1px] h-full bg-gradient-to-b from-transparent via-[#8EAD9B]/30 to-transparent dark:via-[#8EAD9B]/20" />
      </div>

      {/* Botanical Tree Branch, Vine & Leaf Artwork */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden select-none z-0 opacity-85 dark:opacity-45"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 244 900"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <linearGradient id="sbBranchGrad" x1="0" y1="900" x2="244" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#176B4D" stopOpacity="0.32" />
              <stop offset="45%" stopColor="#248260" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#8EAD9B" stopOpacity="0.38" />
            </linearGradient>
            <linearGradient id="sbLeafGradLush" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#D9EEDB" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#BFE2C6" stopOpacity="0.7" />
            </linearGradient>
            <linearGradient id="sbLeafGradMint" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#EBF5EE" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#D3E7D8" stopOpacity="0.75" />
            </linearGradient>
            <linearGradient id="sbLeafGradEmerald" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#176B4D" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#8EAD9B" stopOpacity="0.18" />
            </linearGradient>
            <radialGradient id="sbDewGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#8EAD9B" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#8EAD9B" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Micro-contour organic botanical rings in background */}
          <circle cx="230" cy="110" r="75" stroke="#8EAD9B" strokeWidth="0.8" strokeDasharray="3 4" opacity="0.22" />
          <circle cx="230" cy="110" r="110" stroke="#8EAD9B" strokeWidth="0.6" strokeDasharray="2 6" opacity="0.15" />
          <circle cx="15" cy="560" r="85" stroke="#176B4D" strokeWidth="0.8" strokeDasharray="3 5" opacity="0.14" />
          <circle cx="210" cy="720" r="65" stroke="#8EAD9B" strokeWidth="0.7" strokeDasharray="2 5" opacity="0.18" />

          {/* Upper-right cascading overhanging botanical canopy */}
          <path
            d="M256 12 C218 28, 184 52, 148 88 C128 108, 108 120, 84 130"
            stroke="url(#sbBranchGrad)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M194 48 C180 72, 172 98, 154 120 C146 128, 136 134, 126 138"
            stroke="#8EAD9B"
            strokeWidth="1.6"
            strokeLinecap="round"
            opacity="0.5"
          />
          <path
            d="M148 88 C126 84, 106 74, 88 60 C80 54, 72 46, 68 38"
            stroke="#8EAD9B"
            strokeWidth="1.3"
            strokeLinecap="round"
            opacity="0.45"
          />
          {/* Delicate spiral tendril off top branch */}
          <path
            d="M84 130 C72 136, 66 146, 72 152 C78 156, 84 152, 82 144"
            stroke="#8EAD9B"
            strokeWidth="1.1"
            strokeLinecap="round"
            opacity="0.5"
          />

          {/* Canopy foliage leaves with delicate venation */}
          {/* Leaf 1 */}
          <path
            d="M148 88 C160 66, 182 60, 194 70 C180 84, 164 90, 148 88 Z"
            fill="url(#sbLeafGradLush)"
            stroke="#8EAD9B"
            strokeWidth="0.8"
            strokeOpacity="0.4"
          />
          <path d="M152 86 C168 76, 184 72, 192 70" stroke="#176B4D" strokeWidth="0.7" strokeDasharray="1.5 2" opacity="0.3" />

          {/* Leaf 2 */}
          <path
            d="M120 110 C128 92, 146 86, 156 96 C143 108, 130 112, 120 110 Z"
            fill="url(#sbLeafGradMint)"
            stroke="#8EAD9B"
            strokeWidth="0.7"
            strokeOpacity="0.4"
          />
          {/* Leaf 3 */}
          <path
            d="M84 130 C68 122, 60 132, 68 144 C80 142, 84 136, 84 130 Z"
            fill="url(#sbLeafGradEmerald)"
          />
          {/* Leaf 4 */}
          <path
            d="M154 120 C166 114, 178 122, 172 134 C160 131, 156 126, 154 120 Z"
            fill="url(#sbLeafGradMint)"
          />
          {/* Leaf 5 */}
          <path
            d="M106 72 C116 54, 134 52, 140 64 C128 72, 116 74, 106 72 Z"
            fill="url(#sbLeafGradLush)"
            opacity="0.8"
          />

          {/* Main ascending tree trunk & botanical bough along sidebar */}
          <path
            d="M-10 760 C30 706, 60 652, 92 588 C124 526, 162 480, 214 430 C230 414, 246 396, 258 380"
            stroke="url(#sbBranchGrad)"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          {/* Natural bark contour line on main trunk */}
          <path
            d="M-6 754 C32 702, 62 650, 93 586 C115 540, 142 504, 180 464"
            stroke="#176B4D"
            strokeWidth="0.9"
            strokeDasharray="4 6"
            opacity="0.25"
          />

          {/* Secondary left-climbing bough */}
          <path
            d="M92 588 C76 538, 52 496, 24 454 C14 438, 6 422, -2 404"
            stroke="url(#sbBranchGrad)"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          {/* Tertiary branch arching right */}
          <path
            d="M138 518 C168 522, 196 514, 228 496"
            stroke="url(#sbBranchGrad)"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          {/* Slender upper branch */}
          <path
            d="M180 466 C172 432, 156 406, 136 384 C126 372, 114 362, 100 354"
            stroke="#176B4D"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.35"
          />
          {/* Lower flourishing branch toward bottom right */}
          <path
            d="M46 662 C86 654, 124 666, 166 690 C192 704, 220 712, 248 708"
            stroke="url(#sbBranchGrad)"
            strokeWidth="2.1"
            strokeLinecap="round"
          />
          {/* Tendril curl near lower branch */}
          <path
            d="M220 712 C236 718, 244 732, 238 740 C230 746, 222 738, 224 728"
            stroke="#8EAD9B"
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.4"
          />

          {/* Mid & Lower Leaf Clusters with multi-tonal botanical beauty */}
          {/* Cluster A: Left bough */}
          <path
            d="M56 508 C38 492, 40 468, 58 462 C68 478, 66 498, 56 508 Z"
            fill="url(#sbLeafGradMint)"
            stroke="#8EAD9B"
            strokeWidth="0.8"
            strokeOpacity="0.4"
          />
          <path d="M46 478 C54 486, 60 496, 56 508" stroke="#176B4D" strokeWidth="0.7" strokeDasharray="1.5 2" opacity="0.3" />
          <path
            d="M68 534 C88 518, 102 524, 98 542 C84 546, 74 542, 68 534 Z"
            fill="url(#sbLeafGradLush)"
          />
          <path
            d="M24 454 C8 446, 6 426, 20 418 C32 432, 30 444, 24 454 Z"
            fill="url(#sbLeafGradEmerald)"
          />

          {/* Cluster B: Main central bough */}
          <path
            d="M114 544 C102 520, 112 496, 132 494 C134 516, 126 534, 114 544 Z"
            fill="url(#sbLeafGradMint)"
            stroke="#176B4D"
            strokeWidth="0.8"
            strokeOpacity="0.25"
          />
          <path d="M120 508 C124 522, 122 534, 114 544" stroke="#176B4D" strokeWidth="0.7" strokeDasharray="1.5 2" opacity="0.25" />
          <path
            d="M156 490 C150 466, 164 446, 182 448 C180 468, 168 484, 156 490 Z"
            fill="url(#sbLeafGradLush)"
          />
          <path
            d="M136 384 C122 372, 124 354, 140 352 C148 366, 144 378, 136 384 Z"
            fill="url(#sbLeafGradEmerald)"
          />
          <path
            d="M164 432 C180 418, 198 424, 196 440 C182 442, 172 438, 164 432 Z"
            fill="url(#sbLeafGradMint)"
          />
          <path
            d="M100 354 C88 346, 86 332, 98 328 C106 338, 104 348, 100 354 Z"
            fill="url(#sbLeafGradLush)"
            opacity="0.75"
          />

          {/* Cluster C: Right flourishing twigs */}
          <path
            d="M182 512 C198 496, 218 502, 220 518 C204 526, 190 520, 182 512 Z"
            fill="url(#sbLeafGradMint)"
            stroke="#8EAD9B"
            strokeWidth="0.8"
            strokeOpacity="0.4"
          />
          <path
            d="M228 496 C238 482, 252 486, 254 500 C242 506, 232 502, 228 496 Z"
            fill="url(#sbLeafGradEmerald)"
          />
          <path
            d="M214 430 C204 410, 214 394, 232 396 C230 414, 222 426, 214 430 Z"
            fill="url(#sbLeafGradLush)"
          />

          {/* Cluster D: Lower branch bough */}
          <path
            d="M100 660 C114 642, 136 646, 138 662 C122 668, 108 666, 100 660 Z"
            fill="url(#sbLeafGradMint)"
          />
          <path
            d="M148 680 C138 698, 148 716, 164 712 C164 696, 156 686, 148 680 Z"
            fill="url(#sbLeafGradLush)"
          />
          <path
            d="M194 700 C210 686, 228 692, 228 706 C214 712, 202 706, 194 700 Z"
            fill="url(#sbLeafGradEmerald)"
          />

          {/* Floating botanical dewdrops & spore orbs with soft halos */}
          <circle cx="96" cy="62" r="3.2" fill="#8EAD9B" fillOpacity="0.45" />
          <circle cx="96" cy="62" r="6" fill="url(#sbDewGlow)" />
          <circle cx="136" cy="384" r="2.8" fill="#176B4D" fillOpacity="0.32" />
          <circle cx="228" cy="496" r="3" fill="#176B4D" fillOpacity="0.3" />
          <circle cx="82" cy="596" r="2.6" fill="#8EAD9B" fillOpacity="0.4" />
          <circle cx="166" cy="690" r="2.5" fill="#176B4D" fillOpacity="0.3" />
          <circle cx="72" cy="152" r="2.2" fill="#8EAD9B" fillOpacity="0.5" />
          <circle cx="126" cy="138" r="2" fill="#8EAD9B" fillOpacity="0.4" />
          <circle cx="238" cy="740" r="2.4" fill="#8EAD9B" fillOpacity="0.45" />
        </svg>
      </div>

      {/* Top: Brand Logo & Navigation */}
      <div className="space-y-7 relative z-10">
        {/* Brand Header */}
        <div className="flex items-center justify-between px-1">
          <Link
            to="/dashboard"
            onClick={onCloseMobile}
            className="flex items-center gap-2.5 group"
          >
            <div className="w-9 h-9 rounded-xl bg-[#E4F0E7] dark:bg-[#1D3B2D] border border-[#DCE7DF] dark:border-[#244737] flex items-center justify-center text-[#176B4D] dark:text-[#8EAD9B] transition-transform group-hover:scale-105">
              <Leaf className="w-4.5 h-4.5 text-[#176B4D] dark:text-[#8EAD9B]" />
            </div>
            <div className="flex items-baseline">
              <span className="font-display text-lg font-bold tracking-tight text-[#163A2D] dark:text-[#F1F7F3]">
                PlantCare
              </span>
              <span className="font-display text-lg font-bold text-[#176B4D] dark:text-[#8EAD9B] ml-1">
                AI
              </span>
            </div>
          </Link>

          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 text-[#668074] hover:text-[#163A2D] dark:text-[#B0C9BA] rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation List */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const active = isCurrentActive(item);
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={handleItemClick}
                className={`group/nav flex items-center justify-between px-2.5 py-2.5 rounded-xl text-[15px] leading-snug transition-all ${
                  active
                    ? "bg-[#E4F0E7] dark:bg-[#1D3B2D] text-[#176B4D] dark:text-[#8EAD9B] font-semibold"
                    : "text-[#668074] dark:text-[#B0C9BA] font-medium hover:bg-[#F0F6F1] dark:hover:bg-[#1D3B2D]/60 hover:text-[#163A2D] dark:hover:text-[#F1F7F3]"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {renderNavIcon(item.to, active)}
                  <span className="truncate text-[15px] tracking-[-0.015em]">
                    {item.label}
                  </span>
                  {item.badge && (
                    <span className="ml-1.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-[#176B4D] text-white shrink-0">
                      {item.badge}
                    </span>
                  )}
                </div>
                {active && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#176B4D] dark:bg-[#8EAD9B] shrink-0 ml-1.5" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Controls */}
      <div className="space-y-3.5 pt-4 border-t border-[#DCE7DF] dark:border-[#244737] relative z-10">
        {/* Language Switcher */}
        <div className="flex items-center justify-between gap-2 px-1.5 text-xs text-[#668074] dark:text-[#B0C9BA]">
          <span className="flex items-center gap-1.5 font-medium shrink-0">
            <Globe className="w-3.5 h-3.5 text-[#176B4D] dark:text-[#8EAD9B] shrink-0" />
            {t.languageLabel}
          </span>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
            aria-label="Select application language"
            className="bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] rounded-lg px-2 py-1 text-xs text-[#163A2D] dark:text-[#F1F7F3] font-medium focus:outline-none cursor-pointer max-w-[140px]"
          >
            <option value="en">English (EN)</option>
            <option value="es">Español (ES)</option>
            <option value="hi">हिन्दी (HI)</option>
            <option value="fr">Français (FR)</option>
            <option value="de">Deutsch (DE)</option>
            <option value="zh">中文 (ZH)</option>
            <option value="ta">தமிழ் (TA)</option>
          </select>
        </div>

        {/* Light / Dark Mode Toggle */}
        <div className="bg-[#F0F6F1] dark:bg-[#12281E] p-1 rounded-full flex items-center gap-1 border border-[#DCE7DF] dark:border-[#244737]">
          <button
            type="button"
            onClick={() => setTheme("light")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-full text-xs transition-all cursor-pointer ${
              resolvedTheme === "light"
                ? "bg-white text-[#163A2D] font-semibold shadow-2xs"
                : "text-[#668074] dark:text-[#B0C9BA] hover:text-[#163A2D] dark:hover:text-[#F1F7F3]"
            }`}
          >
            <Sun className="w-3.5 h-3.5 text-[#C98A4A] shrink-0" />
            <span className="truncate">{t.lightModeShort}</span>
          </button>
          <button
            type="button"
            onClick={() => setTheme("dark")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-full text-xs transition-all cursor-pointer ${
              resolvedTheme === "dark"
                ? "bg-[#173126] text-[#F1F7F3] border border-[#8EAD9B]/30 font-semibold shadow-2xs"
                : "text-[#668074] dark:text-[#B0C9BA] hover:text-[#163A2D] dark:hover:text-[#F1F7F3]"
            }`}
          >
            <Moon className="w-3.5 h-3.5 text-[#8EAD9B] shrink-0" />
            <span className="truncate">{t.darkModeShort}</span>
          </button>
        </div>

        {/* PWA Install Button in Sidebar */}
        {isInstallable && !isInstalled && (
          <button
            type="button"
            onClick={installApp}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#E4F0E7] dark:bg-[#1D3B2D] text-[#176B4D] dark:text-[#8EAD9B] text-xs font-semibold hover:bg-[#D7E8DC] dark:hover:bg-[#254A39] transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{tr("Install App")}</span>
          </button>
        )}

        {/* User Profile / Auth Card */}
        <div className="relative">
          {isAuthenticated && user ? (
            <button
              type="button"
              onClick={() => setShowProfileMenu((prev) => !prev)}
              className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-[#F0F6F1] dark:hover:bg-[#1D3B2D] transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#E4F0E7] dark:bg-[#1D3B2D] text-[#176B4D] dark:text-[#8EAD9B] font-semibold text-xs flex items-center justify-center shrink-0 border border-[#DCE7DF] dark:border-[#244737]">
                  {user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase() || "PL"}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#163A2D] dark:text-[#F1F7F3] truncate leading-tight">
                    {user.name}
                  </p>
                  <p className="text-[11px] text-[#668074] dark:text-[#B0C9BA] truncate leading-tight">
                    {user.role || tr("Botanical Care")}
                  </p>
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#668074] dark:text-[#B0C9BA] shrink-0" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => openAuthModal("login")}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#176B4D] text-white text-xs font-bold hover:bg-[#12563D] transition-all cursor-pointer shadow-xs"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{tr("Sign In / Sign Up")}</span>
            </button>
          )}

          {showProfileMenu && isAuthenticated && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] rounded-xl shadow-md p-1.5 text-xs text-[#163A2D] dark:text-[#F1F7F3] space-y-1 z-20">
              <Link
                to="/settings"
                onClick={() => {
                  setShowProfileMenu(false);
                  if (onCloseMobile) onCloseMobile();
                }}
                className="block px-3 py-1.5 rounded-lg hover:bg-[#F0F6F1] dark:hover:bg-[#1D3B2D] transition-colors"
              >
                {tr("Profile & Account")}
              </Link>
              <Link
                to="/history"
                onClick={() => {
                  setShowProfileMenu(false);
                  if (onCloseMobile) onCloseMobile();
                }}
                className="block px-3 py-1.5 rounded-lg hover:bg-[#F0F6F1] dark:hover:bg-[#1D3B2D] transition-colors"
              >
                {t.navHistory}
              </Link>
              <button
                type="button"
                onClick={() => {
                  setShowProfileMenu(false);
                  openAuthModal("login");
                }}
                className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-[#F0F6F1] dark:hover:bg-[#1D3B2D] text-[#176B4D] dark:text-[#8EAD9B] font-medium transition-colors cursor-pointer"
              >
                {tr("Switch Account")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowProfileMenu(false);
                  logout();
                }}
                className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 font-medium transition-colors cursor-pointer flex items-center justify-between"
              >
                <span>{tr("Sign Out")}</span>
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
