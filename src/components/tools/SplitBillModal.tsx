import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Users, Calculator, Copy, Check, X, ArrowLeft, Plus } from 'lucide-react';
import { formatCurrency, normalizeArabicNumerals } from '../../utils/calculations';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { useBackHandler } from '../../hooks/useBackHandler';

interface SplitBillModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SplitBillModal: React.FC<SplitBillModalProps> = ({ isOpen, onClose }) => {
  const { language, settings, openAddExpense, showToast } = useApp();
  const [totalBill, setTotalBill] = useState('');
  const [peopleCount, setPeopleCount] = useState(2);
  const [tipPercent, setTipPercent] = useState(0);
  const [isCopied, setIsCopied] = useState(false);

  useBodyScrollLock(isOpen);
  useBackHandler(isOpen, onClose, 'split-bill');

  const parsedTotal = parseFloat(normalizeArabicNumerals(totalBill)) || 0;

  const tipAmount = useMemo(() => {
    return (parsedTotal * tipPercent) / 100;
  }, [parsedTotal, tipPercent]);

  const grandTotal = useMemo(() => {
    return parsedTotal + tipAmount;
  }, [parsedTotal, tipAmount]);

  const perPerson = useMemo(() => {
    if (peopleCount <= 0) return 0;
    return Math.round((grandTotal / peopleCount) * 100) / 100;
  }, [grandTotal, peopleCount]);

  if (!isOpen) return null;

  const handleCopySummary = () => {
    const text = language === 'ar'
      ? `حساب الفاتورة: ${formatCurrency(parsedTotal, settings.currency, 'ar')}\nعدد الأفراد: ${peopleCount}\nنصيب كل فرد: ${formatCurrency(perPerson, settings.currency, 'ar')}`
      : `Total Bill: ${formatCurrency(parsedTotal, settings.currency, 'en')}\nPeople: ${peopleCount}\nPer Person: ${formatCurrency(perPerson, settings.currency, 'en')}`;

    navigator.clipboard.writeText(text);
    setIsCopied(true);
    showToast(language === 'ar' ? 'تم نسخ تفاصيل الحساب' : 'Summary copied to clipboard');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleRecordMyShare = () => {
    onClose();
    openAddExpense({
      amount: perPerson,
      note: language === 'ar' ? `نصيبي من فاتورة مشتركة (${peopleCount} أفراد)` : `My share of split bill (${peopleCount} people)`,
    });
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
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Calculator size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {language === 'ar' ? 'حاسبة تقسيم الفاتورة' : 'Split Bill Calculator'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {language === 'ar' ? 'تقسيم حساب الأصدقاء وتسجيل نصيبك' : 'Split costs easily among friends'}
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

        {/* Inputs */}
        <div className="space-y-3 text-xs">
          {/* Total Amount */}
          <div>
            <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
              {language === 'ar' ? 'إجمالي مبلغ الفاتورة' : 'Total Bill Amount'} ({language === 'ar' ? 'ج.م' : 'EGP'})
            </label>
            <input
              type="number"
              inputMode="decimal"
              value={totalBill}
              onChange={e => setTotalBill(e.target.value)}
              placeholder="0.00"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-base font-extrabold"
            />
          </div>

          {/* People Count Stepper */}
          <div>
            <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
              {language === 'ar' ? 'عدد الأفراد' : 'Number of People'}
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPeopleCount(prev => Math.max(1, prev - 1))}
                className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-bold text-base flex items-center justify-center cursor-pointer"
              >
                −
              </button>
              <div className="flex-1 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center font-bold text-base flex items-center justify-center gap-1.5">
                <Users size={16} className="text-blue-600" />
                <span>{peopleCount}</span>
              </div>
              <button
                type="button"
                onClick={() => setPeopleCount(prev => prev + 1)}
                className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-bold text-base flex items-center justify-center cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          {/* Tip / Extra Chips */}
          <div>
            <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
              {language === 'ar' ? 'الخدمة / الإكرامية (اختياري)' : 'Tip / Service (Optional)'}
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[0, 10, 12, 14].map(pct => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setTipPercent(pct)}
                  className={`py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                    tipPercent === pct
                      ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-600 text-blue-600 dark:text-blue-300'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {pct === 0 ? (language === 'ar' ? 'بدون' : '0%') : `${pct}%`}
                </button>
              ))}
            </div>
          </div>

          {/* Result Card */}
          <div className="p-3.5 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-blue-950/40 rounded-2xl border border-blue-100 dark:border-blue-900/40 text-center space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
              {language === 'ar' ? 'نصيب الفرد الواحد' : 'Share Per Person'}
            </span>
            <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
              {formatCurrency(perPerson, settings.currency, language)}
            </div>
            {tipAmount > 0 && (
              <span className="text-[10px] text-slate-400 block">
                {language === 'ar' ? `يشمل ${formatCurrency(tipAmount, settings.currency, language)} خدمة` : `Includes ${formatCurrency(tipAmount, settings.currency, language)} tip`}
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={handleRecordMyShare}
            disabled={perPerson <= 0}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:scale-98 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
          >
            <Plus size={16} />
            <span>{language === 'ar' ? 'تسجيل نصيبي كمصروف الآن' : 'Record My Share as Expense'}</span>
          </button>

          <button
            type="button"
            onClick={handleCopySummary}
            disabled={parsedTotal <= 0}
            className="w-full py-2 px-3 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
          >
            {isCopied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            <span>{isCopied ? (language === 'ar' ? 'تم النسخ!' : 'Copied!') : (language === 'ar' ? 'نسخ الحساب لإرساله للأصدقاء' : 'Copy Breakdown')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
