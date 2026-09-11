import { useLocale, useT } from '../../i18n/i18n';
import { LOCALES } from '../../i18n/types';
import { cn } from '../../lib/utils';

/**
 * Accessible Uzbek/Russian language toggle. A small segmented control that reads
 * from the design-system theme tokens, so it renders correctly on both the light
 * app shell and the dark auth backdrop. The choice persists (localStorage) via the
 * i18n provider and survives navigation and reload.
 */
export function LanguageSelector({ className }: { className?: string }) {
  const { locale, setLocale } = useLocale();
  const t = useT();

  return (
    <div
      role="group"
      aria-label={t('lang.label')}
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full border border-[var(--border-1)] bg-[var(--surface)] p-0.5',
        className,
      )}
    >
      {LOCALES.map((l) => {
        const active = l === locale;
        return (
          <button
            key={l}
            type="button"
            onClick={() => setLocale(l)}
            aria-pressed={active}
            title={l === 'uz' ? t('lang.uz') : t('lang.ru')}
            className={cn(
              'flex min-h-8 min-w-9 items-center justify-center rounded-full px-2.5 text-xs font-semibold transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]',
              active
                ? 'bg-[var(--accent)] text-white'
                : 'text-[var(--text-2)] hover:text-[var(--text-1)]',
            )}
          >
            {l === 'uz' ? t('lang.uzShort') : t('lang.ruShort')}
          </button>
        );
      })}
    </div>
  );
}
