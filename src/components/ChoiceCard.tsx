interface ChoiceCardProps {
  title: string;
  description: string;
  consequences: string;
  selected?: boolean;
  onClick: () => void;
}

export function ChoiceCard({ title, description, consequences, selected = false, onClick }: ChoiceCardProps) {
  return (
    <button
      onClick={onClick}
      className={`text-left p-3 rounded-lg border-2 transition w-full ${
        selected ? 'bg-bg border-caution' : 'bg-panel border-line hover:border-accent'
      }`}
    >
      <div className="font-bold text-sm">{title}</div>
      <div className="text-muted text-xs mt-1">{description}</div>
      <div className="text-equity text-xs mt-2">{consequences}</div>
    </button>
  );
}
