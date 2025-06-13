// 开发环境固定数据
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

export const developmentEvents: Event[] = [
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