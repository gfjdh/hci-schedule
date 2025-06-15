// commandExecutor.ts
import { EventManager } from '../EventManager';
import type { Event } from '../EventManager';

export interface OperationCommand {
  operation: 'add' | 'update' | 'delete';
  event: Partial<Event>;
}

export class CommandExecutor {
  private eventManager: EventManager;

  constructor(eventManager: EventManager) {
    this.eventManager = eventManager;
  }

  public execute(commands: OperationCommand[]): { success: boolean; message: string } {
    try {
      commands.forEach(command => {
        switch (command.operation) {
          case 'add':
            this.handleAdd(command.event);
            break;
          case 'update':
            this.handleUpdate(command.event);
            break;
          case 'delete':
            this.handleDelete(command.event);
            break;
          default:
            console.warn(`Unknown operation: ${(command as any).operation}`);
        }
      });
      return { success: true, message: `操作执行成功: ${commands[0].operation} ${commands[0].event.id}` };
    } catch (error: any) {
      return { success: false, message: `操作执行失败: ${error.message}` };
    }
  }

  private handleAdd(event: Partial<Event>): void {
    if (!event.name) {
      throw new Error('添加事件需要事件名称');
    }
    
    // 生成唯一ID
    const newEvent: Event = {
      ...event,
      id: `evt_${Date.now()}`,
      color: '#4CAF50',
    } as Event;
    
    this.eventManager.addEvent(newEvent);
  }

  private handleUpdate(event: Partial<Event>): void {
    if (!event.id) {
      throw new Error('更新事件需要事件ID');
    }
    this.eventManager.updateEvent(event.id, event);
  }

  private handleDelete(event: Partial<Event>): void {
    if (!event.id) {
      throw new Error('删除事件需要事件ID');
    }
    this.eventManager.deleteEvent(event.id);
  }
}