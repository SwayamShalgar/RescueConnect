'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  FiUsers, FiAlertTriangle, FiCheckCircle, FiClock, 
  FiMapPin, FiLogOut, FiTrash2, FiEye, FiMap 
} from 'react-icons/fi';
import dynamic from 'next/dynamic';

// Dynamically import GoogleTranslate with SSR disabled
const GoogleTranslate = dynamic(() => import('../components/GoogleTranslate'), {
  ssr: false,
});

export default function AdminDashboard() {
  const router = useRouter();
  const [requests, setRequests] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adminName, setAdminName] = useState('Admin');
  const [selectedTab, setSelectedTab] = useState('overview');

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('adminToken');
    const name = localStorage.getItem('adminName');
    
    if (!token) {
      router.push('/adminlogin');
      return;
    }

    if (name) setAdminName(name);
    fetchDashboardData();
  }, [router]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('adminToken');
          router.push('/adminlogin');
          return;
        }
        throw new Error('Failed to fetch dashboard data');
      }

      const data = await response.json();
      setRequests(data.requests);
      setVolunteers(data.volunteers);
      setStats(data.stats);
      setLoading(false);
    } catch (err) {
      console.error('Dashboard error:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminId');
    localStorage.removeItem('adminName');
    router.push('/adminlogin');
  };

  const handleDeleteRequest = async (requestId) => {
    if (!confirm('Are you sure you want to delete this request?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/dashboard?requestId=${requestId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete request');

      // Refresh data
      fetchDashboardData();
      alert('Request deleted successfully');
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete request: ' + err.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'bg-yellow-500';
      case 'accepted': return 'bg-blue-500';
      case 'emergency': return 'bg-red-500';
      case 'completed': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency?.toLowerCase()) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-600">Welcome, {adminName}</p>
            </div>
            <div className="flex items-center gap-4">
              <GoogleTranslate />
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
              >
                <FiLogOut />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Volunteers</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total_volunteers || 0}</p>
              </div>
              <FiUsers className="text-4xl text-blue-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Pending Requests</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.pending_requests || 0}</p>
              </div>
              <FiClock className="text-4xl text-yellow-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Emergency Alerts</p>
                <p className="text-3xl font-bold text-red-600">{stats.emergency_requests || 0}</p>
              </div>
              <FiAlertTriangle className="text-4xl text-red-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Requests Today</p>
                <p className="text-3xl font-bold text-green-600">{stats.requests_today || 0}</p>
              </div>
              <FiCheckCircle className="text-4xl text-green-500" />
            </div>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <div className="flex gap-4 overflow-x-auto">
            <button
              onClick={() => setSelectedTab('overview')}
              className={`px-6 py-2 rounded-lg font-medium transition whitespace-nowrap ${
                selectedTab === 'overview'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setSelectedTab('requests')}
              className={`px-6 py-2 rounded-lg font-medium transition whitespace-nowrap ${
                selectedTab === 'requests'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Requests ({requests.length})
            </button>
            <button
              onClick={() => setSelectedTab('volunteers')}
              className={`px-6 py-2 rounded-lg font-medium transition whitespace-nowrap ${
                selectedTab === 'volunteers'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Volunteers ({volunteers.length})
            </button>
            <button
              onClick={() => router.push('/volunteermap')}
              className="px-6 py-2 rounded-lg font-medium transition whitespace-nowrap bg-green-100 text-green-700 hover:bg-green-200 flex items-center gap-2"
            >
              <FiMap />
              Volunteer Map
            </button>
            <button
              onClick={() => router.push('/victimmap')}
              className="px-6 py-2 rounded-lg font-medium transition whitespace-nowrap bg-red-100 text-red-700 hover:bg-red-200 flex items-center gap-2"
            >
              <FiMapPin />
              Victim Map
            </button>
          </div>
        </div>

        {/* Content based on selected tab */}
        {selectedTab === 'requests' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">All Requests</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">ID</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Urgency</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Assigned To</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Location</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((request) => (
                    <tr key={request.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{request.id}</td>
                      <td className="py-3 px-4">{request.name}</td>
                      <td className="py-3 px-4">{request.type}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getUrgencyColor(request.urgency)}`}>
                          {request.urgency}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold text-white ${getStatusColor(request.status)}`}>
                          {request.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">{request.volunteer_name || 'Unassigned'}</td>
                      <td className="py-3 px-4">
                        <a
                          href={`https://www.google.com/maps?q=${request.latitude},${request.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-700 flex items-center gap-1"
                        >
                          <FiMapPin /> View
                        </a>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => router.push(`/victimmap?lat=${request.latitude}&lng=${request.longitude}&id=${request.id}`)}
                            className="text-blue-500 hover:text-blue-700"
                            title="View on Map"
                          >
                            <FiEye />
                          </button>
                          <button
                            onClick={() => handleDeleteRequest(request.id)}
                            className="text-red-500 hover:text-red-700"
                            title="Delete Request"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedTab === 'volunteers' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">All Volunteers</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">ID</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Contact</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Skills</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Last Login</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Location</th>
                  </tr>
                </thead>
                <tbody>
                  {volunteers.map((volunteer) => (
                    <tr key={volunteer.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{volunteer.id}</td>
                      <td className="py-3 px-4">{volunteer.name}</td>
                      <td className="py-3 px-4">{volunteer.contact}</td>
                      <td className="py-3 px-4">{volunteer.skills || 'N/A'}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          volunteer.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {volunteer.status || 'Unknown'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {volunteer.last_login 
                          ? new Date(volunteer.last_login).toLocaleString()
                          : 'Never'}
                      </td>
                      <td className="py-3 px-4">
                        {volunteer.lat && volunteer.long ? (
                          <a
                            href={`https://www.google.com/maps?q=${volunteer.lat},${volunteer.long}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:text-blue-700 flex items-center gap-1"
                          >
                            <FiMapPin /> View
                          </a>
                        ) : (
                          <span className="text-gray-400">No location</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedTab === 'overview' && (
          <div className="space-y-6">
            {/* Recent Requests */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Requests</h2>
              <div className="space-y-3">
                {requests.slice(0, 5).map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{request.name}</h3>
                      <p className="text-sm text-gray-600">{request.type} - {request.urgency}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${getStatusColor(request.status)}`}>
                      {request.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Volunteers */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Recently Active Volunteers</h2>
              <div className="space-y-3">
                {volunteers.slice(0, 5).map((volunteer) => (
                  <div key={volunteer.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{volunteer.name}</h3>
                      <p className="text-sm text-gray-600">{volunteer.contact}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      volunteer.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {volunteer.status || 'Offline'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
