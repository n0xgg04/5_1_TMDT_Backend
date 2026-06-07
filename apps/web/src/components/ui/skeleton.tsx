import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-lg bg-slate-200", className)} />
  );
}

export function EmptyState({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-card">
      {icon && (
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-brand-50 text-brand-700 ring-1 ring-brand-100">
          {icon}
        </div>
      )}
      <p className="text-base font-semibold text-ink-950">{title}</p>
      {description && (
        <p className="mt-1 max-w-md text-sm leading-6 text-slate-600">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
