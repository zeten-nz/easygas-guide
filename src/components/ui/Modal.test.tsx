import { test, expect, vi } from 'vitest';
import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from './Modal';

test('is an accessible dialog (role=dialog, aria-modal)', () => {
  render(
    <Modal open onClose={() => {}} title="Test oynasi">
      <button>Ichki tugma</button>
    </Modal>,
  );
  const dialog = screen.getByRole('dialog');
  expect(dialog).toHaveAttribute('aria-modal', 'true');
  expect(dialog).toHaveAttribute('aria-label', 'Test oynasi');
});

test('moves focus into the dialog on open and traps Tab within it', async () => {
  render(
    <Modal open onClose={() => {}} title="T">
      <button>Birinchi</button>
      <button>Ikkinchi</button>
    </Modal>,
  );
  // Focus enters the dialog on the first focusable (the close button in header order).
  const close = screen.getByRole('button', { name: 'Yopish' });
  expect(close).toHaveFocus();

  // From the last focusable, Tab wraps back to the first — focus never escapes.
  const last = screen.getByRole('button', { name: 'Ikkinchi' });
  last.focus();
  await userEvent.tab();
  expect(close).toHaveFocus();
});

test('Escape closes the dialog', async () => {
  const onClose = vi.fn();
  render(
    <Modal open onClose={onClose} title="T">
      <button>x</button>
    </Modal>,
  );
  await userEvent.keyboard('{Escape}');
  expect(onClose).toHaveBeenCalled();
});

test('restores focus to the trigger when it closes', async () => {
  function Harness() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <button onClick={() => setOpen(true)}>Ochish</button>
        <Modal open={open} onClose={() => setOpen(false)} title="T">
          <button>Ichki</button>
        </Modal>
      </>
    );
  }
  render(<Harness />);
  const trigger = screen.getByRole('button', { name: 'Ochish' });
  trigger.focus();
  await userEvent.click(trigger);
  expect(screen.getByRole('dialog')).toBeInTheDocument();

  await userEvent.keyboard('{Escape}');
  // Focus returns to the element that opened the dialog.
  expect(trigger).toHaveFocus();
});
