import { IExercise, IWorkoutLog } from 'gymfuel-shared';

const EXERCISES_CACHE_KEY = 'gymfuel_offline_exercises';
const WORKOUT_QUEUE_KEY = 'gymfuel_offline_workout_queue';

export interface OfflineWorkoutPayload {
  id: string;
  name?: string;
  exercises: {
    exerciseId: string;
    exerciseName: string;
    sets: {
      setNumber: number;
      reps?: number;
      weight?: number;
      durationSeconds?: number;
      restSeconds?: number;
      isWarmup: boolean;
    }[];
    notes?: string;
  }[];
  durationMinutes: number;
  totalVolume: number;
  caloriesBurned?: number;
  notes?: string;
  startedAt: string;
  completedAt: string;
  queuedAt: string;
}

/** Save exercise library to localStorage for offline search */
export function saveCachedExercises(exercises: IExercise[]): void {
  try {
    localStorage.setItem(EXERCISES_CACHE_KEY, JSON.stringify(exercises));
  } catch (err) {
    console.error('Failed to cache exercises locally:', err);
  }
}

/** Retrieve locally cached exercises */
export function getCachedExercises(): IExercise[] {
  try {
    const raw = localStorage.getItem(EXERCISES_CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** Queue a completed workout when offline */
export function enqueueOfflineWorkout(
  workout: Omit<OfflineWorkoutPayload, 'id' | 'queuedAt'>,
): OfflineWorkoutPayload {
  const payload: OfflineWorkoutPayload = {
    ...workout,
    id: `offline-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    queuedAt: new Date().toISOString(),
  };

  try {
    const queue = getOfflineWorkoutsQueue();
    queue.push(payload);
    localStorage.setItem(WORKOUT_QUEUE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.error('Failed to queue offline workout:', err);
  }

  return payload;
}

/** Retrieve all queued offline workouts */
export function getOfflineWorkoutsQueue(): OfflineWorkoutPayload[] {
  try {
    const raw = localStorage.getItem(WORKOUT_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** Clear offline workouts queue */
export function clearOfflineWorkoutsQueue(): void {
  try {
    localStorage.removeItem(WORKOUT_QUEUE_KEY);
  } catch {
    // ignore
  }
}

/** Sync offline queued workouts with backend API */
export async function syncOfflineWorkouts(
  logWorkoutFn: (
    data: Record<string, unknown>,
  ) => Promise<{ workoutLog: IWorkoutLog }>,
): Promise<{ syncedCount: number; errors: number }> {
  const queue = getOfflineWorkoutsQueue();
  if (queue.length === 0) {
    return { syncedCount: 0, errors: 0 };
  }

  let syncedCount = 0;
  let errors = 0;
  const remainingQueue: OfflineWorkoutPayload[] = [];

  for (const item of queue) {
    try {
      await logWorkoutFn({
        name: item.name,
        exercises: item.exercises,
        durationMinutes: item.durationMinutes,
        totalVolume: item.totalVolume,
        caloriesBurned: item.caloriesBurned,
        notes: item.notes,
        startedAt: item.startedAt,
        completedAt: item.completedAt,
      });
      syncedCount++;
    } catch (err) {
      console.error(`Failed to sync offline workout ${item.id}:`, err);
      errors++;
      remainingQueue.push(item);
    }
  }

  try {
    if (remainingQueue.length === 0) {
      clearOfflineWorkoutsQueue();
    } else {
      localStorage.setItem(WORKOUT_QUEUE_KEY, JSON.stringify(remainingQueue));
    }
  } catch {
    // ignore
  }

  return { syncedCount, errors };
}
