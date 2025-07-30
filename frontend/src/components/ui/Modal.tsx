import { ReactNode } from 'react';
import { HiX } from 'react-icons/hi';
import { cn } from '@/utils/classNames';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity bg-stone-500/75 dark:bg-stone-900/75"
          onClick={onClose}
        />
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">
          &#8203;
        </span>
        <div 
          className={cn(
            'inline-block align-bottom bg-white dark:bg-stone-900 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-stone-200 dark:border-stone-700',
            className
          )}
        >
          <div className="bg-white dark:bg-stone-900 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-stone-900 dark:text-stone-100">
                {title}
              </h3>
              <button
                onClick={onClose}
                className="text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 transition-colors"
              >
                <HiX size={20} />
              </button>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
