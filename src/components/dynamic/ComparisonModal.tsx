import React, { useState } from 'react';
import { X, Eye, EyeOff, CalendarDays, Headphones, Scale, Sparkles } from 'lucide-react';
import type { PropertyCardData } from './PropertyCard';

interface ComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: PropertyCardData[];
  onAction: (item: PropertyCardData, intent: string) => void;
}

const fallbackImage =
  'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=600&q=80';

const formatPrice = (value?: number) =>
  value ? `${(value / 1e9).toLocaleString('vi-VN', { maximumFractionDigits: 2 })} tỷ đ` : 'Liên hệ';

export const ComparisonModal: React.FC<ComparisonModalProps> = ({
  isOpen,
  onClose,
  items,
  onAction,
}) => {
  const [onlyDifferences, setOnlyDifferences] = useState(false);

  if (!isOpen || items.length === 0) return null;

  // Find best price and largest area
  const validPrices = items.map((it) => it.price_vnd).filter(Boolean) as number[];
  const minPrice = validPrices.length ? Math.min(...validPrices) : null;

  const validAreas = items.map((it) => it.area_m2).filter(Boolean) as number[];
  const maxArea = validAreas.length ? Math.max(...validAreas) : null;

  // Comparison criteria definitions
  const rows = [
    {
      key: 'price',
      label: 'Tổng giá bán',
      getValue: (item: PropertyCardData) => formatPrice(item.price_vnd),
      isHighlight: (item: PropertyCardData) =>
        item.price_vnd != null && item.price_vnd === minPrice,
      highlightTag: 'Giá tốt nhất',
    },
    {
      key: 'price_per_m2',
      label: 'Đơn giá / m²',
      getValue: (item: PropertyCardData) =>
        item.price_per_m2_vnd
          ? `${Math.round(item.price_per_m2_vnd / 1e6).toLocaleString('vi-VN')} tr/m²`
          : '—',
      isHighlight: () => false,
    },
    {
      key: 'area',
      label: 'Diện tích',
      getValue: (item: PropertyCardData) =>
        item.area_m2 ? `${item.area_m2.toLocaleString('vi-VN')} m²` : '—',
      isHighlight: (item: PropertyCardData) =>
        item.area_m2 != null && item.area_m2 === maxArea,
      highlightTag: 'Rộng nhất',
    },
    {
      key: 'bedrooms',
      label: 'Phòng ngủ',
      getValue: (item: PropertyCardData) =>
        item.bedrooms != null ? `${item.bedrooms} PN` : item.property_type || '—',
      isHighlight: () => false,
    },
    {
      key: 'floor',
      label: 'Tầng / Vị trí',
      getValue: (item: PropertyCardData) =>
        item.floor_num ? `Tầng ${item.floor_num}` : item.floor_band || '—',
      isHighlight: () => false,
    },
    {
      key: 'direction',
      label: 'Hướng ban công',
      getValue: (item: PropertyCardData) =>
        item.direction_balcony ? `Hướng ${item.direction_balcony}` : '—',
      isHighlight: () => false,
    },
    {
      key: 'project',
      label: 'Dự án / Phân khu',
      getValue: (item: PropertyCardData) =>
        item.project_name || item.subtitle || 'Vinhomes',
      isHighlight: () => false,
    },
    {
      key: 'address',
      label: 'Địa chỉ / Khu vực',
      getValue: (item: PropertyCardData) =>
        item.address || item.province || 'Hà Nội',
      isHighlight: () => false,
    },
  ];

  // Filter rows based on "Only differences"
  const visibleRows = onlyDifferences
    ? rows.filter((row) => {
        const values = items.map((item) => row.getValue(item));
        const allSame = values.every((val) => val === values[0]);
        return !allSame;
      })
    : rows;

  return (
    <div className="compare-modal-backdrop" onClick={onClose}>
      <div
        className="compare-modal-content"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Top Header */}
        <div className="compare-modal-header">
          <div className="compare-modal-title-group">
            <div className="brand-badge">
              <Scale size={20} />
            </div>
            <div>
              <h2>Bảng đối chiếu {items.length} căn hộ</h2>
              <p>So sánh chi tiết các thông số kỹ thuật, giá bán và vị trí</p>
            </div>
          </div>

          <div className="compare-modal-controls">
            <button
              type="button"
              className={`toggle-diff-btn ${onlyDifferences ? 'active' : ''}`}
              onClick={() => setOnlyDifferences(!onlyDifferences)}
            >
              {onlyDifferences ? <EyeOff size={16} /> : <Eye size={16} />}
              <span>{onlyDifferences ? 'Hiện tất cả thông số' : 'Chỉ xem điểm khác biệt'}</span>
            </button>

            <button
              type="button"
              className="close-modal-btn"
              onClick={onClose}
              aria-label="Đóng"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Table Container with Horizontal Scroll */}
        <div className="compare-modal-body">
          <div className="compare-table-wrapper">
            <table className="compare-matrix-table">
              {/* Sticky Top Header with Property Cards */}
              <thead>
                <tr>
                  <th className="criteria-col-header">
                    <span className="text-muted">Thông số</span>
                  </th>
                  {items.map((item, idx) => {
                    const image =
                      item.image_url ||
                      item.thumbnail ||
                      item.images?.[0] ||
                      fallbackImage;
                    return (
                      <th key={item.id || idx} className="property-col-header">
                        <div className="matrix-card-head">
                          <img
                            src={image}
                            alt={item.title || 'Căn hộ'}
                            onError={(e) => {
                              e.currentTarget.src = fallbackImage;
                            }}
                          />
                          <h4 title={item.title}>
                            {item.title || `Căn hộ ${idx + 1}`}
                          </h4>
                          <div className="matrix-price">
                            {formatPrice(item.price_vnd)}
                          </div>

                          <div className="matrix-actions">
                            <button
                              type="button"
                              className="matrix-action-btn primary"
                              onClick={() => onAction(item, 'US2_1_VISIT')}
                            >
                              <CalendarDays size={14} />
                              <span>Đặt lịch xem</span>
                            </button>
                            <button
                              type="button"
                              className="matrix-action-btn outline"
                              onClick={() => onAction(item, 'US2_2_CONSULT')}
                            >
                              <Headphones size={14} />
                              <span>Tư vấn 1:1</span>
                            </button>
                          </div>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              {/* Rows of Specs */}
              <tbody>
                {visibleRows.map((row) => (
                  <tr key={row.key}>
                    <td className="criteria-label">{row.label}</td>
                    {items.map((item, idx) => {
                      const val = row.getValue(item);
                      const isHigh = row.isHighlight(item);
                      return (
                        <td
                          key={`${row.key}-${item.id || idx}`}
                          className={`spec-cell ${isHigh ? 'highlight-cell' : ''}`}
                        >
                          <div className="spec-val-wrapper">
                            <span className="spec-val">{val}</span>
                            {isHigh && row.highlightTag && (
                              <span className="highlight-tag">
                                <Sparkles size={11} /> {row.highlightTag}
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
