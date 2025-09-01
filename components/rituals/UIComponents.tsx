// Small UI components for the Rituals application

import React from 'react';

export const NumberInput: React.FC<{
  value: number;
  onChange: (_newValue: number) => void;
  className?: string;
}> = ({ value, onChange, className }) => (
  <input
    type="number"
    className={`w-16 border rounded px-2 py-1 text-sm ${className || ''}`}
    min={0}
    value={value}
    onChange={(e) => onChange(parseInt(e.target.value || '0', 10))}
  />
);

export const DragHandle: React.FC = () => (
  <span className="cursor-grab text-gray-400 select-none" title="Drag">
    ⋮⋮
  </span>
);
