import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

// Mock the auth store to simulate non-initialized state
vi.mock('./store/authStore', () => {
  return {
    useAuthStore: () => ({
      fetchProfile: vi.fn(),
      isInitialized: false,
      isAuthenticated: false,
      user: null,
    }),
  };
});

describe('User App React Tests', () => {
  it('renders loading screen initially', () => {
    render(<App />);
    const loadingText = screen.getByText(/LOADING PROFILE.../i);
    expect(loadingText).toBeInTheDocument();
  });
});
