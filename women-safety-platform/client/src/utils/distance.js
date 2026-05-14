/**
 * Calculate the great circle distance between two points 
 * on the earth (specified in decimal degrees)
 */
export const haversineDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
};

const deg2rad = (deg) => {
  return deg * (Math.PI / 180);
};

export const formatDistance = (km) => {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  return `${km.toFixed(1)} km`;
};

/**
 * Basic ETA calculation assuming 30 km/h average speed
 */
export const calculateETA = (km) => {
  if (!km) return 'Unknown';
  if (km < 0.1) return 'Arriving';
  
  const speedKmH = 30;
  const timeHours = km / speedKmH;
  const timeMinutes = Math.ceil(timeHours * 60);
  
  if (timeMinutes < 1) return '< 1 min';
  if (timeMinutes > 60) return '> 1 hr';
  return `${timeMinutes} min`;
};
