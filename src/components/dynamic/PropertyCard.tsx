import { useRef, type ReactNode } from 'react';
import { BedDouble, CalendarDays, ChevronLeft, ChevronRight, Compass, Headphones, Layers, MapPin, Ruler, Scale } from 'lucide-react';

export interface PropertyCardData {
  id?: string; title?: string; property_type?: string; image_url?: string; thumbnail?: string;
  images?: string[]; price_vnd?: number; price_per_m2_vnd?: number; area_m2?: number;
  bedrooms?: number; floor_num?: number; floor_band?: string; direction_balcony?: string;
  project_name?: string; address?: string; province?: string; subtitle?: string;
}

interface PropertyCardProps {
  property: PropertyCardData; showViewAll?: boolean; onViewAll?: () => void;
  onVisit: () => void; onConsult: () => void; onMap?: () => void;
  onSelect?: () => void;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  disableSelect?: boolean;
  showCompareToggle?: boolean;
}

const fallbackImage = 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=900&q=80';
const formatPrice = (value?: number) => value ? `Từ ${(value / 1e9).toLocaleString('vi-VN', { maximumFractionDigits: 2 })} tỷ` : 'Liên hệ';

const ActionRow = ({ icon, title, subtitle, onClick }: { icon: ReactNode; title: string; subtitle: string; onClick: () => void; }) => (
  <button type="button" className="property-action" onClick={onClick}>
    <span className="property-action-icon">{icon}</span>
    <span className="property-action-copy"><strong>{title}</strong><small>{subtitle}</small></span>
    <ChevronRight size={16} />
  </button>
);

