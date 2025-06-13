// 生产环境数据管理
import type { Event } from './developmentData';

const STORAGE_KEY = 'hci-schedule-events';

// 默认生产环境数据
const defaultProductionEvents: Event[] = [
  {
    id: 'prod_001',
    name: '重要会议',
    size: 90,
    color: '#ff4757',
    importance: 0.9,
    urgency: 0.8,
    startTime: '2025-01-15 14:00',
    endTime: '2025-01-15 16:00',
    details: {
      location: '总部会议室',
      notes: '季度总结汇报',
      estimatedHours: 2
    }
  }
];

// 从localStorage加载数据
export const loadProductionEvents = (): Event[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    // 如果没有存储数据，使用默认数据并保存
    saveProductionEvents(defaultProductionEvents);
    return defaultProductionEvents;
  } catch (error) {
    console.error('加载数据失败:', error);
    return defaultProductionEvents;
  }
};

// 保存数据到localStorage
export const saveProductionEvents = (events: Event[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch (error) {
    console.error('保存数据失败:', error);
  }
};

// 添加新事件
export const addProductionEvent = (event: Event): Event[] => {
  const events = loadProductionEvents();
  const newEvents = [...events, event];
  saveProductionEvents(newEvents);
  return newEvents;
};

// 更新事件
export const updateProductionEvent = (updatedEvent: Event): Event[] => {
  const events = loadProductionEvents();
  const newEvents = events.map(event => 
    event.id === updatedEvent.id ? updatedEvent : event
  );
  saveProductionEvents(newEvents);
  return newEvents;
};

// 删除事件
export const deleteProductionEvent = (eventId: string): Event[] => {
  const events = loadProductionEvents();
  const newEvents = events.filter(event => event.id !== eventId);
  saveProductionEvents(newEvents);
  return newEvents;
};

// 清空所有数据
export const clearProductionEvents = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};