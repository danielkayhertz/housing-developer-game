import { ReactNode } from 'react';

interface CharacterIntroCardProps {
  avatar: string;
  name: string;
  role: string;
  body: ReactNode;
  footer?: ReactNode;
}

export function CharacterIntroCard({ avatar, name, role, body, footer }: CharacterIntroCardProps) {
  return (
    <div className="bg-bg border-l-4 border-accent rounded-lg p-3 flex gap-3 text-sm">
      <div className="text-3xl leading-none">{avatar}</div>
      <div className="flex-1">
        <div>
          <b className="text-ink">{name}</b>
          <span className="text-muted"> · {role}</span>
        </div>
        <div className="mt-2">{body}</div>
        {footer && <div className="mt-2">{footer}</div>}
      </div>
    </div>
  );
}
