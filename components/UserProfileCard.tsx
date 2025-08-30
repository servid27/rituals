import Image from 'next/image';
import { UserProfile } from '@/types';

interface UserProfileCardProps {
  user:
    | UserProfile
    | {
        _id?: string;
        name?: string;
        email?: string;
        image?: string;
        bio?: string;
        stats?: {
          totalRituals: number;
          completedToday: number;
          currentStreak: number;
          longestStreak: number;
        };
      };
}

export default function UserProfileCard({ user }: UserProfileCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex items-center space-x-4 mb-4">
        {user.image ? (
          <Image src={user.image} alt={user.name || 'User'} width={64} height={64} className="rounded-full" />
        ) : (
          <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center">
            <span className="text-gray-600 text-xl font-semibold">{user.name?.charAt(0).toUpperCase() || 'U'}</span>
          </div>
        )}
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{user.name || 'Anonymous User'}</h2>
          <p className="text-gray-600">{user.email}</p>
        </div>
      </div>

      {user.bio && <p className="text-gray-700 mb-4">{user.bio}</p>}

      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{user.stats?.totalRituals || 0}</div>
          <div className="text-sm text-gray-600">Total Rituals</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{user.stats?.completedToday || 0}</div>
          <div className="text-sm text-gray-600">Completed Today</div>
        </div>
        <div className="text-center p-3 bg-orange-50 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">{user.stats?.currentStreak || 0}</div>
          <div className="text-sm text-gray-600">Current Streak</div>
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{user.stats?.longestStreak || 0}</div>
          <div className="text-sm text-gray-600">Longest Streak</div>
        </div>
      </div>
    </div>
  );
}
