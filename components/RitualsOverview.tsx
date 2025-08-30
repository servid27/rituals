import Link from 'next/link';
import { Ritual } from '@/types';

interface RitualsOverviewProps {
  rituals: Ritual[];
}

const getCategoryColor = (category: string) => {
  const colors: { [key: string]: string } = {
    health: 'bg-red-100 text-red-800',
    mindfulness: 'bg-blue-100 text-blue-800',
    productivity: 'bg-green-100 text-green-800',
    creativity: 'bg-purple-100 text-purple-800',
    relationships: 'bg-pink-100 text-pink-800',
    learning: 'bg-yellow-100 text-yellow-800',
    other: 'bg-gray-100 text-gray-800',
  };
  return colors[category] || colors.other;
};

const isCompletedToday = (lastCompleted?: Date) => {
  if (!lastCompleted) return false;
  const today = new Date();
  const completed = new Date(lastCompleted);
  return (
    today.getDate() === completed.getDate() &&
    today.getMonth() === completed.getMonth() &&
    today.getFullYear() === completed.getFullYear()
  );
};

export default function RitualsOverview({ rituals }: RitualsOverviewProps) {
  if (rituals.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="text-center py-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Rituals Yet</h3>
          <p className="text-gray-600 mb-4">Start building your daily rituals to track your progress.</p>
          <Link
            href="/rituals/new"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Create Your First Ritual
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Your Rituals</h3>
          <Link href="/rituals" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            View All
          </Link>
        </div>
      </div>

      <div className="divide-y divide-gray-200">
        {rituals.slice(0, 5).map((ritual) => (
          <div key={ritual._id} className="p-6 hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-2">
                  <h4 className="text-base font-medium text-gray-900 truncate">{ritual.title}</h4>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(
                      ritual.category
                    )}`}
                  >
                    {ritual.category}
                  </span>
                  {isCompletedToday(ritual.stats.lastCompleted) && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      ✓ Done today
                    </span>
                  )}
                </div>
                {ritual.description && <p className="text-sm text-gray-600 mb-2 line-clamp-2">{ritual.description}</p>}
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>{ritual.frequency}</span>
                  {ritual.targetTime && <span>⏰ {ritual.targetTime}</span>}
                </div>
              </div>

              <div className="ml-4 flex-shrink-0 text-right">
                <div className="text-lg font-semibold text-gray-900">{ritual.stats.currentStreak}</div>
                <div className="text-xs text-gray-500">day streak</div>
                <div className="text-xs text-gray-400 mt-1">{ritual.stats.totalCompletions} total</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {rituals.length > 5 && (
        <div className="p-4 bg-gray-50 text-center">
          <Link href="/rituals" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            View {rituals.length - 5} more rituals
          </Link>
        </div>
      )}
    </div>
  );
}
