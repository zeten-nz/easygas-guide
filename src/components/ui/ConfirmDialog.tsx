import type { ReactNode } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={loading ? () => {} : onCancel} title={title} className="sm:max-w-md">
      <div className="text-sm leading-relaxed text-[var(--text-2)]">{children}</div>
      <div className="mt-5 flex justify-end gap-3">
        <Button variant="ghost" onClick={onCancel} disabled={loading}>
          Bekor qilish
        </Button>
        <Button variant={danger ? 'danger-outline' : 'primary'} onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
