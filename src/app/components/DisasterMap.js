'use client';
import L from 'leaflet';
import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Circle, Popup, useMap, Marker, Tooltip } from 'react-leaflet';

// Haversine formula to calculate distance between two points (in kilometers)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers
  return distance;
}

// Component to handle map centering and zooming
function MapController({ center, zoom }) {
  const mapRef = useRef(null);
  const map = useMap();
  useEffect(() => {
    if (map && center && zoom && Array.isArray(center) && center.length === 2) {
      const [lat, lon] = center;
      if (
        typeof lat === 'number' &&
        typeof lon === 'number' &&
        isFinite(lat) &&
        isFinite(lon) &&
        lat >= -90 &&
        lat <= 90 &&
        lon >= -180 &&
        lon <= 180
      ) {
        try {
          map.setView([lat, lon], zoom);
          map.invalidateSize(); // Ensure map renders correctly after view change
        } catch (error) {
          console.error('Error setting map view:', error);
        }
      }
    }
  }, [center, zoom, map]);
  return null;
}

export default function DisasterMap({ disasters, showDisasters, onDisasterClick, userLocation }) {
  const [selectedDisaster, setSelectedDisaster] = useState(null);
  const radiusKm = 100; // Radius in kilometers to filter disasters

  // Filter disasters within the specified radius of the user's location
  const nearbyDisasters = userLocation
    ? disasters.filter((disaster) => {
      if (
        typeof disaster.latitude !== 'number' ||
        typeof disaster.longitude !== 'number' ||
        !isFinite(disaster.latitude) ||
        !isFinite(disaster.longitude)
      ) {
        return false;
      }
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        disaster.latitude,
        disaster.longitude
      );
      return distance <= radiusKm;
    })
    : disasters;

  // Set initial map center based on user's location
  const initialCenter = userLocation
    ? [userLocation.latitude, userLocation.longitude]
    : [0, 0];
  const initialZoom = 10; // For ~100km view


  const handleDisasterClick = (disaster) => {
    if (
      typeof disaster.latitude === 'number' &&
      typeof disaster.longitude === 'number' &&
      isFinite(disaster.latitude) &&
      isFinite(disaster.longitude) &&
      disaster.latitude >= -90 &&
      disaster.latitude <= 90 &&
      disaster.longitude >= -180 &&
      disaster.longitude <= 180
    ) {
      setSelectedDisaster({ center: [disaster.latitude, disaster.longitude], zoom: 10 });
      onDisasterClick(disaster);
    } else {
      console.warn('Invalid coordinates for disaster:', disaster);
    }
  };

  return (
    <MapContainer
      center={initialCenter}
      zoom={10}
      minZoom={10}
      maxZoom={18}
      maxBounds={
        userLocation
          ? L.latLng(userLocation.latitude, userLocation.longitude).toBounds(100000) // 100 km
          : null
      }
      maxBoundsViscosity={1.0}
      style={{ height: '100%', width: '100%' }}
      className="rounded-xl shadow-md"
      whenCreated={(map) => {
        map.invalidateSize();
      }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      {/* Map Controller for Centering and Zooming */}
      {selectedDisaster ? (
        <MapController center={selectedDisaster.center} zoom={selectedDisaster.zoom} />
      ) : (
        <MapController center={initialCenter} zoom={initialZoom} />
      )}

      {/* User's Location Marker */}
      {userLocation && (
        <Marker position={[userLocation.latitude, userLocation.longitude]}>
          <Tooltip permanent>
            Your Location
          </Tooltip>
        </Marker>
      )}

      {/* Disaster Areas */}
      {showDisasters &&
        nearbyDisasters.map((disaster, index) => {
          // Validate coordinates
          if (
            typeof disaster.latitude !== 'number' ||
            typeof disaster.longitude !== 'number' ||
            !isFinite(disaster.latitude) ||
            !isFinite(disaster.longitude) ||
            disaster.latitude < -90 ||
            disaster.latitude > 90 ||
            disaster.longitude < -180 ||
            disaster.longitude > 180
          ) {
            console.warn('Skipping disaster with invalid coordinates:', disaster);
            return null;
          }

          const color =
            disaster.severity === 'High'
              ? 'red'
              : disaster.severity === 'Medium'
                ? 'yellow'
                : 'green';
          const radius =
            disaster.severity === 'High'
              ? 50000 // 50 km
              : disaster.severity === 'Medium'
                ? 30000 // 30 km
                : 10000; // 10 km

          return (
            <Circle
              key={index}
              center={[disaster.latitude, disaster.longitude]}
              radius={radius}
              pathOptions={{
                color: color,
                fillColor: color,
                fillOpacity: 0.5,
                opacity: 0.8,
              }}
              eventHandlers={{
                click: () => handleDisasterClick(disaster),
              }}
            >
              <Popup>
                <div className="text-center">
                  <h3 className="font-semibold">{disaster.title || 'Untitled Event'}</h3>
                  <p>Category: {disaster.category || 'N/A'}</p>
                  <p>Severity: {disaster.severity || 'N/A'}</p>
                  <p>
                    Location:{' '}
                    {typeof disaster.latitude === 'number' && isFinite(disaster.latitude)
                      ? disaster.latitude.toFixed(2) + '°N'
                      : 'N/A'}
                    ,{' '}
                    {typeof disaster.longitude === 'number' && isFinite(disaster.longitude)
                      ? disaster.longitude.toFixed(2) + '°E'
                      : 'N/A'}
                  </p>
                  <p>Date: {disaster.date || 'N/A'}</p>
                </div>
              </Popup>
            </Circle>
          );
        })}
    </MapContainer>
  );
}