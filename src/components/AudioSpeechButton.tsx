import React, { useState, useEffect } from "react";
import { Volume2, VolumeX, Loader2 } from "lucide-react";
import { tts } from "../services/speechService";
import { useLanguage } from "../context/LanguageContext";

export interface AudioSpeechButtonProps {
  text: string;
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  lang?: string;
}

export const AudioSpeechButton: React.FC<AudioSpeechButtonProps> = ({
  text,
  label = "Listen",
  size = "md",
  className = "",
  lang,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const { language } = useLanguage();

  useEffect(() => {
    return () => {
      if (isPlaying) {
        tts.stop();
      }
    };
  }, [isPlaying]);

  const handleToggle = () => {
    if (isPlaying) {
      tts.stop();
      setIsPlaying(false);
      return;
    }

    if (!text) return;

    setIsPlaying(true);
    tts.speak(
      text,
      {
        lang: lang || language,
        onEnd: () => setIsPlaying(false),
        onError: () => setIsPlaying(false),
      }
    );
  };

  const sizeClasses = {
    sm: "px-2.5 py-1 text-xs gap-1.5 rounded-lg",
    md: "px-3.5 py-2 text-xs sm:text-sm gap-2 rounded-xl",
    lg: "px-4.5 py-2.5 text-sm sm:text-base gap-2.5 rounded-2xl",
  }[size];

  const iconSizes = {
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  }[size];

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`inline-flex items-center font-medium transition-all duration-200 cursor-pointer shadow-xs ${
        isPlaying
          ? "bg-emerald-600 text-white hover:bg-emerald-700 animate-pulse"
          : "bg-[#E4F0E7] dark:bg-[#1D3B2D] text-[#176B4D] dark:text-[#8EAD9B] hover:bg-[#D4E8DA] dark:hover:bg-[#254A39]"
      } ${sizeClasses} ${className}`}
      title={isPlaying ? "Stop audio playback" : "Listen aloud"}
      aria-label={isPlaying ? "Stop audio" : "Play audio"}
    >
      {isPlaying ? (
        <>
          <VolumeX className={iconSizes} />
          {label && <span>Stop</span>}
        </>
      ) : (
        <>
          <Volume2 className={iconSizes} />
          {label && <span>{label}</span>}
        </>
      )}
    </button>
  );
};
