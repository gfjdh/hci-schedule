import React from 'react';
import './ScheduleArea.css';

interface EventTileProps {
  event: {
    id: string;
    name: string;
    size: number; // 1-100%
    color: string;
    importance: number; // 0-1
    urgency: number; // 0-1
    startTime: string;
    endTime: string;
    details?: {
      location?: string;
      notes?: string;
      estimatedHours?: number;
    };
  };
  onClick: () => void;
}

const EventTile: React.FC<EventTileProps> = ({ event, onClick }) => {
  // 计算磁贴大小 (基于剩余工作量)
  const tileSize = Math.max(50, Math.min(200, event.size * 2));
  
  return (
    <div 
      className="event-tile"
      onClick={onClick}
      style={{
        position: 'absolute',
        left: `${event.importance * 90}%`,
        top: `${(1 - event.urgency) * 90}%`,
        width: `${tileSize}px`,
        height: `${tileSize}px`,
        backgroundColor: event.color,
        borderRadius: '8px',
        padding: '10px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
        cursor: 'pointer',
        transform: 'translate(-50%, -50%)',
        transition: 'transform 0.2s, box-shadow 0.2s',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        fontSize: '0.85rem',
        fontWeight: '500',
        color: '#090524',
      }}
    >
      <div className="event-name">{event.name}</div>
    </div>
  );
};

export default EventTile;