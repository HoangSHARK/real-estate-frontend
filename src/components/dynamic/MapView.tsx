import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin, School, Hospital, ShoppingBag, Trees } from 'lucide-react';

// Fix for default marker icon in react-leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconRetinaUrl: iconRetina,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface MapViewProps {
  mapData: any;
}

const ChangeView = ({ center, zoom }: { center: [number, number], zoom: number }) => {
  const map = useMap();
  map.setView(center, zoom);
  return null;
};

const getAmenityEmoji = (type: string) => {
  switch(type) {
    case 'school':
    case 'kindergarten':
      return '🏫';
    case 'hospital':
    case 'clinic':
      return '🏥';
    case 'marketplace':
    case 'shopping':
      return '🛒';
    case 'park':
      return '🌳';
    default:
      return '📍';
  }
};

const getPropertyIcon = () => {
  return L.divIcon({
    html: `<div style="font-size: 18px; line-height: 1; display: flex; justify-content: center; align-items: center; width: 34px; height: 34px; background: #ea580c; color: white; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 12px rgba(234, 88, 12, 0.45);">🏠</div>`,
    className: 'custom-property-icon',
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -34]
  });
};

const getAmenityIcon = (type: string) => {
  const emoji = getAmenityEmoji(type);
  return L.divIcon({
    html: `<div style="font-size: 14px; line-height: 1; display: flex; justify-content: center; align-items: center; width: 28px; height: 28px; background-color: white; border-radius: 50%; border: 1.5px solid #e2e8f0; box-shadow: 0 2px 8px rgba(0,0,0,0.12);">${emoji}</div>`,
    className: 'custom-amenity-icon',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14]
  });
};

export const MapView: React.FC<MapViewProps> = ({ mapData }) => {
  const [selectedAmenityType, setSelectedAmenityType] = useState<string>('all');
  const points = mapData?.points || mapData?.listings || [];
  
  let centerLat = mapData?.center_lat;
  let centerLng = mapData?.center_lng;

  if ((!centerLat || !centerLng) && points.length > 0) {
    centerLat = points.reduce((sum: number, p: any) => sum + (p.lat || p.latitude || 0), 0) / points.length;
    centerLng = points.reduce((sum: number, p: any) => sum + (p.lng || p.longitude || 0), 0) / points.length;
  }

  if (!centerLat || !centerLng) {
    centerLat = 10.762622;
    centerLng = 106.660172;
  }

  const allAmenities = mapData?.amenities || [];
  const filteredAmenities = selectedAmenityType === 'all'
    ? allAmenities
    : allAmenities.filter((a: any) => a.type === selectedAmenityType);

  return (
    <div className="map-view-wrapper animate-fade-in">
      <div className="map-view-header">
        <div className="map-view-title">
          <MapPin size={18} style={{ color: 'var(--color-accent)' }} />
          <span>Bản đồ vị trí & Tiện ích lân cận</span>
        </div>
      </div>

      {allAmenities.length > 0 && (
        <div className="map-amenity-filters">
          <button
            type="button"
            className={`map-amenity-filter-btn ${selectedAmenityType === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedAmenityType('all')}
          >
            Tất cả ({allAmenities.length})
          </button>
          <button
            type="button"
            className={`map-amenity-filter-btn ${selectedAmenityType === 'school' ? 'active' : ''}`}
            onClick={() => setSelectedAmenityType('school')}
          >
            <School size={13} /> Trường học
          </button>
          <button
            type="button"
            className={`map-amenity-filter-btn ${selectedAmenityType === 'hospital' ? 'active' : ''}`}
            onClick={() => setSelectedAmenityType('hospital')}
          >
            <Hospital size={13} /> Bệnh viện
          </button>
          <button
            type="button"
            className={`map-amenity-filter-btn ${selectedAmenityType === 'marketplace' ? 'active' : ''}`}
            onClick={() => setSelectedAmenityType('marketplace')}
          >
            <ShoppingBag size={13} /> TTTM / Chợ
          </button>
          <button
            type="button"
            className={`map-amenity-filter-btn ${selectedAmenityType === 'park' ? 'active' : ''}`}
            onClick={() => setSelectedAmenityType('park')}
          >
            <Trees size={13} /> Công viên
          </button>
        </div>
      )}

      <div className="map-container-box">
        <MapContainer center={[centerLat, centerLng]} zoom={14} attributionControl={false} style={{ height: '100%', width: '100%' }}>
          <ChangeView center={[centerLat, centerLng]} zoom={14} />
          <TileLayer
            attribution=""
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {points.map((p: any, idx: number) => {
            const lat = p.lat || p.latitude;
            const lng = p.lng || p.longitude;
            if (!lat || !lng) return null;
            return (
              <Marker key={`point-${idx}`} position={[lat, lng]} icon={getPropertyIcon()}>
                {(p.title || p.name) && (
                  <Popup>
                    <div style={{ padding: '4px' }}>
                      <strong style={{ fontSize: '13px', color: '#0f172a' }}>{p.title || p.name}</strong>
                      {p.price_vnd ? (
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#ea580c', marginTop: '2px' }}>
                          Từ {(p.price_vnd / 1e9).toFixed(2)} tỷ VND
                        </div>
                      ) : null}
                    </div>
                  </Popup>
                )}
              </Marker>
            );
          })}
          {filteredAmenities.map((a: any, idx: number) => {
            const lat = a.lat;
            const lng = a.lng;
            if (!lat || !lng) return null;
            
            return (
              <Marker key={`amenity-${idx}`} position={[lat, lng]} icon={getAmenityIcon(a.type)}>
                <Popup>
                  <div style={{ padding: '2px' }}>
                    <strong style={{ fontSize: '12.5px', color: '#0f172a' }}>{a.name || 'Tiện ích'}</strong>
                    <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'capitalize', marginTop: '1px' }}>
                      {a.type || 'Tiện ích'}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
};

