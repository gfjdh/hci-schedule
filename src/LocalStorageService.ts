// LocalStorageService.ts

// 存储的数据在浏览器控制台-应用程序-存储-本地存储中查看，键值为 "schedule_events"
export class LocalStorageService {
  static saveData<T>(key: string, data: T): void {
    try {
      const serializedData = JSON.stringify(data);
      localStorage.setItem(key, serializedData);
    } catch (error) {
      console.error("Error saving data to localStorage", error);
    }
  }

  static loadData<T>(key: string, defaultValue: T): T {
    try {
      const serializedData = localStorage.getItem(key);
      if (serializedData === null) {
        return defaultValue;
      }
      return JSON.parse(serializedData) as T;
    } catch (error) {
      console.error("Error loading data from localStorage", error);
      return defaultValue;
    }
  }
}