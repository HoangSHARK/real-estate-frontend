import { useEffect, useRef } from 'react';
import type { Message, Suggestion } from '../../types/agent';
import { InlineActions } from '../dynamic/InlineActions';
import { ProjectOptionList } from '../dynamic/ProjectOptionCard';
import { PropertyCard, PropertyCarousel, type PropertyCardData } from '../dynamic/PropertyCard';
import { FeedbackRow } from '../dynamic/ResponseMeta';
import { SuggestedPrompts } from '../dynamic/SuggestedPrompts';
import { ChatBubbleUser } from './ChatBubbleUser';
import { ChatInputBar } from './ChatInputBar';
import { ChatTextAgent } from './ChatTextAgent';

interface ChatAreaProps {
  messages: Message[];
  isLoading: boolean;
  sendMessage: (content: string, explicitIntent?: string) => Promise<void>;
}

export const ChatArea = ({ messages, isLoading, sendMessage }: ChatAreaProps) => {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isLoading]);

  const selectProperty = (item: PropertyCardData) => sendMessage(`Giới thiệu chi tiết căn ${item.id || item.title}`, 'US3_DETAIL');
  const propertyAction = (item: PropertyCardData, intent: string) => {
    let label = '';
    if (intent === 'US2_1_VISIT') label = 'đặt lịch tham quan';
    else if (intent === 'US2_2_CONSULT') label = 'được tư vấn mua nhà';
    else if (intent === 'US5_MAP') label = 'xem bản đồ cùng với các tiện ích xung quanh';
    return sendMessage(`Tôi muốn ${label} cho căn ${item.id || item.title}`, intent);
  };
  const selectSuggestion = (suggestion: Suggestion) => sendMessage(suggestion.value || suggestion.label, suggestion.intent);

  return (
    <div className="chat-layout">
      <div className="message-feed">
        {messages.map(message => {
          if (message.role === 'user') return <ChatBubbleUser key={message.id} content={message.content} />;

          const cards = message.actions?.find(action => action.type === 'cards') as any;
          const detail = message.actions?.find(action => action.type === 'detail') as any;
          const clarify = message.actions?.find(action => action.type === 'clarify') as any;
          const cta = message.actions?.find(action => action.type === 'cta') as any;
          const sources = message.actions?.find(action => action.type === 'sources') as any;
          const advanced = message.actions?.filter(action => ['form', 'map', 'compare', 'overview'].includes(action.type)) || [];
          const projectOptions = clarify?.suggestions?.filter((item: Suggestion) => item.project_id) || [];
          const promptOptions = projectOptions.length ? [] : (clarify?.suggestions || cta?.items || []);

          return (
            <section className="agent-response" key={message.id}>
              {message.content && <ChatTextAgent content={message.content} />}
              {cards?.items?.length > 0 && <PropertyCarousel items={cards.items} showViewAll={cards.items.length > 3} onSelect={selectProperty} onAction={propertyAction} />}
              {detail?.listing && <PropertyCard property={detail.listing} onVisit={() => propertyAction(detail.listing, 'US2_1_VISIT')} onConsult={() => propertyAction(detail.listing, 'US2_2_CONSULT')} onMap={() => propertyAction(detail.listing, 'US5_MAP')} />}
              {projectOptions.length > 0 && <ProjectOptionList options={projectOptions} onSelect={selectSuggestion} />}
              {advanced.length > 0 && <InlineActions actions={advanced} sendMessage={sendMessage} />}
              <FeedbackRow text={message.content} sourceCount={sources?.items?.length || 0} />
              {promptOptions.length > 0 && <SuggestedPrompts prompts={promptOptions} onSelect={selectSuggestion} />}
            </section>
          );
        })}
        {isLoading && <div className="typing-dots" aria-label="Đang trả lời"><span /><span /><span /></div>}
        <div ref={endRef} />
      </div>
      <ChatInputBar isLoading={isLoading} onSend={value => { void sendMessage(value); }} />
    </div>
  );
};
