import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { CategoryIcon } from '../common/CategoryIcon';
import { AccountIcon } from '../common/AccountIcon';
import { 
  predictCategoryFromText, 
  detectDuplicateExpense,
  parseMoneyInput,
  validateTransfer,
  getLocalDateString,
  getLocalTimeString,
  formatCurrency,
  normalizeArabicNumerals
} from '../../utils/calculations';
import { getCategoryDisplayName, getAccountDisplayName, getAccountTypeDisplayName } from '../../utils/i18n';
import { triggerHaptic } from '../../utils/haptics';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { useBackHandler } from '../../hooks/useBackHandler';
import { 
  X, 
  ArrowLeft,
  ChevronDown, 
  ChevronUp, 
  AlertCircle, 
  Sparkles, 
  Check, 
  Plus, 
  Calendar, 
  Clock, 
  CreditCard,
  ArrowLeftRight,
  ArrowRight,
  Calculator
} from 'lucide-react';
import { Expense } from '../../types';

function safeEvalMath(expr: string): number | null {
  if (!expr || !expr.trim()) return null;
  const sanitized = expr.replace(/[^0-9+\-*/.]/g, '');
  if (!/[+\-*/]/.test(sanitized)) return null;
  try {
    if (/[+\-*/.]$/.test(sanitized.trim())) return null;
    const result = Function(`'use strict'; return (${sanitized})`)();
    if (typeof result === 'number' && !isNaN(result) && isFinite(result) && result > 0) {
      return Math.round(result * 100) / 100;
    }
    return null;
  } catch {
    return null;
  }
}

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  editExpense?: Expense | null;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  editExpense,
}) => {
  const {
    categories,
    accounts,
    createExpense,
    modifyExpense,
    createTransfer,
    expenses,
    settings,
    lastUsedCategoryId,
    lastUsedPaymentMethodId,
    prefillExpense,
    language,
    t,
  } = useApp();

  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [note, setNote] = useState('');
  const [merchant, setMerchant] = useState('');
  const [type, setType] = useState<'expense' | 'income' | 'transfer'>('expense');
  const [date, setDate] = useState(getLocalDateString());
  const [time, setTime] = useState(getLocalTimeString());
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [suggestedCatId, setSuggestedCatId] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<Expense | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  useBodyScrollLock(isOpen);
  useBackHandler(isOpen, onClose, 'add-expense');

  const amountInputRef = useRef<HTMLInputElement>(null);

  // Live in-line math expression evaluator
  const liveMathResult = useMemo(() => safeEvalMath(amount), [amount]);

  // Active selectable categories & accounts
  const activeCategories = categories.filter(c => c.isActive);
  const activeAccounts = accounts.filter(a => a.isActive);

  // Initialize or reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      if (editExpense) {
        setAmount(editExpense.amount.toString());
        setCategoryId(editExpense.categoryId || 'cat-other');
        setNote(editExpense.note || '');
        setMerchant(editExpense.merchant || '');
        setType(editExpense.type);
        setDate(editExpense.date);
        setTime(editExpense.time || getLocalTimeString());
        setPaymentMethodId(editExpense.paymentMethodId || accounts[0]?.id || 'acc-card');
        setFromAccountId(editExpense.fromAccountId || editExpense.accountId || accounts[0]?.id || 'acc-cash');
        setToAccountId(editExpense.toAccountId || accounts.find(a => a.id !== (editExpense.fromAccountId || editExpense.accountId))?.id || accounts[1]?.id || 'acc-card');
        setShowMoreDetails(true);
      } else {
        // New transaction defaults
        const defaultCat = prefillExpense?.categoryId || lastUsedCategoryId || activeCategories[0]?.id || 'cat-food';
        const defaultPay = prefillExpense?.paymentMethodId || lastUsedPaymentMethodId || accounts[0]?.id || 'acc-card';
        setAmount(prefillExpense?.amount ? prefillExpense.amount.toString() : '');
        setCategoryId(defaultCat);
        setNote(prefillExpense?.note || '');
        setMerchant(prefillExpense?.merchant || '');
        setType(prefillExpense?.type || 'expense');
        setDate(prefillExpense?.date || getLocalDateString());
        setTime(getLocalTimeString());
        setPaymentMethodId(defaultPay);
        const defaultFrom = prefillExpense?.fromAccountId || accounts[0]?.id || 'acc-cash';
        setFromAccountId(defaultFrom);
        setToAccountId(prefillExpense?.toAccountId || accounts.find(a => a.id !== defaultFrom)?.id || accounts[1]?.id || 'acc-card');
        setShowMoreDetails(false);
      }
      setShowAllCategories(false);
      setSuggestedCatId(null);
      setDuplicateWarning(null);
      setError(null);
      setShowDiscardConfirm(false);
    }
  }, [isOpen, editExpense, prefillExpense, lastUsedCategoryId, lastUsedPaymentMethodId, accounts]);

  // Check if form is meaningfully dirty
  const isDirty = Boolean(
    (amount.trim() && amount !== editExpense?.amount.toString()) ||
    (note.trim() && note !== (editExpense?.note || '')) ||
    (merchant.trim() && merchant !== (editExpense?.merchant || ''))
  );

  const handleRequestClose = () => {
    if (isDirty && !showDiscardConfirm) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  };

  useBackHandler(isOpen, handleRequestClose, 'add-expense');

  // Smart categorization suggestion when typing note or merchant
  const handleNoteChange = (text: string) => {
    setNote(text);
    if (!editExpense) {
      const predicted = predictCategoryFromText(text, expenses);
      if (predicted && predicted !== categoryId) {
        setSuggestedCatId(predicted);
      } else {
        setSuggestedCatId(null);
      }
    }
  };

  const applySuggestedCategory = () => {
    if (suggestedCatId) {
      setCategoryId(suggestedCatId);
      setSuggestedCatId(null);
    }
  };

  // Submit handler
  const handleSave = async (e?: React.FormEvent, bypassDuplicate = false) => {
    if (e) e.preventDefault();
    if (isSubmitting) return; // Prevent double save on rapid taps

    // Validate amount (auto-evaluate math if present)
    let finalAmountStr = amount;
    const mathEval = safeEvalMath(amount);
    if (mathEval !== null) {
      finalAmountStr = mathEval.toString();
      setAmount(finalAmountStr);
    }

    const parsed = parseMoneyInput(finalAmountStr);
    if (!parsed.valid) {
      setError(parsed.error || (language === 'ar' ? 'أدخل مبلغاً أكبر من 0.' : 'Enter an amount greater than 0.'));
      amountInputRef.current?.focus();
      return;
    }

    if (type === 'transfer') {
      const val = validateTransfer({ amount: parsed.amount, fromAccountId, toAccountId }, accounts);
      if (!val.valid) {
        setError(val.error || (language === 'ar' ? 'تفاصيل التحويل غير صالحة' : 'Invalid transfer details'));
        return;
      }

      try {
        setIsSubmitting(true);
        const fromAcc = accounts.find(a => a.id === fromAccountId);
        const toAcc = accounts.find(a => a.id === toAccountId);
        const fromName = fromAcc?.name || 'Account';
        const toName = toAcc?.name || 'Account';

        if (editExpense) {
          await modifyExpense(editExpense.id, {
            type: 'transfer',
            amount: parsed.amount,
            accountId: fromAccountId,
            fromAccountId,
            toAccountId,
            paymentMethodId: fromAccountId,
            note: note.trim() || `${fromName} → ${toName}`,
            merchant: `Transfer: ${fromName} → ${toName}`,
            date,
            time,
          });
        } else {
          await createTransfer({
            amount: parsed.amount,
            fromAccountId,
            toAccountId,
            note: note.trim(),
            date,
            time,
          });
        }
        onClose();
      } catch (err: any) {
        console.error(err);
        setError(err?.message || (language === 'ar' ? 'تعذر إتمام التحويل. يرجى المحاولة مرة أخرى.' : "Couldn't complete transfer. Please try again."));
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!categoryId) {
      setError(language === 'ar' ? 'يرجى اختيار فئة.' : 'Please choose a category.');
      return;
    }

    // Check duplicate if creating a new expense and not bypassed
    if (!editExpense && !bypassDuplicate) {
      const duplicate = detectDuplicateExpense(
        { amount: parsed.amount, categoryId, note, date },
        expenses
      );
      if (duplicate) {
        setDuplicateWarning(duplicate);
        return;
      }
    }

    try {
      setIsSubmitting(true);
      if (editExpense) {
        await modifyExpense(editExpense.id, {
          type,
          amount: parsed.amount,
          categoryId,
          note: note.trim(),
          merchant: merchant.trim() || note.trim(),
          date,
          time,
          paymentMethodId,
        });
      } else {
        await createExpense({
          type,
          amount: parsed.amount,
          categoryId,
          accountId: paymentMethodId || 'acc-card',
          paymentMethodId: paymentMethodId || 'acc-card',
          note: note.trim(),
          merchant: merchant.trim() || note.trim(),
          date,
          time,
        });
      }
      triggerHaptic('success');
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || (language === 'ar' ? 'تعذر حفظ المعاملة. يرجى المحاولة مرة أخرى.' : "Couldn't save this expense. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const suggestedCategoryObj = categories.find(c => c.id === suggestedCatId);
  const displayedCategories = showAllCategories ? activeCategories : activeCategories.slice(0, 8);
  const hasMoreCategories = activeCategories.length > 8;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      {/* Backdrop tap */}
      <div className="absolute inset-0" onClick={handleRequestClose} />

      <div 
        className="relative w-full sm:max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border border-slate-200/80 dark:border-slate-800 z-10"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-5 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800/80 shrink-0 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRequestClose}
                className="p-1.5 -ms-1 rounded-full text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title={language === 'ar' ? 'رجوع' : 'Back'}
              >
                <ArrowLeft size={18} className="rtl:rotate-180" />
              </button>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                {editExpense 
                  ? (type === 'transfer' ? t.addExpense.editTransfer : type === 'income' ? t.addExpense.editIncome : t.addExpense.editExpense) 
                  : (type === 'transfer' ? t.addExpense.newTransfer : type === 'income' ? t.addExpense.newIncome : t.addExpense.newExpense)
                }
              </h2>
            </div>
            <button
              type="button"
              onClick={handleRequestClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label={t.detail.close}
            >
              <X size={20} />
            </button>
          </div>

          {/* Under title: Segmented type tabs */}
          <div className="grid grid-cols-3 rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs font-semibold gap-1">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`py-1.5 text-center rounded-lg transition-colors cursor-pointer ${
                type === 'expense'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              {t.transactions.expenses}
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`py-1.5 text-center rounded-lg transition-colors cursor-pointer ${
                type === 'income'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              {t.transactions.income}
            </button>
            <button
              type="button"
              onClick={() => setType('transfer')}
              className={`py-1.5 text-center rounded-lg transition-colors cursor-pointer ${
                type === 'transfer'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              {t.transactions.transfers}
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={e => handleSave(e)} className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-4">
          {/* Amount Field - Dominant, instant entry */}
          <div className="text-center py-2">
            <label htmlFor="amount-input" className="block text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">
              {t.addExpense.amount} ({language === 'ar' ? 'ج.م' : 'EGP'})
            </label>
            <div className="relative inline-flex items-baseline justify-center w-full">
              <span className="text-xl sm:text-2xl font-bold text-slate-400 dark:text-slate-500 me-1.5 select-none">
                {language === 'ar' ? 'ج.م' : 'EGP'}
              </span>
              <input
                id="amount-input"
                ref={amountInputRef}
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={e => {
                  const normalized = normalizeArabicNumerals(e.target.value);
                  setAmount(normalized);
                  setError(null);
                  setDuplicateWarning(null);
                }}
                placeholder="0.00"
                className="w-48 sm:w-56 text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white text-center bg-transparent focus:outline-hidden border-b-2 border-slate-200 dark:border-slate-700 focus:border-blue-600 dark:focus:border-blue-500 transition-colors pb-1 tracking-tight"
                autoComplete="off"
              />
            </div>

            {/* Live in-line calculator evaluation */}
            {liveMathResult !== null && (
              <div className="mt-2 flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => setAmount(liveMathResult.toString())}
                  className="px-3 py-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-300 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                >
                  <Calculator size={13} />
                  <span>= {liveMathResult} {language === 'ar' ? 'ج.م' : 'EGP'}</span>
                  <span className="text-[10px] text-slate-400">({language === 'ar' ? 'اعتماد' : 'Apply'})</span>
                </button>
              </div>
            )}

            {/* Quick Math Operators & Increment Chips */}
            <div className="flex items-center justify-center gap-1.5 mt-2 flex-wrap">
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-full me-1">
                {['+', '-', '*'].map(op => (
                  <button
                    key={op}
                    type="button"
                    onClick={() => {
                      if (amount && !/[+\-*/.]$/.test(amount.trim())) {
                        setAmount(prev => `${prev} ${op} `);
                      }
                    }}
                    className="w-6 h-6 rounded-full hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center cursor-pointer transition-colors"
                  >
                    {op === '*' ? '×' : op}
                  </button>
                ))}
              </div>

              {[10, 20, 50, 100, 200].map(addVal => (
                <button
                  key={addVal}
                  type="button"
                  onClick={() => {
                    const current = parseFloat(amount) || 0;
                    setAmount((current + addVal).toString());
                    setError(null);
                  }}
                  className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer active:scale-95"
                >
                  +{addVal} {language === 'ar' ? 'ج.م' : 'EGP'}
                </button>
              ))}
            </div>
          </div>

          {/* Conditional: Transfer Accounts Selector vs Category Grid */}
          {type === 'transfer' ? (
            <div className="space-y-3 p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t.addExpense.fromAccount}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {activeAccounts.map(acc => {
                    const isSelected = fromAccountId === acc.id;
                    return (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => {
                          setFromAccountId(acc.id);
                          if (toAccountId === acc.id) {
                            const other = activeAccounts.find(a => a.id !== acc.id);
                            if (other) setToAccountId(other.id);
                          }
                          setError(null);
                        }}
                        className={`p-2.5 rounded-xl border flex items-center gap-2 text-start transition-all cursor-pointer ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 ring-1 ring-blue-600/30'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <AccountIcon type={acc.type} color={acc.color} size={16} />
                        <span className="text-sm font-semibold truncate">{getAccountDisplayName(acc.name, language)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-center py-0.5">
                <div className="p-1.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  <ArrowRight size={14} className="rtl:rotate-180" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t.addExpense.toAccount}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {activeAccounts.map(acc => {
                    const isSelected = toAccountId === acc.id;
                    const isSameAsFrom = acc.id === fromAccountId;
                    return (
                      <button
                        key={acc.id}
                        type="button"
                        disabled={isSameAsFrom}
                        onClick={() => {
                          setToAccountId(acc.id);
                          setError(null);
                        }}
                        className={`p-2.5 rounded-xl border flex items-center gap-2 text-start transition-all ${
                          isSameAsFrom
                            ? 'opacity-40 border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 cursor-not-allowed'
                            : isSelected
                              ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-600/30 cursor-pointer'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer'
                        }`}
                      >
                        <AccountIcon type={acc.type} color={acc.color} size={16} />
                        <span className="text-sm font-semibold truncate">{getAccountDisplayName(acc.name, language)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Category Selection - Compact 8-item grid first */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {t.addExpense.category}
                  </label>
                  {hasMoreCategories && (
                    <button
                      type="button"
                      onClick={() => setShowAllCategories(!showAllCategories)}
                      className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      {showAllCategories 
                        ? (language === 'ar' ? 'عرض أقل' : 'Show less') 
                        : (language === 'ar' ? `+ فئات إضافية (${activeCategories.length - 8})` : `+ More categories (${activeCategories.length - 8})`)}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {displayedCategories.map((cat) => {
                    const isSelected = categoryId === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setCategoryId(cat.id);
                          setError(null);
                          setSuggestedCatId(null);
                        }}
                        className={`flex flex-col items-center justify-center p-2.5 rounded-xl transition-all border min-h-[58px] cursor-pointer ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold ring-1 ring-blue-600/30 shadow-xs'
                            : 'border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <CategoryIcon name={cat.icon} color={cat.color} size={18} className="mb-1" />
                        <span className="text-xs font-medium truncate max-w-full text-center leading-tight">
                          {getCategoryDisplayName(cat.name, language)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Smart Category Auto-Suggestion Chip */}
              {suggestedCategoryObj && (
                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-xl text-sm animate-in fade-in">
                  <div className="flex items-center gap-2 text-blue-900 dark:text-blue-200">
                    <Sparkles size={16} className="text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>
                      {language === 'ar' ? 'مقترح:' : 'Suggested:'} <strong>{getCategoryDisplayName(suggestedCategoryObj.name, language)}</strong>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={applySuggestedCategory}
                    className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                  >
                    {language === 'ar' ? 'تطبيق' : 'Apply'}
                  </button>
                </div>
              )}
            </>
          )}

          {/* Quick Note Input with smart prediction */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {t.addExpense.noteOptional}
            </label>
            <input
              type="text"
              value={note}
              onChange={e => handleNoteChange(e.target.value)}
              placeholder={language === 'ar' ? 'مثال: غداء، تاكسي، تسوق' : 'e.g. Lunch, Uber, Groceries, Netflix'}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-hidden transition-all shadow-2xs"
            />
          </div>

          {/* Duplicate Expense Warning Notice */}
          {duplicateWarning && (
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl text-sm text-amber-900 dark:text-amber-200 space-y-2 animate-in fade-in">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertCircle size={16} className="text-amber-600 shrink-0" />
                <span>{t.addExpense.duplicateWarning}</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                {language === 'ar'
                  ? `تم تسجيل معاملة مطابقة بقيمة ${formatCurrency(duplicateWarning.amount, settings.currency)} بتاريخ ${duplicateWarning.date}.`
                  : `An identical expense of ${formatCurrency(duplicateWarning.amount, settings.currency)} was recorded on ${duplicateWarning.date}.`
                }
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleSave(undefined, true)}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                >
                  {language === 'ar' ? 'حفظ على أي حال' : 'Save anyway'}
                </button>
                <button
                  type="button"
                  onClick={() => setDuplicateWarning(null)}
                  className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                >
                  {language === 'ar' ? 'مراجعة' : 'Review'}
                </button>
              </div>
            </div>
          )}

          {/* More Details Expander */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowMoreDetails(!showMoreDetails)}
              className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <span>
                {showMoreDetails 
                  ? (language === 'ar' ? 'إخفاء الحقول الإضافية' : 'Hide additional fields') 
                  : (language === 'ar' ? 'تفاصيل إضافية (المتجر، التاريخ، الوقت، الحساب)' : 'More details (Merchant, Date, Time, Payment)')}
              </span>
              {showMoreDetails ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>

            {showMoreDetails && (
              <div className="mt-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3 animate-in fade-in duration-150 text-sm">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    {t.addExpense.merchantOptional}
                  </label>
                  <input
                    type="text"
                    value={merchant}
                    onChange={e => setMerchant(e.target.value)}
                    placeholder={language === 'ar' ? 'مثال: كارفور، أوبر، صيدلية العزبي' : 'e.g. Carrefour, Uber, Starbucks'}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                      <Calendar size={13} /> {t.addExpense.date}
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                      <Clock size={13} /> {t.addExpense.time}
                    </label>
                    <input
                      type="time"
                      value={time}
                      onChange={e => setTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                    <CreditCard size={13} /> {t.addExpense.account}
                  </label>
                  <select
                    value={paymentMethodId}
                    onChange={e => setPaymentMethodId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white font-medium"
                  >
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {getAccountDisplayName(acc.name, language)} ({getAccountTypeDisplayName(acc.type, language)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Validation error message */}
          {error && (
            <p className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1.5 font-medium pt-1">
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </p>
          )}
        </form>

        {/* Sticky Action Footer - 16px font-semibold balanced primary button */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs shrink-0">
          <button
            type="button"
            onClick={e => handleSave(e)}
            disabled={isSubmitting}
            className="w-full py-3.5 px-5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 text-white font-semibold rounded-2xl shadow-xs text-base flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[48px]"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{language === 'ar' ? 'جاري الحفظ...' : 'Saving...'}</span>
              </>
            ) : (
              <>
                <Check size={20} />
                <span>
                  {editExpense 
                    ? t.addExpense.update
                    : (type === 'transfer' ? t.addExpense.saveTransfer : type === 'income' ? t.addExpense.saveIncome : t.addExpense.saveExpense)
                  }
                </span>
              </>
            )}
          </button>
        </div>

        {/* Discard Confirmation Dialog */}
        {showDiscardConfirm && (
          <div className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="w-full max-w-xs bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xl space-y-3 text-xs">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {t.addExpense.discardConfirm}
              </h3>
              <p className="text-slate-500 dark:text-slate-400">
                {t.addExpense.discardDesc}
              </p>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDiscardConfirm(false)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl cursor-pointer"
                >
                  {t.addExpense.keepEditing}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDiscardConfirm(false);
                    onClose();
                  }}
                  className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl cursor-pointer"
                >
                  {t.addExpense.discard}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
