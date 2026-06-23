import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

describe('User App React Tests', () => {
  // Test 1: Component renders heading correctly
  it('renders dashboard header', () => {
    render(<App />);
    const heading = screen.getByRole('heading', { name: /GymFuel User Dashboard/i });
    expect(heading).toBeInTheDocument();
  });

  // Test 2: Validation message starts empty
  it('initially does not show validation status message', () => {
    render(<App />);
    const status = screen.queryByText(/Onboarding data is/i);
    expect(status).not.toBeInTheDocument();
  });

  // Test 3: Validation fires and displays success for default values
  it('shows success message when clicking Validate with default valid props', () => {
    render(<App />);
    const button = screen.getByRole('button', { name: /Validate Data/i });
    fireEvent.click(button);
    expect(screen.getByText(/Onboarding data is valid/i)).toBeInTheDocument();
  });
});
