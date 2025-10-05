'use client';

import { motion } from 'framer-motion';
import { FiActivity, FiMapPin, FiPhone, FiAlertTriangle, FiUser } from 'react-icons/fi';
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

export default function VolunteerMapPage() {
  const searchParams = useSearchParams();
  const [volunteers, setVolunteers] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [isMounted, setIsMounted] = useState(false);
  const [L, setL] = useState(null);
  const [selectedVolunteer, setSelectedVolunteer] = useState(null);
  const [map, setMap] = useState(null);
  const [routingControl, setRoutingControl] = useState(null);

  // Get query parameters for specific volunteer
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const volunteerId = searchParams.get('id');

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

  // Fetch volunteers
  useEffect(() => {
    const fetchVolunteers = async () => {
      setIsLoading(true);
      setError(''); // Clear previous errors
      
      try {
        console.log('=== FETCHING VOLUNTEERS ===');
        console.log('API URL:', '/api/volunteers');
        console.log('Time:', new Date().toISOString());
        
        const response = await fetch('/api/volunteers', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        console.log('Response received:');
        console.log('- Status:', response.status);
        console.log('- Status Text:', response.statusText);
        console.log('- OK:', response.ok);
        console.log('- Headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
          let errorMessage = `Server returned ${response.status}`;
          try {
            const errorData = await response.json();
            console.error('API Error Data:', errorData);
            if (errorData.error || errorData.details) {
              errorMessage = errorData.error || errorData.details;
            }
          } catch (parseError) {
            console.error('Could not parse error response:', parseError);
            // Try to get response text
            try {
              const text = await response.text();
              console.error('Response text:', text);
            } catch (e) {
              console.error('Could not read response text');
            }
          }
          throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log('Volunteers API Response:', data);
        console.log('Data type:', Array.isArray(data) ? 'Array' : typeof data);
        console.log('Data length:', Array.isArray(data) ? data.length : 'N/A');
        
        // Ensure data is an array
        if (!Array.isArray(data)) {
          console.error('Expected array but got:', typeof data);
          setVolunteers([]);
          setIsLoading(false);
          return;
        }
        
        // Filter for valid volunteers with coordinates
        const validVolunteers = data.filter((vol) => {
          const hasLat = vol.latitude !== null && vol.latitude !== undefined;
          const hasLng = vol.longitude !== null && vol.longitude !== undefined;
          const isValidLat = hasLat && isFinite(Number(vol.latitude));
          const isValidLng = hasLng && isFinite(Number(vol.longitude));
          
          if (!isValidLat || !isValidLng) {
            console.log(`Filtering out volunteer ${vol.id} (${vol.name}) - lat: ${vol.latitude}, lng: ${vol.longitude}`);
          }
          
          return isValidLat && isValidLng;
        });
        
        console.log(`Total volunteers: ${data.length}, Valid with locations: ${validVolunteers.length}`);
        setVolunteers(validVolunteers);
        
        // If a specific volunteer ID is provided, find and select it
        if (volunteerId) {
          const volunteer = validVolunteers.find(v => v.id === parseInt(volunteerId));
          if (volunteer) {
            console.log('Selected volunteer:', volunteer);
            setSelectedVolunteer(volunteer);
          } else {
            console.log('Volunteer ID not found:', volunteerId);
          }
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error in fetchVolunteers:', err);
        setError(`Unable to load volunteers: ${err.message}`);
        setVolunteers([]);
        setIsLoading(false);
      }
    };

    fetchVolunteers();
  }, [volunteerId]);

  // Update current date and time every second
  useEffect(() => {
    setIsMounted(true);
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Function to show route from user location to volunteer
  const showRoute = (volunteerLat, volunteerLng, volunteerName) => {
    if (!userLocation) {
      alert('Unable to show route. Please ensure your location is enabled.');
      return;
    }

    // Calculate straight-line distance using Haversine formula
    const R = 6371; // Earth's radius in kilometers
    const dLat = (volunteerLat - userLocation.latitude) * Math.PI / 180;
    const dLon = (volunteerLng - userLocation.longitude) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(userLocation.latitude * Math.PI / 180) * Math.cos(volunteerLat * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = (R * c).toFixed(2);
    
    // Estimate time (assuming average speed of 40 km/h in city)
    const estimatedTime = Math.round((distance / 40) * 60);

    // Remove existing route line if any
    if (routingControl) {
      map.removeLayer(routingControl);
    }

    // Draw a straight line from user to volunteer on the map
    if (map && L) {
      import('react-leaflet').then((reactLeaflet) => {
        const line = L.polyline(
          [
            [userLocation.latitude, userLocation.longitude],
            [volunteerLat, volunteerLng]
          ],
          {
            color: '#10b981',
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
      `Route to ${volunteerName}:\n\n` +
      `📍 Straight-line distance: ${distance} km\n` +
      `⏱️ Estimated time: ${estimatedTime} minutes (by road)\n\n` +
      `Click OK to open turn-by-turn navigation in Google Maps`
    );

    if (userConfirm) {
      // Open Google Maps with directions
      window.open(
        `https://www.google.com/maps/dir/?api=1&origin=${userLocation.latitude},${userLocation.longitude}&destination=${volunteerLat},${volunteerLng}&travelmode=driving`,
        '_blank'
      );
    }
  };

  // Custom icon for volunteers
  const createCustomIcon = () => {
    if (!L) return null;
    
    // Simple green marker for all volunteers
    const color = '#10b981'; // Green
    
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
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
        </div>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });
  };

  // Determine center position
  const centerPosition = selectedVolunteer 
    ? [Number(selectedVolunteer.latitude), Number(selectedVolunteer.longitude)]
    : lat && lng 
    ? [Number(lat), Number(lng)]
    : userLocation 
    ? [userLocation.latitude, userLocation.longitude]
    : [17.7514, 75.9695]; // Default to Solapur area coordinates

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-teal-100">
        <p className="text-lg text-gray-700">Loading volunteer locations...</p>
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
            <div className="bg-gradient-to-r from-green-600 to-teal-600 p-4 rounded-full">
              <FiUser size={40} className="text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Volunteer Locations Map</h1>
          <p className="text-lg text-gray-600">
            Find available volunteers near you for rescue assistance
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

        {/* No Volunteers Message */}
        {!error && volunteers.length === 0 && !isLoading && (
          <motion.div
            className="bg-gradient-to-r from-blue-50 to-teal-50 rounded-xl shadow-lg p-6 mb-6 border border-blue-200"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="bg-blue-100 rounded-full p-3">
                  <FiMapPin className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Volunteer Locations Available
                </h3>
                <p className="text-gray-700 mb-3">
                  No volunteers have shared their location yet. Volunteers need to log in and share their location to appear on this map.
                </p>
                <div className="bg-white rounded-lg p-4 border border-blue-100">
                  <p className="text-sm font-medium text-gray-800 mb-2">📍 For Volunteers:</p>
                  <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                    <li>Go to the login page</li>
                    <li>Click "Get Current Location" button</li>
                    <li>Allow browser location permission</li>
                    <li>Login to update your location in the system</li>
                  </ol>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Legend */}
        {volunteers.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-xl shadow-lg p-4 mb-6"
          >
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
              <FiActivity className="mr-2" />
              Volunteer Information
            </h3>
            <p className="text-sm text-gray-600">
              Total Volunteers: <strong>{volunteers.length}</strong>
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Click on any marker to view volunteer details and get directions
            </p>
          </motion.div>
        )}

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
              zoom={selectedVolunteer || (lat && lng) ? 15 : 10}
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
              
              {/* Render all volunteer markers */}
              {volunteers.map((volunteer) => (
                <Marker
                  key={volunteer.id}
                  position={[Number(volunteer.latitude), Number(volunteer.longitude)]}
                  icon={createCustomIcon()}
                >
                  <Popup>
                    <div className="p-2 min-w-[250px]">
                      <h3 className="font-bold text-lg text-gray-900 mb-2">{volunteer.name}</h3>
                      <div className="space-y-1 text-sm">
                        {volunteer.skills && (
                          <p className="text-gray-700">
                            <strong>Skills:</strong> {volunteer.skills}
                          </p>
                        )}
                        {volunteer.certifications && volunteer.certifications.length > 0 && (
                          <p className="text-gray-700">
                            <strong>Certifications:</strong> {Array.isArray(volunteer.certifications) ? volunteer.certifications.join(', ') : volunteer.certifications}
                          </p>
                        )}
                        {volunteer.last_login && (
                          <p className="text-gray-600 text-xs">
                            <strong>Last Online:</strong> {new Date(volunteer.last_login).toLocaleString()}
                          </p>
                        )}
                        <div className="flex items-center text-blue-600 mt-2">
                          <FiPhone className="mr-2" />
                          <a href={`tel:${volunteer.contact}`} className="hover:underline">
                            {volunteer.contact}
                          </a>
                        </div>
                        {userLocation && (
                          <button
                            onClick={() => showRoute(
                              Number(volunteer.latitude), 
                              Number(volunteer.longitude),
                              volunteer.name
                            )}
                            className="mt-3 w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center justify-center"
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
