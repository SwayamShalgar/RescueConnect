'use client';

import { motion } from 'framer-motion';
import { FiActivity, FiMapPin, FiPhone, FiAlertTriangle } from 'react-icons/fi';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';

// Dynamically import Leaflet components to prevent SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);


export default function VictimMapPage() {
  const searchParams = useSearchParams();
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [isMounted, setIsMounted] = useState(false);
  const [L, setL] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [map, setMap] = useState(null);
  const [routingControl, setRoutingControl] = useState(null);

  // Get query parameters for specific request
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const requestId = searchParams.get('id');

  // Load Leaflet
  useEffect(() => {
    import('leaflet').then((leaflet) => {
      setL(leaflet.default);
      delete leaflet.default.Icon.Default.prototype._getIconUrl;
      leaflet.default.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
    });
  }, []);

  // Fetch user's location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          if (
            isFinite(latitude) &&
            isFinite(longitude) &&
            latitude >= -90 &&
            latitude <= 90 &&
            longitude >= -180 &&
            longitude <= 180
          ) {
            setUserLocation({ latitude, longitude });
          } else {
            setLocationError('Invalid location coordinates obtained.');
          }
        },
        (err) => {
          console.error('Geolocation error:', err);
          setLocationError('Unable to detect your location.');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setLocationError('Geolocation is not supported by your browser.');
    }
  }, []);

  // Fetch rescue requests
  useEffect(() => {
    const fetchRequests = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Authentication required. Please log in.');
          setIsLoading(false);
          return;
        }

        const response = await fetch('/api/staff/volunteersdashboard', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch rescue requests');
        }

        const data = await response.json();
        const validRequests = data.filter(
          (req) =>
            req.latitude &&
            req.longitude &&
            isFinite(Number(req.latitude)) &&
            isFinite(Number(req.longitude))
        );
        setRequests(validRequests);
        
        // If a specific request ID is provided, find and select it
        if (requestId) {
          const request = validRequests.find(r => r.id === parseInt(requestId));
          if (request) {
            setSelectedRequest(request);
          }
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching requests:', err);
        setError(err.message);
        setIsLoading(false);
      }
    };

    fetchRequests();
  }, [requestId]);

  // Update current date and time every second
  useEffect(() => {
    setIsMounted(true);
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Function to show route from volunteer location to victim
  const showRoute = (victimLat, victimLng, victimName) => {
    if (!userLocation) {
      alert('Unable to show route. Please ensure your location is enabled.');
      return;
    }

    // Calculate straight-line distance using Haversine formula
    const R = 6371; // Earth's radius in kilometers
    const dLat = (victimLat - userLocation.latitude) * Math.PI / 180;
    const dLon = (victimLng - userLocation.longitude) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(userLocation.latitude * Math.PI / 180) * Math.cos(victimLat * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = (R * c).toFixed(2);
    
    // Estimate time (assuming average speed of 40 km/h in city)
    const estimatedTime = Math.round((distance / 40) * 60);

    // Remove existing route line if any
    if (routingControl) {
      map.removeLayer(routingControl);
    }

    // Draw a straight line from volunteer to victim on the map
    if (map && L) {
      import('react-leaflet').then((reactLeaflet) => {
        const line = L.polyline(
          [
            [userLocation.latitude, userLocation.longitude],
            [victimLat, victimLng]
          ],
          {
            color: '#3b82f6',
            weight: 4,
            opacity: 0.7,
            dashArray: '10, 10'
          }
        ).addTo(map);

        setRoutingControl(line);

        // Fit map to show both points
        map.fitBounds(line.getBounds(), { padding: [50, 50] });
      });
    }

    // Show distance info and offer to open in Google Maps
    const userConfirm = confirm(
      `Route to ${victimName}:\n\n` +
      `📍 Straight-line distance: ${distance} km\n` +
      `⏱️ Estimated time: ${estimatedTime} minutes (by road)\n\n` +
      `Click OK to open turn-by-turn navigation in Google Maps`
    );

    if (userConfirm) {
      // Open Google Maps with directions
      window.open(
        `https://www.google.com/maps/dir/?api=1&origin=${userLocation.latitude},${userLocation.longitude}&destination=${victimLat},${victimLng}&travelmode=driving`,
        '_blank'
      );
    }
  };

  // Custom icon for victims
  const createCustomIcon = (urgency) => {
    if (!L) return null;
    
    // Color scheme: Critical-Red, High-Light Red, Medium-Yellow, Low-Green
    let color;
    if (urgency === 'Critical') {
      color = '#dc2626'; // Red (red-600)
    } else if (urgency === 'High') {
      color = '#f87171'; // Light Red (red-400)
    } else if (urgency === 'Medium') {
      color = '#fbbf24'; // Yellow (yellow-400)
    } else {
      color = '#10b981'; // Green (green-500)
    }
    
    return L.divIcon({
      className: 'custom-icon',
      html: `
        <div style="
          background-color: ${color};
          width: 30px;
          height: 30px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="white">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </div>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });
  };

  // Determine center position
  const centerPosition = selectedRequest 
    ? [Number(selectedRequest.latitude), Number(selectedRequest.longitude)]
    : lat && lng 
    ? [Number(lat), Number(lng)]
    : userLocation 
    ? [userLocation.latitude, userLocation.longitude]
    : [17.7514, 75.9695]; // Default to Solapur area coordinates

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-teal-100">
        <p className="text-lg text-gray-700">Loading victim locations...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-6"
        >
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-r from-blue-600 to-teal-600 p-4 rounded-full">
              <FiMapPin size={40} className="text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Victim Locations Map</h1>
          <p className="text-lg text-gray-600">
            Real-time locations of people requiring rescue assistance
          </p>
        </motion.div>

        {/* Error Display */}
        {error && (
          <motion.div
            className="flex items-center justify-center p-3 bg-red-50 text-red-700 rounded-lg border border-red-200 mb-6"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <FiAlertTriangle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Location Error */}
        {locationError && (
          <motion.div
            className="flex items-center justify-center p-3 bg-yellow-50 text-yellow-700 rounded-lg border border-yellow-200 mb-6"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <FiAlertTriangle className="h-5 w-5 mr-2" />
            <span>{locationError}</span>
          </motion.div>
        )}

        {/* Legend */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-xl shadow-lg p-4 mb-6"
        >
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
            <FiActivity className="mr-2" />
            Urgency Levels
          </h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-red-600 mr-2"></div>
              <span className="text-sm text-gray-700">Critical</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-red-400 mr-2"></div>
              <span className="text-sm text-gray-700">High</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-yellow-400 mr-2"></div>
              <span className="text-sm text-gray-700">Medium</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
              <span className="text-sm text-gray-700">Low</span>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Total Rescue Requests: <strong>{requests.length}</strong>
          </p>
        </motion.div>

        {/* Map Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-xl shadow-2xl overflow-hidden"
          style={{ height: '600px' }}
        >
          {L && (
            <MapContainer
              center={centerPosition}
              zoom={selectedRequest || (lat && lng) ? 15 : 10}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={true}
              whenReady={(mapEvent) => {
                setMap(mapEvent.target);
              }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {/* Render all rescue request markers */}
              {requests.map((request) => (
                <Marker
                  key={request.id}
                  position={[Number(request.latitude), Number(request.longitude)]}
                  icon={createCustomIcon(request.urgency)}
                >
                  <Popup>
                    <div className="p-2 min-w-[250px]">
                      <h3 className="font-bold text-lg text-gray-900 mb-2">{request.name}</h3>
                      <div className="space-y-1 text-sm">
                        <p className="text-gray-700">
                          <strong>Type:</strong> {request.type}
                        </p>
                        <p className="text-gray-700">
                          <strong>Urgency:</strong>{' '}
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              request.urgency === 'Critical'
                                ? 'bg-red-600 text-white'
                                : request.urgency === 'High'
                                ? 'bg-red-400 text-white'
                                : request.urgency === 'Medium'
                                ? 'bg-yellow-400 text-gray-900'
                                : 'bg-green-500 text-white'
                            }`}
                          >
                            {request.urgency}
                          </span>
                        </p>
                        <p className="text-gray-700">
                          <strong>Status:</strong>{' '}
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              request.status === 'pending'
                                ? 'bg-gray-100 text-gray-800'
                                : request.status === 'accepted'
                                ? 'bg-green-100 text-green-800'
                                : request.status === 'completed'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {request.status}
                          </span>
                        </p>
                        <p className="text-gray-700">
                          <strong>Description:</strong> {request.description}
                        </p>
                        <div className="flex items-center text-blue-600 mt-2">
                          <FiPhone className="mr-2" />
                          <a href={`tel:${request.contact}`} className="hover:underline">
                            {request.contact}
                          </a>
                        </div>
                        {request.image_url && (
                          <a
                            href={request.image_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-xs block mt-2"
                          >
                            View Image
                          </a>
                        )}
                        {userLocation && (
                          <button
                            onClick={() => showRoute(
                              Number(request.latitude), 
                              Number(request.longitude),
                              request.name
                            )}
                            className="mt-3 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center"
                          >
                            <svg 
                              xmlns="http://www.w3.org/2000/svg" 
                              className="h-4 w-4 mr-2" 
                              fill="none" 
                              viewBox="0 0 24 24" 
                              stroke="currentColor"
                            >
                              <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={2} 
                                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" 
                              />
                            </svg>
                            Get Directions
                          </button>
                        )}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
              
              {/* User location marker */}
              {userLocation && L && (
                <Marker
                  position={[userLocation.latitude, userLocation.longitude]}
                  icon={L.divIcon({
                    className: 'custom-icon',
                    html: `
                      <div style="
                        background-color: #3b82f6;
                        width: 20px;
                        height: 20px;
                        border-radius: 50%;
                        border: 3px solid white;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                      "></div>
                    `,
                    iconSize: [20, 20],
                    iconAnchor: [10, 10],
                  })}
                >
                  <Popup>
                    <div className="text-center">
                      <strong>Your Location</strong>
                    </div>
                  </Popup>
                </Marker>
              )}
            </MapContainer>
          )}
        </motion.div>

        {/* Footer with timestamp */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 text-center text-gray-600 text-sm"
        >
          {isMounted ? (
            <>
              Last updated: {currentDateTime.toLocaleTimeString()} | {currentDateTime.toLocaleDateString()}
            </>
          ) : (
            'Loading...'
          )}
        </motion.div>
      </div>
    </div>
  );
}
