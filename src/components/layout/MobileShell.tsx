import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { HomeScreen } from '../home/HomeScreen';
import { TransactionsScreen } from '../transactions/TransactionsScreen';
import { InsightsScreen } from '../insights/InsightsScreen';
import { SettingsScreen } from '../settings/SettingsScreen';
import { BottomNavigation } from './BottomNavigation';
import { AddExpenseModal } from '../expense/AddExpenseModal';
import { TransactionDetailModal } from '../transactions/TransactionDetailModal';
import { OnboardingModal } from '../onboarding/OnboardingModal';
import { LockScreen } from '../security/LockScreen';
import { Toast } from '../ui/Toast';
import { useBackHandler, registerTabBackHandler } from '../../hooks/useBackHandler';

export const MobileShell: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab,
    isAddExpenseOpen, 
    closeAddExpense, 
    editingExpense, 
    setEditingExpense, 
    viewingExpense, 
    setViewingExpense,
    openAddExpense,
    settings,
    isLoading,
    language,
    t
  } = useApp();

  const [showOnboarding, setShowOnboarding] = useState(!settings.hasCompletedOnboarding);
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    return Boolean(settings.biometricLock);
  });

  useEffect(() => {
    if (settings.biometricLock) {
      const handleVisibilityChange = () => {
        if (document.hidden) {
          setIsLocked(true);
        }
      };
      const handleLockNow = () => {
        setIsLocked(true);
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('masrofy_lock_now', handleLockNow);
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('masrofy_lock_now', handleLockNow);
      };
    } else {
      setIsLocked(false);
    }
  }, [settings.biometricLock]);

  // Onboarding back handler
  useBackHandler(showOnboarding, () => setShowOnboarding(false), 'onboarding');

  // Dynamic Tab Navigation Back handling:
  // When activeTab is not 'home', pressing Back returns to 'home'.
  // When on 'home', pressing Back exits the app (letting browser/device perform standard back).
  useEffect(() => {
    if (activeTab === 'home') {
      registerTabBackHandler(null);
    } else {
      registerTabBackHandler(() => {
        setActiveTab('home');
      });
    }
  }, [activeTab, setActiveTab]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-start font-sans text-slate-900 dark:text-slate-100 transition-colors">
      {/* Mobile-first viewport container (Natural responsive width, no fake bezels or fake status bar) */}
      <main className="w-full max-w-md min-h-screen flex flex-col relative bg-slate-50 dark:bg-slate-950 sm:shadow-sm sm:border-x sm:border-slate-200/80 dark:sm:border-slate-800">
        {/* Scrollable Screen Body with safe area padding */}
        <div className="flex-1 overflow-y-auto px-4 pt-3 pb-36 no-scrollbar">
          {isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span>{settings.language === 'ar' ? 'جارٍ التحميل...' : 'Loading...'}</span>
            </div>
          ) : (
            <>
              {activeTab === 'home' && <HomeScreen />}
              {activeTab === 'transactions' && <TransactionsScreen />}
              {activeTab === 'insights' && <InsightsScreen />}
              {activeTab === 'settings' && <SettingsScreen />}
            </>
          )}
        </div>

        {/* Bottom Navigation with Center Elevated + Button */}
        <BottomNavigation />
      </main>

      {/* Fast Add / Edit Expense Modal */}
      <AddExpenseModal
        isOpen={isAddExpenseOpen || !!editingExpense}
        onClose={() => {
          closeAddExpense();
          setEditingExpense(null);
        }}
        editExpense={editingExpense}
      />

      {/* Transaction Details Modal */}
      <TransactionDetailModal
        expense={viewingExpense}
        onClose={() => setViewingExpense(null)}
        onEdit={(exp) => {
          setViewingExpense(null);
          setEditingExpense(exp);
        }}
      />

      {/* Onboarding Dialog */}
      <OnboardingModal
        isOpen={showOnboarding}
        onComplete={() => setShowOnboarding(false)}
      />

      {/* Biometric & Passcode Lock Screen */}
      {settings.biometricLock && isLocked && (
        <LockScreen
          onUnlock={() => setIsLocked(false)}
          savedPasscode={settings.passcode}
          language={language === 'en' ? 'en' : 'ar'}
        />
      )}

      {/* Global Toast with Undo support */}
      <Toast />
    </div>
  );
};
