import { Clock3, Mic, Plus, Scale, Send, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import type { PropertyCardData } from '../dynamic/PropertyCard';

interface ChatInputBarProps {
  isLoading: boolean;
  onSend: (value: string, intent?: string, displayText?: string) => void;
  selectedProperties?: PropertyCardData[];
  onRemoveProperty?: (property: PropertyCardData) => void;
  onClearProperties?: () => void;
  onOpenComparisonModal?: () => void;
}

const formatChipTitle = (title?: string) => {
  if (!title) return 'Căn hộ';
  // Rút gọn bớt nếu tên quá dài
  return title.length > 24 ? `${title.slice(0, 22)}…` : title;
};

const formatJoinList = (items: string[]) => {
  if (items.length <= 1) return items[0] || '';
  if (items.length === 2) return `${items[0]} và ${items[1]}`;
  return `${items.slice(0, -1).join(', ')} và ${items[items.length - 1]}`;
};

export const ChatInputBar = ({
  isLoading,
  onSend,
  selectedProperties = [],
  onRemoveProperty,
  onClearProperties,
  onOpenComparisonModal,
}: ChatInputBarProps) => {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const hasChips = selectedProperties.length > 0;
  const canCompare = selectedProperties.length >= 2;
  const canSubmit = value.trim().length > 0 || canCompare;

  // Auto focus vào input khi chọn căn
  useEffect(() => {
    if (hasChips) {
      inputRef.current?.focus();
    }
  }, [selectedProperties.length, hasChips]);

  const submit = () => {
    if (isLoading || !canSubmit) return;

    const trimmed = value.trim();
    if (canCompare) {
      // 1. Tên hiển thị thân thiện cho User thấy trên bong bóng chat (A, B, C và D)
      const rawTitles = selectedProperties.map((p) => p.title || p.id || 'Căn hộ');
      const displayTitles = formatJoinList(rawTitles);

      // 2. Nội dung chi tiết kèm mã ID thật từ database (oh:3YLP08...) gửi xuống AI backend
      const rawIdsWithContext = selectedProperties
        .map((p) => (p.id ? `${p.title || 'Căn hộ'} (${p.id})` : p.title))
        .filter(Boolean) as string[];
      const propertyIdsWithContext = formatJoinList(rawIdsWithContext);

      const displayText = trimmed
        ? `${trimmed} (So sánh: ${displayTitles})`
        : `So sánh chi tiết các căn sau: ${displayTitles}`;

      const apiPayload = trimmed
        ? `${trimmed} (So sánh các căn: ${propertyIdsWithContext})`
        : `So sánh các căn: ${propertyIdsWithContext}`;

      onSend(apiPayload, 'US6_COMPARE', displayText);
      onClearProperties?.();
    } else if (trimmed) {
      onSend(trimmed);
    }
    setValue('');
  };

  const getPlaceholder = () => {
    if (selectedProperties.length === 1) {
      return 'Chọn thêm ít nhất 1 căn nữa (1/4)...';
    }
    if (selectedProperties.length >= 2) {
      return `Nhập câu hỏi hoặc bấm Gửi để so sánh ${selectedProperties.length} căn...`;
    }
    return 'Hỏi bất kỳ điều gì...';
  };

  return (
    <div className="input-dock">
      <div className={`chat-input-bar ${hasChips ? 'has-chips' : ''}`}>
        <button type="button" className="input-action-btn" aria-label="Đính kèm">
          <Plus size={20} />
        </button>
        <button type="button" className="input-action-btn" aria-label="Lịch sử">
          <Clock3 size={18} />
        </button>

        {/* Input Field with Attached Property Chips */}
        <div className="input-field-area">
          {hasChips && (
            <div className="input-chips-list">
              {selectedProperties.map((property, index) => (
                <div
                  className="input-property-chip"
                  key={property.id || property.title || index}
                  title="Bấm để xem nhanh bảng so sánh"
                  onClick={() => onOpenComparisonModal?.()}
                  style={{ cursor: onOpenComparisonModal ? 'pointer' : 'default' }}
                >
                  <Scale size={13} className="chip-icon" />
                  <span className="chip-text">{formatChipTitle(property.title)}</span>
                  {onRemoveProperty && (
                    <button
                      type="button"
                      className="chip-remove"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveProperty(property);
                      }}
                      aria-label="Xóa căn"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <input
            ref={inputRef}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(event) => {
              if (
                event.key === 'Backspace' &&
                value === '' &&
                selectedProperties.length > 0 &&
                onRemoveProperty
              ) {
                // Xóa chip cuối cùng khi bấm Backspace ở ô input trống
                onRemoveProperty(selectedProperties[selectedProperties.length - 1]);
              } else if (event.key === 'Enter') {
                submit();
              }
            }}
            placeholder={getPlaceholder()}
            disabled={isLoading}
          />
        </div>

        {/* Send / Mic button */}
        <button
          type="button"
          className={canSubmit ? 'input-send active' : 'input-send'}
          onClick={canSubmit ? submit : undefined}
          aria-label={canSubmit ? 'Gửi câu hỏi / So sánh' : 'Ghi âm'}
          title={
            canCompare
              ? `Bấm để so sánh ${selectedProperties.length} căn`
              : canSubmit
              ? 'Gửi tin nhắn'
              : undefined
          }
        >
          {canSubmit ? <Send size={18} /> : <Mic size={19} />}
        </button>
      </div>
    </div>
  );
};
