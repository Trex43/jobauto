import { type ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title?: string;
  message?: string;
  action?: ReactNode;
}

export default function EmptyState({
  icon,
  title = 'Nothing here yet',
  message = 'Get started by adding your first item.',
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center border border-dashed border-gray-700 rounded-2xl bg-[#13131f]/50">
      {icon && <div className="mb-4 text-gray-500">{icon}</div>}
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400 max-w-md mb-6">{message}</p>
      {action && <div>{action}</div>}
    </div>
  );
}

