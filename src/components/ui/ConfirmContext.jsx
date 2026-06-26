import { useState, useRef, useEffect, useCallback } from "react";
import { ConfirmContext } from "../../hooks/useConfirm.js";

export function ConfirmProvider({ children }) {
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmLabel: "Confirmer",
    cancelLabel: "Annuler",
    isDanger: false,
    onConfirm: null,
    onCancel: null,
  });

  const modalRef = useRef(null);
  const previousFocusRef = useRef(null);

  const confirm = useCallback(({ title, message, confirmLabel = "Confirmer", cancelLabel = "Annuler", isDanger = false }) => {
    return new Promise((resolve) => {
      previousFocusRef.current = document.activeElement;
      setConfirmState({
        isOpen: true,
        title,
        message,
        confirmLabel,
        cancelLabel,
        isDanger,
        onConfirm: () => {
          setConfirmState(prev => ({ ...prev, isOpen: false }));
          if (previousFocusRef.current) previousFocusRef.current.focus();
          resolve(true);
        },
        onCancel: () => {
          setConfirmState(prev => ({ ...prev, isOpen: false }));
          if (previousFocusRef.current) previousFocusRef.current.focus();
          resolve(false);
        }
      });
    });
  }, []);

  useEffect(() => {
    if (!confirmState.isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") confirmState.onCancel();
      else if (e.key === "Tab") {
        if (!modalRef.current) return;
        const focusables = modalRef.current.querySelectorAll('button:not([disabled])');
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          last.focus();
          e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === last) {
          first.focus();
          e.preventDefault();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    if (modalRef.current) {
      const primaryBtn = modalRef.current.querySelector('[data-primary="true"]');
      if (primaryBtn) primaryBtn.focus();
    }
    
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [confirmState]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      
      {confirmState.isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-ink/90 backdrop-blur-md animate-in fade-in duration-200">
          <div 
            ref={modalRef}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby="confirm-desc"
            className="w-full max-w-sm p-6 bg-panel border border-white/10 rounded-2xl shadow-[0_15px_50px_rgba(0,0,0,0.8)] relative overflow-hidden"
          >
            {confirmState.isDanger && (
              <div className="absolute top-0 right-0 w-32 h-32 bg-danger/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
            )}
            
            <div className="relative z-10">
              <h2 id="confirm-title" className={`text-xl font-bold tracking-tight mb-2 ${confirmState.isDanger ? 'text-danger' : 'text-white'}`}>
                {confirmState.title}
              </h2>
              <p id="confirm-desc" className="text-sm text-textdim mb-8 leading-relaxed">
                {confirmState.message}
              </p>
              
              <div className="flex gap-3 justify-end">
                <button 
                  onClick={confirmState.onCancel}
                  className="btn-secondary"
                >
                  {confirmState.cancelLabel}
                </button>
                <button 
                  data-primary="true"
                  onClick={confirmState.onConfirm}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${confirmState.isDanger ? 'bg-danger/20 text-danger hover:bg-danger hover:text-white border border-danger/30' : 'bg-white text-ink hover:bg-white/90'}`}
                >
                  {confirmState.confirmLabel}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}


