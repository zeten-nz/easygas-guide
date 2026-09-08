import { test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DropdownMenu, MenuItem } from './DropdownMenu';

function Harness() {
  return (
    <DropdownMenu button={<button type="button">Ochish</button>}>
      {(close) => (
        <>
          <MenuItem onClick={close}>Birinchi</MenuItem>
          <MenuItem onClick={close}>Ikkinchi</MenuItem>
        </>
      )}
    </DropdownMenu>
  );
}

test('opens on click, focuses the first item, and wires aria on the trigger', async () => {
  render(<Harness />);
  const trigger = screen.getByRole('button', { name: 'Ochish' });
  expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
  expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await userEvent.click(trigger);
  expect(trigger).toHaveAttribute('aria-expanded', 'true');
  expect(screen.getByRole('menu')).toBeInTheDocument();
  // First menu item receives focus for keyboard users.
  expect(screen.getByRole('menuitem', { name: 'Birinchi' })).toHaveFocus();
});

test('Escape closes the menu and restores focus to the trigger', async () => {
  render(<Harness />);
  const trigger = screen.getByRole('button', { name: 'Ochish' });
  await userEvent.click(trigger);
  expect(screen.getByRole('menu')).toBeInTheDocument();
  await userEvent.keyboard('{Escape}');
  expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  expect(trigger).toHaveFocus();
});

test('activating an item closes the menu (via close())', async () => {
  render(<Harness />);
  await userEvent.click(screen.getByRole('button', { name: 'Ochish' }));
  await userEvent.click(screen.getByRole('menuitem', { name: 'Ikkinchi' }));
  expect(screen.queryByRole('menu')).not.toBeInTheDocument();
});
