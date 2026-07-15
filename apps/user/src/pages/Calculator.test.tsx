import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CalculatorPage from './Calculator';
import { calculatorApi } from '../api/calculatorApi';
import { Gender, ActivityLevel, FitnessGoal } from 'gymfuel-shared';

// Mock calculatorApi
vi.mock('../api/calculatorApi', () => ({
  calculatorApi: {
    getTDEE: vi.fn(),
    getBMI: vi.fn(),
    getProteinRange: vi.fn(),
    getOneRepMax: vi.fn(),
  },
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock authStore
vi.mock('../store/authStore', () => ({
  useAuthStore: () => ({
    user: {
      profile: {
        weight: 80,
        height: 180,
        age: 30,
        gender: Gender.MALE,
        activityLevel: ActivityLevel.MODERATE,
      },
      goals: {
        type: FitnessGoal.BUILD_MUSCLE,
      },
    },
  }),
}));

describe('CalculatorPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the tab buttons and active tab content', () => {
    render(<CalculatorPage />);

    // Header title check
    expect(screen.getByText('GymFuel Calculators')).toBeInTheDocument();

    // Tab buttons check
    expect(screen.getByTestId('tab-tdee')).toBeInTheDocument();
    expect(screen.getByTestId('tab-bmi')).toBeInTheDocument();
    expect(screen.getByTestId('tab-protein')).toBeInTheDocument();
    expect(screen.getByTestId('tab-1rm')).toBeInTheDocument();

    // TDEE form is visible by default
    expect(
      screen.getByText('Calculate TDEE & Daily Macros'),
    ).toBeInTheDocument();
  });

  it('pre-populates TDEE form with user profile values', () => {
    render(<CalculatorPage />);

    const weightInput = screen.getByTestId('tdee-weight') as HTMLInputElement;
    const heightInput = screen.getByTestId('tdee-height') as HTMLInputElement;
    const ageInput = screen.getByTestId('tdee-age') as HTMLInputElement;
    const genderSelect = screen.getByTestId('tdee-gender') as HTMLSelectElement;
    const activitySelect = screen.getByTestId(
      'tdee-activity',
    ) as HTMLSelectElement;
    const goalSelect = screen.getByTestId('tdee-goal') as HTMLSelectElement;

    expect(weightInput.value).toBe('80');
    expect(heightInput.value).toBe('180');
    expect(ageInput.value).toBe('30');
    expect(genderSelect.value).toBe(Gender.MALE);
    expect(activitySelect.value).toBe(ActivityLevel.MODERATE);
    expect(goalSelect.value).toBe(FitnessGoal.BUILD_MUSCLE);
  });

  it('calculates TDEE and displays target results', async () => {
    const mockTDEEResponse = {
      tdee: 2800,
      targets: {
        targetCalories: 3100,
        targetProtein: 160,
        targetCarbs: 450,
        targetFat: 86,
        targetWaterGlasses: 10,
      },
    };
    vi.mocked(calculatorApi.getTDEE).mockResolvedValue(mockTDEEResponse);

    render(<CalculatorPage />);

    const submitButton = screen.getByRole('button', {
      name: /calculate targets/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(calculatorApi.getTDEE).toHaveBeenCalledWith({
        weight: 80,
        height: 180,
        age: 30,
        gender: Gender.MALE,
        activityLevel: ActivityLevel.MODERATE,
        goal: FitnessGoal.BUILD_MUSCLE,
      });
    });

    expect(screen.getByText('2,800')).toBeInTheDocument();
    expect(screen.getByText('3,100 kcal')).toBeInTheDocument();
    expect(screen.getByText('160g')).toBeInTheDocument();
    expect(screen.getByText('450g')).toBeInTheDocument();
    expect(screen.getByText('86g')).toBeInTheDocument();
    expect(screen.getByText('10 glasses (2.5L)')).toBeInTheDocument();
  });

  it('calculates BMI and classifications', async () => {
    const mockBMIResponse = {
      bmi: 24.7,
      classification: 'Normal',
    };
    vi.mocked(calculatorApi.getBMI).mockResolvedValue(mockBMIResponse);

    render(<CalculatorPage />);

    // Switch tab to BMI
    const bmiTab = screen.getByTestId('tab-bmi');
    fireEvent.click(bmiTab);

    // Verify BMI Form title
    await waitFor(() => {
      expect(screen.getByText('Body Mass Index (BMI)')).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: /calculate bmi/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(calculatorApi.getBMI).toHaveBeenCalledWith({
        weight: 80,
        height: 180,
      });
    });

    expect(screen.getByText('24.7')).toBeInTheDocument();
    expect(screen.getByText('Classification: Normal')).toBeInTheDocument();
  });

  it('calculates Protein targets range', async () => {
    const mockProteinResponse = {
      min: 160,
      max: 192,
    };
    vi.mocked(calculatorApi.getProteinRange).mockResolvedValue(
      mockProteinResponse,
    );

    render(<CalculatorPage />);

    // Switch tab to Protein
    const proteinTab = screen.getByTestId('tab-protein');
    fireEvent.click(proteinTab);

    // Verify Protein Form title
    await waitFor(() => {
      expect(
        screen.getByText('Daily Protein Intake Target'),
      ).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', {
      name: /calculate protein/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(calculatorApi.getProteinRange).toHaveBeenCalledWith({
        weight: 80,
        goal: FitnessGoal.BUILD_MUSCLE,
      });
    });

    expect(screen.getByText('160g - 192g')).toBeInTheDocument();
  });

  it('calculates 1-Rep Max range table', async () => {
    const mockORMResponse = {
      oneRepMax: 100,
    };
    vi.mocked(calculatorApi.getOneRepMax).mockResolvedValue(mockORMResponse);

    render(<CalculatorPage />);

    // Switch tab to 1-Rep Max
    const ormTab = screen.getByTestId('tab-1rm');
    fireEvent.click(ormTab);

    // Verify 1RM Form title
    await waitFor(() => {
      expect(
        screen.getByText('1-Repetition Max (1RM) Estimator'),
      ).toBeInTheDocument();
    });

    // Fill in inputs
    const weightInput = screen.getByTestId('orm-weight');
    const repsInput = screen.getByTestId('orm-reps');
    fireEvent.change(weightInput, { target: { value: '85' } });
    fireEvent.change(repsInput, { target: { value: '6' } });

    const submitButton = screen.getByRole('button', {
      name: /estimate 1-rep max/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(calculatorApi.getOneRepMax).toHaveBeenCalledWith({
        weight: 85,
        reps: 6,
      });
    });

    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('95%')).toBeInTheDocument();
    expect(screen.getByText('95 kg/lbs')).toBeInTheDocument();
  });
});
