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
    <div className="card rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>Timeline</h3>
        <span className="text-xs font-mono" style={{ color: 'var(--ink)' }}>{current.date}</span>
      </div>

      <input
        type="range"
        min={0}
        max={timeSlices.length - 1}
        value={currentIndex}
        onChange={e => onChange(parseInt(e.target.value))}
        className="w-full mb-3"
      />

      <div className="flex justify-between text-xs mb-3" style={{ color: 'var(--muted)' }}>
        {timeSlices.map((ts, i) => (
          <button
            key={ts.date}
            onClick={() => onChange(i)}
            className="text-center px-1 transition-colors"
            style={{ color: i === currentIndex ? 'var(--ink)' : 'var(--muted)' }}
          >
            {ts.date.slice(0, 4)}
          </button>
        ))}
      </div>

      <div className="well rounded p-3">
        <div className="font-medium text-sm mb-1" style={{ color: 'var(--ink)' }}>{current.label}</div>
        <div className="text-xs leading-relaxed" style={{ color: 'var(--body)' }}>{current.description}</div>
        {current.narrativeShift && (
          <div className="card mt-2 text-xs p-2" style={{ color: 'var(--body)' }}>
            Narrative shift: {current.narrativeShift}
          </div>
        )}
        <div className="mt-2 text-xs font-mono" style={{ color: 'var(--muted)' }}>
          {current.activeNodeIds.length} active nodes | {current.activeEdgeIds.length} active edges
        </div>
      </div>
    </div>
  );
}
