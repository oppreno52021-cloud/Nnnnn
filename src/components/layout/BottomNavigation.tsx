import React from 'react';
import { useApp } from '../../context/AppContext';
import { Home, Receipt, LineChart, Settings, Plus } from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';

export const BottomNavigation: React.FC = () => {
  const { activeTab, setActiveTab, openAddExpense, language, t } = useApp();

  return (
    <nav 
      role="navigation" 
      aria-label={language === 'ar' ? 'شريط التنقل الرئيسي' : 'Main Navigation'}
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t sm:border-x border-slate-200/80 dark:border-slate-800 transition-colors pb-[max(0.5rem,env(safe-area-inset-bottom,0.5rem))]"
    >
      <div className="px-3 py-2 flex items-center justify-between">
        {/* Tab 1: Home */}
        <button
          type="button"
          onClick={() => setActiveTab('home')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all cursor-pointer active:scale-95 ${
            activeTab === 'home'
              ? 'text-blue-600 dark:text-blue-400 font-bold'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 font-medium'
          }`}
        >
          <Home size={20} strokeWidth={activeTab === 'home' ? 2.4 : 1.8} />
          <span className="text-[10px] sm:text-[11px] mt-1 tracking-tight">
            {t.nav.home}
          </span>
        </button>

        {/* Tab 2: Transactions */}
        <button
          type="button"
          onClick={() => setActiveTab('transactions')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all cursor-pointer active:scale-95 ${
            activeTab === 'transactions'
              ? 'text-blue-600 dark:text-blue-400 font-bold'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 font-medium'
          }`}
        >
          <Receipt size={20} strokeWidth={activeTab === 'transactions' ? 2.4 : 1.8} />
          <span className="text-[10px] sm:text-[11px] mt-1 tracking-tight">
            {t.nav.transactions}
          </span>
        </button>

        {/* CENTER ACTION BUTTON: INTEGRATED & FAST */}
        <div className="flex-1 flex flex-col items-center justify-center px-1">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('medium');
              openAddExpense();
            }}
            title={t.nav.addExpense}
            aria-label={t.nav.addExpense}
            className="w-11 h-11 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-90 text-white shadow-sm shadow-blue-500/25 flex items-center justify-center transition-all cursor-pointer focus:outline-hidden"
          >
            <Plus size={22} strokeWidth={2.6} />
          </button>
        </div>

        {/* Tab 3: Insights */}
        <button
          type="button"
          onClick={() => setActiveTab('insights')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all cursor-pointer active:scale-95 ${
            activeTab === 'insights'
              ? 'text-blue-600 dark:text-blue-400 font-bold'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 font-medium'
          }`}
        >
          <LineChart size={20} strokeWidth={activeTab === 'insights' ? 2.4 : 1.8} />
          <span className="text-[10px] sm:text-[11px] mt-1 tracking-tight">
            {t.nav.insights}
          </span>
        </button>

        {/* Tab 4: Settings */}
        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all cursor-pointer active:scale-95 ${
            activeTab === 'settings'
              ? 'text-blue-600 dark:text-blue-400 font-bold'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 font-medium'
          }`}
        >
          <Settings size={20} strokeWidth={activeTab === 'settings' ? 2.4 : 1.8} />
          <span className="text-[10px] sm:text-[11px] mt-1 tracking-tight">
            {t.nav.settings}
          </span>
        </button>
      </div>
    </nav>
  );
};
