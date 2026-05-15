import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <div className="mb-4 text-[#D0D0CC]">{icon}</div>}
      <h3 className="text-lg font-semibold text-[#1A1A18] mb-1">{title}</h3>
      {description && <p className="text-sm text-[#6B6B66] mb-6 max-w-sm">{description}</p>}
      {action}
    </div>
  );
}
