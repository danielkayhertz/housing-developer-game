import { CharacterId, characters } from '../data/characters';

interface CharacterBubbleProps {
  characterId: CharacterId;
  line: string;
  whisper?: boolean;
}

export function CharacterBubble({ characterId, line, whisper = false }: CharacterBubbleProps) {
  const c = characters[characterId];
  return (
    <div className="bg-bg p-3 rounded-lg text-sm">
      <b>
        {c.emoji} {c.name}
        {whisper && <span className="text-muted font-normal"> (whisper)</span>}:
      </b>
      <br />
      <i className="text-muted">{line}</i>
    </div>
  );
}
