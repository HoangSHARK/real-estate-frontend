import { CheckCheck } from 'lucide-react';

export const ChatBubbleUser = ({ content }: { content: string }) => (
  <div className="user-message">
    <div className="user-bubble">{content}</div>
    <span className="message-status">
      <CheckCheck size={13} style={{ color: 'var(--color-success)' }} /> Đã gửi
    </span>
  </div>
);

