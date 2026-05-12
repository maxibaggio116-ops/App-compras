import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
  variant?: 'danger' | 'warning';
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmar',
  loading,
  variant = 'danger',
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex flex-col items-center text-center gap-3 py-2">
        <div className={`p-3 rounded-full ${variant === 'danger' ? 'bg-red-50' : 'bg-amber-50'}`}>
          <AlertTriangle
            size={24}
            className={variant === 'danger' ? 'text-[#A32D2D]' : 'text-[#BA7517]'}
          />
        </div>
        <div>
          <h3 className="text-base font-semibold text-gray-800 mb-1">{title}</h3>
          <p className="text-sm text-gray-500">{message}</p>
        </div>
      </div>
    </Modal>
  );
}
