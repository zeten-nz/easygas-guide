import type { ReactNode } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { useT } from '../../i18n/i18n';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  children: ReactNode;
  /** Defaults to the shared "Tasdiqlash" label when the caller passes none. */
  confirmLabel?: string;
  /** Defaults to the shared "Bekor qilish" label when the caller passes none. */
  cancelLabel?: string;
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
  cancelLabel,
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const t = useT();
  return (
    <Modal open={open} onClose={loading ? () => {} : onCancel} title={title} className="sm:max-w-md">
      <div className="text-sm leading-relaxed text-[var(--text-2)]">{children}</div>
      <div className="mt-5 flex justify-end gap-3">
        <Button variant="ghost" onClick={onCancel} disabled={loading}>
          {cancelLabel ?? t('common.cancel')}
        </Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
          {confirmLabel ?? t('common.confirm')}
        </Button>
      </div>
    </Modal>
  );
}
