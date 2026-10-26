import type { TFunc } from './i18n';
import type { Locale, MessageKey } from './types';
import type { RoleCode } from '../types/auth';

/**
 * Localized DISPLAY labels for values whose stored form must never change:
 *  - Role codes (USTA/MASTER/…) keep their codes; only the shown label localizes.
 *  - Region values are submitted verbatim (the Uzbek name is the stored value);
 *    only the shown label changes. Uzbek display == the stored value.
 */

/** Russian display names for the recognized regions. Keys are the stored uz values. */
const REGION_RU: Record<string, string> = {
  'Toshkent shahri': 'город Ташкент',
  'Toshkent viloyati': 'Ташкентская область',
  Andijon: 'Андижан',
  Buxoro: 'Бухара',
  "Farg'ona": 'Фергана',
  Jizzax: 'Джизак',
  Namangan: 'Наманган',
  Navoiy: 'Навои',
  Qashqadaryo: 'Кашкадарья',
  "Qoraqalpog'iston": 'Каракалпакстан',
  Samarqand: 'Самарканд',
  Sirdaryo: 'Сырдарья',
  Surxondaryo: 'Сурхандарья',
  Xorazm: 'Хорезм',
};

/** Localized region label; the passed `value` (stored form) is returned unchanged for uz. */
export function regionLabel(value: string, locale: Locale): string {
  if (locale === 'ru') return REGION_RU[value] ?? value;
  return value;
}

/** Localized role label from a stable role code. */
export function roleLabel(role: RoleCode, t: TFunc): string {
  return t(`role.${role}` as MessageKey);
}
