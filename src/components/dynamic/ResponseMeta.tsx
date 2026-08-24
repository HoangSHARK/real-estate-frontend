import { Check, Copy, LoaderCircle, ThumbsDown, ThumbsUp } from 'lucide-react';
import { useState } from 'react';
import type { FeedbackValue, MessageFeedbackState } from '../../types/agent';

export const SourceBadge = ({ count }: { count: number }) => <span className="source-badge">{count} nguồn</span>;

interface FeedbackRowProps {
  text: string;
  sourceCount?: number;
  feedback?: MessageFeedbackState;
  onFeedback?: (value: FeedbackValue) => Promise<void>;
}

export const FeedbackRow = ({
  text,
  sourceCount = 0,
  feedback,
  onFeedback,
}: FeedbackRowProps) => {
  const [copied, setCopied] = useState(false);
  const copy = async () => { await navigator.clipboard?.writeText(text); setCopied(true); window.setTimeout(() => setCopied(false), 1400); };
  const submitting = feedback?.status === 'submitting';
  const selectedValue = feedback?.pendingValue ?? feedback?.value;
  const submit = (value: FeedbackValue) => {
    if (!onFeedback || submitting) return;
    if (feedback?.status === 'submitted' && feedback.value === value) return;
    void onFeedback(value);
  };

  return (
    <div className="response-meta">
      <div>{sourceCount > 0 && <SourceBadge count={sourceCount} />}</div>
      <div className="feedback-row">
        {text && (
          <button type="button" onClick={copy} aria-label="Sao chép">{copied ? <Check size={18} /> : <Copy size={18} />}</button>
        )}
        {onFeedback && (
          <>
            {feedback?.status === 'error' && (
              <span className="feedback-error" role="status" title={feedback.error}>
                Gửi lỗi
              </span>
            )}
            <button
              type="button"
              className={selectedValue === 1 ? 'selected' : ''}
              onClick={() => submit(1)}
              aria-label="Hữu ích"
              aria-pressed={feedback?.value === 1}
              aria-busy={submitting && selectedValue === 1}
              disabled={submitting}
            >
              {submitting && selectedValue === 1
                ? <LoaderCircle className="feedback-spinner" size={18} />
                : <ThumbsUp size={18} />}
            </button>
            <button
              type="button"
              className={selectedValue === 0 ? 'selected' : ''}
              onClick={() => submit(0)}
              aria-label="Không hữu ích"
              aria-pressed={feedback?.value === 0}
              aria-busy={submitting && selectedValue === 0}
              disabled={submitting}
            >
              {submitting && selectedValue === 0
                ? <LoaderCircle className="feedback-spinner" size={18} />
                : <ThumbsDown size={18} />}
            </button>
          </>
        )}
      </div>
    </div>
  );
};
