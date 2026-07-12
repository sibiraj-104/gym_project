import { IDailyLogSummary, IMealLog } from 'gymfuel-shared';

const API_BASE = '/api';

/** Safely parse JSON — throws a human-readable error if the server is unreachable */
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

export const mealsApi = {
  /**
   * Fetch today's meal log and summaries
   * @param date Optional date in YYYY-MM-DD format (defaults to today on server)
   */
  async getTodayLog(date?: string): Promise<IDailyLogSummary> {
    const url = date
      ? `${API_BASE}/meals/log/today?date=${date}`
      : `${API_BASE}/meals/log/today`;
    const res = await fetch(url);
    const data = await safeJson(res);
    if (!res.ok) {
      throw new Error(
        data.error?.message || "Failed to fetch today's meal log.",
      );
    }
    return data;
  },

  /**
   * Log a new meal entry
   */
  async logMeal(
    foodId: string,
    portionGrams: number,
    mealType: string,
    date?: string,
  ): Promise<IMealLog> {
    const res = await fetch(`${API_BASE}/meals/log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ foodId, portionGrams, mealType, date }),
    });

    const data = await safeJson(res);
    if (!res.ok) {
      throw new Error(data.error?.message || 'Failed to log meal.');
    }
    return data;
  },

  /**
   * Delete a meal entry from a specific log
   */
  async deleteMealEntry(logId: string, entryIndex: number): Promise<IMealLog> {
    const res = await fetch(`${API_BASE}/meals/log/entry`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ logId, entryIndex }),
    });

    const data = await safeJson(res);
    if (!res.ok) {
      throw new Error(data.error?.message || 'Failed to delete meal entry.');
    }
    return data;
  },
};
