import React from 'react';

interface ComparisonTableProps {
  comparisonData: any;
  sendMessage?: (content: string, explicitIntent?: string) => Promise<void>;
}

export const ComparisonTable: React.FC<ComparisonTableProps> = ({ comparisonData, sendMessage }) => {
  if (!comparisonData || !comparisonData.listings || comparisonData.listings.length === 0) return null;

  const listings = comparisonData.listings;
  
  return (
    <div style={{ padding: '24px' }}>
      <h3 className="font-bold text-lg mb-4 text-white">So sánh các căn hộ</h3>
      <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
        {listings.map((listing: any, idx: number) => (
          <div key={idx} className="glass-card flex-shrink-0 w-64 rounded-2xl overflow-hidden snap-center">
            <div className="relative h-32 w-full bg-slate-800">
              <img 
                src={listing.thumbnail || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80"} 
                alt="Thumbnail" 
                className="w-full h-full object-cover"
                onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80" }}
              />
            </div>
            <div className="p-4 flex flex-col gap-2 text-sm">
              <div className="font-bold text-white mb-1 truncate" title={listing.title}>{listing.title}</div>
              
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span className="text-slate-400">Giá:</span>
                <span className="font-bold text-primary">{listing.price_vnd ? `${(listing.price_vnd / 1e9).toFixed(1)} Tỷ` : 'Liên hệ'}</span>
              </div>
              
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span className="text-slate-400">Diện tích:</span>
                <span className="text-slate-200">{listing.area_m2} m²</span>
              </div>
              
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span className="text-slate-400">Phòng ngủ:</span>
                <span className="text-slate-200">{listing.bedrooms || '-'}</span>
              </div>
              
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span className="text-slate-400">Tầng:</span>
                <span className="text-slate-200">{listing.floor_num || listing.floor_band || '-'}</span>
              </div>
              
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span className="text-slate-400">Hướng:</span>
                <span className="text-slate-200">{listing.direction_balcony || '-'}</span>
              </div>

              <div className="flex justify-between border-b border-white/5 pb-1">
                <span className="text-slate-400">Bàn giao:</span>
                <span className="text-slate-200">{listing.furnishing || 'Cơ bản'}</span>
              </div>

              <button 
                className="w-full py-2 mt-2 text-white rounded-lg text-xs font-bold transition-all hover:scale-[1.02] shadow-md shadow-primary/20" 
                style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)' }}
                onClick={() => sendMessage && sendMessage(`Tôi muốn đặt lịch xem căn này: ${listing.id}`, 'US2_1_VISIT')}
              >
                Đặt lịch xem
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {comparisonData.amenities && (
        <div className="mt-4">
          <h4 className="font-bold text-sm mb-2 text-white">Tiện ích xung quanh</h4>
          <p className="text-xs text-slate-400">Dữ liệu tiện ích đang được cập nhật thêm.</p>
        </div>
      )}
    </div>
  );
};
