import Link from 'next/link';

export default function QuickActions() {
  const actions = [
    {
      title: 'Create New Ritual',
      description: 'Add a new daily practice to track',
      href: '/rituals/new',
      icon: '➕',
      color: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      title: 'View All Rituals',
      description: 'Manage your existing rituals',
      href: '/rituals',
      icon: '📋',
      color: 'bg-green-600 hover:bg-green-700',
    },
    {
      title: 'Progress Analytics',
      description: 'See your progress over time',
      href: '/analytics',
      icon: '📊',
      color: 'bg-purple-600 hover:bg-purple-700',
    },
    {
      title: 'Settings',
      description: 'Customize your preferences',
      href: '/settings',
      icon: '⚙️',
      color: 'bg-gray-600 hover:bg-gray-700',
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className={`${action.color} text-white p-4 rounded-lg transition-colors group`}
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{action.icon}</span>
              <div>
                <h4 className="font-medium">{action.title}</h4>
                <p className="text-sm opacity-90">{action.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
