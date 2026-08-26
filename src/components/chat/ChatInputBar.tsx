import { Mic, MicOff, Scale, Send, Sparkles, Square, X } from 'lucide-react';

import { useState, useRef, useEffect } from 'react';
import type { PropertyCardData } from '../dynamic/PropertyCard';

interface ChatInputBarProps {
  isLoading: boolean;
  onSend: (value: string, intent?: string, displayText?: string) => void;
  onStop?: () => void;
  selectedProperties?: PropertyCardData[];
  onRemoveProperty?: (property: PropertyCardData) => void;
  onClearProperties?: () => void;
}

const formatChipTitle = (property: PropertyCardData, allSelected: PropertyCardData[]) => {
  const title = property.title || property.id || 'Căn hộ';
  const duplicates = allSelected.filter(
    (p) => (p.title || p.id || 'Căn hộ').trim().toLowerCase() === title.trim().toLowerCase()
  );
  if (duplicates.length > 1 && property.price_vnd) {
    const priceStr = `${(property.price_vnd / 1e9).toLocaleString('vi-VN', { maximumFractionDigits: 2 })} tỷ`;
    const shortT = title.length > 18 ? `${title.slice(0, 16)}…` : title;
    return `${shortT} (${priceStr})`;
  }
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
  onStop,
  selectedProperties = [],
  onRemoveProperty,
  onClearProperties,
}: ChatInputBarProps) => {
  const [value, setValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
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
      const rawTitles = selectedProperties.map((p) => {
        const title = p.title || p.id || 'Căn hộ';
        const duplicates = selectedProperties.filter(
          (other) => (other.title || other.id || 'Căn hộ').trim().toLowerCase() === title.trim().toLowerCase()
        );
        if (duplicates.length > 1 && p.price_vnd) {
          const priceStr = `${(p.price_vnd / 1e9).toLocaleString('vi-VN', { maximumFractionDigits: 2 })} tỷ`;
          return `${title} (${priceStr})`;
        }
        return title;
      });
      const displayTitles = formatJoinList(rawTitles);

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

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
    } else {
      setIsRecording(true);
      // Simulate speech-to-text recognition prompt
      setTimeout(() => {
        setValue((prev) => prev ? `${prev} tìm căn 2 phòng ngủ giá tốt` : 'Tìm căn 2 phòng ngủ giá tốt');
        setIsRecording(false);
      }, 1800);
    }
  };

  const getPlaceholder = () => {
    if (selectedProperties.length === 1) {
      return 'Chọn thêm ít nhất 1 căn nữa (1/4)...';
    }
    if (selectedProperties.length >= 2) {
      return `Nhập câu hỏi hoặc bấm Gửi để so sánh ${selectedProperties.length} căn...`;
    }
    return 'Hỏi về dự án, giá bán, tiện ích, vị trí...';
  };

  return (
    <div className="input-dock">
      <div className={`chat-input-bar ${hasChips ? 'has-chips multi-row' : ''}`}>
        {/* Tier 1: Comparison Chips Tray (when hasChips) */}
        {hasChips && (
          <div className="input-chips-tray">
            <div className="input-chips-list">
              {selectedProperties.map((property, index) => (
                <div
                  className="input-property-chip"
                  key={property.id || index}
                >
                  <Scale size={12} className="chip-icon" />
                  <span className="chip-text">{formatChipTitle(property, selectedProperties)}</span>
                  {onRemoveProperty && (
                    <button
                      type="button"
                      className="chip-remove"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveProperty(property);
                      }}
                      aria-label="Xóa căn"
                      title="Bỏ chọn căn này"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="chips-tray-counter">
                Đã chọn ({selectedProperties.length}/4)
              </span>
              {onClearProperties && (
                <button
                  type="button"
                  onClick={onClearProperties}
                  style={{
                    fontSize: '11px',
                    color: 'var(--color-muted)',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    padding: '2px 4px',
                  }}
                >
                  Xóa hết
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tier 2: Input and Action controls */}
        <div className="input-main-row">
          <button
            type="button"
            className="input-action-btn"
            aria-label="Gợi ý thông minh"
            title="Gợi ý câu hỏi"
            onClick={() => {
              setValue('Gợi ý cho tôi các dự án căn hộ hot nhất hiện nay');
              inputRef.current?.focus();
            }}
          >
            <Sparkles size={18} />
          </button>

          <div className="input-field-area">
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
                  onRemoveProperty(selectedProperties[selectedProperties.length - 1]);
                } else if (event.key === 'Enter') {
                  submit();
                }
              }}
              placeholder={isRecording ? 'Đang lắng nghe giọng nói của bạn...' : getPlaceholder()}
              disabled={isLoading}
            />
          </div>

          {/* Send / Mic / Stop button */}
          {isLoading ? (
            <button
              type="button"
              className="input-send stop"
              onClick={onStop}
              aria-label="Dừng tiến trình"
              title="Dừng tiến trình"
            >
              <Square size={13} fill="currentColor" />
            </button>
          ) : (
            <>
              {!canSubmit ? (
                <button
                  type="button"
                  className="input-action-btn"
                  onClick={toggleRecording}
                  aria-label={isRecording ? 'Dừng ghi âm' : 'Nhập bằng giọng nói'}
                  title={isRecording ? 'Đang nghe...' : 'Nhập bằng giọng nói'}
                  style={{ color: isRecording ? 'var(--color-danger)' : undefined }}
                >
                  {isRecording ? <MicOff size={19} /> : <Mic size={19} />}
                </button>
              ) : null}

              <button
                type="button"
                className={canSubmit ? 'input-send active' : 'input-send'}
                onClick={canSubmit ? submit : undefined}
                aria-label={canSubmit ? 'Gửi câu hỏi / So sánh' : 'Gửi'}
                title={
                  canCompare
                    ? `Bấm để so sánh ${selectedProperties.length} căn`
                    : canSubmit
                    ? 'Gửi tin nhắn'
                    : undefined
                }
              >
                <Send size={18} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

