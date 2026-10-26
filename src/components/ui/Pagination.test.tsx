import { test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Pagination } from './Pagination';
import { I18nProvider } from '../../i18n/i18n';

const noop = () => {};

// Pagination reads its labels from the i18n provider (Uzbek default).
function renderPg(ui: Parameters<typeof render>[0]) {
  return render(<I18nProvider>{ui}</I18nProvider>);
}

function summaryText(): string {
  // The summary <p> is the one containing the count-agnostic "Jami:" total.
  const p = screen.getByText((_c, el) => (el?.textContent ?? '').includes('Jami:') && el?.tagName === 'P');
  return (p.textContent ?? '').replace(/\s+/g, ' ').trim();
}

function normalized(container: HTMLElement): string {
  return (container.textContent ?? '').replace(/\s+/g, ' ').trim();
}

test('renders a persistent, count-agnostic summary even for a single page', () => {
  const { container } = renderPg(<Pagination page={1} pageSize={25} total={6} noun="xodim" onPageChange={noop} onPageSizeChange={noop} />);
  expect(summaryText()).toBe('Jami: 6 · 1–6');
  expect(normalized(container)).toContain('Sahifa 1 / 1');
});

test('computes the shown range and page count for a middle page', () => {
  const { container } = renderPg(<Pagination page={2} pageSize={25} total={60} noun="ish" onPageChange={noop} onPageSizeChange={noop} />);
  expect(summaryText()).toBe('Jami: 60 · 26–50');
  expect(normalized(container)).toContain('Sahifa 2 / 3');
});

test('renders nothing when there are no rows (the caller owns the empty state)', () => {
  const { container } = renderPg(<Pagination page={1} pageSize={25} total={0} noun="xodim" onPageChange={noop} onPageSizeChange={noop} />);
  expect(container).toBeEmptyDOMElement();
});

test('previous is disabled on the first page and next on the last', () => {
  const { rerender } = renderPg(<Pagination page={1} pageSize={25} total={60} noun="x" onPageChange={noop} onPageSizeChange={noop} />);
  expect(screen.getByLabelText('Oldingi sahifa')).toBeDisabled();
  expect(screen.getByLabelText('Keyingi sahifa')).not.toBeDisabled();
  rerender(<I18nProvider><Pagination page={3} pageSize={25} total={60} noun="x" onPageChange={noop} onPageSizeChange={noop} /></I18nProvider>);
  expect(screen.getByLabelText('Keyingi sahifa')).toBeDisabled();
});

test('next/prev and page-size selection call back with the right values', async () => {
  const onPageChange = vi.fn();
  const onPageSizeChange = vi.fn();
  renderPg(<Pagination page={2} pageSize={25} total={100} noun="x" onPageChange={onPageChange} onPageSizeChange={onPageSizeChange} />);
  await userEvent.click(screen.getByLabelText('Keyingi sahifa'));
  expect(onPageChange).toHaveBeenCalledWith(3);
  await userEvent.click(screen.getByLabelText('Oldingi sahifa'));
  expect(onPageChange).toHaveBeenCalledWith(1);
  await userEvent.selectOptions(screen.getByLabelText(/qatorlar soni/i), '50');
  expect(onPageSizeChange).toHaveBeenCalledWith(50);
});
