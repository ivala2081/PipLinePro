import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  subtitle?: string;
  footer?: React.ReactNode;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  className?: string;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  subtitle,
  footer,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  className = '',
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle escape key press
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && closeOnEscape) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, closeOnEscape]);

  // Handle click outside modal
  const handleBackdropClick = (event: React.MouseEvent) => {
    if (closeOnBackdropClick && event.target === event.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'business-modal-sm',
    md: 'business-modal-md',
    lg: 'business-modal-lg',
    xl: 'business-modal-xl',
    full: 'business-modal-full',
  };

  return (
    <div className="business-modal-overlay" onClick={handleBackdropClick}>
      {/* Modal */}
      <div
        ref={modalRef}
        className={`${sizeClasses[size]} ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby={subtitle ? "modal-subtitle" : undefined}
      >
        {/* Header */}
        <div className="business-modal-header">
          <div>
            <h2
              id="modal-title"
              className="business-modal-header-title"
            >
              {title}
            </h2>
            {subtitle && (
              <p
                id="modal-subtitle"
                className="business-modal-header-subtitle"
              >
                {subtitle}
              </p>
            )}
          </div>
          {showCloseButton && (
            <button
              onClick={onClose}
              className="business-modal-close"
              aria-label="Close modal"
            >
              <X className="business-modal-close-icon" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="business-modal-body">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="business-modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
