import type { ReactNode } from 'react';
import { CalendarDays, ChevronRight, Headphones } from 'lucide-react';

export interface PropertyCardData {
  id?: string; title?: string; property_type?: string; image_url?: string; thumbnail?: string;
  images?: string[]; price_vnd?: number; price_per_m2_vnd?: number; area_m2?: number;
  bedrooms?: number; floor_num?: number; floor_band?: string; direction_balcony?: string;
  project_name?: string; address?: string; province?: string; subtitle?: string;
}

interface PropertyCardProps {
  property: PropertyCardData; showViewAll?: boolean; onViewAll?: () => void;
  onVisit: () => void; onConsult: () => void;
  onSelect?: () => void;
}

const fallbackImage = 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=900&q=80';
const formatPrice = (value?: number) => value ? `Từ ${(value / 1e9).toLocaleString('vi-VN', { maximumFractionDigits: 2 })} tỷ đ` : 'Liên hệ';

const ActionRow = ({ icon, title, subtitle, onClick }: { icon: ReactNode; title: string; subtitle: string; onClick: () => void; }) => (
  <button type="button" className="property-action" onClick={onClick}>
    <span className="property-action-icon">{icon}</span>
    <span className="property-action-copy"><strong>{title}</strong><small>{subtitle}</small></span>
    <ChevronRight size={18} />
  </button>
);

export const PropertyCard = ({ property, showViewAll, onViewAll, onVisit, onConsult, onSelect }: PropertyCardProps) => {
  const image = property.image_url || property.thumbnail || property.images?.[0] || fallbackImage;
  const specs = [property.floor_num ? `${property.floor_num} tầng` : property.floor_band, property.direction_balcony ? `Hướng ${property.direction_balcony}` : undefined, property.area_m2 ? `${property.area_m2.toLocaleString('vi-VN')} m²` : undefined].filter(Boolean);

  return (
    <article className="property-card">
      <img className="property-hero" src={image} alt={property.title || 'Bất động sản'} onClick={onSelect} style={{ cursor: onSelect ? 'pointer' : 'default' }} onError={event => { event.currentTarget.src = fallbackImage; }} />
      <div className="property-card-body">
        <h3 onClick={onSelect} style={{ cursor: onSelect ? 'pointer' : 'default' }}>{property.title || property.property_type || 'Bất động sản nổi bật'}</h3>
        <div className="property-price"><strong>{formatPrice(property.price_vnd)}</strong>{property.price_per_m2_vnd && <span>{Math.round(property.price_per_m2_vnd / 1e6)} triệu/m²</span>}</div>
        {specs.length > 0 && <p className="property-specs">{specs.join('  |  ')}</p>}
        <p className="property-address">{property.address || property.subtitle || property.project_name || property.province || 'Thông tin vị trí đang được cập nhật'}</p>
        {showViewAll && <button type="button" className="view-all-button" onClick={onViewAll}>Xem tất cả</button>}
      </div>
      <div className="property-actions">
        <ActionRow icon={<CalendarDays size={18} />} title="Đặt lịch tham quan" subtitle="Dự án, nhà mẫu / thực tế" onClick={onVisit} />
        <ActionRow icon={<Headphones size={18} />} title="Tư vấn mua nhà 1:1" subtitle="Phân tích chính sách chuyên sâu" onClick={onConsult} />
      </div>
    </article>
  );
};

export const PropertyCarousel = ({ items, onSelect, onAction, showViewAll }: { items: PropertyCardData[]; onSelect: (item: PropertyCardData) => void; onAction: (item: PropertyCardData, intent: string) => void; showViewAll?: boolean; }) => (
  <div className="property-carousel" aria-label="Danh sách bất động sản">
    {items.map((item, index) => (
      <div className="property-slide" key={item.id || index}>
        <PropertyCard property={item} showViewAll={showViewAll && index === 0} onViewAll={() => onSelect(item)} onSelect={() => onSelect(item)} onVisit={() => onAction(item, 'US2_1_VISIT')} onConsult={() => onAction(item, 'US2_2_CONSULT')} />
      </div>
    ))}
  </div>
);
