import { useEffect, useRef } from 'react';

interface BackAction {
  id: string;
  onBack: () => void;
}

// Global LIFO stack of active overlays/modals
const activeBackActions: BackAction[] = [];
let ignoreNextPop = false;
let tabBackHandler: (() => void) | null = null;
let isListenerAttached = false;

function ensureGlobalListener() {
  if (isListenerAttached || typeof window === 'undefined') return;
  isListenerAttached = true;

  window.addEventListener('popstate', () => {
    // 1. If programmatic cleanup triggered this pop, ignore it
    if (ignoreNextPop) {
      ignoreNextPop = false;
      return;
    }

    // 2. If there are active modals/drawers in the stack, close the topmost one
    if (activeBackActions.length > 0) {
      const topAction = activeBackActions.pop();
      if (topAction) {
        topAction.onBack();
      }
      return;
    }

    // 3. If overlay stack is empty, trigger Tab Back Handler (e.g. return to Home)
    if (tabBackHandler) {
      tabBackHandler();
    }
  });

  // Global Escape key support for desktop
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (activeBackActions.length > 0) {
        // Trigger browser back to pop cleanly
        window.history.back();
      }
    }
  });
}

/**
 * Hook to register an overlay/modal/sheet with the global back navigation stack.
 */
export function useBackHandler(isOpen: boolean, onBack: () => void, id: string = 'modal') {
  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;

  useEffect(() => {
    ensureGlobalListener();
    if (!isOpen) return;

    const actionId = `${id}-${Date.now()}`;
    const action: BackAction = {
      id: actionId,
      onBack: () => onBackRef.current(),
    };

    activeBackActions.push(action);
    window.history.pushState({ modalId: actionId }, '');

    let closedByPop = false;

    return () => {
      // Find and remove this action from stack
      const index = activeBackActions.findIndex(a => a.id === actionId);
      if (index !== -1) {
        activeBackActions.splice(index, 1);
      } else {
        closedByPop = true;
      }

      // If closed via UI click (not by browser popstate), revert pushed state safely
      if (!closedByPop && window.history.state?.modalId === actionId) {
        ignoreNextPop = true;
        window.history.back();
      }
    };
  }, [isOpen, id]);
}

let hasTabHistory = false;

/**
 * Registers the global tab back handler (called when Back is pressed and no overlays are open)
 */
export function registerTabBackHandler(handler: (() => void) | null) {
  tabBackHandler = handler;
  ensureGlobalListener();

  if (handler) {
    if (!hasTabHistory && typeof window !== 'undefined') {
      hasTabHistory = true;
      window.history.pushState({ isTab: true }, '');
    }
  } else {
    hasTabHistory = false;
  }
}
