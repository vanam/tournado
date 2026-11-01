import { afterEach, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './Dialog';

const originalFullscreen = Object.getOwnPropertyDescriptor(document, 'fullscreenElement');
afterEach(() => {
  cleanup();
  if (originalFullscreen) Object.defineProperty(document, 'fullscreenElement', originalFullscreen);
  else Reflect.deleteProperty(document, 'fullscreenElement');
});

it('keeps the dialog inside the active fullscreen subtree', () => {
  const container = document.createElement('div');
  document.body.append(container);
  Object.defineProperty(document, 'fullscreenElement', { configurable: true, value: container });
  render(<Dialog open={true}><DialogContent><DialogTitle>Score</DialogTitle><DialogDescription>Enter the result</DialogDescription></DialogContent></Dialog>);
  expect(container.contains(screen.getByRole('dialog'))).toBe(true);
  container.remove();
});
