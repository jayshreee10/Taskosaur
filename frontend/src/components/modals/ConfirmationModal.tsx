'use client';

import { useEffect } from 'react';
import {
  HiExclamationTriangle,
  HiInformationCircle,
  HiCheckCircle
} from 'react-icons/hi2';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'info'
}: ConfirmationModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
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
  }, []);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return (
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100/80 dark:bg-red-900/30 backdrop-blur-sm">
            <HiExclamationTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
        );
      case 'warning':
        return (
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100/80 dark:bg-amber-900/30 backdrop-blur-sm">
            <HiExclamationTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
        );
      default:
        return (
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100/80 dark:bg-amber-900/30 backdrop-blur-sm">
            <HiInformationCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
        );
    }
  };

  const getConfirmButtonClass = () => {
    switch (type) {
      case 'danger':
        return 'inline-flex w-full justify-center rounded-lg bg-red-600/90 backdrop-blur-sm px-4 py-2 text-sm font-medium text-white shadow-lg hover:bg-red-700/90 border border-red-500/20 sm:ml-3 sm:w-auto transition-all';
      case 'warning':
        return 'inline-flex w-full justify-center rounded-lg bg-amber-600/90 backdrop-blur-sm px-4 py-2 text-sm font-medium text-white shadow-lg hover:bg-amber-700/90 border border-amber-500/20 sm:ml-3 sm:w-auto transition-all';
      default:
        return 'inline-flex w-full justify-center rounded-lg bg-amber-600/90 backdrop-blur-sm px-4 py-2 text-sm font-medium text-white shadow-lg hover:bg-amber-700/90 border border-amber-500/20 sm:ml-3 sm:w-auto transition-all';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        {/* Backdrop with blur effect */}
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm transition-all duration-300"
          onClick={onClose}
        />

        {/* Modal panel with glass effect */}
        <div className="relative transform overflow-hidden rounded-xl bg-white/80 dark:bg-stone-900/80 backdrop-blur-lg border border-white/20 dark:border-stone-700/30 text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
          <div className="px-6 pt-6 pb-4">
            <div className="sm:flex sm:items-start">
              {getIcon()}
              <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                <h3 className="text-sm font-semibold leading-6 text-stone-900 dark:text-stone-100">
                  {title}
                </h3>
                <div className="mt-2">
                  <p className="text-xs text-stone-600 dark:text-stone-400">
                    {message}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-stone-50/50 dark:bg-stone-800/50 backdrop-blur-sm px-6 py-4 sm:flex sm:flex-row-reverse border-t border-stone-200/30 dark:border-stone-700/30">
            <button
              type="button"
              className={getConfirmButtonClass()}
              onClick={onConfirm}
            >
              {confirmText}
            </button>
            <button
              type="button"
              className="mt-3 inline-flex w-full justify-center rounded-lg bg-stone-100/80 dark:bg-stone-800/80 backdrop-blur-sm px-4 py-2 text-sm font-medium text-stone-700 dark:text-stone-300 shadow-lg hover:bg-stone-200/80 dark:hover:bg-stone-700/80 border border-stone-300/30 dark:border-stone-600/30 sm:mt-0 sm:w-auto transition-all"
              onClick={onClose}
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}