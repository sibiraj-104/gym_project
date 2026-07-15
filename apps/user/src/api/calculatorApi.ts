import { Gender, ActivityLevel, FitnessGoal } from 'gymfuel-shared';

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

export interface TDEEResponse {
  tdee: number;
  targets: {
    targetCalories: number;
    targetProtein: number;
    targetCarbs: number;
    targetFat: number;
    targetWaterGlasses: number;
  };
}

export interface BMIResponse {
  bmi: number;
  classification: string;
}

export interface ProteinResponse {
  min: number;
  max: number;
}

export interface OneRepMaxResponse {
  oneRepMax: number;
}

export const calculatorApi = {
  async getTDEE(params: {
    weight: number;
    height: number;
    age: number;
    gender: Gender;
    activityLevel: ActivityLevel;
    goal?: FitnessGoal;
  }): Promise<TDEEResponse> {
    const query = new URLSearchParams({
      weight: String(params.weight),
      height: String(params.height),
      age: String(params.age),
      gender: params.gender,
      activityLevel: params.activityLevel,
    });
    if (params.goal) {
      query.append('goal', params.goal);
    }
    const res = await fetch(`${API_BASE}/calculator/tdee?${query.toString()}`);
    const data = await safeJson(res);
    if (!res.ok) {
      throw new Error(data.error?.message || 'Failed to calculate TDEE.');
    }
    return data;
  },

  async getBMI(params: {
    weight: number;
    height: number;
  }): Promise<BMIResponse> {
    const query = new URLSearchParams({
      weight: String(params.weight),
      height: String(params.height),
    });
    const res = await fetch(`${API_BASE}/calculator/bmi?${query.toString()}`);
    const data = await safeJson(res);
    if (!res.ok) {
      throw new Error(data.error?.message || 'Failed to calculate BMI.');
    }
    return data;
  },

  async getProteinRange(params: {
    weight: number;
    goal: FitnessGoal;
  }): Promise<ProteinResponse> {
    const query = new URLSearchParams({
      weight: String(params.weight),
      goal: params.goal,
    });
    const res = await fetch(
      `${API_BASE}/calculator/protein?${query.toString()}`,
    );
    const data = await safeJson(res);
    if (!res.ok) {
      throw new Error(
        data.error?.message || 'Failed to calculate protein target.',
      );
    }
    return data;
  },

  async getOneRepMax(params: {
    weight: number;
    reps: number;
  }): Promise<OneRepMaxResponse> {
    const query = new URLSearchParams({
      weight: String(params.weight),
      reps: String(params.reps),
    });
    const res = await fetch(`${API_BASE}/calculator/1rm?${query.toString()}`);
    const data = await safeJson(res);
    if (!res.ok) {
      throw new Error(data.error?.message || 'Failed to calculate 1-Rep Max.');
    }
    return data;
  },
};
