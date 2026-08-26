import { useState } from 'react';
import { CalendarDays, CheckCircle2, Home, MapPin, Ruler, Sofa } from 'lucide-react';

import type {
  ActionCompare,
  ActionDetail,
  ActionForm,
  ActionMap,
  ActionOverview,
  UIAction,
} from '../../types/agent';
import { ComparisonTable } from './ComparisonTable';
import { MapView } from './MapView';
import { ProjectOverview } from './ProjectOverview';
import { ChatTextAgent } from '../chat/ChatTextAgent';

interface InlineActionsProps {
  actions: UIAction[];
  sendMessage: (content: string, explicitIntent?: string, displayText?: string) => Promise<void>;
}

const fallbackImage =
  'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=900&q=80';

const displayValue = (value: unknown, fallback = 'Đang cập nhật') =>
  value === null || value === undefined || value === '' ? fallback : String(value);

export const InlineActions = ({ actions, sendMessage }: InlineActionsProps) => {
  const [formSubmitted, setFormSubmitted] = useState(false);
  const detailAction = actions.find(action => action.type === 'detail') as ActionDetail | undefined;
  const formAction = actions.find(action => action.type === 'form') as ActionForm | undefined;
  const mapAction = actions.find(action => action.type === 'map') as ActionMap | undefined;
  const compareAction = actions.find(action => action.type === 'compare') as ActionCompare | undefined;
  const overviewAction = actions.find(action => action.type === 'overview') as ActionOverview | undefined;
  const listing = detailAction?.listing;

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const entries = Object.fromEntries(formData.entries());
    const summary = Object.entries(entries)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');
    setFormSubmitted(true);
    void sendMessage(
      `Tôi đã điền thông tin đặt lịch: ${summary}`,
      'US2_1_VISIT',
      'Đã gửi thông tin đặt lịch tham quan',
    );
  };

  return (
    <div className="chat-inline-actions animate-fade-in">
      {listing && (
        <article className="inline-listing-card">
          <div className="inline-listing-image-wrap">
            <img
              src={listing.thumbnail || listing.image_url || listing.images?.[0] || fallbackImage}
              alt={listing.title || 'Căn hộ'}
              className="inline-listing-image"
              onError={event => { event.currentTarget.src = fallbackImage; }}
            />
            <span className="inline-listing-badge">Căn hộ đề xuất</span>
          </div>

          <div className="inline-listing-content">
            <div>
              <p className="inline-listing-eyebrow"><Home size={15} /> Chi tiết căn hộ</p>
              <h3>{listing.title || 'Thông tin căn hộ'}</h3>
              <p className="inline-listing-price">
                {listing.price_vnd
                  ? `${(listing.price_vnd / 1e9).toFixed(2)} tỷ VND`
                  : 'Liên hệ để nhận báo giá'}
              </p>
            </div>

            <div className="inline-listing-specs">
              <div><Ruler size={17} /><span>Diện tích<strong>{listing.area_m2 ? `${listing.area_m2} m²` : 'Đang cập nhật'}</strong></span></div>
              <div><Home size={17} /><span>Tầng<strong>{displayValue(listing.floor_num || listing.floor_band)}</strong></span></div>
              <div><MapPin size={17} /><span>Hướng / tầm nhìn<strong>{displayValue(listing.direction_balcony || listing.view)}</strong></span></div>
              <div><Sofa size={17} /><span>Bàn giao<strong>{displayValue(listing.furnishing, 'Cơ bản')}</strong></span></div>
              <div><CheckCircle2 size={17} /><span>Pháp lý<strong>{displayValue(listing.legal_status, 'Hợp đồng mua bán')}</strong></span></div>
            </div>

            <button
              className="inline-booking-button"
              onClick={() => sendMessage(
                `Tôi muốn đặt lịch tham quan căn ${listing.id || listing.title || 'này'}`,
                'US2_1_VISIT',
                `Đặt lịch tham quan căn ${listing.title || ''}`,
              )}
            >
              <CalendarDays size={18} />
              Đặt lịch tham quan
            </button>
          </div>
        </article>
      )}

      {formAction?.form && (
        <section className="inline-booking-form">
          <div className="inline-form-heading">
            <span><CalendarDays size={22} /></span>
            <div>
              <h3>{formAction.form.title || 'Đặt lịch tham quan căn hộ'}</h3>
              <p>{formAction.form.description || 'Vui lòng để lại thông tin, chuyên viên tư vấn sẽ liên hệ xác nhận lịch với bạn trong 15 phút.'}</p>
            </div>
          </div>

          {formSubmitted ? (
            <div style={{ padding: '16px', borderRadius: '12px', background: 'var(--color-success-soft)', border: '1px solid #a7f3d0', color: '#065f46', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CheckCircle2 size={20} color="#059669" />
              <span style={{ fontSize: '13.5px', fontWeight: 600 }}>Yêu cầu đặt lịch của bạn đã được ghi nhận thành công! Chuyên viên sẽ gọi điện thoại sớm nhất.</span>
            </div>
          ) : (
            <form onSubmit={handleFormSubmit}>
              <div className="inline-form-fields">
                {formAction.form.fields?.map((field: any, index: number) => (
                  <label key={field.name || index}>
                    <span>{field.label}</span>
                    <input
                      name={field.name}
                      type={field.type === 'datetime' ? 'datetime-local' : field.type || 'text'}
                      placeholder={field.placeholder || `Nhập ${field.label.toLowerCase()}`}
                      required
                    />
                  </label>
                ))}
              </div>
              <button type="submit" className="inline-form-submit">
                Gửi yêu cầu đặt lịch tham quan
              </button>
            </form>
          )}
        </section>
      )}

      {mapAction && <div className="inline-map"><MapView mapData={mapAction.map} /></div>}
      {compareAction && (
        <div className="inline-compare">
          <ComparisonTable
            comparisonData={compareAction.comparison}
            category={compareAction.category}
            title={compareAction.title}
            sendMessage={sendMessage}
          />
          {compareAction.summary && (
            <div className="compare-chat-summary-text">
              <ChatTextAgent content={`💡 **Nhận định:** ${compareAction.summary}`} />
            </div>
          )}
        </div>
      )}
      {overviewAction && <ProjectOverview overview={overviewAction.overview} />}
    </div>
  );
};

