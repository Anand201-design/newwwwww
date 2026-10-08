import React from "react";
import { AlertTriangle, Trash2, X, Loader2 } from "lucide-react";
import { DiagnosticResult } from "../services/plantService";
import { useLanguage } from "../context/LanguageContext";

interface DeleteAnalysisModalProps {
  analysis: DiagnosticResult | null;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export const DeleteAnalysisModal: React.FC<DeleteAnalysisModalProps> = ({
  analysis,
  isDeleting,
  onCancel,
  onConfirm,
}) => {
  const { tr, localizePlantName, localizeDiseaseName } = useLanguage();

  if (!analysis) return null;

  const plantName = localizePlantName
    ? localizePlantName(analysis.plant_name)
    : analysis.plant_name;
  const diagnosisName = localizeDiseaseName
    ? localizeDiseaseName(analysis.disease_name)
    : analysis.disease_name;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
    >
      <div className="relative w-full max-w-md bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] rounded-3xl p-6 shadow-2xl space-y-5 text-[#163A2D] dark:text-[#F1F7F3]">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3
                id="delete-dialog-title"
                className="font-display font-bold text-lg text-[#163A2D] dark:text-[#F1F7F3]"
              >
                {tr("Delete Analysis?")}
              </h3>
              <p className="text-xs text-[#668074] dark:text-[#8EAD9B]">
                {tr("This action cannot be undone.")}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="p-1.5 text-[#668074] hover:text-[#163A2D] dark:text-[#8EAD9B] dark:hover:text-[#F1F7F3] rounded-xl hover:bg-[#F0F6F1] dark:hover:bg-[#1D3B2D] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Card info */}
        <div className="p-3.5 rounded-2xl bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] space-y-1">
          <div className="font-semibold text-sm truncate">{plantName}</div>
          <div className="text-xs text-[#668074] dark:text-[#8EAD9B] truncate">
            {tr("Diagnosis")}: <span className="font-medium text-[#163A2D] dark:text-[#F1F7F3]">{diagnosisName}</span>
          </div>
          {analysis.created_at && (
            <div className="text-[11px] text-[#668074]/80 dark:text-[#8EAD9B]/80">
              {new Date(analysis.created_at).toLocaleDateString()}
            </div>
          )}
        </div>

        <p className="text-xs text-[#668074] dark:text-[#B0C9BA] leading-relaxed">
          {tr(
            "Are you sure you want to remove this diagnostic report from your health history? The recorded symptoms and recommendations will be permanently removed."
          )}
        </p>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2.5 rounded-xl border border-[#DCE7DF] dark:border-[#244737] text-xs font-semibold text-[#163A2D] dark:text-[#F1F7F3] hover:bg-[#F0F6F1] dark:hover:bg-[#1D3B2D] transition-colors cursor-pointer disabled:opacity-50"
          >
            {tr("Cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{tr("Deleting...")}</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>{tr("Delete Report")}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
