import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

describe('Admin Panel React Tests', () => {
  // Test 1: Renders heading
  it('renders admin panel header', () => {
    render(<App />);
    const heading = screen.getByRole('heading', { name: /GymFuel Admin Panel/i });
    expect(heading).toBeInTheDocument();
  });

  // Test 2: Default option is support agent
  it('defaults to support agent role profile', () => {
    render(<App />);
    const select = screen.getByRole('combobox');
    expect((select as HTMLSelectElement).value).toBe('support');
  });

  // Test 3: Clicking button adds action to log
  it('logs admin actions to audit logs when button is clicked', () => {
    render(<App />);
    const button = screen.getByRole('button', { name: /Clear Redis Cache/i });
    fireEvent.click(button);
    expect(screen.getByText(/Performed: Cleared Cache/i)).toBeInTheDocument();
  });
});
