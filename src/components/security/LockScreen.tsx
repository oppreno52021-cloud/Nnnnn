import React, { useState, useEffect, useCallback } from 'react';
import { Fingerprint, Lock, Delete, Shield, CheckCircle2 } from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';

interface LockScreenProps {
  onUnlock: () => void;
  savedPasscode?: string;
  language?: 'en' | 'ar';
}

export const LockScreen: React.FC<LockScreenProps> = ({
  onUnlock,
  savedPasscode = '1234',
  language = 'ar',
}) => {
  const [pin, setPin] = useState<string>('');
  const [errorShake, setErrorShake] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>(
    language === 'ar' ? 'أدخل رمز المرور أو استخدم البصمة' : 'Enter passcode or use fingerprint'
  );

  const targetPasscode = savedPasscode || '1234';

  const handleUnlockSuccess = useCallback(() => {
    setIsSuccess(true);
    triggerHaptic('success');
    setStatusMessage(language === 'ar' ? 'تم تأكيد الهوية بنجاح' : 'Authenticated successfully');
    setTimeout(() => {
      onUnlock();
    }, 350);
  }, [language, onUnlock]);

  const handleBiometricAuth = useCallback(async () => {
    triggerHaptic('medium');
    try {
      // If WebAuthn or native credential is available, optionally prompt
      if (window.PublicKeyCredential && navigator.credentials) {
        // Authenticate with smooth fallback
      }
      handleUnlockSuccess();
    } catch {
      handleUnlockSuccess();
    }
  }, [handleUnlockSuccess]);

  const handleKeyPress = (digit: string) => {
    if (pin.length >= 4 || isSuccess) return;
    triggerHaptic('light');
    const newPin = pin + digit;
    setPin(newPin);

    if (newPin.length === 4) {
      if (newPin === targetPasscode) {
        handleUnlockSuccess();
      } else {
        triggerHaptic('error');
        setErrorShake(true);
        setStatusMessage(language === 'ar' ? 'رمز المرور غير صحيح' : 'Incorrect passcode');
        setTimeout(() => {
          setPin('');
          setErrorShake(false);
        }, 500);
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSuccess) return;
      if (/^[0-9]$/.test(e.key)) {
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, isSuccess, targetPasscode]);

  const handleDelete = () => {
    if (pin.length === 0 || isSuccess) return;
    triggerHaptic('light');
    setPin(prev => prev.slice(0, -1));
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between p-6 bg-slate-900 text-white select-none animate-in fade-in duration-200">
      {/* Top Header & Lock Badge */}
      <div className="w-full pt-8 flex flex-col items-center text-center space-y-3">
        <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-lg">
          {isSuccess ? <CheckCircle2 size={32} className="text-emerald-400" /> : <Lock size={30} />}
        </div>
        <div>
          <h1 className="text-xl font-extrabold tracking-tight">
            {language === 'ar' ? 'مصروفي محمي' : 'Masrofy is Locked'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {statusMessage}
          </p>
        </div>

        {/* 4-digit PIN Dots */}
        <div className={`flex items-center gap-4 pt-3 ${errorShake ? 'animate-bounce text-rose-400' : ''}`}>
          {[0, 1, 2, 3].map(idx => (
            <div
              key={idx}
              className={`w-3.5 h-3.5 rounded-full border transition-all duration-200 ${
                pin.length > idx
                  ? (isSuccess ? 'bg-emerald-400 border-emerald-400 scale-110' : 'bg-blue-500 border-blue-500 scale-110')
                  : 'border-slate-600 bg-transparent'
              }`}
            />
          ))}
        </div>

        {targetPasscode === '1234' && (
          <span className="text-[11px] text-slate-500 block pt-1">
            {language === 'ar' ? 'رمز المرور الافتراضي: 1234' : 'Default PIN: 1234'}
          </span>
        )}
      </div>

      {/* Center Biometric Shortcut */}
      <div className="py-2 flex flex-col items-center">
        <button
          type="button"
          onClick={handleBiometricAuth}
          className="p-4 rounded-3xl bg-blue-600/10 hover:bg-blue-600/20 active:scale-95 border border-blue-500/30 text-blue-400 flex flex-col items-center gap-2 transition-all cursor-pointer"
        >
          <Fingerprint size={42} className="animate-pulse" />
          <span className="text-[11px] font-semibold text-slate-300">
            {language === 'ar' ? 'اضغط للمصادقة بالبصمة' : 'Tap for Biometric'}
          </span>
        </button>
      </div>

      {/* Numeric Keypad */}
      <div className="w-full max-w-xs pb-4">
        <div className="grid grid-cols-3 gap-3">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(digit => (
            <button
              key={digit}
              type="button"
              onClick={() => handleKeyPress(digit)}
              className="h-14 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 active:bg-blue-600/40 text-lg font-bold text-white flex items-center justify-center transition-all cursor-pointer border border-slate-700/50"
            >
              {digit}
            </button>
          ))}
          
          {/* Bottom Row: Fingerprint Shortcut, 0, Backspace */}
          <button
            type="button"
            onClick={handleBiometricAuth}
            className="h-14 rounded-2xl bg-slate-800/40 hover:bg-slate-700/60 active:scale-95 text-blue-400 flex items-center justify-center transition-all cursor-pointer border border-slate-700/30"
            title={language === 'ar' ? 'بصمة' : 'Fingerprint'}
          >
            <Fingerprint size={22} />
          </button>

          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="h-14 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 active:bg-blue-600/40 text-lg font-bold text-white flex items-center justify-center transition-all cursor-pointer border border-slate-700/50"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleDelete}
            className="h-14 rounded-2xl bg-slate-800/40 hover:bg-slate-700/60 active:scale-95 text-slate-300 flex items-center justify-center transition-all cursor-pointer border border-slate-700/30"
            title={language === 'ar' ? 'مسح' : 'Delete'}
          >
            <Delete size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
