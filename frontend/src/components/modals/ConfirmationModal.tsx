import { useEffect } from 'react';
import {
  HiExclamationTriangle,
  HiInformationCircle,
} from 'react-icons/hi2';
import Portal from '../common/Portal';

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
          <div className="confirmationmodal-icon-wrapper confirmationmodal-icon-danger">
            <HiExclamationTriangle className="confirmationmodal-icon-danger-color" />
          </div>
        );
      case 'warning':
        return (
          <div className="confirmationmodal-icon-wrapper confirmationmodal-icon-warning">
            <HiExclamationTriangle className="confirmationmodal-icon-warning-color" />
          </div>
        );
      default:
        return (
          <div className="confirmationmodal-icon-wrapper confirmationmodal-icon-info">
            <HiInformationCircle className="confirmationmodal-icon-info-color" />
          </div>
        );
    }
  };

  const getConfirmButtonClass = () => {
    switch (type) {
      case 'danger':
        return 'confirmationmodal-confirm-danger';
      case 'warning':
        return 'confirmationmodal-confirm-warning';
      default:
        return 'confirmationmodal-confirm-info';
    }
  };

  return (
     <Portal>
      <div className="confirmationmodal-overlay">
        <div className="confirmationmodal-backdrop">
          {/* Backdrop with blur effect */}
          <div
            className="confirmationmodal-blur"
            onClick={onClose}
          />

          {/* Modal panel with glass effect */}
          <div className="confirmationmodal-panel">
            <div className="confirmationmodal-content">
              <div className="confirmationmodal-body">
                {getIcon()}
                <div className="confirmationmodal-text-container">
                  <h3 className="confirmationmodal-title">
                    {title}
                  </h3>
                  <div className="confirmationmodal-message-container">
                    <p className="confirmationmodal-message">
                      {message}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="confirmationmodal-footer">
              <button
                type="button"
                className={getConfirmButtonClass()}
                onClick={onConfirm}
              >
                {confirmText}
              </button>
              <button
                type="button"
                className="confirmationmodal-cancel"
                onClick={onClose}
              >
                {cancelText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
}