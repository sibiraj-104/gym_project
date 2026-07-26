import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

describe('Admin Panel React Tests', () => {
  // Test 1: Renders main title
  it('renders admin management console header', () => {
    render(<App />);
    const heading = screen.getByRole('heading', {
      name: /GymFuel Management Console/i,
    });
    expect(heading).toBeInTheDocument();
  });

  // Test 2: Renders metrics and navigation sidebar
  it('renders navigation tabs and server metrics', () => {
    render(<App />);
    expect(screen.getByText(/Overview Dashboard/i)).toBeInTheDocument();
    expect(screen.getAllByText(/AWS EC2/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Total Members/i)).toBeInTheDocument();
  });

  // Test 3: Role selector updates audit log context
  it('allows changing role profile and logging actions', () => {
    render(<App />);
    const select = screen.getByRole('combobox');
    expect((select as HTMLSelectElement).value).toBe('admin');

    const flushBtn = screen.getByRole('button', { name: /Flush Redis Cache/i });
    fireEvent.click(flushBtn);

    expect(screen.getByText(/Role: ADMIN/i)).toBeInTheDocument();
    expect(screen.getByText(/Flushed Redis Cache/i)).toBeInTheDocument();
  });

  // Test 4: Member ban/unban toggle updates user status
  it('toggles member ban status when ban button is clicked', () => {
    render(<App />);
    const banButtons = screen.getAllByRole('button', { name: /^Ban User$/i });
    expect(banButtons.length).toBeGreaterThan(0);

    fireEvent.click(banButtons[0]);
    expect(
      screen.getByText(/Banned User: sibiraj@gymfuel.com/i),
    ).toBeInTheDocument();
  });
});
