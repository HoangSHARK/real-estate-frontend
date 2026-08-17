import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

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

export const MapView: React.FC<MapViewProps> = ({ mapData }) => {
  const points = mapData?.points || mapData?.listings || [];
  
  let centerLat = mapData?.center_lat;
  let centerLng = mapData?.center_lng;

  // If no center provided, compute from points
  if ((!centerLat || !centerLng) && points.length > 0) {
    centerLat = points.reduce((sum: number, p: any) => sum + (p.lat || p.latitude || 0), 0) / points.length;
    centerLng = points.reduce((sum: number, p: any) => sum + (p.lng || p.longitude || 0), 0) / points.length;
  }

  // Fallback to a default center (e.g., HCMC center)
  if (!centerLat || !centerLng) {
    centerLat = 10.762622;
    centerLng = 106.660172;
  }

  return (
    <div style={{ padding: '24px', borderBottom: '1px solid var(--border-light)' }}>
      <h3 className="font-bold text-xs mb-4 uppercase tracking-wider text-slate-400">
        Vị trí: {centerLat.toFixed(4)}, {centerLng.toFixed(4)}
      </h3>
      <div 
        className="relative"
        style={{ 
          height: '220px', 
          borderRadius: '24px', 
          overflow: 'hidden', 
          boxShadow: 'var(--shadow-md)',
          zIndex: 1
        }}
      >
        <MapContainer center={[centerLat, centerLng]} zoom={13} style={{ height: '100%', width: '100%' }}>
          <ChangeView center={[centerLat, centerLng]} zoom={13} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {points.map((p: any, idx: number) => {
            const lat = p.lat || p.latitude;
            const lng = p.lng || p.longitude;
            if (!lat || !lng) return null;
            return (
              <Marker key={idx} position={[lat, lng]}>
                {(p.title || p.name) && (
                  <Popup>
                    {p.title || p.name}
                  </Popup>
                )}
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
};