export const PropertyCard = ({
  property,
  showViewAll,
  onViewAll,
  onVisit,
  onConsult,
  onMap,
  onSelect,
  isSelected,
  onToggleSelect,
  disableSelect,
  showCompareToggle,
}: PropertyCardProps) => {
  const image = property.image_url || property.thumbnail || property.images?.[0] || fallbackImage;

  // 1. Diện tích
  const areaSpec =
    property.area_m2 && Number(property.area_m2) > 0
      ? { icon: <Ruler size={12} />, text: `${Number(property.area_m2).toLocaleString('vi-VN')} m²` }
      : null;

  // 2. Phòng ngủ
  const bedSpec =
    property.bedrooms && Number(property.bedrooms) > 0
      ? { icon: <BedDouble size={12} />, text: `${property.bedrooms} PN` }
      : null;

  // 3. Hướng
  const directionSpec =
    property.direction_balcony && property.direction_balcony.trim()
      ? { icon: <Compass size={12} />, text: property.direction_balcony.trim().replace(/^Hướng\s+/i, '') }
      : null;

  // 4. Tầng
  let floorText: string | null = null;
  if (property.floor_num && Number(property.floor_num) > 0) {
    floorText = `Tầng ${property.floor_num}`;
  } else if (property.floor_band && property.floor_band.trim()) {
    floorText = property.floor_band.trim();
  }
  const floorSpec = floorText ? { icon: <Layers size={12} />, text: floorText } : null;

  const specs = [areaSpec, bedSpec, directionSpec, floorSpec].filter(Boolean) as { icon: ReactNode; text: string }[];
  const shouldShowToggle = Boolean(onToggleSelect && (showCompareToggle || isSelected));
  const projectName = property.project_name || property.subtitle?.split('•')?.[0]?.trim();

  const handleCardClick = () => {
    if (shouldShowToggle) {
      if (!disableSelect || isSelected) {
        onToggleSelect?.();
      }
    } else {
      onSelect?.();
    }
  };

  return (
    <article className={`property-card ${isSelected ? 'is-selected' : ''}`}>
      <div className="property-hero-wrap">
        <img
          className="property-hero"
          src={image}
          alt={property.title || 'Bất động sản'}
          onClick={handleCardClick}
          style={{ cursor: 'pointer' }}
          onError={event => { event.currentTarget.src = fallbackImage; }}
        />
        <div className="property-hero-overlay" />
        
        {projectName && (
          <span className="property-project-tag">{projectName}</span>
        )}

        {shouldShowToggle && (
          <button
            type="button"
            className={`property-compare-toggle ${isSelected ? 'selected' : ''} ${disableSelect && !isSelected ? 'disabled' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              if (!disableSelect || isSelected) {
                onToggleSelect?.();
              }
            }}
            title={isSelected ? 'Bỏ chọn so sánh' : disableSelect ? 'Đã chọn tối đa 4 căn' : 'Thêm vào danh sách so sánh'}
          >
            <Scale size={13} />
            <span>{isSelected ? '✓ Đã chọn' : '+ So sánh'}</span>
          </button>
        )}
      </div>

      <div className="property-card-body">
        <h3 onClick={handleCardClick} style={{ cursor: 'pointer' }}>
          {property.title || property.property_type || 'Bất động sản nổi bật'}
        </h3>
        
        <div className="property-price">
          <strong>{formatPrice(property.price_vnd)}</strong>
          {property.price_per_m2_vnd && (
            <span>~{Math.round(property.price_per_m2_vnd / 1e6)} tr/m²</span>
          )}
        </div>

        <div className="property-specs-tag-row">
          {specs.map((item, idx) => (
            <span key={idx} className="property-spec-pill">
              {item.icon}
              {item.text}
            </span>
          ))}
        </div>

        <p className="property-address">
          <MapPin size={13} />
          <span>
            {property.address ||
              (property.project_name && property.province
                ? `${property.project_name}, ${property.province}`
                : property.project_name || property.province || property.subtitle || 'Vị trí đang cập nhật')}
          </span>
        </p>

        {showViewAll && <button type="button" className="view-all-button" onClick={onViewAll}>Xem tất cả căn tương tự</button>}
      </div>

      <div className="property-actions">
        {onMap && <ActionRow icon={<MapPin size={16} />} title="Xem vị trí & tiện ích" subtitle="Bản đồ quanh dự án" onClick={onMap} />}
        <ActionRow icon={<CalendarDays size={16} />} title="Đặt lịch tham quan" subtitle="Dự án, nhà mẫu thực tế" onClick={onVisit} />
        <ActionRow icon={<Headphones size={16} />} title="Tư vấn mua nhà 1:1" subtitle="Phân tích chính sách & giá" onClick={onConsult} />
      </div>
    </article>
  );
};

export const PropertyCarousel = ({
  items,
  onSelect,
  onAction,
  showViewAll,
  selectedItems = [],
  onToggleSelect,
  maxSelect = 4,
  showCompareToggle = false,
}: {
  items: PropertyCardData[];
  onSelect: (item: PropertyCardData) => void;
  onAction: (item: PropertyCardData, intent: string) => void;
  showViewAll?: boolean;
  selectedItems?: PropertyCardData[];
  onToggleSelect?: (item: PropertyCardData) => void;
  maxSelect?: number;
  showCompareToggle?: boolean;
}) => {
  const isMaxReached = selectedItems.length >= maxSelect;
  const carouselRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = direction === 'left' ? -340 : 340;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="carousel-nav-container">
      {items.length > 2 && (
        <button
          type="button"
          className="carousel-arrow-btn left"
          onClick={() => scroll('left')}
          aria-label="Căn hộ trước"
          style={{
            position: 'absolute',
            left: '-14px',
            top: '40%',
            zIndex: 5,
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.96)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            display: 'grid',
            placeItems: 'center',
            cursor: 'pointer',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text)',
          }}
        >
          <ChevronLeft size={18} />
        </button>
      )}

      <div className="property-carousel" ref={carouselRef} aria-label="Danh sách bất động sản">
        {items.map((item, index) => {
          const isSelected = Boolean(
            item.id && selectedItems.some((s) => s.id === item.id)
          );

          return (
            <div className="property-slide" key={item.id || index}>
              <PropertyCard
                property={item}
                showViewAll={showViewAll && index === 0}
                onViewAll={() => onSelect(item)}
                onSelect={() => onSelect(item)}
                onVisit={() => onAction(item, 'US2_1_VISIT')}
                onConsult={() => onAction(item, 'US2_2_CONSULT')}
                onMap={() => onAction(item, 'US5_MAP')}
                isSelected={isSelected}
                onToggleSelect={onToggleSelect ? () => onToggleSelect(item) : undefined}
                disableSelect={isMaxReached}
                showCompareToggle={showCompareToggle}
              />
            </div>
          );
        })}
      </div>

      {items.length > 2 && (
        <button
          type="button"
          className="carousel-arrow-btn right"
          onClick={() => scroll('right')}
          aria-label="Căn hộ tiếp theo"
          style={{
            position: 'absolute',
            right: '-14px',
            top: '40%',
            zIndex: 5,
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.96)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            display: 'grid',
            placeItems: 'center',
            cursor: 'pointer',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text)',
          }}
        >
          <ChevronRight size={18} />
        </button>
      )}
    </div>
  );
};

