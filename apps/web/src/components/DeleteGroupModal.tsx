"use client";

import { useEffect, useState } from 'react';

interface DeleteGroupModalProps {
  isOpen: boolean;
  groupName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
}

export function DeleteGroupModal({ 
  isOpen, 
  groupName, 
  onConfirm, 
  onCancel, 
  isDeleting = false 
}: DeleteGroupModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDeleting) {
        onCancel();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isDeleting, onCancel]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={!isDeleting ? onCancel : undefined}
      />
      
      {/* Modal */}
      <div className={`relative bg-card border border-border rounded-xl shadow-2xl max-w-md w-full p-6 transition-all duration-200 ${
        isOpen 
          ? 'opacity-100 scale-100 translate-y-0' 
          : 'opacity-0 scale-95 translate-y-4'
      }`}>
        {/* Close button */}
        {!isDeleting && (
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-accent"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Icon */}
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/20 dark:to-red-800/20 rounded-full shadow-lg">
          <div className="w-8 h-8 text-red-600 dark:text-red-400">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-foreground text-center mb-3">
          Удалить группу?
        </h3>

        {/* Description */}
        <div className="text-center mb-6 space-y-3">
          <p className="text-muted-foreground">
            Вы уверены, что хотите удалить группу
          </p>
          <div className="bg-gradient-to-r from-accent/50 to-accent/30 border border-border rounded-lg p-3">
            <p className="font-semibold text-foreground text-lg">
              "{groupName}"
            </p>
          </div>
          <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-lg p-3">
            <div className="flex items-center justify-center gap-2 text-red-700 dark:text-red-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="font-medium">Внимание!</span>
            </div>
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
              Это действие нельзя отменить.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="btn-outline flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Отмена
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="btn bg-destructive text-destructive-foreground hover:bg-destructive/90 flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Удаление...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Удалить</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
