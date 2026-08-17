export const ChatTextAgent = ({ content }: { content: string }) => (
  <div className="agent-text">
    {content.split('\n').map((line, index) => (
      <span key={`${line}-${index}`}>{line}{index < content.split('\n').length - 1 && <br />}</span>
    ))}
  </div>
);
