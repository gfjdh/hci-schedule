// EventManager.ts
import { LocalStorageService } from './LocalStorageService';

export interface Event {
    id: string;
    name: string;
    size: number;
    color: string;
    importance: number;
    urgency: number;
    startTime: string;
    endTime: string;
    details: {
        location?: string;
        notes?: string;
        estimatedHours?: number;
    };
}

export interface IEventManager {
    addEvent(event: Event): void;
    updateEvent(id: string, updates: Partial<Event>): void;
    deleteEvent(id: string): void;
    getEvent(id: string): Event | undefined;
    getAllEvents(): Event[];
    saveToStorage(): void;
    loadFromStorage(): void;
}

export class EventManager implements IEventManager {
  private events: Event[] = [];
  private readonly storageKey = "schedule_events";

  constructor(initialEvents: Event[] = []) {
    this.loadFromStorage();
    
    // 如果存储中没有数据，使用初始数据
    if (this.events.length === 0 && initialEvents.length > 0) {
      this.events = [...initialEvents];
      this.saveToStorage();
    }
  }

  addEvent(event: Event): void {
    this.events.push(event);
    this.saveToStorage();
  }

  updateEvent(id: string, updates: Partial<Event>): void {
    this.events = this.events.map(event => 
      event.id === id ? { ...event, ...updates } : event
    );
    this.saveToStorage();
  }

  deleteEvent(id: string): void {
    this.events = this.events.filter(event => event.id !== id);
    this.saveToStorage();
  }

  getEvent(id: string): Event | undefined {
    return this.events.find(event => event.id === id);
  }

  getAllEvents(): Event[] {
    return [...this.events];
  }

  saveToStorage(): void {
    LocalStorageService.saveData(this.storageKey, this.events);
  }

  loadFromStorage(): void {
    this.events = LocalStorageService.loadData<Event[]>(this.storageKey, []);
  }
}

export const initialEvents: Event[] = [
  {
    id: 'evt_001',
    name: '项目汇报',
    size: 80,
    color: '#ff6b6b',
    importance: 0.85,
    urgency: 0.9,
    startTime: '2025-06-20 14:00',
    endTime: '2025-06-20 16:00',
    details: {
      location: '会议室A',
      notes: '准备PPT和演示材料',
      estimatedHours: 2
    }
  },
  {
    id: 'evt_002',
    name: '团队周会',
    size: 60,
    color: '#4ecdc4',
    importance: 0.7,
    urgency: 0.6,
    startTime: '2025-06-18 10:00',
    endTime: '2025-06-18 11:30',
    details: {
      location: '线上会议',
      notes: '审查项目进度'
    }
  },
  {
    id: 'evt_003',
    name: '文档整理',
    size: 40,
    color: '#ffe66d',
    importance: 0.4,
    urgency: 0.3,
    startTime: '2025-06-19 09:00',
    endTime: '2025-06-19 12:00',
    details: {}
  },
  {
    id: 'evt_004',
    name: 'max',
    size: 40,
    color: '#ffe66d',
    importance: 1,
    urgency: 1,
    startTime: '2025-06-19 09:00',
    endTime: '2025-06-19 12:00',
    details: {}
  },
  {
    id: 'evt_005',
    name: 'min',
    size: 40,
    color: '#ffe66d',
    importance: 0,
    urgency: 0,
    startTime: '2025-06-19 09:00',
    endTime: '2025-06-19 12:00',
    details: {}
  },
];