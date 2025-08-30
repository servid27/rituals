'use client';

import { useState } from 'react';
import { DailyRitual } from '@/types';

interface DailyProgressProps {
  rituals: DailyRitual[];
  onCompleteRitual?: (id: string) => void;
}

export default function DailyProgress({ rituals, onCompleteRitual }: DailyProgressProps) {
  const [completedRituals, setCompletedRituals] = useState<Set<string>>(
    new Set(rituals.filter((r) => r.isCompleted).map((r) => r._id))
  );

  const handleComplete = (ritualId: string) => {
    const newCompleted = new Set(completedRituals);
    if (newCompleted.has(ritualId)) {
      newCompleted.delete(ritualId);
    } else {
      newCompleted.add(ritualId);
    }
    setCompletedRituals(newCompleted);
    onCompleteRitual?.(ritualId);
  };

  const completionRate = rituals.length > 0 ? Math.round((completedRituals.size / rituals.length) * 100) : 0;

  const getCategoryEmoji = (category: string) => {
    const emojis: { [key: string]: string } = {
      health: '🏃‍♀️',
      mindfulness: '🧘‍♀️',
      productivity: '💼',
      creativity: '🎨',
      relationships: '❤️',
      learning: '📚',
      other: '⭐',
    };
    return emojis[category] || emojis.other;
  };

  if (rituals.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Today&apos;s Progress</h3>
        <div className="text-center py-6">
          <p className="text-gray-600">No rituals scheduled for today.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Today&apos;s Progress</h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">
            {completedRituals.size}/{rituals.length} completed
          </span>
          <div className="w-16 h-2 bg-gray-200 rounded-full">
            <div
              className="h-2 bg-green-500 rounded-full transition-all duration-300"
              style={{ width: `${completionRate}%` }}
            />
          </div>
          <span className="text-sm font-medium text-gray-900">{completionRate}%</span>
        </div>
      </div>

      <div className="space-y-3">
        {rituals.map((ritual) => {
          const isCompleted = completedRituals.has(ritual._id);

          return (
            <div
              key={ritual._id}
              className={`flex items-center space-x-3 p-3 rounded-lg border transition-all ${
                isCompleted ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <button
                onClick={() => handleComplete(ritual._id)}
                className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  isCompleted ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-green-400'
                }`}
              >
                {isCompleted && <span className="text-xs">✓</span>}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{getCategoryEmoji(ritual.category)}</span>
                  <span className={`font-medium ${isCompleted ? 'text-green-900 line-through' : 'text-gray-900'}`}>
                    {ritual.title}
                  </span>
                </div>

                <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                  {ritual.targetTime && <span>⏰ {ritual.targetTime}</span>}
                  {ritual.estimatedDuration && <span>🕒 {ritual.estimatedDuration} min</span>}
                </div>
              </div>

              {isCompleted && <span className="text-green-600 text-sm font-medium">Done!</span>}
            </div>
          );
        })}
      </div>

      {completionRate === 100 && (
        <div className="mt-4 p-3 bg-green-100 rounded-lg text-center">
          <span className="text-green-800 font-medium">🎉 Great job! All rituals completed today!</span>
        </div>
      )}
    </div>
  );
}
