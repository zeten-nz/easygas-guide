import { test, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../test/utils';
import { I18nProvider } from '../../i18n/i18n';
import { CompletionReadinessPanel } from './CompletionReadinessPanel';
import type { CompletionReadiness } from './completion-blockers';

const blocked: CompletionReadiness = {
  canComplete: false,
  reasons: [{ code: 'CRITICAL_RISK_UNRESOLVED', message: 'Hal qilinmagan kritik xavf' }],
  conditions: { checklist: true, stops: true, photos: true, measurements: true, risks: false, signature: false },
};

test('renders each condition with a TEXT status (not colour alone) and server blockers', () => {
  renderWithProviders(<I18nProvider><CompletionReadinessPanel readiness={blocked} /></I18nProvider>);
  // Blocking reason is shown localized-by-code (not the raw server message), tagged by code.
  const reason = screen.getByText('Kritik xavf hal etilmagan');
  expect(reason).toBeInTheDocument();
  expect(reason).toHaveAttribute('data-code', 'CRITICAL_RISK_UNRESOLVED');
  // Each condition row shows a text status ("OK"/"kerak"), not just a colour.
  expect(screen.getAllByText('kerak').length).toBeGreaterThanOrEqual(2); // risks + signature
  expect(screen.getAllByText('OK').length).toBeGreaterThanOrEqual(4);
  expect(screen.getByText("Yakunlash uchun bajarilishi kerak")).toBeInTheDocument();
});

test('shows a ready state with no blocking reasons when the server says canComplete', () => {
  const ready: CompletionReadiness = {
    canComplete: true,
    reasons: [],
    conditions: { checklist: true, stops: true, photos: true, measurements: true, risks: true, signature: true },
  };
  renderWithProviders(<I18nProvider><CompletionReadinessPanel readiness={ready} /></I18nProvider>);
  expect(screen.getByText('Yakunlashga tayyor')).toBeInTheDocument();
  expect(screen.queryByLabelText("To'siqlar")).not.toBeInTheDocument();
});
