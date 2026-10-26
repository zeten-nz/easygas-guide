import { forwardRef, useState, type ComponentProps } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { Input } from './Input';
import { useT } from '../../i18n/i18n';

type PasswordInputProps = Omit<ComponentProps<typeof Input>, 'type' | 'rightSlot' | 'leftIcon'>;

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(function PasswordInput(props, ref) {
  const [visible, setVisible] = useState(false);
  const t = useT();

  return (
    <Input
      ref={ref}
      type={visible ? 'text' : 'password'}
      leftIcon={<Lock className="size-[18px]" />}
      rightSlot={
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? t('ui.password.hide') : t('ui.password.show')}
          className="rounded-md p-1 text-[var(--text-2)] transition-colors hover:text-[var(--text-1)]"
        >
          {visible ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
        </button>
      }
      {...props}
    />
  );
});
