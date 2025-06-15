// useLocalStorage.ts
import { useState, useEffect, useCallback } from 'react';

// 存储的数据在浏览器控制台-应用程序-存储-本地存储中查看

/**
 * 自定义钩子：用于管理localStorage中的数据
 * @param key - localStorage的键名
 * @param defaultValue - 默认值
 * @returns [value, setValue, removeValue] - 当前值、设置值的函数、删除值的函数
 */
export function useLocalStorage<T>(key: string, defaultValue: T) {
  // 初始化状态
  const [value, setValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error loading data from localStorage for key "${key}"`, error);
      return defaultValue;
    }
  });

  // 设置值的函数
  const setStoredValue = useCallback((newValue: T | ((prevValue: T) => T)) => {
    try {
      // 支持函数式更新
      const valueToStore = newValue instanceof Function ? newValue(value) : newValue;
      setValue(valueToStore);
      localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error saving data to localStorage for key "${key}"`, error);
    }
  }, [key, value]);

  // 删除值的函数
  const removeValue = useCallback(() => {
    try {
      setValue(defaultValue);
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing data from localStorage for key "${key}"`, error);
    }
  }, [key, defaultValue]);

  // 监听localStorage的变化（跨标签页同步）
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setValue(JSON.parse(e.newValue));
        } catch (error) {
          console.error(`Error parsing storage event data for key "${key}"`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [value, setStoredValue, removeValue] as const;
}

// 保持向后兼容的静态方法（可选）
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