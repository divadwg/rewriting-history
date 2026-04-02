'use client';

import { TimeSlice } from '@/lib/types/graph';

interface TimeSliderProps {
  timeSlices: TimeSlice[];
  currentIndex: number;
  onChange: (index: number) => void;
}

export default function TimeSlider({ timeSlices, currentIndex, onChange }: TimeSliderProps) {
  if (timeSlices.length === 0) return null;

  const current = timeSlices[currentIndex];

  return (
    <div className="rounded-lg p-4" style={{ background: '#ffffff', border: '1px solid #e5e5e5', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold" style={{ color: '#1a1a1a' }}>Timeline</h3>
        <span className="text-xs font-mono" style={{ color: '#e87b35' }}>{current.date}</span>
      </div>

      <input
        type="range"
        min={0}
        max={timeSlices.length - 1}
        value={currentIndex}
        onChange={e => onChange(parseInt(e.target.value))}
        className="w-full mb-3"
      />

      <div className="flex justify-between text-xs mb-3" style={{ color: '#999999' }}>
        {timeSlices.map((ts, i) => (
          <button
            key={ts.date}
            onClick={() => onChange(i)}
            className="text-center px-1 transition-colors"
            style={{ color: i === currentIndex ? '#e87b35' : '#999999' }}
          >
            {ts.date.slice(0, 4)}
          </button>
        ))}
      </div>

      <div className="rounded p-3" style={{ background: '#f7f7f7' }}>
        <div className="font-medium text-sm mb-1" style={{ color: '#1a1a1a' }}>{current.label}</div>
        <div className="text-xs leading-relaxed" style={{ color: '#6b6b6b' }}>{current.description}</div>
        {current.narrativeShift && (
          <div className="mt-2 text-xs rounded p-2" style={{ background: '#fdf0e6', color: '#d06a2a' }}>
            Narrative shift: {current.narrativeShift}
          </div>
        )}
        <div className="mt-2 text-xs font-mono" style={{ color: '#999999' }}>
          {current.activeNodeIds.length} active nodes | {current.activeEdgeIds.length} active edges
        </div>
      </div>
    </div>
  );
}
