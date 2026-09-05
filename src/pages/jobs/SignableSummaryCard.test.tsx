import { test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SignableSummaryCard } from './SignableSummaryCard';
import type { SignableSummaryContent } from '../../api/safety.api';

const content: SignableSummaryContent = {
  schemaVersion: '1',
  jobId: 5,
  cycle: 1,
  branchId: 2,
  assignedTechnicianId: 3,
  checklistTemplateId: 1,
  checklistVersion: 4,
  installation: { gasType: 'LPG', kit: 'Stag', ecu: 'ECU-1', cylinder: '50L', note: null },
  customer: { id: 1, name: 'Ali Valiyev', phoneMasked: '+998 90 *** ** 67' },
  vehicle: { id: 1, plate: '01A123BC', vin: null, make: 'Chevrolet', model: 'Cobalt', year: 2022 },
  steps: [{ id: 1, stepId: 1, name: 'a', status: 'READY', isStop: false }],
  stops: [{ jobStepId: 1, attempt: 1, status: 'APPROVED' }],
  openBlockingRiskIds: [],
};

test('renders the customer, vehicle, installation, checklist version and the signing digest', () => {
  render(<SignableSummaryCard content={content} digest="abc123def456abc123def456" />);
  expect(screen.getByText('Ali Valiyev')).toBeInTheDocument();
  expect(screen.getByText('+998 90 *** ** 67')).toBeInTheDocument(); // masked phone shown as-is
  expect(screen.getByText(/01A123BC/)).toBeInTheDocument();
  expect(screen.getByText('v4')).toBeInTheDocument();
  // The canonical digest the customer signs is shown verbatim.
  expect(screen.getByText('abc123def456abc123def456')).toBeInTheDocument();
});

test('shows unresolved blocking-risk count when present', () => {
  render(<SignableSummaryCard content={{ ...content, openBlockingRiskIds: [7, 8] }} digest="d" />);
  expect(screen.getByText('2 ta')).toBeInTheDocument();
});
