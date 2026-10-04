import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Target, X, ArrowLeft, Check, PiggyBank } from 'lucide-react';
import { SavingsGoal } from '../../types';
import { normalizeArabicNumerals } from '../../utils/calculations';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { useBackHandler } from '../../hooks/useBackHandler';

interface SavingsGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingGoal?: SavingsGoal | null;
}

export const SavingsGoalModal: React.FC<SavingsGoalModalProps> = ({
  isOpen,
  onClose,
  editingGoal,
}) => {
  const { language, addSavingsGoal, updateSavingsGoal, deleteSavingsGoal, showToast } = useApp();
  const [title, setTitle] = useState(editingGoal?.title || '');
  const [targetAmount, setTargetAmount] = useState(editingGoal?.targetAmount?.toString() || '');
  const [savedAmount, setSavedAmount] = useState(editingGoal?.savedAmount?.toString() || '0');
  const [color, setColor] = useState(editingGoal?.color || '#3B82F6');

  useBodyScrollLock(isOpen);
  useBackHandler(isOpen, onClose, 'savings-goal');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast(language === 'ar' ? 'يرجى إدخال اسم الهدف' : 'Please enter goal title');
      return;
    }
    const tAmount = parseFloat(normalizeArabicNumerals(targetAmount)) || 0;
    const sAmount = parseFloat(normalizeArabicNumerals(savedAmount)) || 0;

    if (tAmount <= 0) {
      showToast(language === 'ar' ? 'المبلغ المستهدف يجب أن يكون أكبر من صفر' : 'Target amount must be > 0');
      return;
    }

    if (editingGoal) {
      updateSavingsGoal({
        ...editingGoal,
        title: title.trim(),
        targetAmount: tAmount,
        savedAmount: sAmount,
        color,
      });
    } else {
      addSavingsGoal({
        title: title.trim(),
        targetAmount: tAmount,
        savedAmount: sAmount,
        color,
      });
    }
    onClose();
  };

  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'];

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
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <PiggyBank size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {editingGoal 
                  ? (language === 'ar' ? 'تعديل هدف الادخار' : 'Edit Savings Goal')
                  : (language === 'ar' ? 'هدف ادخار جديد' : 'New Savings Goal')}
              </h3>
              <p className="text-[11px] text-slate-400">
                {language === 'ar' ? 'تتبع حصالتك وحقق طموحاتك' : 'Track your savings progress'}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
              {language === 'ar' ? 'اسم الهدف' : 'Goal Title'}
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={language === 'ar' ? 'مثال: شراء لابتوب، مصاريف رحلة، طوارئ' : 'e.g. New Laptop, Emergency Fund'}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                {language === 'ar' ? 'المبلغ المستهدف' : 'Target Amount'}
              </label>
              <input
                type="number"
                value={targetAmount}
                onChange={e => setTargetAmount(e.target.value)}
                placeholder="20000"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
              />
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                {language === 'ar' ? 'المبلغ المحفوظ حالياً' : 'Current Saved'}
              </label>
              <input
                type="number"
                value={savedAmount}
                onChange={e => setSavedAmount(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
              />
            </div>
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1.5">
              {language === 'ar' ? 'لون التمييز' : 'Accent Color'}
            </label>
            <div className="flex items-center gap-2">
              {colors.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-7 h-7 rounded-full flex items-center justify-center cursor-pointer transition-transform ${
                    color === c ? 'scale-115 ring-2 ring-offset-2 ring-slate-400' : 'hover:scale-105'
                  }`}
                >
                  {color === c && <Check size={14} className="text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center gap-2">
            {editingGoal && (
              <button
                type="button"
                onClick={() => {
                  deleteSavingsGoal(editingGoal.id);
                  onClose();
                }}
                className="py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 rounded-xl font-bold transition-colors cursor-pointer"
              >
                {language === 'ar' ? 'حذف' : 'Delete'}
              </button>
            )}
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              {editingGoal 
                ? (language === 'ar' ? 'حفظ التعديلات' : 'Update Goal')
                : (language === 'ar' ? 'إضافة الهدف' : 'Create Goal')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
