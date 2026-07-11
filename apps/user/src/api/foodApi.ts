import { IFoodItem } from 'gymfuel-shared';

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

export const foodApi = {
  /**
   * Look up a food item by barcode
   */
  async getByBarcode(barcode: string): Promise<IFoodItem> {
    const res = await fetch(`${API_BASE}/food/barcode/${barcode}`);
    const data = await safeJson(res);
    if (!res.ok) {
      throw new Error(
        data.error?.message || 'Failed to fetch food by barcode.',
      );
    }
    return data.foodItem;
  },

  /**
   * Scan an image for food nutrition
   * @param imageFile The image File to upload
   */
  async scanImage(imageFile: File): Promise<IFoodItem> {
    const formData = new FormData();
    formData.append('image', imageFile);

    const res = await fetch(`${API_BASE}/food/scan`, {
      method: 'POST',
      body: formData,
    });

    const data = await safeJson(res);
    if (!res.ok) {
      throw new Error(data.error?.message || 'Failed to scan image.');
    }
    return data.foodItem;
  },

  /**
   * Search food items by name
   */
  async search(
    query: string,
    page = 1,
    limit = 20,
  ): Promise<{
    results: IFoodItem[];
    count: number;
    page: number;
    limit: number;
  }> {
    const res = await fetch(
      `${API_BASE}/food/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`,
    );
    const data = await safeJson(res);
    if (!res.ok) {
      throw new Error(data.error?.message || 'Failed to search food.');
    }
    return data;
  },
};
