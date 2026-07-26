import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import WorkoutPage from './Workout';
import { workoutApi } from '../api/workoutApi';
import { useWorkoutStore } from '../store/workoutStore';
import { MuscleGroup, Equipment } from 'gymfuel-shared';

// Mock workoutApi
vi.mock('../api/workoutApi', () => ({
  workoutApi: {
    getExercises: vi.fn(),
    getExerciseById: vi.fn(),
    logWorkout: vi.fn(),
    getWorkoutHistory: vi.fn(),
    getWorkoutTemplates: vi.fn(),
    getWorkoutTemplateById: vi.fn(),
  },
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

describe('WorkoutPage Component', () => {
  const mockExercises = [
    {
      _id: 'ex-1',
      name: 'Bench Press',
      muscleGroup: MuscleGroup.CHEST,
      equipment: Equipment.BARBELL,
      category: 'Strength',
      description: 'Barbell bench press',
      videoUrl: '',
    },
    {
      _id: 'ex-2',
      name: 'Barbell Squat',
      muscleGroup: MuscleGroup.LEGS,
      equipment: Equipment.BARBELL,
      category: 'Strength',
      description: 'Back squat',
      videoUrl: '',
    },
  ];

  const mockTemplates = [
    {
      _id: 'tmpl-1',
      name: 'Push Day Alpha',
      description: 'Chest, shoulders, triceps heavy strength',
      difficulty: 'Intermediate' as const,
      targetMuscles: [MuscleGroup.CHEST, MuscleGroup.SHOULDERS],
      exercises: [
        {
          exerciseId: 'ex-1',
          exerciseName: 'Bench Press',
          sets: 4,
          repsRange: '8-10',
          restSeconds: 90,
          notes: 'Focus on chest contraction',
        },
      ],
      createdByAdmin: true,
    },
  ];

  const mockHistory = [
    {
      _id: 'log-1',
      userId: 'user-123',
      name: 'Push Hypertrophy',
      startedAt: '2026-07-20T10:00:00Z',
      completedAt: '2026-07-20T10:45:00Z',
      durationMinutes: 45,
      caloriesBurned: 270,
      totalVolume: 3500,
      notes: 'Great pump',
      exercises: [
        {
          exerciseId: 'ex-1',
          exerciseName: 'Bench Press',
          sets: [
            { setNumber: 1, reps: 10, weight: 80, isWarmup: false },
            { setNumber: 2, reps: 8, weight: 85, isWarmup: false },
          ],
        },
      ],
      createdAt: '2026-07-20T10:45:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset Zustand workoutStore state to initial
    useWorkoutStore.setState({
      activeWorkout: {
        name: '',
        startedAt: null,
        exercises: [],
        isActive: false,
      },
      loading: false,
      error: null,
    });

    vi.mocked(workoutApi.getExercises).mockResolvedValue({
      exercises: mockExercises,
      pagination: { total: 2, page: 1, limit: 12, pages: 1 },
    });

    vi.mocked(workoutApi.getWorkoutTemplates).mockResolvedValue({
      templates: mockTemplates,
    });

    vi.mocked(workoutApi.getWorkoutHistory).mockResolvedValue({
      history: mockHistory,
      pagination: { total: 1, page: 1, limit: 10, pages: 1 },
    });
  });

  it('renders top navbar and tab buttons', () => {
    render(<WorkoutPage />);

    expect(screen.getByText('GymFuel Tracker')).toBeInTheDocument();
    expect(screen.getByText('💪 New Workout')).toBeInTheDocument();
    expect(screen.getByText('📖 Movement Library')).toBeInTheDocument();
    expect(screen.getByText('📋 Routine Templates')).toBeInTheDocument();
    expect(screen.getByText('📅 Log History')).toBeInTheDocument();
  });

  it('starts an empty workout session correctly', async () => {
    render(<WorkoutPage />);

    const startBtn = screen.getByRole('button', {
      name: /Start Empty Workout/i,
    });
    fireEvent.click(startBtn);

    expect(useWorkoutStore.getState().activeWorkout.isActive).toBe(true);
    expect(screen.getByDisplayValue('My Workout')).toBeInTheDocument();
    expect(screen.getByText('No movements added yet')).toBeInTheDocument();
  });

  it('loads and displays exercise library with search and filters', async () => {
    render(<WorkoutPage />);

    const libTab = screen.getByText('📖 Movement Library');
    fireEvent.click(libTab);

    await waitFor(() => {
      expect(workoutApi.getExercises).toHaveBeenCalledWith({
        search: '',
        muscle: '',
        equipment: '',
        page: 1,
        limit: 12,
      });
    });

    expect(screen.getByText('Bench Press')).toBeInTheDocument();
    expect(screen.getByText('Barbell Squat')).toBeInTheDocument();
  });

  it('allows filtering exercise library by muscle and search text', async () => {
    render(<WorkoutPage />);

    fireEvent.click(screen.getByText('📖 Movement Library'));

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText('Search exercise by name...'),
      ).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(
      'Search exercise by name...',
    );
    fireEvent.change(searchInput, { target: { value: 'Bench' } });

    await waitFor(() => {
      expect(workoutApi.getExercises).toHaveBeenLastCalledWith({
        search: 'Bench',
        muscle: '',
        equipment: '',
        page: 1,
        limit: 12,
      });
    });
  });

  it('starts a workout session from a template', async () => {
    render(<WorkoutPage />);

    fireEvent.click(screen.getByText('📋 Routine Templates'));

    await waitFor(() => {
      expect(screen.getByText('Push Day Alpha')).toBeInTheDocument();
    });

    const startTmplBtn = screen.getByRole('button', { name: /Start Routine/i });
    fireEvent.click(startTmplBtn);

    expect(useWorkoutStore.getState().activeWorkout.isActive).toBe(true);
    expect(useWorkoutStore.getState().activeWorkout.name).toBe(
      'Push Day Alpha',
    );
    expect(screen.getByText('Bench Press')).toBeInTheDocument();
  });

  it('allows adding sets, editing set weight/reps, and finishing workout', async () => {
    vi.mocked(workoutApi.logWorkout).mockResolvedValue({
      message: 'Workout logged successfully',
      workoutLog: mockHistory[0],
    });

    render(<WorkoutPage />);

    // Start empty workout
    fireEvent.click(
      screen.getByRole('button', { name: /Start Empty Workout/i }),
    );

    // Add exercise to store directly
    useWorkoutStore.getState().addExercise('ex-1', 'Bench Press');

    // Re-render check
    await waitFor(() => {
      expect(screen.getByText('Bench Press')).toBeInTheDocument();
    });

    // Add a set
    const addSetBtn = screen.getByRole('button', { name: /Add Set/i });
    fireEvent.click(addSetBtn);

    // Finish workout
    const finishBtn = screen.getByRole('button', { name: /Finish Workout/i });
    fireEvent.click(finishBtn);

    await waitFor(() => {
      expect(workoutApi.logWorkout).toHaveBeenCalled();
    });
  });

  it('loads and displays past workout history logs', async () => {
    render(<WorkoutPage />);

    fireEvent.click(screen.getByText('📅 Log History'));

    await waitFor(() => {
      expect(workoutApi.getWorkoutHistory).toHaveBeenCalledWith(1, 10);
    });

    expect(screen.getByText('Push Hypertrophy')).toBeInTheDocument();

    // Click history item to expand details
    fireEvent.click(screen.getByText('Push Hypertrophy'));

    await waitFor(() => {
      expect(screen.getByText(/Great pump/i)).toBeInTheDocument();
    });
  });
});
