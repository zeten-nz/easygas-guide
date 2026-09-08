import { test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Pagination } from './Pagination';

const noop = () => {};

function summaryText(): string {
  // The summary <p> is the one containing "ko'rsatilmoqda".
  const p = screen.getByText((_c, el) => (el?.textContent ?? '').includes("ko'rsatilmoqda") && el?.tagName === 'P');
  return (p.textContent ?? '').replace(/\s+/g, ' ').trim();
}

function normalized(container: HTMLElement): string {
  return (container.textContent ?? '').replace(/\s+/g, ' ').trim();
}

test('renders a persistent summary even for a single page', () => {
  const { container } = render(<Pagination page={1} pageSize={25} total={6} noun="xodim" onPageChange={noop} onPageSizeChange={noop} />);
  expect(summaryText()).toBe("Jami 6 xodim · 1–6 ko'rsatilmoqda");
  expect(normalized(container)).toContain('Sahifa 1 / 1');
});

test('computes the shown range and page count for a middle page', () => {
  const { container } = render(<Pagination page={2} pageSize={25} total={60} noun="ish" onPageChange={noop} onPageSizeChange={noop} />);
  expect(summaryText()).toBe("Jami 60 ish · 26–50 ko'rsatilmoqda");
  expect(normalized(container)).toContain('Sahifa 2 / 3');
});

test('renders nothing when there are no rows (the caller owns the empty state)', () => {
  const { container } = render(<Pagination page={1} pageSize={25} total={0} noun="xodim" onPageChange={noop} onPageSizeChange={noop} />);
  expect(container).toBeEmptyDOMElement();
});

test('previous is disabled on the first page and next on the last', () => {
  const { rerender } = render(<Pagination page={1} pageSize={25} total={60} noun="x" onPageChange={noop} onPageSizeChange={noop} />);
  expect(screen.getByLabelText('Oldingi sahifa')).toBeDisabled();
  expect(screen.getByLabelText('Keyingi sahifa')).not.toBeDisabled();
  rerender(<Pagination page={3} pageSize={25} total={60} noun="x" onPageChange={noop} onPageSizeChange={noop} />);
  expect(screen.getByLabelText('Keyingi sahifa')).toBeDisabled();
});

test('next/prev and page-size selection call back with the right values', async () => {
  const onPageChange = vi.fn();
  const onPageSizeChange = vi.fn();
  render(<Pagination page={2} pageSize={25} total={100} noun="x" onPageChange={onPageChange} onPageSizeChange={onPageSizeChange} />);
  await userEvent.click(screen.getByLabelText('Keyingi sahifa'));
  expect(onPageChange).toHaveBeenCalledWith(3);
  await userEvent.click(screen.getByLabelText('Oldingi sahifa'));
  expect(onPageChange).toHaveBeenCalledWith(1);
  await userEvent.selectOptions(screen.getByLabelText(/qatorlar soni/i), '50');
  expect(onPageSizeChange).toHaveBeenCalledWith(50);
});
