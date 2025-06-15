import { useCallback } from 'react';
import type { Event } from '../EventManager';

/**
 * 自定义钩子：生成日程表事件的中文描述
 * @returns getScheduleDescription - 生成日程描述的函数
 */
export function useScheduleDescription() {
  /**
   * 格式化时间字符串
   * @param timeStr - 时间字符串
   * @returns 格式化后的时间
   */
  const formatTime = useCallback((timeStr: string): string => {
    try {
      const date = new Date(timeStr);
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        weekday: 'long'
      });
    } catch {
      return timeStr;
    }
  }, []);

  /**
   * 获取重要性描述
   * @param importance - 重要性值 (0-1)
   * @returns 重要性描述
   */
  const getImportanceText = useCallback((importance: number): string => {
    if (importance >= 0.8) return '非常重要';
    if (importance >= 0.6) return '重要';
    if (importance >= 0.4) return '一般重要';
    if (importance >= 0.2) return '不太重要';
    return '不重要';
  }, []);

  /**
   * 获取紧急性描述
   * @param urgency - 紧急性值 (0-1)
   * @returns 紧急性描述
   */
  const getUrgencyText = useCallback((urgency: number): string => {
    if (urgency >= 0.8) return '非常紧急';
    if (urgency >= 0.6) return '紧急';
    if (urgency >= 0.4) return '一般紧急';
    if (urgency >= 0.2) return '不太紧急';
    return '不紧急';
  }, []);

  /**
   * 生成单个事件的描述
   * @param event - 事件对象
   * @param index - 事件序号
   * @returns 事件描述字符串
   */
  const generateEventDescription = useCallback((event: Event, index: number): string => {
    const parts: string[] = [];
    
    // 基本信息
    parts.push(`${index + 1}. 【${event.name}】`);
    
    // 时间信息
    if (event.startTime && event.endTime) {
      const startTime = formatTime(event.startTime);
      const endTime = formatTime(event.endTime);
      parts.push(`时间：${startTime} 至 ${endTime}`);
    } else if (event.startTime) {
      parts.push(`开始时间：${formatTime(event.startTime)}`);
    }
    
    // 重要性和紧急性
    const importance = getImportanceText(event.importance);
    const urgency = getUrgencyText(event.urgency);
    parts.push(`重要性：${importance}，紧急性：${urgency}`);
    
    // 详细信息
    if (event.details) {
      if (event.details.location) {
        parts.push(`地点：${event.details.location}`);
      }
      
      if (event.details.estimatedHours) {
        parts.push(`预计用时：${event.details.estimatedHours}小时`);
      }
      
      if (event.details.notes) {
        parts.push(`备注："${event.details.notes.replace(/\n/g, '\\n')}"`);
      }
    }
    
    return parts.join('，');
  }, [formatTime, getImportanceText, getUrgencyText]);

  /**
   * 生成完整的日程描述
   * @param events - 事件数组
   * @returns 完整的日程描述
   */
  const getScheduleDescription = useCallback((events: Event[]): string => {
    if (!events || events.length === 0) {
      return '当前没有任何日程安排。';
    }

    const descriptions: string[] = [];
    
    // 统计信息
    descriptions.push(`当前共有 ${events.length} 个日程安排：`);
    descriptions.push(''); // 空行分隔
    
    // 按重要性和紧急性排序
    const sortedEvents = [...events].sort((a, b) => {
      // 先按重要性降序，再按紧急性降序
      if (a.importance !== b.importance) {
        return b.importance - a.importance;
      }
      return b.urgency - a.urgency;
    });
    
    // 生成每个事件的描述
    sortedEvents.forEach((event, index) => {
      descriptions.push(generateEventDescription(event, index));
    });
    
    // 添加总结
    descriptions.push(''); // 空行分隔
    
    // 统计不同优先级的事件
    const highPriority = events.filter(e => e.importance >= 0.7 && e.urgency >= 0.7).length;
    const mediumPriority = events.filter(e => e.importance >= 0.4 || e.urgency >= 0.4).length - highPriority;
    const lowPriority = events.length - highPriority - mediumPriority;
    
    const summary: string[] = [];
    if (highPriority > 0) summary.push(`高优先级事件 ${highPriority} 个`);
    if (mediumPriority > 0) summary.push(`中优先级事件 ${mediumPriority} 个`);
    if (lowPriority > 0) summary.push(`低优先级事件 ${lowPriority} 个`);
    
    if (summary.length > 0) {
      descriptions.push(`优先级分布：${summary.join('，')}。`);
    }
    
    return descriptions.join('\n');
  }, [generateEventDescription]);

  return {
    getScheduleDescription,
    generateEventDescription,
    formatTime,
    getImportanceText,
    getUrgencyText
  };
}