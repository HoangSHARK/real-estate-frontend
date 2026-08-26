import { Building2, Coins, Home, Ruler, TrendingUp } from 'lucide-react';


const propertyLabels: Record<string, string> = {
  can_ho: 'Căn hộ', lien_ke: 'Liền kề', thuong_mai_dich_vu: 'Thương mại',
  shophouse: 'Shophouse', biet_thu_song_lap: 'Biệt thự song lập', unknown: 'Khác',
};
const money = (value?: number) => value ? `${(value / 1e9).toLocaleString('vi-VN', { maximumFractionDigits: 2 })} tỷ` : '—';
const millions = (value?: number) => value ? `${Math.round(value / 1e6).toLocaleString('vi-VN')} tr/m²` : '—';

export const ProjectOverview = ({ overview }: { overview: any }) => {
  const stats = overview?.stats || overview;
  const project = overview?.project;
  const types = Object.entries(stats?.by_property_type || {}).sort((a: any, b: any) => b[1] - a[1]);
  const maxType = Math.max(...types.map(([, count]) => Number(count)), 1);
  const asking = stats?.by_price_type?.asking?.count || 0;
  const estimate = stats?.by_price_type?.estimate?.count || 0;
  const totalPriceTypes = Math.max(asking + estimate, 1);

  return (
    <section className="project-overview animate-fade-in">
      <div className="overview-heading">
        <span><TrendingUp size={22} /></span>
        <div>
          <h3>{project?.name || 'Tổng quan thị trường dự án'}</h3>
          <p>{[project?.district, project?.province].filter(Boolean).join(', ') || 'Dữ liệu giao dịch & giỏ hàng thực tế'}</p>
        </div>
      </div>

      <div className="overview-kpis">
        <div className="overview-kpi-card">
          <div className="overview-kpi-icon"><Building2 size={18} /></div>
          <div className="overview-kpi-info">
            <span>Tổng nguồn hàng</span>
            <strong>{stats?.count?.toLocaleString('vi-VN') || '—'} căn</strong>
          </div>
        </div>

        <div className="overview-kpi-card">
          <div className="overview-kpi-icon"><Home size={18} /></div>
          <div className="overview-kpi-info">
            <span>Giá trung bình</span>
            <strong>{money(stats?.price_vnd?.avg)}</strong>
          </div>
        </div>

        <div className="overview-kpi-card">
          <div className="overview-kpi-icon"><Coins size={18} /></div>
          <div className="overview-kpi-info">
            <span>Đơn giá TB</span>
            <strong>{millions(stats?.price_per_m2_vnd?.avg)}</strong>
          </div>
        </div>

        <div className="overview-kpi-card">
          <div className="overview-kpi-icon"><Ruler size={18} /></div>
          <div className="overview-kpi-info">
            <span>Diện tích TB</span>
            <strong>{stats?.area_m2?.avg ? `${stats.area_m2.avg.toLocaleString('vi-VN')} m²` : '—'}</strong>
          </div>
        </div>
      </div>

      <div className="overview-range">
        <h4>Biên độ giá ghi nhận</h4>
        <div className="overview-range-bar">
          <span>{money(stats?.price_vnd?.min)}</span>
          <i />
          <span>{money(stats?.price_vnd?.max)}</span>
        </div>
      </div>

      {types.length > 0 && (
        <div className="overview-chart">
          <h4>Cơ cấu loại hình bất động sản</h4>
          {types.slice(0, 5).map(([key, count]) => (
            <div className="chart-row" key={key}>
              <span>{propertyLabels[key] || key}</span>
              <div><i style={{ width: `${Math.max((Number(count) / maxType) * 100, 3)}%` }} /></div>
              <strong>{Number(count).toLocaleString('vi-VN')}</strong>
            </div>
          ))}
        </div>
      )}

      <div className="price-type-chart">
        <h4>Phân loại nguồn giá</h4>
        <div className="stacked-bar">
          <i style={{ width: `${(asking / totalPriceTypes) * 100}%` }} />
          <b style={{ width: `${(estimate / totalPriceTypes) * 100}%` }} />
        </div>
        <p>
          <span>• Chào bán trực tiếp: {asking} căn</span>
          <span>• Định giá ước tính: {estimate} căn</span>
        </p>
      </div>

      <p className="overview-note">
        * Số liệu thống kê và mô tả thị trường tự động tổng hợp theo giỏ hàng cập nhật nhất, không cấu thành cam kết đầu tư.
      </p>
    </section>
  );
};

