import React, { useState, useRef } from 'react';
import { Expense, Category, Account } from '../../types';
import { CategoryIcon } from '../common/CategoryIcon';
import { formatCurrency, toArabicNumerals } from '../../utils/calculations';
import { getCategoryDisplayName, getAccountDisplayName } from '../../utils/i18n';
import { triggerHaptic } from '../../utils/haptics';
import { ArrowLeftRight, Pencil, Trash2, Copy } from 'lucide-react';

interface SwipeableTransactionItemProps {
  expense: Expense;
  category?: Category;
  fromAccount?: Account;
  toAccount?: Account;
  currency: string;
  language: 'en' | 'ar';
  numberFormat?: 'arabic' | 'western';
  isPrivacyMode: boolean;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate?: () => void;
  todayLabel: string;
  transferLabel: string;
  editLabel: string;
  deleteLabel: string;
  duplicateLabel?: string;
}

export const SwipeableTransactionItem: React.FC<SwipeableTransactionItemProps> = ({
  expense,
  category,
  fromAccount,
  toAccount,
  currency,
  language,
  numberFormat,
  isPrivacyMode,
  onClick,
  onEdit,
  onDelete,
  todayLabel,
  transferLabel,
  editLabel,
  deleteLabel,
}) => {
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const startXRef = useRef<number>(0);
  const startYRef = useRef<number>(0);
  const currentXRef = useRef<number>(0);
  const directionLockedRef = useRef<'vertical' | 'horizontal' | null>(null);
  const hasMovedRef = useRef<boolean>(false);

  const isRTL = language === 'ar';
  const isExpense = expense.type === 'expense';
  const isIncome = expense.type === 'income';
  const isTransfer = expense.type === 'transfer';
  const transferArrow = isRTL ? '←' : '→';

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    const isTouch = 'touches' in e;
    if (!isTouch && (e as React.MouseEvent).buttons !== 1) return;

    const clientX = isTouch ? e.touches[0].clientX : e.clientX;
    const clientY = isTouch ? e.touches[0].clientY : e.clientY;

    startXRef.current = clientX;
    startYRef.current = clientY;
    currentXRef.current = clientX;
    directionLockedRef.current = null; // Undetermined intent
    hasMovedRef.current = false;
    setIsDragging(false);
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    const isTouch = 'touches' in e;
    if (!isTouch && (e as React.MouseEvent).buttons !== 1) {
      if (isDragging) handleTouchEnd();
      return;
    }

    const clientX = isTouch ? e.touches[0].clientX : e.clientX;
    const clientY = isTouch ? e.touches[0].clientY : e.clientY;

    // If already locked to vertical scrolling: DO NOT MOVE THE CARD AT ALL
    if (directionLockedRef.current === 'vertical') {
      return;
    }

    const diffX = clientX - startXRef.current;
    const diffY = clientY - startYRef.current;
    const absX = Math.abs(diffX);
    const absY = Math.abs(diffY);

    // Direction intent check threshold (10px deadzone)
    if (directionLockedRef.current === null) {
      if (absX < 10 && absY < 10) {
        return; // In deadzone: ignore micro-movements
      }

      // If user is moving vertically more than or equal to horizontally -> THIS IS A SCROLL!
      if (absY >= absX) {
        directionLockedRef.current = 'vertical';
        return;
      }

      // Clear horizontal swipe intent
      if (absX > absY * 1.3) {
        directionLockedRef.current = 'horizontal';
        setIsDragging(true);
        hasMovedRef.current = true;
      } else {
        // Diagonal/ambiguous: prioritize scroll
        directionLockedRef.current = 'vertical';
        return;
      }
    }

    // Only if locked to horizontal swipe
    if (directionLockedRef.current === 'horizontal') {
      currentXRef.current = clientX;
      // Damped spring resistance
      const activeDiff = diffX - (diffX > 0 ? 10 : -10);
      const damped = activeDiff * 0.45;
      const clamped = Math.max(-110, Math.min(110, damped));
      setOffsetX(clamped);
    }
  };

  const handleTouchEnd = () => {
    const wasHorizontal = directionLockedRef.current === 'horizontal';
    setIsDragging(false);

    // Trigger action only on intentional horizontal swipe crossing threshold
    if (wasHorizontal) {
      if (offsetX > 70) {
        triggerHaptic('light');
        onEdit();
      } else if (offsetX < -70) {
        triggerHaptic('medium');
        onDelete();
      }
    }

    // Reset state smoothly
    directionLockedRef.current = null;
    setOffsetX(0);
  };

  return (
    <div className="relative overflow-hidden select-none bg-white dark:bg-slate-900 group">
      {/* 
        Background Action Layers with explicit physical directions:
        - Swiping Right (offsetX > 0): reveals the Left side -> GREEN (Edit)
        - Swiping Left (offsetX < 0): reveals the Right side -> RED (Delete)
      */}

      {/* 1. Green Action Layer for Edit (Revealed when pulling to the right) */}
      <div 
        className={`absolute inset-0 bg-emerald-600 text-white flex items-center justify-start px-5 pointer-events-none select-none transition-opacity duration-150 ${
          offsetX > 5 ? 'opacity-100 z-0' : 'opacity-0 -z-10'
        }`}
        style={{ direction: 'ltr' }}
      >
        <div 
          className="flex items-center gap-2 font-bold text-xs"
          style={{
            transform: `scale(${Math.min(1.15, Math.max(0.75, offsetX / 65))})`,
            transition: 'transform 0.1s ease-out',
          }}
        >
          <Pencil size={18} className="shrink-0 drop-shadow-xs" />
          <span className="whitespace-nowrap drop-shadow-xs">{editLabel}</span>
        </div>
      </div>

      {/* 2. Red Action Layer for Delete (Revealed when pulling to the left) */}
      <div 
        className={`absolute inset-0 bg-rose-600 text-white flex items-center justify-end px-5 pointer-events-none select-none transition-opacity duration-150 ${
          offsetX < -5 ? 'opacity-100 z-0' : 'opacity-0 -z-10'
        }`}
        style={{ direction: 'ltr' }}
      >
        <div 
          className="flex items-center gap-2 font-bold text-xs"
          style={{
            transform: `scale(${Math.min(1.15, Math.max(0.75, Math.abs(offsetX) / 65))})`,
            transition: 'transform 0.1s ease-out',
          }}
        >
          <span className="whitespace-nowrap drop-shadow-xs">{deleteLabel}</span>
          <Trash2 size={18} className="shrink-0 drop-shadow-xs" />
        </div>
      </div>

      {/* Foreground Draggable Transaction Card */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseMove={handleTouchMove}
        onMouseUp={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
        onClick={() => {
          if (!hasMovedRef.current) {
            onClick();
          }
        }}
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
        className="relative z-10 p-3.5 flex items-center justify-between bg-white dark:bg-slate-900 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer touch-pan-y"
        title={`${isRTL ? 'اسحب لليمين للتعديل، لليسار للحذف' : 'Swipe right to edit, left to delete'}`}
      >
        <div className="flex items-center gap-3 min-w-0">
          {isTransfer ? (
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <ArrowLeftRight size={18} className="rtl:rotate-180" />
            </div>
          ) : (
            <CategoryIcon 
              name={category?.icon || 'MoreHorizontal'} 
              color={category?.color || '#64748B'} 
              size={20} 
            />
          )}

          <div className="min-w-0">
            <span className="text-sm font-semibold text-slate-900 dark:text-white block truncate">
              {isTransfer 
                ? `${transferLabel}: ${getAccountDisplayName(fromAccount?.name || 'Account', language)} ${transferArrow} ${getAccountDisplayName(toAccount?.name || 'Account', language)}`
                : getCategoryDisplayName(category?.name || 'Other', language)}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 block truncate mt-0.5">
              {expense.note || (isTransfer ? transferLabel : expense.merchant || getCategoryDisplayName(category?.name || '', language))} · {language === 'ar' ? toArabicNumerals(expense.time || '12:00') : (expense.time || '12:00')}
            </span>
          </div>
        </div>

        <div className="text-end shrink-0 ps-2 flex items-center gap-2">
          <span className={`text-base font-bold tracking-tight ${
            isExpense 
              ? 'text-slate-900 dark:text-white' 
              : isIncome 
                ? 'text-emerald-600 dark:text-emerald-400' 
                : 'text-blue-600 dark:text-blue-400'
          }`}>
            {isExpense ? '− ' : isIncome ? '+ ' : '⇄ '}
            {formatCurrency(expense.amount, currency, language, isPrivacyMode, numberFormat)}
          </span>
        </div>
      </div>
    </div>
  );
};
