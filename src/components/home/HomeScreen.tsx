import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CategoryIcon } from '../common/CategoryIcon';
import { AccountIcon } from '../common/AccountIcon';
import { SplitBillModal } from '../tools/SplitBillModal';
import { SavingsGoalModal } from '../tools/SavingsGoalModal';
import { MonthlyReportModal } from '../tools/MonthlyReportModal';
import { WalletManagementModal } from '../tools/WalletManagementModal';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { 
  formatCurrency, 
  getTodayExpenses, 
  getCurrentMonthPrefix,
  getLocalDateString,
  toArabicNumerals
} from '../../utils/calculations';
import { 
  getCategoryDisplayName, 
  getAccountDisplayName, 
  getAccountTypeDisplayName,
  formatDateLabel 
} from '../../utils/i18n';
import { 
  Plus, 
  ChevronRight, 
  Calendar, 
  ArrowLeftRight, 
  Wallet, 
  Eye, 
  EyeOff, 
  X
} from 'lucide-react';

export const HomeScreen: React.FC = () => {
  const { 
    expenses, 
    categories, 
    accounts,
    accountSummaries,
    budgetPace, 
    referenceDate,
    settings, 
    openAddExpense, 
    setViewingExpense,
    setActiveTab,
    setFilters,
    isPrivacyMode,
    togglePrivacyMode,
    language,
    numberFormat,
    t
  } = useApp();

  const formatNum = (val: number | string) => {
    return language === 'ar' ? toArabicNumerals(val) : String(val);
  };

  const [isSplitBillOpen, setIsSplitBillOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [dismissEveningPing, setDismissEveningPing] = useState(false);

  useBodyScrollLock(isWalletModalOpen || isSplitBillOpen || isGoalModalOpen || isReportModalOpen);

  const isEvening = useMemo(() => {
    const hour = new Date().getHours();
    return hour >= 20;
  }, []);

  // Greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return t.home.goodMorning;
    if (hour < 18) return t.home.goodAfternoon;
    return t.home.goodEvening;
  }, [t]);

  // Today's spending summary
  const todayData = useMemo(() => {
    const todayStr = getLocalDateString(referenceDate);
    return getTodayExpenses(expenses, todayStr);
  }, [expenses, referenceDate]);

  // Recent 4 transactions
  const recentTransactions = useMemo(() => {
    return [...expenses]
      .filter(e => !e.isDeleted)
      .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`))
      .slice(0, 4);
  }, [expenses]);

  const categoryMap = useMemo(() => {
    return new Map(categories.map(c => [c.id, c]));
  }, [categories]);

  const hasBudget = budgetPace.status !== 'no_budget' && budgetPace.budget !== null && budgetPace.budget > 0;
  const todayStr = getLocalDateString(referenceDate);
  const currentMonthPrefix = getCurrentMonthPrefix(referenceDate);

  const availableAmount = hasBudget ? (budgetPace.requiredRemainingDailyAverage || 0) : todayData.total;
  const rawFormattedAvailable = Math.round(availableAmount).toLocaleString('en-US');
  const formattedAvailableNumber = isPrivacyMode 
    ? '••••' 
    : (language === 'ar' ? toArabicNumerals(rawFormattedAvailable) : rawFormattedAvailable);
  const currencyAbbr = language === 'ar' ? 'ج.م' : settings.currency;

  return (
    <div className="space-y-3.5 pb-24 text-slate-900 dark:text-slate-100">
      {/* 1. TOP HEADER: DATE & ACTION ICONS */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
            · {formatDateLabel(todayStr, language)}
          </h1>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Privacy Eye Toggle */}
          <button
            type="button"
            onClick={togglePrivacyMode}
            title={isPrivacyMode ? (language === 'ar' ? 'إظهار الأرقام' : 'Show amounts') : (language === 'ar' ? 'إخفاء الأرقام' : 'Hide amounts')}
            className={`p-2 rounded-full border transition-all cursor-pointer shadow-2xs ${
              isPrivacyMode 
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' 
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {isPrivacyMode ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>

          {/* Day of Month Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 font-semibold shadow-2xs">
            <Calendar size={13} className="text-blue-600 dark:text-blue-400" />
            <span>
              {hasBudget && budgetPace.daysRemaining > 0 
                ? (language === 'ar' ? `باقي ${formatNum(budgetPace.daysRemaining)} يوماً` : `${formatNum(budgetPace.daysRemaining)}d left`)
                : (language === 'ar' ? `اليوم ${formatNum(budgetPace.daysElapsed)}` : `Day ${formatNum(budgetPace.daysElapsed)}`)}
            </span>
          </div>
        </div>
      </div>

      {/* EVENING PING BANNER (Only in evening if 0 expenses logged) */}
      {isEvening && !dismissEveningPing && todayData.count === 0 && (
        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-2.5 animate-in fade-in">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-lg shrink-0">🌙</span>
            <p className="text-xs font-bold text-amber-900 dark:text-amber-200 truncate">
              {language === 'ar' ? 'هل نسيت تسجيل مصاريف اليوم؟' : "Did you forget today's expenses?"}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => openAddExpense()}
              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold cursor-pointer"
            >
              {language === 'ar' ? 'سجل الآن' : 'Log now'}
            </button>
            <button
              type="button"
              onClick={() => setDismissEveningPing(true)}
              className="p-1 text-amber-600/70 hover:text-amber-800 dark:text-amber-400 cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* 2. HARMONIOUS MASTER HERO CARD (Clean, cohesive, soothing & crystal clear) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        {/* Top: Allowance / Spending Label & Large Number */}
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 block">
              {hasBudget ? t.home.dailyAllowance : t.home.todaySpending}
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {formattedAvailableNumber}
              </span>
              <span className="text-sm font-bold text-slate-400 dark:text-slate-500">
                {currencyAbbr}
              </span>
            </div>
          </div>

          {!hasBudget ? (
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer pt-1"
            >
              {t.home.setBudget}
            </button>
          ) : (
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
              budgetPace.status === 'over_budget'
                ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
                : budgetPace.status === 'watch' || budgetPace.status === 'attention'
                ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
                : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
            }`}>
              {budgetPace.status === 'over_budget' 
                ? (language === 'ar' ? 'تجاوزت الميزانية' : 'Over budget')
                : (language === 'ar' ? 'الميزانية منتظمة' : 'On track')}
            </span>
          )}
        </div>

        {/* Progress Bar (if budget exists) */}
        {hasBudget && budgetPace.percentUsed !== null && (
          <div className="space-y-1.5 pt-0.5">
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                style={{ width: `${Math.min(100, Math.max(0, budgetPace.percentUsed))}%` }}
                className={`h-full rounded-full transition-all duration-500 ${
                  budgetPace.status === 'over_budget' 
                    ? 'bg-rose-500' 
                    : budgetPace.status === 'watch' || budgetPace.status === 'attention' 
                    ? 'bg-amber-400' 
                    : 'bg-blue-600'
                }`}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 font-medium">
              <span>
                {formatNum(budgetPace.percentUsed ?? 0)}{language === 'ar' ? '٪ مستهلك من الميزانية' : '% of budget used'}
              </span>
              <span>
                {budgetPace.daysRemaining > 1 
                  ? (language === 'ar' ? `باقي ${formatNum(budgetPace.daysRemaining)} يوماً` : `${formatNum(budgetPace.daysRemaining)}d left`) 
                  : (language === 'ar' ? 'اليوم الأخير' : 'Final day')}
              </span>
            </div>
          </div>
        )}

        {/* Financial Metrics Strip - Air, clean whitespace, no nested boxes */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
          <div className="min-w-0">
            <span className="text-[11px] text-slate-400 dark:text-slate-500 block truncate">
              {t.home.todaySpending}
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {formatCurrency(todayData.total, settings.currency, language, isPrivacyMode, numberFormat)}
              </span>
              <span className="text-[10px] text-slate-400 font-normal">
                ({todayData.count === 1 ? t.home.transactionsLoggedToday_one : t.home.transactionsLoggedToday_other.replace('{count}', formatNum(todayData.count))})
              </span>
            </div>
          </div>

          <div className="min-w-0 text-end">
            <span className="text-[11px] text-slate-400 dark:text-slate-500 block truncate">
              {language === 'ar' ? 'المتبقي للشهر' : t.home.remaining}
            </span>
            <div className="flex items-baseline justify-end gap-1 mt-0.5">
              <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {hasBudget ? formatCurrency(budgetPace.remaining || 0, settings.currency, language, isPrivacyMode, numberFormat) : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. MULTI-WALLET HORIZONTAL STRIP */}
      {(settings.showWalletsOnHome ?? true) && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                <Wallet size={16} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-tight">
                  {language === 'ar' ? 'محافظك' : 'Wallets'}
                </h2>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {t.home.netWorth}: <strong className="text-slate-900 dark:text-white font-bold">{formatCurrency(accountSummaries.totalNetWorth, settings.currency, language, isPrivacyMode, numberFormat)}</strong>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => openAddExpense({ type: 'transfer' })}
                className="px-2.5 py-1 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <ArrowLeftRight size={13} className="rtl:rotate-180" />
                <span>{t.home.transfer}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsWalletModalOpen(true)}
                className="text-xs font-bold text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 px-2 py-1 rounded-lg cursor-pointer transition-colors"
              >
                {t.home.manage}
              </button>
            </div>
          </div>

          {/* Wallets Horizontal Scroll */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            {(() => {
              const visibleSummaries = accountSummaries.summaries.filter(
                s => s.account.isActive && (s.account.showOnHome ?? true)
              );
              if (visibleSummaries.length === 0) {
                return (
                  <div className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                    <span>{language === 'ar' ? 'جميع المحافظ مخفية من الرئيسية' : 'All wallets hidden from home'}</span>
                    <button
                      type="button"
                      onClick={() => setIsWalletModalOpen(true)}
                      className="font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      {language === 'ar' ? 'إدارة الظهور' : 'Manage'}
                    </button>
                  </div>
                );
              }
              return visibleSummaries.map(s => {
                const isCredit = s.account.type === 'credit_card';
                const isOwed = s.currentBalance < 0;

                return (
                  <div
                    key={s.account.id}
                    onClick={() => {
                      setFilters(prev => ({
                        ...prev,
                        paymentMethodIds: [s.account.id],
                      }));
                      setActiveTab('transactions');
                    }}
                    className="min-w-[125px] max-w-[160px] shrink-0 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex flex-col justify-between gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-all active:scale-98"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <AccountIcon type={s.account.type} color={s.account.color} size={14} />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block">
                        {getAccountDisplayName(s.account.name, language)}
                      </span>
                    </div>
                    <div>
                      <span className={`text-sm font-bold block tracking-tight ${
                        isOwed ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
                      }`}>
                        {formatCurrency(s.currentBalance, settings.currency, language, isPrivacyMode, numberFormat)}
                      </span>
                      <span className="text-[10px] text-slate-400 block truncate">
                        {isCredit ? (isOwed ? t.home.debt : t.home.available) : getAccountTypeDisplayName(s.account.type, language)}
                      </span>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* 4. RECENT TRANSACTIONS (Clean tap-to-view, swipe is in Transactions only) */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            {t.home.recentTransactions}
          </h2>
          <button
            type="button"
            onClick={() => setActiveTab('transactions')}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 cursor-pointer"
          >
            <span>{t.home.viewAll}</span>
            <ChevronRight size={14} className="rtl:rotate-180" />
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="p-6 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
              {t.home.noTransactionsYet}
            </p>
            <p className="text-xs text-slate-400 mt-0.5 mb-3">
              {t.home.noTransactionsDesc}
            </p>
            <button
              type="button"
              onClick={() => openAddExpense()}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus size={15} />
              <span>{t.nav.addExpense}</span>
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden shadow-xs">
            {recentTransactions.map(exp => {
              const cat = categoryMap.get(exp.categoryId);
              const isExp = exp.type === 'expense';
              const isTransfer = exp.type === 'transfer';

              return (
                <div
                  key={exp.id}
                  onClick={() => setViewingExpense(exp)}
                  className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {isTransfer ? (
                      <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <ArrowLeftRight size={16} className="rtl:rotate-180" />
                      </div>
                    ) : (
                      <CategoryIcon
                        name={cat?.icon || 'MoreHorizontal'}
                        color={cat?.color || '#2563EB'}
                        size={18}
                      />
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1 truncate">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {isTransfer ? t.addExpense.typeTransfer : getCategoryDisplayName(cat?.name || 'Other', language)}
                        </span>
                        {exp.note && (
                          <>
                            <span className="text-slate-300 dark:text-slate-600 text-xs">·</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              {exp.note}
                            </span>
                          </>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 block">
                        {exp.date === todayStr ? t.transactions.today : formatDateLabel(exp.date, language)} · {exp.time || '12:00'}
                      </span>
                    </div>
                  </div>

                  <div className="text-end shrink-0 ms-2">
                    <span className={`text-sm font-bold tracking-tight ${
                      isTransfer 
                        ? 'text-blue-600 dark:text-blue-400' 
                        : isExp 
                          ? 'text-slate-900 dark:text-white' 
                          : 'text-emerald-600 dark:text-emerald-400'
                    }`}>
                      {isTransfer ? '⇄ ' : isExp ? '− ' : '+ '}
                      {formatCurrency(exp.amount, settings.currency, language, isPrivacyMode, numberFormat)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Smart Tools Modals */}
      <SplitBillModal
        isOpen={isSplitBillOpen}
        onClose={() => setIsSplitBillOpen(false)}
      />
      <SavingsGoalModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
      />
      <MonthlyReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />
      <WalletManagementModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
      />
    </div>
  );
};
