import React from "react";
import { Loader2 } from "lucide-react";

export interface DashboardStatCardProps {
  loading?: boolean;
  title: string;
  value: string | number;
  description?: string;
  badgeText?: string;
  badgeVariant?: "positive" | "neutral" | "attention" | "warning";
  accentVariant?: "botanical" | "attention";
  icon: React.ReactNode;
  onClick?: () => void;
}

export const DashboardStatCard: React.FC<DashboardStatCardProps> = ({
  loading = false,
  title,
  value,
  description,
  badgeText,
  badgeVariant = "neutral",
  accentVariant = "botanical",
  icon,
  onClick,
}) => {
  const badgeClasses = {
    positive:
      "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60",
    neutral:
      "bg-[#F0F6F1] dark:bg-[#1D3B2D] text-[#668074] dark:text-[#8EAD9B] border-[#DCE7DF] dark:border-[#244737]",
    attention:
      "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60",
    warning:
      "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60",
  }[badgeVariant];

  const iconClasses =
    accentVariant === "attention"
      ? "bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border-amber-200/80 dark:border-amber-800/60"
      : "bg-[#E4F0E7] dark:bg-[#1D3B2D] text-[#176B4D] dark:text-[#8EAD9B] border-[#DCE7DF] dark:border-[#244737]";

  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick();
        }
      }}
      className={`relative bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] rounded-3xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between ${
        onClick ? "cursor-pointer group hover:border-[#176B4D]/50 dark:hover:border-[#8EAD9B]/50" : ""
      }`}
    >
      <div>
        <div className="flex items-center justify-between gap-3 mb-3">
          <span className="text-xs sm:text-sm font-medium text-[#668074] dark:text-[#8EAD9B] truncate">
            {title}
          </span>
          <div
            className={`w-9 h-9 rounded-2xl border flex items-center justify-center shrink-0 transition-transform duration-200 ${
              onClick ? "group-hover:scale-105" : ""
            } ${iconClasses}`}
          >
            {icon}
          </div>
        </div>

        <div className="flex items-baseline gap-2">
          {loading ? (
            <div className="h-9 flex items-center">
              <Loader2 className="w-5 h-5 animate-spin text-[#176B4D] dark:text-[#8EAD9B]" />
            </div>
          ) : (
            <span className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-[#163A2D] dark:text-[#F1F7F3]">
              {value}
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-[#F0F6F1] dark:border-[#1D3B2D] flex items-center justify-between gap-2 min-h-[28px]">
        {description && (
          <p className="text-[11px] sm:text-xs text-[#668074] dark:text-[#8EAD9B] line-clamp-1 flex-1">
            {description}
          </p>
        )}
        {badgeText && (
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${badgeClasses}`}
          >
            {badgeText}
          </span>
        )}
      </div>
    </div>
  );
};
