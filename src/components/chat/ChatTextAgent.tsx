import React from 'react';

// Phân tích inline markdown: **bold**, `code`, và giá tiền
const renderInlineMarkdown = (text: string): React.ReactNode => {
  // Tách theo **in đậm** và `code inline`
  const tokenRegex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={idx}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={idx} className="code-inline">{part.slice(1, -1)}</code>;
    }
    return part;
  });
};

export const ChatTextAgent = ({ content }: { content: string }) => {
  if (!content) return null;

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let currentList: { type: 'ul' | 'ol'; items: React.ReactNode[] } | null = null;

  const flushList = () => {
    if (currentList) {
      if (currentList.type === 'ul') {
        elements.push(<ul key={`list-${elements.length}`}>{currentList.items}</ul>);
      } else {
        elements.push(<ol key={`list-${elements.length}`}>{currentList.items}</ol>);
      }
      currentList = null;
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      return;
    }

    // Header 3: ### Tiêu đề
    if (trimmed.startsWith('### ')) {
      flushList();
      elements.push(
        <h4 key={index} style={{ fontSize: '15px', fontWeight: 700, margin: '12px 0 6px', color: 'var(--color-text)' }}>
          {renderInlineMarkdown(trimmed.slice(4))}
        </h4>
      );
      return;
    }

    // Header 2 / 1: ## hoặc #
    if (trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
      flushList();
      const text = trimmed.replace(/^#+\s*/, '');
      elements.push(
        <h3 key={index} style={{ fontSize: '16px', fontWeight: 800, margin: '14px 0 8px', color: 'var(--color-text)' }}>
          {renderInlineMarkdown(text)}
        </h3>
      );
      return;
    }

    // Blockquote / Callout: > Gợi ý
    if (trimmed.startsWith('> ')) {
      flushList();
      elements.push(
        <blockquote key={index}>
          {renderInlineMarkdown(trimmed.slice(2))}
        </blockquote>
      );
      return;
    }

    // Unordered List: - item hoặc * item
    const bulletMatch = trimmed.match(/^[-*•]\s+(.*)/);
    if (bulletMatch) {
      if (!currentList || currentList.type !== 'ul') {
        flushList();
        currentList = { type: 'ul', items: [] };
      }
      currentList.items.push(
        <li key={`li-${index}`}>{renderInlineMarkdown(bulletMatch[1])}</li>
      );
      return;
    }

    // Ordered List: 1. item
    const numberMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (numberMatch) {
      if (!currentList || currentList.type !== 'ol') {
        flushList();
        currentList = { type: 'ol', items: [] };
      }
      currentList.items.push(
        <li key={`li-${index}`}>{renderInlineMarkdown(numberMatch[2])}</li>
      );
      return;
    }

    // Normal Paragraph
    flushList();
    elements.push(
      <p key={index}>{renderInlineMarkdown(line)}</p>
    );
  });

  flushList();

  return <div className="agent-text">{elements}</div>;
};

