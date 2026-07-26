import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  saveCachedExercises,
  getCachedExercises,
  enqueueOfflineWorkout,
  getOfflineWorkoutsQueue,
  clearOfflineWorkoutsQueue,
  syncOfflineWorkouts,
} from './offlineStorage';
import {
  MuscleGroup,
  Equipment,
  DifficultyLevel,
  IExercise,
} from 'gymfuel-shared';

describe('offlineStorage Utilities', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  const mockExercises: IExercise[] = [
    {
      _id: 'ex-101',
      name: 'Push Up',
      muscleGroup: MuscleGroup.CHEST,
      equipment: Equipment.BODYWEIGHT,
      difficulty: DifficultyLevel.BEGINNER,
      instructions: ['Plank position', 'Lower body', 'Push up'],
      isCustom: false,
      createdAt: '2026-07-01',
    },
  ];

  it('saves and retrieves cached exercise library from localStorage', () => {
    saveCachedExercises(mockExercises);
    const cached = getCachedExercises();

    expect(cached).toHaveLength(1);
    expect(cached[0].name).toBe('Push Up');
  });

  it('queues offline workout logs correctly', () => {
    const payload = {
      name: 'Leg Day Offline',
      exercises: [
        {
          exerciseId: 'ex-102',
          exerciseName: 'Squat',
          sets: [{ setNumber: 1, reps: 12, weight: 100, isWarmup: false }],
        },
      ],
      durationMinutes: 45,
      totalVolume: 1200,
      startedAt: '2026-07-26T10:00:00Z',
      completedAt: '2026-07-26T10:45:00Z',
    };

    const enqueued = enqueueOfflineWorkout(payload);

    expect(enqueued.id).toContain('offline-');
    expect(enqueued.name).toBe('Leg Day Offline');

    const queue = getOfflineWorkoutsQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0].name).toBe('Leg Day Offline');
  });

  it('clears offline workouts queue', () => {
    enqueueOfflineWorkout({
      exercises: [],
      durationMinutes: 30,
      totalVolume: 0,
      startedAt: '2026-07-26T10:00:00Z',
      completedAt: '2026-07-26T10:30:00Z',
    });

    expect(getOfflineWorkoutsQueue()).toHaveLength(1);
    clearOfflineWorkoutsQueue();
    expect(getOfflineWorkoutsQueue()).toHaveLength(0);
  });

  it('syncs offline queued workouts to backend API', async () => {
    enqueueOfflineWorkout({
      name: 'Synced Session',
      exercises: [],
      durationMinutes: 30,
      totalVolume: 500,
      startedAt: '2026-07-26T10:00:00Z',
      completedAt: '2026-07-26T10:30:00Z',
    });

    const mockApiFn = vi.fn().mockResolvedValue({
      workoutLog: { _id: 'server-id-1' },
    });

    const result = await syncOfflineWorkouts(mockApiFn);

    expect(result.syncedCount).toBe(1);
    expect(result.errors).toBe(0);
    expect(mockApiFn).toHaveBeenCalledTimes(1);
    expect(getOfflineWorkoutsQueue()).toHaveLength(0);
  });
});
