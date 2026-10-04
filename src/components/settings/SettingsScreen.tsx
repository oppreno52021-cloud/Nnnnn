import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { CategoryIcon } from '../common/CategoryIcon';
import { AccountIcon } from '../common/AccountIcon';
import { 
  formatCurrency, 
  getLocalDateString, 
  normalizeArabicNumerals,
  SUPPORTED_CURRENCIES,
  getCurrencySymbol,
  getCurrencyDisplayName,
  toArabicNumerals,
  formatNumber
} from '../../utils/calculations';
import { 
  getCategoryDisplayName, 
  getAccountDisplayName, 
  getAccountTypeDisplayName, 
  getFrequencyDisplayName 
} from '../../utils/i18n';
import { 
  DollarSign, 
  PieChart, 
  Tag, 
  Repeat, 
  Download, 
  Upload, 
  Moon, 
  Sun, 
  RotateCcw, 
  ShieldCheck, 
  Plus, 
  Check, 
  X,
  Trash2,
  Play,
  Bell,
  Lock,
  Info,
  Wallet,
  Edit3,
  Globe,
  Type,
  ChevronDown,
  Phone,
  MessageCircle,
  ArrowLeft,
  Eye,
  EyeOff
} from 'lucide-react';
import { Category, Account, AccountType, RecurringTransaction } from '../../types';
import { useBackHandler } from '../../hooks/useBackHandler';

