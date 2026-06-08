import { ReactNode } from 'react';

interface ReviseSubScreenProps {
  title: string;
  timeCostLabel: string;
  primaryLabel: string;
  primaryDisabled?: boolean;
  onPrimary: () => void;
  children: ReactNode;
}

export function ReviseSubScreen({
  title,
  timeCostLabel,
  primaryLabel,
  primaryDisabled = false,
  onPrimary,
  children,
}: ReviseSubScreenProps) {
  return (
    <div className="bg-panel border-2 border-caution rounded-lg p-4 mt-3">
      <div className="flex justify-between items-baseline mb-3">
        <h3 className="text-lg font-bold">{title}</h3>
        <span className="text-caution text-xs tabular">{timeCostLabel}</span>
      </div>
      <div className="space-y-3">{children}</div>
      <button
        onClick={onPrimary}
        disabled={primaryDisabled}
        className="w-full mt-4 btn-primary py-3 disabled:opacity-40"
      >
        {primaryLabel}
      </button>
    </div>
  );
}
