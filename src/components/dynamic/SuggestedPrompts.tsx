import { ArrowRight, Compass } from 'lucide-react';

export const SuggestedPrompts = ({
  prompts,
  onSelect,
}: {
  prompts: Array<{ label: string; value?: string; intent?: string }>;
  onSelect: (prompt: { label: string; value?: string; intent?: string }) => void;
}) => (
  <div className="suggested-prompts animate-fade-in">
    <div className="suggested-prompts-title">
      <Compass size={13} style={{ color: 'var(--color-accent)' }} />
      <span>Gợi ý bước tiếp theo</span>
    </div>
    {prompts.map((prompt, index) => (
      <button
        type="button"
        className="suggested-prompt-btn"
        key={`${prompt.label}-${index}`}
        onClick={() => onSelect(prompt)}
      >
        <span>{prompt.label}</span>
        <ArrowRight size={15} />
      </button>
    ))}
  </div>
);

