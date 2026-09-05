import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

/** Renders a component with the app's providers (react-query + router) for tests. */
export function renderWithProviders(ui: ReactElement) {
  const client = new QueryClient({
    // Consume query errors here so an intentionally-failing queryFn (error-state
    // tests) never surfaces as an "unhandled rejection" that fails the test.
    queryCache: new QueryCache({ onError: () => {} }),
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}
