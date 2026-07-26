import { create } from 'zustand';
import { workoutApi } from '../api/workoutApi';
import { IWorkoutExerciseLog, IWorkoutLog, IWorkoutSet } from 'gymfuel-shared';

interface ActiveWorkoutState {
  name: string;
  startedAt: string | null;
  exercises: IWorkoutExerciseLog[];
  isActive: boolean;
}

interface WorkoutStore {
  activeWorkout: ActiveWorkoutState;
  loading: boolean;
  error: string | null;

  startWorkout: (name: string, exercises?: IWorkoutExerciseLog[]) => void;
  cancelWorkout: () => void;
  addExercise: (exerciseId: string, exerciseName: string) => void;
  removeExercise: (exerciseId: string) => void;
  addSet: (exerciseId: string) => void;
  removeSet: (exerciseId: string, setIndex: number) => void;
  updateSet: (
    exerciseId: string,
    setIndex: number,
    fields: Partial<IWorkoutSet>,
  ) => void;
  finishWorkout: (
    durationMinutes: number,
    notes?: string,
    caloriesBurned?: number,
  ) => Promise<IWorkoutLog>;
}

const initialActiveWorkout: ActiveWorkoutState = {
  name: '',
  startedAt: null,
  exercises: [],
  isActive: false,
};

export const useWorkoutStore = create<WorkoutStore>((set, get) => ({
  activeWorkout: initialActiveWorkout,
  loading: false,
  error: null,

  startWorkout: (name: string, exercises = []) => {
    set({
      activeWorkout: {
        name: name || 'Workout',
        startedAt: new Date().toISOString(),
        exercises,
        isActive: true,
      },
      error: null,
    });
  },

  cancelWorkout: () => {
    set({ activeWorkout: initialActiveWorkout, error: null });
  },

  addExercise: (exerciseId, exerciseName) => {
    const { activeWorkout } = get();
    if (!activeWorkout.isActive) return;

    // Check if exercise already added
    if (activeWorkout.exercises.some((e) => e.exerciseId === exerciseId)) {
      return;
    }

    const newExercise: IWorkoutExerciseLog = {
      exerciseId,
      exerciseName,
      sets: [
        {
          setNumber: 1,
          reps: 10,
          weight: 0,
          isWarmup: false,
        },
      ],
      notes: '',
    };

    set({
      activeWorkout: {
        ...activeWorkout,
        exercises: [...activeWorkout.exercises, newExercise],
      },
    });
  },

  removeExercise: (exerciseId) => {
    const { activeWorkout } = get();
    if (!activeWorkout.isActive) return;

    set({
      activeWorkout: {
        ...activeWorkout,
        exercises: activeWorkout.exercises.filter(
          (e) => e.exerciseId !== exerciseId,
        ),
      },
    });
  },

  addSet: (exerciseId) => {
    const { activeWorkout } = get();
    if (!activeWorkout.isActive) return;

    const exercises = activeWorkout.exercises.map((ex) => {
      if (ex.exerciseId !== exerciseId) return ex;

      const nextSetNumber = ex.sets.length + 1;
      const lastSet = ex.sets[ex.sets.length - 1];

      // Copy values from the last set for better UX
      const newSet: IWorkoutSet = {
        setNumber: nextSetNumber,
        reps: lastSet ? lastSet.reps : 10,
        weight: lastSet ? lastSet.weight : 0,
        restSeconds: lastSet ? lastSet.restSeconds : 90,
        isWarmup: false,
      };

      return {
        ...ex,
        sets: [...ex.sets, newSet],
      };
    });

    set({ activeWorkout: { ...activeWorkout, exercises } });
  },

  removeSet: (exerciseId, setIndex) => {
    const { activeWorkout } = get();
    if (!activeWorkout.isActive) return;

    const exercises = activeWorkout.exercises.map((ex) => {
      if (ex.exerciseId !== exerciseId) return ex;

      const sets = ex.sets
        .filter((_, idx) => idx !== setIndex)
        .map((s, idx) => ({ ...s, setNumber: idx + 1 })); // Recalculate set numbers

      return { ...ex, sets };
    });

    set({ activeWorkout: { ...activeWorkout, exercises } });
  },

  updateSet: (exerciseId, setIndex, fields) => {
    const { activeWorkout } = get();
    if (!activeWorkout.isActive) return;

    const exercises = activeWorkout.exercises.map((ex) => {
      if (ex.exerciseId !== exerciseId) return ex;

      const sets = ex.sets.map((s, idx) => {
        if (idx !== setIndex) return s;
        return { ...s, ...fields };
      });

      return { ...ex, sets };
    });

    set({ activeWorkout: { ...activeWorkout, exercises } });
  },

  finishWorkout: async (durationMinutes, notes = '', caloriesBurned) => {
    const { activeWorkout } = get();
    if (!activeWorkout.isActive || !activeWorkout.startedAt) {
      throw new Error('No active workout session to finish.');
    }

    set({ loading: true, error: null });

    try {
      const payload = {
        name: activeWorkout.name,
        exercises: activeWorkout.exercises,
        durationMinutes,
        caloriesBurned,
        notes,
        startedAt: activeWorkout.startedAt,
        completedAt: new Date().toISOString(),
      };

      const res = await workoutApi.logWorkout(payload);
      set({ activeWorkout: initialActiveWorkout, loading: false });
      return res.workoutLog;
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : 'Failed to complete workout session.';
      set({ error: errorMsg, loading: false });
      throw new Error(errorMsg);
    }
  },
}));
