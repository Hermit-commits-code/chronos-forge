import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ChronosForge from '../src/app/page';

// We mock 'fetch' because we don't want to actually hit the Go server during unit tests
global.fetch = vi.fn();

describe('Chronos Forge UI', () => {
  it('renders the main forge heading', () => {
    render(<ChronosForge />);
    const heading = screen.getByText(/Chronos Forge/i);
    expect(heading).toBeInTheDocument();
  });

  it('contains the clock-in buttons', () => {
    render(<ChronosForge />);
    const forgeButton = screen.getByRole('button', { name: /Clock into Forge/i });
    const adminButton = screen.getByRole('button', { name: /Clock into Admin/i });
    expect(forgeButton).toBeInTheDocument();
    expect(adminButton).toBeInTheDocument();
  });
});