// 数据管理器 - 根据环境自动选择数据源
import type { Event } from './developmentData';
import { developmentEvents } from './developmentData';
// import {
//   loadProductionEvents,
//   saveProductionEvents,
//   addProductionEvent,
//   updateProductionEvent,
//   deleteProductionEvent,
//   clearProductionEvents
// } from './productionData';

// 获取当前环境
const isProduction = import.meta.env.VITE_APP_ENV === 'production';
const dataPersistence = import.meta.env.REACT_APP_DATA_PERSISTENCE === 'true';

// 数据管理器类
class DataManager {
  private events: Event[] = [];
  private listeners: Array<(events: Event[]) => void> = [];

  constructor() {
    this.loadEvents();
  }

  // 加载事件数据
  private loadEvents(): void {
    if (isProduction && dataPersistence) {
      // this.events = loadProductionEvents();
    } else {
      // 开发环境使用固定数据
      this.events = [...developmentEvents];
    }
  }

  // 获取所有事件
  getEvents(): Event[] {
    return [...this.events];
  }

  // 添加事件
  addEvent(event: Event): void {
    if (isProduction && dataPersistence) {
      // this.events = addProductionEvent(event);
    } else {
      // 开发环境只在内存中添加，不持久化
      this.events = [...this.events, event];
    }
    this.notifyListeners();
  }

  // 更新事件
  updateEvent(updatedEvent: Event): void {
    if (isProduction && dataPersistence) {
      // this.events = updateProductionEvent(updatedEvent);
    } else {
      // 开发环境只在内存中更新
      this.events = this.events.map(event => 
        event.id === updatedEvent.id ? updatedEvent : event
      );
    }
    this.notifyListeners();
  }

  // 删除事件
  deleteEvent(eventId: string): void {
    if (isProduction && dataPersistence) {
      // this.events = deleteProductionEvent(eventId);
    } else {
      // 开发环境只在内存中删除
      this.events = this.events.filter(event => event.id !== eventId);
    }
    this.notifyListeners();
  }

  // 清空所有事件
  clearEvents(): void {
    if (isProduction && dataPersistence) {
      // clearProductionEvents();
      this.events = [];
    } else {
      // 开发环境重新加载固定数据
      this.events = [...developmentEvents];
    }
    this.notifyListeners();
  }

  // 添加数据变化监听器
  addListener(listener: (events: Event[]) => void): void {
    this.listeners.push(listener);
  }

  // 移除监听器
  removeListener(listener: (events: Event[]) => void): void {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  // 通知所有监听器
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.events));
  }

  // 获取环境信息
  getEnvironmentInfo(): { isProduction: boolean; dataPersistence: boolean } {
    return { isProduction, dataPersistence };
  }
}

// 导出单例实例
export const dataManager = new DataManager();
export type { Event };