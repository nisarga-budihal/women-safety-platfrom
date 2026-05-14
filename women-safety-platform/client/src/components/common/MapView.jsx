import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, Polyline } from 'react-leaflet';
import { useEffect, useMemo } from 'react';
import L from 'leaflet';
import { DEFAULT_CENTER, DEFAULT_ZOOM } from '../../utils/constants';

// Custom marker icons
const createIcon = (color, emoji = '📍') => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background: ${color};
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      border: 3px solid white;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    ">${emoji}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20]
  });
};

const userIcon = createIcon('#F43F5E', '🆘');
const volunteerIcon = createIcon('#7C3AED', '🙋');
const resolvedIcon = createIcon('#10B981', '✅');

// Component to fly to a location
const FlyTo = ({ position, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, zoom || 15, { duration: 1.5 });
    }
  }, [position, zoom, map]);
  return null;
};

const MapView = ({
  center,
  zoom = DEFAULT_ZOOM,
  markers = [],
  pathCoordinates = [],
  userLocation,
  volunteerLocation,
  showRadius = false,
  radiusMeters = 5000,
  className = '',
  style = {},
  compact = false
}) => {
  const mapCenter = center || (userLocation ? [userLocation[1], userLocation[0]] : DEFAULT_CENTER);

  const pathPositions = useMemo(() => {
    return pathCoordinates.map(coord => [coord[1], coord[0]]);
  }, [pathCoordinates]);

  return (
    <div className={`rounded-2xl overflow-hidden border border-dark-700/50 ${className}`}
         style={{ height: compact ? '250px' : '400px', ...style }}>
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        className="w-full h-full"
        zoomControl={!compact}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* Fly to user location */}
        {userLocation && (
          <FlyTo position={[userLocation[1], userLocation[0]]} zoom={15} />
        )}

        {/* User SOS marker */}
        {userLocation && (
          <>
            <Marker
              position={[userLocation[1], userLocation[0]]}
              icon={userIcon}
            >
              <Popup>
                <div className="text-center">
                  <p className="font-bold text-red-500">🆘 SOS Location</p>
                  <p className="text-xs text-gray-600">
                    {userLocation[1].toFixed(4)}, {userLocation[0].toFixed(4)}
                  </p>
                </div>
              </Popup>
            </Marker>
            {showRadius && (
              <Circle
                center={[userLocation[1], userLocation[0]]}
                radius={radiusMeters}
                pathOptions={{
                  color: '#F43F5E',
                  fillColor: '#F43F5E',
                  fillOpacity: 0.08,
                  weight: 1,
                  dashArray: '8, 8'
                }}
              />
            )}
          </>
        )}

        {/* Volunteer marker */}
        {volunteerLocation && (
          <Marker
            position={[volunteerLocation[1], volunteerLocation[0]]}
            icon={volunteerIcon}
          >
            <Popup>
              <div className="text-center">
                <p className="font-bold text-purple-500">🙋 Volunteer</p>
                <p className="text-xs text-gray-600">On their way</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Additional markers */}
        {markers.map((marker, idx) => (
          <Marker
            key={idx}
            position={[marker.lat, marker.lng]}
            icon={marker.icon === 'volunteer' ? volunteerIcon : marker.icon === 'resolved' ? resolvedIcon : userIcon}
          >
            {marker.popup && (
              <Popup>
                <div className="text-center text-sm">
                  <p className="font-bold">{marker.popup.title}</p>
                  <p className="text-xs text-gray-500">{marker.popup.description}</p>
                </div>
              </Popup>
            )}
          </Marker>
        ))}

        {/* Live track connecting line */}
        {userLocation && volunteerLocation && (
          <Polyline
            positions={[
              [userLocation[1], userLocation[0]],
              [volunteerLocation[1], volunteerLocation[0]]
            ]}
            pathOptions={{
              color: '#F59E0B',
              weight: 4,
              opacity: 0.8,
              dashArray: '10, 10'
            }}
          />
        )}

        {/* Location history path */}
        {pathPositions.length > 1 && (
          <Polyline
            positions={pathPositions}
            pathOptions={{
              color: '#7C3AED',
              weight: 3,
              opacity: 0.7,
              dashArray: '10, 5'
            }}
          />
        )}
      </MapContainer>
    </div>
  );
};

export default MapView;
