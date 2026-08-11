export const getPersistentData = <T>(key: string, defaultData: T): T => {
  if (typeof window === 'undefined') return defaultData;
  const saved = localStorage.getItem(key);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse local storage key:", key, e);
    }
  }
  // Initialize storage with defaultData
  localStorage.setItem(key, JSON.stringify(defaultData));
  return defaultData;
};

export const savePersistentData = (key: string, data: any): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
};