export const SettingsScreen: React.FC = () => {
  const { 
    budget, 
    updateBudgetAmount, 
    settings, 
    updateSettings, 
    categories, 
    saveCategoryItem, 
    toggleArchiveCategory,
    deleteCategoryItem,
    accounts,
    accountSummaries,
    saveAccountItem,
    toggleArchiveAccount,
    toggleAccountShowOnHome,
    deleteAccountItem,
    recurring, 
    addRecurringItem, 
    updateRecurringItem,
    removeRecurringItem, 
    processRecurringItem,
    clearAllExpenses,
    resetDatabaseToDemo, 
    downloadCSV,
    importCSVText,
    downloadFullBackupJSON,
    importFullBackupJSON,
    showToast,
    language,
    setLanguage,
    numberFormat,
    setNumberFormat,
    setCurrency,
    theme,
    setTheme,
    fontSize,
    setFontSize,
    setActiveTab,
    t
  } = useApp();

  const formatNum = (v: number | string) => formatNumber(v, language, numberFormat);

  const [budgetInput, setBudgetInput] = useState(
    language === 'ar' ? toArabicNumerals(budget.amount.toString()) : budget.amount.toString()
  );
  const [isEditingBudget, setIsEditingBudget] = useState(false);

  React.useEffect(() => {
    setBudgetInput(language === 'ar' ? toArabicNumerals(budget.amount.toString()) : budget.amount.toString());
  }, [budget.amount, language]);

  // Collapsible dropdown sections state
  const [isAccountsOpen, setIsAccountsOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isRecurringOpen, setIsRecurringOpen] = useState(false);
  const [isDataStorageOpen, setIsDataStorageOpen] = useState(false);

  // Destructive Confirmation Dialog state
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    desc: string;
    confirmLabel: string;
    isDanger?: boolean;
    onConfirm: () => void;
  } | null>(null);

  // Account Modal state
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [accName, setAccName] = useState('');
  const [accType, setAccType] = useState<AccountType>('cash');
  const [accOpeningBalance, setAccOpeningBalance] = useState('0');
  const [accColor, setAccColor] = useState('#10B981');

  // New Category Modal / Sheet state
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#3B82F6');
  const [newCatIcon, setNewCatIcon] = useState('Tag');

  // Recurring Modal state
  const [isAddRecurringOpen, setIsAddRecurringOpen] = useState(false);
  const [editingRecurring, setEditingRecurring] = useState<RecurringTransaction | null>(null);
  const [recAmount, setRecAmount] = useState('');
  const [recNote, setRecNote] = useState('');
  const [recCatId, setRecCatId] = useState(categories[0]?.id || 'cat-bills');
  const [recAccountId, setRecAccountId] = useState(accounts[0]?.id || 'acc-card');
  const [recFreq, setRecFreq] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [recNextDate, setRecNextDate] = useState(() => getLocalDateString(new Date()));

  // File input refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backupFileInputRef = useRef<HTMLInputElement>(null);

  // Hardware & Browser Back Navigation for Settings Modals & Confirm Dialogs
  useBackHandler(isAccountModalOpen, () => {
    setIsAccountModalOpen(false);
    setEditingAccount(null);
  }, 'settings-account');
  useBackHandler(isAddCategoryOpen, () => setIsAddCategoryOpen(false), 'settings-cat');
  useBackHandler(isAddRecurringOpen, () => {
    setIsAddRecurringOpen(false);
    setEditingRecurring(null);
  }, 'settings-rec');
  useBackHandler(Boolean(confirmAction), () => setConfirmAction(null), 'settings-confirm');

  const handleSaveBudget = async () => {
    const normalized = normalizeArabicNumerals(budgetInput);
    const val = parseFloat(normalized);
    if (!isNaN(val) && val >= 0) {
      await updateBudgetAmount(val);
      setIsEditingBudget(false);
    }
  };

  const handleToggleTheme = async () => {
    const next = settings.theme === 'dark' ? 'light' : 'dark';
    await updateSettings({ theme: next });
    if (next === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const newCat: Category = {
      id: `cat-${Date.now()}`,
      name: newCatName.trim(),
      icon: newCatIcon,
      color: newCatColor,
      isDefault: false,
      isActive: true,
      sortOrder: categories.length + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveCategoryItem(newCat);
    setNewCatName('');
    setIsAddCategoryOpen(false);
  };

  const handleOpenAddAccount = () => {
    setEditingAccount(null);
    setAccName('');
    setAccType('cash');
    setAccOpeningBalance('0');
    setAccColor('#10B981');
    setIsAccountModalOpen(true);
  };

  const handleOpenEditAccount = (acc: Account) => {
    setEditingAccount(acc);
    setAccName(acc.name);
    setAccType(acc.type);
    setAccOpeningBalance(acc.openingBalance.toString());
    setAccColor(acc.color || '#3B82F6');
    setIsAccountModalOpen(true);
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accName.trim()) return;
    const balanceNum = parseFloat(accOpeningBalance) || 0;
    const accToSave: Account = {
      id: editingAccount ? editingAccount.id : `acc-${Date.now()}`,
      name: accName.trim(),
      type: accType,
      openingBalance: balanceNum,
      currency: settings.currency,
      color: accColor,
      showOnHome: editingAccount ? (editingAccount.showOnHome ?? true) : true,
      isActive: editingAccount ? editingAccount.isActive : true,
      isArchived: editingAccount ? editingAccount.isArchived : false,
      createdAt: editingAccount?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await saveAccountItem(accToSave);
    setIsAccountModalOpen(false);
    setEditingAccount(null);
  };

  const handleOpenAddRecurring = () => {
    setEditingRecurring(null);
    setRecAmount('');
    setRecNote('');
    setRecCatId(categories[0]?.id || 'cat-bills');
    setRecAccountId(accounts[0]?.id || 'acc-card');
    setRecFreq('monthly');
    setRecNextDate(getLocalDateString(new Date()));
    setIsAddRecurringOpen(true);
  };

  const handleOpenEditRecurring = (rec: RecurringTransaction) => {
    setEditingRecurring(rec);
    setRecAmount(rec.amount.toString());
    setRecNote(rec.note);
    setRecCatId(rec.categoryId);
    setRecAccountId(rec.accountId || accounts[0]?.id || 'acc-card');
    setRecFreq(rec.frequency);
    setRecNextDate(rec.nextOccurrence || getLocalDateString(new Date()));
    setIsAddRecurringOpen(true);
  };

  const handleSaveRecurring = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = normalizeArabicNumerals(recAmount);
    const num = parseFloat(normalized);
    if (isNaN(num) || num <= 0 || !recNote.trim()) return;

    if (editingRecurring) {
      await updateRecurringItem(editingRecurring.id, {
        amount: num,
        note: recNote.trim(),
        categoryId: recCatId,
        accountId: recAccountId || accounts[0]?.id || 'acc-card',
        frequency: recFreq,
        nextOccurrence: recNextDate || getLocalDateString(new Date()),
      });
    } else {
      await addRecurringItem({
        type: 'expense',
        amount: num,
        categoryId: recCatId,
        accountId: recAccountId || accounts[0]?.id || 'acc-card',
        frequency: recFreq,
        nextOccurrence: recNextDate || getLocalDateString(new Date()),
        note: recNote.trim(),
        isActive: true,
      });
    }

    setRecAmount('');
    setRecNote('');
    setEditingRecurring(null);
    setIsAddRecurringOpen(false);
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (text) {
        await importCSVText(text);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleBackupUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setConfirmAction({
          title: t.settings.restoreConfirmTitle,
          desc: t.settings.restoreConfirmDesc,
          confirmLabel: t.settings.restoreConfirmAction,
          isDanger: true,
          onConfirm: async () => {
            await importFullBackupJSON(text);
            setConfirmAction(null);
          },
        });
      }
    };
    reader.readAsText(file);
    if (backupFileInputRef.current) backupFileInputRef.current.value = '';
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Settings Title with Back to Home Button */}
      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={() => setActiveTab('home')}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer shadow-xs shrink-0"
          title={language === 'ar' ? 'الرجوع للرئيسية' : 'Back to Home'}
          aria-label={language === 'ar' ? 'الرجوع للرئيسية' : 'Back to Home'}
        >
          <ArrowLeft size={18} className="rtl:rotate-180" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
            {t.settings.title}
          </h1>
        </div>
      </div>

      {/* Monthly Budget Card - Single Line with Rectangle Box */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <PieChart size={17} />
          </div>
          <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
            {t.settings.monthlyBudget}
          </span>
        </div>

        {isEditingBudget ? (
          <div className="flex items-center gap-1.5 shrink-0">
            <input
              type="text"
              inputMode="decimal"
              autoFocus
              value={budgetInput}
              onChange={e => setBudgetInput(normalizeArabicNumerals(e.target.value))}
              onKeyDown={e => {
                if (e.key === 'Enter') handleSaveBudget();
                if (e.key === 'Escape') {
                  setBudgetInput(budget.amount.toString());
                  setIsEditingBudget(false);
                }
              }}
              className="w-28 sm:w-32 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border-2 border-blue-500 rounded-xl text-xs sm:text-sm font-bold text-slate-900 dark:text-white text-center focus:outline-hidden"
            />
            <button
              type="button"
              onClick={handleSaveBudget}
              className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl cursor-pointer transition-colors"
              title={t.settings.saveBudget}
            >
              <Check size={15} />
            </button>
            <button
              type="button"
              onClick={() => {
                setBudgetInput(budget.amount.toString());
                setIsEditingBudget(false);
              }}
              className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl cursor-pointer transition-colors"
              title={t.settings.cancel}
            >
              <X size={15} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsEditingBudget(true)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-slate-100/80 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-900 dark:text-white font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-2xs hover:border-blue-400 focus:ring-2 focus:ring-blue-500/20 shrink-0"
            title={language === 'ar' ? 'انقر لتعديل الميزانية' : 'Click to edit budget'}
          >
            {budget.amount > 0 ? formatCurrency(budget.amount, settings.currency, language, false, numberFormat) : (language === 'ar' ? 'حدد الميزانية' : 'Set budget')}
          </button>
        )}
      </div>

      {/* Preferences: Language & Theme Switches */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3.5">
        {/* Language Switch */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <Globe size={17} />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                {t.settings.language}
              </span>
              <span className="text-[11px] text-slate-400 block">
                {language === 'ar' ? 'العربية' : 'English'}
              </span>
            </div>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center gap-1 border border-slate-200/80 dark:border-slate-700/60">
            <button
              type="button"
              onClick={() => setLanguage('ar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                language === 'ar'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              العربية
            </button>
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                language === 'en'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              English
            </button>
          </div>
        </div>

        {/* Theme Switch */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
              theme === 'dark' ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-400' : 'bg-amber-50 dark:bg-amber-950/50 text-amber-500'
            }`}>
              {theme === 'dark' ? <Moon size={17} /> : <Sun size={17} />}
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                {t.settings.theme}
              </span>
              <span className="text-[11px] text-slate-400 block">
                {theme === 'dark' ? t.settings.darkMode : t.settings.lightMode}
              </span>
            </div>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center gap-1 border border-slate-200/80 dark:border-slate-700/60">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                theme === 'light'
                  ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Sun size={13} className="text-amber-500" />
              <span>{language === 'ar' ? 'فاتح' : 'Light'}</span>
            </button>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                theme === 'dark'
                  ? 'bg-white dark:bg-slate-900 text-blue-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Moon size={13} className="text-blue-400" />
              <span>{language === 'ar' ? 'داكن' : 'Dark'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Accounts & Wallets Management */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div 
          onClick={() => setIsAccountsOpen(prev => !prev)}
          className="flex items-center justify-between cursor-pointer select-none"
        >
          <div className="flex items-center gap-2">
            <Wallet size={18} className="text-blue-600 dark:text-blue-400" />
            <h2 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
              <span>{t.settings.accounts}</span>
              <bdi className="font-semibold text-slate-500 dark:text-slate-400">({formatNum(accounts.length)})</bdi>
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenAddAccount();
              }}
              className="px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95"
            >
              <span>{language === 'ar' ? 'إضافة' : 'Add'}</span>
            </button>
            <div className={`p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-transform duration-200 ${isAccountsOpen ? 'rotate-180' : ''}`}>
              <ChevronDown size={16} />
            </div>
          </div>
        </div>

        {isAccountsOpen && (
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 animate-in fade-in duration-200">
            {accountSummaries.summaries.map(s => {
              const acc = s.account;
              return (
                <div
                  key={acc.id}
                  onClick={() => handleOpenEditAccount(acc)}
                  className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition-all cursor-pointer hover:border-blue-300 dark:hover:border-blue-700/60 active:scale-[0.99] ${
                    acc.isActive 
                      ? 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800' 
                      : 'bg-slate-100/40 dark:bg-slate-800/20 border-dashed border-slate-200 dark:border-slate-700 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <AccountIcon type={acc.type} color={acc.color} size={18} showBackground className="p-2 rounded-xl shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                          {getAccountDisplayName(acc.name, language)}
                        </span>
                        {!acc.isActive ? (
                          <span className="text-[10px] text-amber-500 font-medium">({t.settings.archived})</span>
                        ) : !(acc.showOnHome ?? true) ? (
                          <span className="text-[10px] text-slate-400 font-normal">({language === 'ar' ? 'مخفية بالرئيسية' : 'Hidden'})</span>
                        ) : null}
                      </div>
                      <span className="text-[11px] text-slate-400 block truncate mt-0.5">
                        {getAccountTypeDisplayName(acc.type, language)} · <strong className={s.currentBalance < 0 ? 'text-rose-600 font-bold' : 'text-slate-700 dark:text-slate-300 font-bold'}>{formatCurrency(s.currentBalance, settings.currency, language, false, numberFormat)}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Single clean Switch on the row */}
                  <div 
                    className="flex items-center gap-2 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      role="switch"
                      aria-checked={acc.showOnHome ?? true}
                      onClick={() => toggleAccountShowOnHome(acc.id)}
                      className={`w-9 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors duration-200 ${
                        (acc.showOnHome ?? true) ? 'bg-blue-600 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                      }`}
                      title={(acc.showOnHome ?? true) 
                        ? (language === 'ar' ? 'معروضة بالرئيسية (اضغط للإخفاء)' : 'Visible on Home') 
                        : (language === 'ar' ? 'مخفية من الرئيسية (اضغط للإظهار)' : 'Hidden from Home')}
                    >
                      <span className="w-4 h-4 rounded-full bg-white shadow-xs transition-transform" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Category Management */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div 
          onClick={() => setIsCategoriesOpen(prev => !prev)}
          className="flex items-center justify-between cursor-pointer select-none"
        >
          <div className="flex items-center gap-2">
            <Tag size={18} className="text-blue-600 dark:text-blue-400" />
            <h2 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
              <span>{t.settings.categories}</span>
              <bdi className="font-semibold text-slate-500 dark:text-slate-400">({formatNum(categories.length)})</bdi>
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsAddCategoryOpen(true);
              }}
              className="px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95"
            >
              <span>{language === 'ar' ? 'إضافة' : 'Add'}</span>
            </button>
            <div className={`p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-transform duration-200 ${isCategoriesOpen ? 'rotate-180' : ''}`}>
              <ChevronDown size={16} />
            </div>
          </div>
        </div>

        {isCategoriesOpen && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 animate-in fade-in duration-200">
            {categories.map(cat => (
              <div
                key={cat.id}
                className="p-2.5 rounded-2xl border flex items-center justify-between gap-2 transition-all bg-slate-50/80 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div 
                    className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                  >
                    <CategoryIcon name={cat.icon} color={cat.color} size={15} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block">
                      {getCategoryDisplayName(cat.name, language)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      if (categories.length <= 1) {
                        showToast(language === 'ar' ? 'يجب أن تتبقى فئة واحدة على الأقل' : 'At least one category is required');
                        return;
                      }
                      setConfirmAction({
                        title: language === 'ar' ? `حذف فئة "${getCategoryDisplayName(cat.name, language)}"` : `Delete Category "${getCategoryDisplayName(cat.name, language)}"`,
                        desc: language === 'ar' 
                          ? 'هل أنت متأكد من رغبتك في حذف هذه الفئة نهائياً؟ سيتم تحويل المعاملات التابعة لها تلقائياً إلى فئة أخرى للحفاظ على بياناتك.' 
                          : 'Are you sure you want to permanently delete this category? Associated transactions will be preserved.',
                        confirmLabel: language === 'ar' ? 'نعم، احذف' : 'Delete',
                        isDanger: true,
                        onConfirm: async () => {
                          await deleteCategoryItem(cat.id);
                          setConfirmAction(null);
                        },
                      });
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg text-xs cursor-pointer transition-colors"
                    title={language === 'ar' ? 'حذف الفئة' : 'Delete Category'}
                    aria-label={language === 'ar' ? 'حذف الفئة' : 'Delete Category'}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recurring Transactions Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div 
          onClick={() => setIsRecurringOpen(prev => !prev)}
          className="flex items-center justify-between cursor-pointer select-none"
        >
          <div className="flex items-center gap-2">
            <Repeat size={18} className="text-blue-600 dark:text-blue-400" />
            <h2 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
              <span>{t.settings.recurring}</span>
              {recurring.length > 0 && (
                <bdi className="font-semibold text-slate-500 dark:text-slate-400">({formatNum(recurring.length)})</bdi>
              )}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenAddRecurring();
              }}
              className="px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95"
            >
              <span>{language === 'ar' ? 'إضافة' : 'Add'}</span>
            </button>
            <div className={`p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-transform duration-200 ${isRecurringOpen ? 'rotate-180' : ''}`}>
              <ChevronDown size={16} />
            </div>
          </div>
        </div>

        {isRecurringOpen && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2.5 animate-in fade-in duration-200">
            {recurring.length === 0 ? (
              <div className="text-center py-4 px-2">
                <p className="text-xs text-slate-400">
                  {language === 'ar' ? 'لا توجد معاملات متكررة أو اشتراكات مجدولة.' : 'No recurring transactions configured.'}
                </p>
                <button
                  type="button"
                  onClick={handleOpenAddRecurring}
                  className="mt-2 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  {language === 'ar' ? '+ إضافة اشتراك أو فاتورة متكررة' : '+ Add recurring subscription'}
                </button>
              </div>
            ) : (
              <>
                {/* Total Monthly Commitments Banner */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-xs">
                  <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-300 font-medium">
                    <Repeat size={14} />
                    <span>{language === 'ar' ? 'إجمالي الالتزامات:' : 'Total commitments:'}</span>
                  </div>
                  <span className="font-bold text-blue-900 dark:text-blue-100">
                    {formatCurrency(recurring.filter(r => r.isActive).reduce((sum, r) => sum + r.amount, 0), settings.currency, language, false, numberFormat)}
                  </span>
                </div>

                <div className="space-y-2">
                  {recurring.map(rec => (
                    <div 
                      key={rec.id} 
                      onClick={() => handleOpenEditRecurring(rec)}
                      className="p-3 rounded-2xl border bg-slate-50/80 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700/60 active:scale-[0.99] cursor-pointer flex items-center justify-between gap-2.5 transition-all"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-blue-100/70 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                          <Repeat size={15} />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate block">
                            {rec.note}
                          </span>
                          <span className="text-[11px] text-slate-400 block truncate mt-0.5">
                            <strong className="text-slate-700 dark:text-slate-300 font-semibold">{formatCurrency(rec.amount, settings.currency, language, false, numberFormat)}</strong>
                            {' · '}{getFrequencyDisplayName(rec.frequency, language)}
                            {rec.nextOccurrence ? ` · ${language === 'ar' ? 'مستحق: ' : 'Due: '}${rec.nextOccurrence}` : ''}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleOpenEditRecurring(rec)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg text-xs cursor-pointer transition-colors"
                          aria-label={language === 'ar' ? 'تعديل المعاملة المتكررة' : 'Edit recurring item'}
                          title={language === 'ar' ? 'تعديل' : 'Edit'}
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setConfirmAction({
                              title: language === 'ar' ? `حذف المعاملة المتكررة "${rec.note || ''}"` : `Delete Recurring "${rec.note || ''}"`,
                              desc: language === 'ar' 
                                ? 'هل أنت متأكد من رغبتك في حذف هذه المعاملة المتكررة؟' 
                                : 'Are you sure you want to permanently delete this recurring transaction?',
                              confirmLabel: language === 'ar' ? 'نعم، احذف' : 'Delete',
                              isDanger: true,
                              onConfirm: async () => {
                                await removeRecurringItem(rec.id);
                                setConfirmAction(null);
                              },
                            });
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg text-xs cursor-pointer transition-colors"
                          aria-label={language === 'ar' ? 'حذف المعاملة المتكررة' : 'Delete recurring item'}
                          title={language === 'ar' ? 'حذف' : 'Delete'}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Data Management: Export & Import CSV & JSON Backup */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div 
          onClick={() => setIsDataStorageOpen(prev => !prev)}
          className="flex items-center justify-between cursor-pointer select-none"
        >
          <div className="flex items-center gap-2">
            <Download size={18} className="text-purple-600 dark:text-purple-400" />
            <h2 className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {t.settings.dataStorage}
            </h2>
          </div>
          <div className={`p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-transform duration-200 ${isDataStorageOpen ? 'rotate-180' : ''}`}>
            <ChevronDown size={16} />
          </div>
        </div>

        {isDataStorageOpen && (
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800 animate-in fade-in duration-200">
            <div className="grid grid-cols-2 gap-2 text-xs">
              {/* Export CSV */}
              <button
                type="button"
                onClick={downloadCSV}
                className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200/80 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <Download size={18} className="text-blue-600 dark:text-blue-400" />
                <span>{t.settings.exportCsv}</span>
              </button>

              {/* Import CSV */}
              <label className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200/80 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors">
                <Upload size={18} className="text-emerald-600 dark:text-emerald-400" />
                <span>{t.settings.importCsv}</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleCSVUpload}
                  className="hidden"
                />
              </label>

              {/* Export Full JSON Backup */}
              <button
                type="button"
                onClick={downloadFullBackupJSON}
                className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200/80 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <Download size={18} className="text-purple-600 dark:text-purple-400" />
                <span>{t.settings.backupJson}</span>
              </button>

              {/* Restore Full JSON Backup */}
              <label className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200/80 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors">
                <Upload size={18} className="text-purple-600 dark:text-purple-400" />
                <span>{t.settings.restoreJson}</span>
                <input
                  ref={backupFileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleBackupUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Reset & Clear Ledger Controls with Confirmation */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <button
                type="button"
                onClick={() => setConfirmAction({
                  title: t.settings.confirmReset,
                  desc: t.settings.confirmResetDesc,
                  confirmLabel: t.settings.resetNow,
                  isDanger: true,
                  onConfirm: async () => {
                    await resetDatabaseToDemo();
                    setConfirmAction(null);
                  },
                })}
                className="w-full py-2.5 px-3 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 hover:bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <RotateCcw size={14} />
                <span>{t.settings.resetData}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Developer & Contact Card */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs text-xs space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Info size={18} />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 block leading-tight">
              {language === 'ar' ? 'تطوير' : 'Developed by'}
            </span>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
              {language === 'ar' ? 'د. بيشوي ويصا كامل' : 'Dr Beshoy wisa kamel'}
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-0.5">
          {/* WhatsApp Button */}
          <a
            href="https://wa.me/201203730493"
            target="_blank"
            rel="noopener noreferrer"
            className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <MessageCircle size={15} />
            <span>{language === 'ar' ? 'واتساب' : 'WhatsApp'}</span>
          </a>

          {/* Call Button */}
          <a
            href="tel:01203730493"
            className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <Phone size={15} />
            <span>{language === 'ar' ? 'اتصال' : 'Call'}</span>
          </a>
        </div>
      </div>

      {/* Add Category Modal */}
      {isAddCategoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddCategoryOpen(false)}
                  className="p-1 -ms-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  title={language === 'ar' ? 'رجوع' : 'Back'}
                >
                  <ArrowLeft size={16} className="rtl:rotate-180" />
                </button>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {t.settings.addCategory}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddCategoryOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">
                  {t.settings.categoryName}
                </label>
                <input
                  type="text"
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  placeholder={language === 'ar' ? 'مثال: سفر، استثمار، دراسة' : 'e.g. Travel, Investments, Pet'}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">
                  {t.settings.color}
                </label>
                <div className="flex items-center gap-2">
                  {['#EF4444', '#F97316', '#F59E0B', '#10B981', '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#64748B'].map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewCatColor(c)}
                      style={{ backgroundColor: c }}
                      className={`w-6 h-6 rounded-full transition-transform ${
                        newCatColor === c ? 'scale-125 ring-2 ring-slate-900 dark:ring-white' : 'opacity-80'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddCategoryOpen(false)}
                  className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl"
                >
                  {t.addExpense.cancel}
                </button>
                <button
                  type="submit"
                  disabled={!newCatName.trim()}
                  className="px-4 py-2 bg-blue-600 disabled:opacity-50 text-white font-semibold rounded-xl"
                >
                  {t.addExpense.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Recurring Modal */}
      {isAddRecurringOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddRecurringOpen(false);
                    setEditingRecurring(null);
                  }}
                  className="p-1 -ms-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  title={language === 'ar' ? 'رجوع' : 'Back'}
                >
                  <ArrowLeft size={16} className="rtl:rotate-180" />
                </button>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Repeat size={16} className="text-blue-600 dark:text-blue-400" />
                  <span>
                    {editingRecurring 
                      ? (language === 'ar' ? 'تعديل المعاملة المتكررة' : 'Edit Recurring') 
                      : t.settings.addRecurring}
                  </span>
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddRecurringOpen(false);
                  setEditingRecurring(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveRecurring} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">
                  {t.addExpense.noteOptional}
                </label>
                <input
                  type="text"
                  value={recNote}
                  onChange={e => setRecNote(e.target.value)}
                  placeholder={language === 'ar' ? 'مثال: اشتراك نتفليكس، إيجار، جيم' : 'e.g. Netflix, Rent, Gym'}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1">
                  {t.addExpense.amount} ({getCurrencySymbol(settings.currency, language)})
                </label>
                <input
                  type="number"
                  step="any"
                  value={recAmount}
                  onChange={e => setRecAmount(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">
                    {t.settings.frequency}
                  </label>
                  <select
                    value={recFreq}
                    onChange={e => setRecFreq(e.target.value as any)}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="daily">{t.settings.daily}</option>
                    <option value="weekly">{t.settings.weekly}</option>
                    <option value="monthly">{t.settings.monthly}</option>
                    <option value="yearly">{t.settings.yearly}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">
                    {t.addExpense.category}
                  </label>
                  <select
                    value={recCatId}
                    onChange={e => setRecCatId(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>
                        {getCategoryDisplayName(c.name, language)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">
                    {t.addExpense.paidFrom}
                  </label>
                  <select
                    value={recAccountId}
                    onChange={e => setRecAccountId(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {accounts.filter(a => a.isActive).map(a => (
                      <option key={a.id} value={a.id}>
                        {getAccountDisplayName(a.name, language)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1">
                    {t.addExpense.date}
                  </label>
                  <input
                    type="date"
                    value={recNextDate}
                    onChange={e => setRecNextDate(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between gap-2">
                {editingRecurring ? (
                  <button
                    type="button"
                    onClick={() => {
                      const idToDelete = editingRecurring.id;
                      const noteToDelete = editingRecurring.note;
                      setIsAddRecurringOpen(false);
                      setEditingRecurring(null);
                      setConfirmAction({
                        title: language === 'ar' ? `حذف المعاملة المتكررة "${noteToDelete}"` : `Delete Recurring "${noteToDelete}"`,
                        desc: language === 'ar' 
                          ? 'هل أنت متأكد من رغبتك في حذف هذه المعاملة المتكررة؟' 
                          : 'Are you sure you want to permanently delete this recurring transaction?',
                        confirmLabel: language === 'ar' ? 'نعم، احذف' : 'Delete',
                        isDanger: true,
                        onConfirm: async () => {
                          await removeRecurringItem(idToDelete);
                          setConfirmAction(null);
                        },
                      });
                    }}
                    className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                    title={language === 'ar' ? 'حذف المعاملة' : 'Delete'}
                    aria-label="Delete recurring"
                  >
                    <Trash2 size={16} />
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddRecurringOpen(false);
                      setEditingRecurring(null);
                    }}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl cursor-pointer transition-colors"
                  >
                    {t.addExpense.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={!recNote.trim() || !recAmount}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-50 text-white font-semibold rounded-xl cursor-pointer shadow-xs transition-all"
                  >
                    {t.addExpense.save}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Account Modal Sheet */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAccountModalOpen(false);
                    setEditingAccount(null);
                  }}
                  className="p-1 -ms-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  title={language === 'ar' ? 'رجوع' : 'Back'}
                >
                  <ArrowLeft size={16} className="rtl:rotate-180" />
                </button>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Wallet size={16} className="text-blue-600 dark:text-blue-400" />
                  <span>{editingAccount ? t.settings.editAccountModal : t.settings.addAccountModal}</span>
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAccountModalOpen(false);
                  setEditingAccount(null);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveAccount} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.settings.accountName}
                </label>
                <input
                  type="text"
                  value={accName}
                  onChange={e => setAccName(e.target.value)}
                  placeholder={language === 'ar' ? 'مثال: البنك الأهلي، المحفظة النقدية' : 'e.g. Main Bank, Wallet Cash'}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.settings.accountType}
                  </label>
                  <select
                    value={accType}
                    onChange={e => setAccType(e.target.value as AccountType)}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="cash">{getAccountTypeDisplayName('cash', language)}</option>
                    <option value="bank">{getAccountTypeDisplayName('bank', language)}</option>
                    <option value="debit_card">{getAccountTypeDisplayName('debit_card', language)}</option>
                    <option value="credit_card">{getAccountTypeDisplayName('credit_card', language)}</option>
                    <option value="mobile_wallet">{getAccountTypeDisplayName('mobile_wallet', language)}</option>
                    <option value="savings">{getAccountTypeDisplayName('savings', language)}</option>
                    <option value="other">{getAccountTypeDisplayName('other', language)}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.settings.openingBalance}
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={accOpeningBalance}
                    onChange={e => setAccOpeningBalance(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t.settings.themeColor}
                </label>
                <div className="flex items-center gap-2">
                  {['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#06B6D4', '#EF4444', '#64748B'].map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setAccColor(c)}
                      className={`w-7 h-7 rounded-full transition-transform cursor-pointer ${
                        accColor === c ? 'ring-2 ring-offset-2 ring-blue-600 scale-110' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between gap-2">
                {editingAccount ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={async () => {
                        await toggleArchiveAccount(editingAccount.id);
                        setIsAccountModalOpen(false);
                        setEditingAccount(null);
                      }}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl cursor-pointer text-xs transition-colors"
                    >
                      {editingAccount.isActive ? t.settings.archive : t.settings.unarchive}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const idToDelete = editingAccount.id;
                        const nameToDelete = editingAccount.name;
                        setIsAccountModalOpen(false);
                        setEditingAccount(null);
                        setConfirmAction({
                          title: language === 'ar' ? `حذف محفظة "${nameToDelete}"` : `Delete Wallet "${nameToDelete}"`,
                          desc: language === 'ar' 
                            ? 'هل أنت متأكد من رغبتك في حذف هذه المحفظة نهائياً من حساباتك؟' 
                            : 'Are you sure you want to permanently delete this wallet?',
                          confirmLabel: language === 'ar' ? 'نعم، احذف' : 'Delete',
                          isDanger: true,
                          onConfirm: async () => {
                            await deleteAccountItem(idToDelete);
                            setConfirmAction(null);
                          },
                        });
                      }}
                      className="px-3 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-semibold rounded-xl cursor-pointer flex items-center gap-1 transition-colors text-xs"
                    >
                      <Trash2 size={13} />
                      <span>{language === 'ar' ? 'حذف' : 'Delete'}</span>
                    </button>
                  </div>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAccountModalOpen(false);
                      setEditingAccount(null);
                    }}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl cursor-pointer"
                  >
                    {t.settings.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={!accName.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl cursor-pointer"
                  >
                    {editingAccount ? (language === 'ar' ? 'تحديث الحساب' : 'Update Account') : (language === 'ar' ? 'حفظ الحساب' : 'Save Account')}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Explicit Confirmation Dialog Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xl space-y-3.5 text-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {confirmAction.title}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              {confirmAction.desc}
            </p>
            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl cursor-pointer"
              >
                {t.settings.cancel}
              </button>
              <button
                type="button"
                onClick={async () => {
                  const fn = confirmAction.onConfirm;
                  setConfirmAction(null);
                  if (fn) {
                    await fn();
                  }
                }}
                className={`px-4 py-2 font-semibold text-white rounded-xl cursor-pointer ${
                  confirmAction.isDanger ? 'bg-rose-600 hover:bg-rose-700' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {confirmAction.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
