import { useEffect, useRef, useState } from 'react';
import { Scale } from 'lucide-react';
import type { Message, Suggestion } from '../../types/agent';
import { InlineActions } from '../dynamic/InlineActions';
import { ProjectOptionList } from '../dynamic/ProjectOptionCard';
import { PropertyCard, PropertyCarousel, type PropertyCardData } from '../dynamic/PropertyCard';
import { ComparisonModal } from '../dynamic/ComparisonModal';
import { FeedbackRow } from '../dynamic/ResponseMeta';
import { SuggestedPrompts } from '../dynamic/SuggestedPrompts';
import { ChatBubbleUser } from './ChatBubbleUser';
import { ChatInputBar } from './ChatInputBar';
import { ChatTextAgent } from './ChatTextAgent';
import { ProgressStatus } from './ProgressStatus';

interface ChatAreaProps {
  messages: Message[];
  isLoading: boolean;
  sendMessage: (content: string, explicitIntent?: string, displayText?: string) => Promise<void>;
}

const formatJoinList = (items: string[]) => {
  if (items.length <= 1) return items[0] || '';
  if (items.length === 2) return `${items[0]} và ${items[1]}`;
  return `${items.slice(0, -1).join(', ')} và ${items[items.length - 1]}`;
};

export const ChatArea = ({ messages, isLoading, sendMessage }: ChatAreaProps) => {
  const endRef = useRef<HTMLDivElement>(null);
  const carouselSectionRef = useRef<HTMLDivElement>(null);
  const [selectedProperties, setSelectedProperties] = useState<PropertyCardData[]>([]);
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isLoading]);

  // Cuộn mượt mà lên đúng đoạn danh sách căn hộ khi kích hoạt chế độ so sánh
  useEffect(() => {
    if (isCompareMode) {
      const timer = setTimeout(() => {
        carouselSectionRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isCompareMode]);

  const selectProperty = (item: PropertyCardData) => {
    setIsCompareMode(false);
    void sendMessage(`Giới thiệu chi tiết căn ${item.id || item.title}`, 'US3_DETAIL');
  };
  const propertyAction = (item: PropertyCardData, intent: string) => {
    const label = intent === 'US2_1_VISIT' ? 'đặt lịch tham quan' : 'được tư vấn mua nhà';
    return sendMessage(`Tôi muốn ${label} cho căn ${item.id || item.title}`, intent);
  };
  const selectSuggestion = (suggestion: Suggestion) => {
    if (suggestion.value === '__COMPARE_MODE__' || suggestion.label === 'So sánh các căn') {
      setIsCompareMode(true);
      return;
    }
    setIsCompareMode(false);
    void sendMessage(
      suggestion.value || suggestion.label,
      suggestion.intent,
      suggestion.display_text || suggestion.label
    );
  };

  const handleToggleSelect = (item: PropertyCardData) => {
    setSelectedProperties((prev) => {
      const isExist = prev.some(
        (p) => (p.id && p.id === item.id) || (p.title && p.title === item.title)
      );
      if (isExist) {
        return prev.filter(
          (p) => !((p.id && p.id === item.id) || (p.title && p.title === item.title))
        );
      }
      if (prev.length >= 4) return prev;
      return [...prev, item];
    });
  };

  const handleRemoveFromCompare = (item: PropertyCardData) => {
    setSelectedProperties((prev) =>
      prev.filter(
        (p) => !((p.id && p.id === item.id) || (p.title && p.title === item.title))
      )
    );
  };

  const handleClearCompare = () => {
    setSelectedProperties([]);
    setIsCompareMode(false);
  };

  const handleTriggerCompare = () => {
    if (selectedProperties.length < 2) return;
    setIsModalOpen(true);
    const rawTitles = selectedProperties.map((p) => p.title || p.id || 'Căn hộ');
    const displayTitles = formatJoinList(rawTitles);

    const rawIdsWithContext = selectedProperties
      .map((p) => (p.id ? `${p.title || 'Căn hộ'} (${p.id})` : p.title))
      .filter(Boolean) as string[];
    const propertyIdsWithContext = formatJoinList(rawIdsWithContext);

    setIsCompareMode(false);
    void sendMessage(
      `So sánh các căn: ${propertyIdsWithContext}`,
      'US6_COMPARE',
      `So sánh chi tiết các căn sau: ${displayTitles}`
    );
  };

  const latestBot = [...messages].reverse().find(message => message.role === 'bot');
  const hasVisibleLatestProgress = Boolean(latestBot?.progress?.steps.length);
  const lastMessageWithCardsId = [...messages].reverse().find(m => m.actions?.some(a => a.type === 'cards'))?.id;

  return (
    <div className="chat-layout">
      <div className="message-feed">
        {messages.map(message => {
          if (message.role === 'user') return <ChatBubbleUser key={message.id} content={message.content} />;

          const cards = message.actions?.find(action => action.type === 'cards') as any;
          const intro = message.actions?.find(action => action.type === 'intro') as any;
          const followup = message.actions?.find(action => action.type === 'followup') as any;
          const detail = message.actions?.find(action => action.type === 'detail') as any;
          const clarify = message.actions?.find(action => action.type === 'clarify') as any;
          const cta = message.actions?.find(action => action.type === 'cta') as any;
          const sources = message.actions?.find(action => action.type === 'sources') as any;
          const advanced = message.actions?.filter(action => ['form', 'map', 'compare', 'overview'].includes(action.type)) || [];
          const projectOptions = clarify?.suggestions?.filter((item: Suggestion) => item.project_id) || [];
          let promptOptions = projectOptions.length ? [] : (clarify?.suggestions || cta?.items || []);

          const isComparisonResult = Boolean(cards?.is_comparison || intro);

          // Tự động bổ sung option "So sánh các căn" nếu là kết quả tìm kiếm thông thường (không phải kết quả vừa so sánh)
          if (cards?.items?.length >= 2 && !isComparisonResult) {
            const hasCompare = promptOptions.some((p: Suggestion) =>
              p.label.toLowerCase().includes('so sánh')
            );
            if (!hasCompare) {
              promptOptions = [
                ...promptOptions,
                { label: 'So sánh các căn', value: '__COMPARE_MODE__' },
              ];
            }
          }

          const hasProgress = Boolean(message.progress?.steps.length);
          const hasResponseMeta = message.content.length > 0 || (message.actions?.length ?? 0) > 0;
          const retry = message.retry;
          const isLatestCardsMessage = message.id === lastMessageWithCardsId;

          return (
            <section className="agent-response" key={message.id}>
              {hasProgress && message.progress && (
                <ProgressStatus
                  progress={message.progress}
                  onRetry={retry ? () => { void sendMessage(retry.content, retry.intent); } : undefined}
                />
              )}

              {/* 1. Lời dẫn mở đầu (nếu có intro thì hiện intro, nếu không thì hiện message.content) */}
              {intro ? (
                <ChatTextAgent content={intro.text} />
              ) : (
                message.content && <ChatTextAgent content={message.content} />
              )}

              {/* 2. Danh sách thẻ căn hộ (Ẩn nút so sánh nếu đang ở kết quả so sánh) */}
              {cards?.items?.length > 0 && (
                <div
                  ref={isLatestCardsMessage ? carouselSectionRef : undefined}
                  className="carousel-compare-wrapper"
                >
                  {isCompareMode && isLatestCardsMessage && !isComparisonResult && (
                    <div className="compare-mode-guide-banner">
                      <div className="guide-text">
                        <Scale size={16} className="guide-icon" />
                        <span>
                          <strong>Chế độ so sánh:</strong> Bấm vào các thẻ để <strong>thêm hoặc bớt (2–4 căn)</strong> so sánh.
                        </span>
                      </div>
                      <button
                        type="button"
                        className="guide-dismiss-btn"
                        onClick={() => {
                          setIsCompareMode(false);
                          setSelectedProperties([]);
                        }}
                      >
                        Thoát
                      </button>
                    </div>
                  )}

                  <PropertyCarousel
                    items={cards.items}
                    showViewAll={cards.items.length > 3}
                    onSelect={selectProperty}
                    onAction={propertyAction}
                    selectedItems={selectedProperties}
                    onToggleSelect={handleToggleSelect}
                    showCompareToggle={!isComparisonResult && isLatestCardsMessage && (isCompareMode || selectedProperties.length > 0)}
                  />
                </div>
              )}

              {/* 3. Câu hỏi gợi mở sau thẻ ảnh */}
              {followup && <ChatTextAgent content={followup.text} />}

              {detail?.listing && (
                <PropertyCard
                  property={detail.listing}
                  onVisit={() => propertyAction(detail.listing, 'US2_1_VISIT')}
                  onConsult={() => propertyAction(detail.listing, 'US2_2_CONSULT')}
                  showCompareToggle={false}
                />
              )}
              {projectOptions.length > 0 && <ProjectOptionList options={projectOptions} onSelect={selectSuggestion} />}
              {advanced.length > 0 && <InlineActions actions={advanced} sendMessage={sendMessage} />}
              {hasResponseMeta && <FeedbackRow text={message.content} sourceCount={sources?.items?.length || 0} />}
              {promptOptions.length > 0 && <SuggestedPrompts prompts={promptOptions} onSelect={selectSuggestion} />}
            </section>
          );
        })}
        {isLoading && !hasVisibleLatestProgress && <div className="typing-dots" aria-label="Đang trả lời"><span /><span /><span /></div>}
        <div ref={endRef} />
      </div>

      <ChatInputBar
        isLoading={isLoading}
        onSend={(value, intent, displayText) => { void sendMessage(value, intent, displayText); }}
        selectedProperties={selectedProperties}
        onRemoveProperty={handleRemoveFromCompare}
        onClearProperties={handleClearCompare}
        onOpenComparisonModal={handleTriggerCompare}
      />

      {/* Comparison Modal Matrix View */}
      <ComparisonModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        items={selectedProperties}
        onAction={(item, intent) => {
          setIsModalOpen(false);
          void propertyAction(item, intent);
        }}
      />
    </div>
  );
};
