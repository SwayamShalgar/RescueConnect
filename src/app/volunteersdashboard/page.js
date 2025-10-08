'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { FiAlertTriangle } from 'react-icons/fi';
import { jwtDecode } from 'jwt-decode';
import { useRouter } from 'next/navigation';

// Dynamically import GoogleTranslate with SSR disabled
const GoogleTranslate = dynamic(() => import('../components/GoogleTranslate'), {
  ssr: false,
});

export default function VolunteersDashboard() {
  const router = useRouter();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [volunteerId, setVolunteerId] = useState(null);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          // Redirect to login instead of throwing error
          router.push('/login');
          return;
        }

        const decoded = jwtDecode(token);
        if (!decoded.id) {
          throw new Error('Invalid token: Volunteer ID not found.');
        }
        setVolunteerId(decoded.id);

        const response = await fetch('/api/staff/volunteersdashboard', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch requests');
        }

        const data = await response.json();
        setRequests(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  // Update current date and time every second (client-side only)
  useEffect(() => {
    setIsMounted(true);
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Update volunteer location periodically
  useEffect(() => {
    const updateLocation = async () => {
      if (navigator.geolocation && volunteerId) {
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 60000 // Cache for 1 minute
            });
          });
          
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          
          const token = localStorage.getItem('token');
          if (token) {
            // Update location on server
            const response = await fetch('/api/staff/update-location', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({ latitude, longitude })
            });
            
            const data = await response.json();
            
            if (response.status === 409 && data.duplicate) {
              // Show alert for duplicate coordinates
              alert('⚠️ Duplicate Location Detected\n\nAnother volunteer is already registered at this exact location. Your location was not updated.\n\nPlease verify your coordinates or move to a different location.');
              console.warn('Duplicate coordinates detected:', latitude, longitude);
            } else if (response.ok) {
              console.log('Location updated:', latitude, longitude);
            } else {
              console.warn('Location update failed:', data.message);
            }
          }
        } catch (error) {
          console.warn('Could not update location:', error.message);
        }
      }
    };

    // Update location immediately
    updateLocation();

    // Update location every 5 minutes
    const locationTimer = setInterval(updateLocation, 5 * 60 * 1000);

    return () => clearInterval(locationTimer);
  }, [volunteerId]);

  const handleAcceptRequest = async (requestId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`/api/staff/volunteersdashboard`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ requestId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to accept request');
      }

      setRequests((prevRequests) =>
        prevRequests.map((req) =>
          req.id === requestId
            ? { ...req, status: 'accepted', assigned_to: volunteerId }
            : req
        )
      );
      setSuccess('Request accepted successfully.');
    } catch (error) {
      console.error('Error accepting request:', error);
      setError(error.message);
    }
  };

  const handleCompleteRequest = async (requestId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`/api/staff/volunteersdashboard`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ requestId }),
      });

      // Try to parse response as JSON
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        throw new Error('Invalid response from server');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to complete and delete request');
      }

      // Check if operation was successful
      if (data.success !== false) {
        // Remove the request from the list (it's been deleted from database)
        setRequests((prevRequests) =>
          prevRequests.filter((req) => req.id !== requestId)
        );
        setSuccess('Request completed and removed from database.');
      } else {
        throw new Error(data.error || 'Completion operation failed');
      }
    } catch (error) {
      console.error('Error completing request:', error);
      console.error('Error details:', error.message);
      setError(`Failed to complete request: ${error.message}`);
    }
  };

  const handleEmergencyRequest = async (requestId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`/api/staff/volunteersdashboard`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ requestId }),
      });

      // Try to parse response as JSON
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        throw new Error('Invalid response from server');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to report emergency');
      }

      // Check if operation was successful
      if (data.success !== false) {
        // Remove the request from the list (it's been deleted from database after alerts sent)
        setRequests((prevRequests) =>
          prevRequests.filter((req) => req.id !== requestId)
        );
        setSuccess('Emergency alert sent to government and nearby volunteers. Request removed from database.');
      } else {
        throw new Error(data.error || 'Emergency operation failed');
      }
    } catch (error) {
      console.error('Error reporting emergency:', error);
      console.error('Error details:', error.message);
      setError(`Failed to report emergency: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-teal-100">
        <p className="text-lg text-gray-700">Loading requests...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-100 py-12 px-4 sm:px-6 lg:px-8">
      {/* Language Selector - Top Right */}
      <div className="fixed top-4 right-4 z-50">
        {isMounted && <GoogleTranslate />}
      </div>

      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h1 className="text-4xl font-bold text-gray-900">Volunteers Dashboard</h1>
          <p className="mt-2 text-lg text-gray-600">
            View and respond to active rescue requests
          </p>
        </motion.div>

        {error && (
          <motion.div 
            className="flex items-center justify-center p-3 bg-red-50 text-red-700 rounded-lg border border-red-200 mb-6 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <FiAlertTriangle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </motion.div>
        )}

        {success && (
          <motion.div 
            className="flex items-center justify-center p-3 bg-green-50 text-green-700 rounded-lg border border-green-200 mb-6 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span>{success}</span>
          </motion.div>
        )}

        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Urgency
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Image
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requests.map((request, index) => (
                  <motion.tr
                    key={request.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.3 }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <a
                        href={`tel:${request.contact}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {request.contact}
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
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
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {request.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <button
                        onClick={() => router.push(`/victimmap?lat=${request.latitude}&lng=${request.longitude}&id=${request.id}`)}
                        className="text-blue-600 hover:text-blue-800 flex items-center transition-colors"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-1"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        View on Map
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
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
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.image_url ? (
                        <a
                          href={request.image_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          View Image
                        </a>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(request.created_at).toLocaleString('en-IN', {
                        timeZone: 'Asia/Kolkata',
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.status === 'pending' ? (
                        <button
                          onClick={() => handleAcceptRequest(request.id)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Accept
                        </button>
                      ) : request.status === 'accepted' && request.assigned_to === volunteerId ? (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleCompleteRequest(request.id)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          >
                            Completed
                          </button>
                          <button
                            onClick={() => handleEmergencyRequest(request.id)}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                          >
                            Emergency
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-500">
                          {request.assigned_to === volunteerId
                            ? request.status === 'completed'
                              ? 'Completed by You'
                              : 'Emergency Reported'
                            : request.status}
                        </span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <motion.footer 
        className="relative z-10 bg-white/90 backdrop-blur-sm py-8 px-4 text-center text-gray-600 border-t border-gray-100 mt-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto">
          <p>© 2025 Disaster Crisis Response Platform. All rights reserved.</p>
          <p className="mt-2 text-sm">
            {isMounted ? `Last updated: ${currentDateTime.toLocaleTimeString('en-IN', { 
              hour: '2-digit', 
              minute: '2-digit',
              second: '2-digit',
              hour12: true 
            })} IST on ${currentDateTime.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}` : 'Loading...'}
          </p>
          <p className="mt-2 text-sm">Built with ❤ to help communities in need</p>
        </div>
      </motion.footer>
    </div>
  );
}