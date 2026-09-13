import type { Orchestra } from '../../game/types';

export function AnswerChoices({ choices, selected, disabled, onSelect }: {
  choices: Orchestra[];
  selected?: string;
  disabled?: boolean;
  onSelect: (id: Orchestra['id']) => void;
}) {
  return <div className="choices" role="group" aria-label="Orchestra choices">
    {choices.map((choice) => <button key={choice.id} type="button" disabled={disabled} className={selected === choice.id ? 'selected' : ''} onClick={() => onSelect(choice.id)}>{choice.displayName}</button>)}
  </div>;
}
