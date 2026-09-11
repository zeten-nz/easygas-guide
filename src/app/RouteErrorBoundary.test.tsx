import { test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouteErrorBoundary } from './RouteErrorBoundary';
import { I18nProvider } from '../i18n/i18n';

function Boom({ message }: { message: string }): never {
  throw new Error(message);
}

let errSpy: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => errSpy.mockRestore());

test('a failed lazy-chunk fetch offers a reload (never a stack trace)', async () => {
  const reload = vi.fn();
  Object.defineProperty(window, 'location', { value: { reload }, writable: true });

  render(
    <I18nProvider>
      <RouteErrorBoundary>
        <Boom message="Failed to fetch dynamically imported module: /assets/x.js" />
      </RouteErrorBoundary>
    </I18nProvider>,
  );

  expect(screen.getByText(/Yangi versiya mavjud/i)).toBeInTheDocument();
  // No internal detail leaked to the user.
  expect(screen.queryByText(/assets\/x\.js/)).toBeNull();
  await userEvent.click(screen.getByRole('button', { name: /qayta yuklash/i }));
  expect(reload).toHaveBeenCalled();
});

test('a generic render error offers an in-place retry and shows no stack trace', async () => {
  render(
    <I18nProvider>
      <RouteErrorBoundary>
        <Boom message="TypeError: cannot read x of undefined" />
      </RouteErrorBoundary>
    </I18nProvider>,
  );
  expect(screen.getByText(/Nimadir noto/i)).toBeInTheDocument();
  expect(screen.queryByText(/cannot read x/)).toBeNull();
  expect(screen.getByRole('button', { name: /qayta urinish/i })).toBeInTheDocument();
});
