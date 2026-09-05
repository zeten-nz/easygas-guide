import { test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Brand } from './Brand';

test('renders the real wordmark asset with a meaningful alt and no-CLS dimensions', () => {
  render(<Brand variant="wordmark" height={30} />);
  const img = screen.getByAltText('EASY GAS') as HTMLImageElement;
  // Real asset path (never regenerated/recolored) and the true 729×207 ratio.
  expect(img.getAttribute('src')).toBe('/easygas-side-text.png');
  expect(img.getAttribute('height')).toBe('30');
  expect(img.getAttribute('width')).toBe(String(Math.round(30 * (729 / 207))));
});

test('a decorative logo (a text label already names the brand) has an empty alt and is aria-hidden', () => {
  const { container } = render(<Brand variant="wordmark" height={30} decorative />);
  const img = container.querySelector('img')!;
  expect(img.getAttribute('alt')).toBe('');
  expect(img.getAttribute('aria-hidden')).toBe('true');
  // Not exposed to the accessibility tree by name.
  expect(screen.queryByAltText('EASY GAS')).toBeNull();
});

test('the mark and stacked variants use their own real square assets', () => {
  const { rerender, container } = render(<Brand variant="mark" height={40} />);
  expect(container.querySelector('img')!.getAttribute('src')).toBe('/easygas-none-text.png');
  rerender(<Brand variant="stacked" height={40} />);
  expect(container.querySelector('img')!.getAttribute('src')).toBe('/easygas-bottom-text.png');
});
