import { test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RiskMatrixTable } from './RiskMatrixTable';
import type { MatrixCell, MatrixDefinition } from '../../api/safety.api';

const definition: MatrixDefinition = {
  algorithm: 'severity_x_likelihood',
  allowedSeverity: [1, 2],
  allowedLikelihood: [1, 2],
  thresholds: [{ min: 4, level: 'CRITICAL' }, { min: 0, level: 'LOW' }],
  blockingLevels: ['CRITICAL'],
};
const cells: MatrixCell[] = [
  { severity: 1, likelihood: 1, score: 1, level: 'LOW', blocking: false },
  { severity: 1, likelihood: 2, score: 2, level: 'LOW', blocking: false },
  { severity: 2, likelihood: 1, score: 2, level: 'LOW', blocking: false },
  { severity: 2, likelihood: 2, score: 4, level: 'CRITICAL', blocking: true },
];

test('renders an accessible table with word labels + blocking text (colour never the sole signal)', () => {
  render(<RiskMatrixTable cells={cells} definition={definition} />);
  // A real <table> with a caption for screen readers.
  expect(screen.getByRole('table')).toBeInTheDocument();
  // Level names are words, and the blocking cell says "Bloklovchi" (not colour alone).
  expect(screen.getAllByText('Past').length).toBe(3);
  expect(screen.getByText('Kritik')).toBeInTheDocument();
  expect(screen.getByText(/Bloklovchi/i)).toBeInTheDocument();
  // Each cell exposes a descriptive accessible label.
  expect(screen.getByLabelText(/Og'irlik 2, ehtimollik 2: Kritik, bloklovchi/i)).toBeInTheDocument();
});
