'use client';

// Small UI components for the Rituals application

import React from 'react';

export const NumberInput: React.FC<{
  value: number;
  onChange: (_newValue: number) => void;
  className?: string;
  placeholder?: string;
}> = ({ value, onChange, className, placeholder }) => (
  <input
    type="number"
    className={`w-16 bg-gray-100   rounded px-2 py-1  ${className || ''}`}
    min={0}
    value={value}
    onChange={(e) => onChange(parseInt(e.target.value || '0', 10))}
    placeholder={placeholder}
  />
);

export const DragHandle: React.FC = () => (
  <span className="cursor-grab text-gray-400 select-none" title="Drag">
    ⋮⋮
  </span>
);
