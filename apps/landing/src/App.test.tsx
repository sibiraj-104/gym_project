import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

describe('Landing Page React Tests', () => {
  // Test 1: Renders main header
  it('renders marketing main header', () => {
    render(<App />);
    const heading = screen.getByRole('heading', { name: /GymFuel — Your Ultimate Fitness Partner/i });
    expect(heading).toBeInTheDocument();
  });

  // Test 2: Invalid subscription shows error
  it('shows error message if subscribing with empty or invalid email', () => {
    render(<App />);
    const button = screen.getByRole('button', { name: /Get Early Access/i });
    fireEvent.click(button);
    expect(screen.getByText(/Please enter a valid email address/i)).toBeInTheDocument();
  });

  // Test 3: Valid subscription shows success
  it('shows success message if subscribing with valid email format', () => {
    render(<App />);
    const input = screen.getByPlaceholderText(/Enter your email/i);
    const button = screen.getByRole('button', { name: /Get Early Access/i });
    
    fireEvent.change(input, { target: { value: 'user@gymfuel.com' } });
    fireEvent.click(button);
    
    expect(screen.getByText(/Thank you for subscribing/i)).toBeInTheDocument();
  });
});
