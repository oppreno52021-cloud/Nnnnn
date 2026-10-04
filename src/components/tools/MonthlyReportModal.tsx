import React from 'react';
import { useApp } from '../../context/AppContext';
import { Share2, Download, X, ArrowLeft, Sparkles, TrendingDown, ArrowUpRight, Wallet } from 'lucide-react';
import { formatCurrency } from '../../utils/calculations';
import { formatMonthLabel } from '../../utils/i18n';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { useBackHandler } from '../../hooks/useBackHandler';

interface MonthlyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MonthlyReportModal: React.FC<MonthlyReportModalProps> = ({ isOpen, onClose }) => {
  const { language, settings, budgetPace, referenceDate, accountSummaries, isPrivacyMode, showToast } = useApp();

  useBodyScrollLock(isOpen);
  useBackHandler(isOpen, onClose, 'monthly-report');

  if (!isOpen) return null;

  const monthLabel = formatMonthLabel(
    `${referenceDate.getFullYear()}-${String(referenceDate.getMonth() + 1).padStart(2, '0')}`,
    language
  );

  const handleShare = () => {
    const text = language === 'ar'
      ? `📊 ملخص مصاريف ${monthLabel}:\n• إجمالي المصاريف: ${formatCurrency(budgetPace.spent, settings.currency, 'ar')}\n• المتوسط اليومي: ${formatCurrency(budgetPace.dailyAverage, settings.currency, 'ar')}\n• المتبقي من الميزانية: ${formatCurrency(budgetPace.remaining || 0, settings.currency, 'ar')}\n- مسجل عبر تطبيق مصروفي`
      : `📊 ${monthLabel} Financial Summary:\n• Total Spent: ${formatCurrency(budgetPace.spent, settings.currency, 'en')}\n• Daily Average: ${formatCurrency(budgetPace.dailyAverage, settings.currency, 'en')}\n• Remaining: ${formatCurrency(budgetPace.remaining || 0, settings.currency, 'en')}\n- Tracked with Daily Expense`;

    if (navigator.share) {
      navigator.share({ title: `تقرير ${monthLabel}`, text });
    } else {
      navigator.clipboard.writeText(text);
      showToast(language === 'ar' ? 'تم نسخ التقرير لمشاركته' : 'Report copied to clipboard');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="absolute inset-0" onClick={onClose} onTouchMove={e => e.preventDefault()} />
      <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 z-10">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-1 -ms-1 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
              title={language === 'ar' ? 'رجوع' : 'Back'}
            >
              <ArrowLeft size={18} className="rtl:rotate-180" />
            </button>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {language === 'ar' ? 'بطاقة التقرير الشهري' : 'Monthly Summary Card'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {monthLabel}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Visual Infographic Card */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-indigo-900 via-slate-900 to-blue-950 text-white shadow-xl space-y-4 border border-indigo-900/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-lg bg-blue-500/30 flex items-center justify-center">
                <Wallet size={14} className="text-blue-300" />
              </div>
              <span className="text-xs font-bold tracking-tight text-slate-200">مصروفي · Masrofy</span>
            </div>
            <span className="text-[11px] font-semibold text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded-full border border-blue-400/30">
              {monthLabel}
            </span>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-slate-300 block">
              {language === 'ar' ? 'إجمالي المصاريف المسجلة' : 'Total Expenses'}
            </span>
            <div className="text-3xl font-black text-white tracking-tight mt-0.5">
              {formatCurrency(budgetPace.spent, settings.currency, language, isPrivacyMode)}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-xs">
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
              <span className="text-[10px] text-slate-300 block">{language === 'ar' ? 'المتوسط اليومي' : 'Daily Average'}</span>
              <span className="text-sm font-bold text-amber-300 block mt-0.5">
                {formatCurrency(budgetPace.dailyAverage, settings.currency, language, isPrivacyMode)}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
              <span className="text-[10px] text-slate-300 block">{language === 'ar' ? 'المتبقي بالميزانية' : 'Remaining'}</span>
              <span className="text-sm font-bold text-emerald-300 block mt-0.5">
                {formatCurrency(budgetPace.remaining || 0, settings.currency, language, isPrivacyMode)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
            <span>{budgetPace.percentUsed}% {language === 'ar' ? 'من الميزانية' : 'of budget'}</span>
            <span>{budgetPace.daysElapsed} {language === 'ar' ? 'أيام نشطة' : 'days active'}</span>
          </div>
        </div>

        {/* Action */}
        <div className="pt-1">
          <button
            type="button"
            onClick={handleShare}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <Share2 size={16} />
            <span>{language === 'ar' ? 'مشاركة التقرير الملخص' : 'Share Summary Card'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
