import { IExercise, IWorkoutLog, IWorkoutTemplate } from 'gymfuel-shared';

const API_BASE = '/api';

async function safeJson(res: Response) {
  const text = await res.text();
  if (!text || text.trim() === '') {
    throw new Error(
      'Unable to reach the server. Please make sure the backend is running.',
    );
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      'Server returned an unexpected response. Please try again.',
    );
  }
}

export interface GetExercisesResponse {
  exercises: IExercise[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface GetWorkoutHistoryResponse {
  history: IWorkoutLog[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export const workoutApi = {
  /**
   * Fetch paginated exercise library with optional search and filters.
   */
  async getExercises(params?: {
    muscle?: string;
    equipment?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<GetExercisesResponse> {
    const searchParams = new URLSearchParams();
    if (params?.muscle) searchParams.append('muscle', params.muscle);
    if (params?.equipment) searchParams.append('equipment', params.equipment);
    if (params?.search) searchParams.append('search', params.search);
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.limit) searchParams.append('limit', String(params.limit));

    const url = `${API_BASE}/workout/exercises?${searchParams.toString()}`;
    const res = await fetch(url);
    const data = await safeJson(res);
    if (!res.ok) {
      throw new Error(
        data.error?.message || 'Failed to fetch exercise library.',
      );
    }
    return data;
  },

  /**
   * Fetch single exercise details.
   */
  async getExerciseById(id: string): Promise<{ exercise: IExercise }> {
    const res = await fetch(`${API_BASE}/workout/exercises/${id}`);
    const data = await safeJson(res);
    if (!res.ok) {
      throw new Error(
        data.error?.message || 'Failed to fetch exercise details.',
      );
    }
    return data;
  },

  /**
   * Log a new completed workout session.
   */
  async logWorkout(
    payload: Omit<IWorkoutLog, '_id' | 'userId' | 'totalVolume' | 'createdAt'>,
  ): Promise<{
    message: string;
    workoutLog: IWorkoutLog;
  }> {
    const res = await fetch(`${API_BASE}/workout/log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await safeJson(res);
    if (!res.ok) {
      throw new Error(data.error?.message || 'Failed to log workout session.');
    }
    return data;
  },

  /**
   * Fetch paginated user workout history logs.
   */
  async getWorkoutHistory(
    page = 1,
    limit = 10,
  ): Promise<GetWorkoutHistoryResponse> {
    const res = await fetch(
      `${API_BASE}/workout/history?page=${page}&limit=${limit}`,
    );
    const data = await safeJson(res);
    if (!res.ok) {
      throw new Error(
        data.error?.message || 'Failed to fetch workout history.',
      );
    }
    return data;
  },

  /**
   * Fetch available pre-defined workout templates.
   */
  async getWorkoutTemplates(): Promise<{ templates: IWorkoutTemplate[] }> {
    const res = await fetch(`${API_BASE}/workout/templates`);
    const data = await safeJson(res);
    if (!res.ok) {
      throw new Error(
        data.error?.message || 'Failed to fetch workout templates.',
      );
    }
    return data;
  },

  /**
   * Fetch details for a specific template.
   */
  async getWorkoutTemplateById(
    id: string,
  ): Promise<{ template: IWorkoutTemplate }> {
    const res = await fetch(`${API_BASE}/workout/templates/${id}`);
    const data = await safeJson(res);
    if (!res.ok) {
      throw new Error(
        data.error?.message || 'Failed to fetch workout template details.',
      );
    }
    return data;
  },
};
