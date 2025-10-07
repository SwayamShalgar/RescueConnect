'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { FiActivity, FiSend, FiUsers, FiMapPin, FiChevronDown, FiSearch } from 'react-icons/fi';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { jwtDecode } from 'jwt-decode';
import { getNearestCity } from '../utils/cities';

// Dynamically import GoogleTranslate with SSR disabled
const GoogleTranslate = dynamic(() => import('../components/GoogleTranslate'), {
  ssr: false,
});

// All city names for auto-generating groups
const ALL_CITIES = [
  'Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad', 'Solapur', 'Kolhapur', 'Thane',
  'Navi Mumbai', 'Kalyan-Dombivli', 'Vasai-Virar', 'Amravati', 'Sangli', 'Jalgaon',
  'Akola', 'Latur', 'Dhule', 'Ahmednagar', 'Chandrapur', 'Parbhani', 'Ichalkaranji',
  'Jalna', 'Bhusawal', 'Panvel', 'Satara', 'Beed', 'Yavatmal', 'Achalpur', 'Osmanabad',
  'Nanded', 'Wardha', 'Udgir', 'Hinganghat', 'Ratnagiri', 'Phaltan', 'Gondia', 'Bhandara',
  'Washim', 'Hingoli', 'Baramati', 'Malegaon', 'Pandharpur', 'Bid', 'Amalner', 'Ambajogai',
  'Manjlegaon', 'Parli Vaijnath', 'Buldhana', 'Gadhinglaj', 'Karad', 'Wai', 'Paithan',
  'Lonavala', 'Alibag', 'Delhi', 'Bengaluru', 'Chennai', 'Kolkata', 'Hyderabad',
  'Ahmedabad', 'Jaipur', 'Lucknow', 'Belagavi'
];

export default function LiveChatPage() {
  const router = useRouter();
  const [userLocation, setUserLocation] = useState({ city: null, lat: null, lon: null });
  const [permissionRequested, setPermissionRequested] = useState(false);
  const [groupMessages, setGroupMessages] = useState({}); // Store messages per group
  const [newMessage, setNewMessage] = useState('');
  const [allCityGroups, setAllCityGroups] = useState([]); // All city groups
  const [currentGroup, setCurrentGroup] = useState(null);
  const [users, setUsers] = useState([]);
  const [ws, setWs] = useState(null);
  const [username, setUsername] = useState('');
  const [userId, setUserId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);
  const reconnectTimeout = useRef(null);
  const dropdownRef = useRef(null);

  // Get messages for current group
  const messages = currentGroup ? (groupMessages[currentGroup] || []) : [];

  // Check authentication and get user info from JWT token
  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('You must be logged in to access the chat. Redirecting to login...');
        router.push('/login');
        return;
      }

      const decoded = jwtDecode(token);
      if (!decoded.id || !decoded.name) {
        alert('Invalid authentication token. Please login again.');
        localStorage.removeItem('token');
        router.push('/login');
        return;
      }

      // Set user info from JWT token
      setUserId(decoded.id.toString());
      setUsername(decoded.name);
      setIsAuthenticated(true);
      setIsLoading(false);
    } catch (error) {
      console.error('Error decoding token:', error);
      alert('Authentication error. Please login again.');
      localStorage.removeItem('token');
      router.push('/login');
    }
  }, [router]);

  // Request geolocation and initialize WebSocket (only if authenticated)
  useEffect(() => {
    if (!isAuthenticated || !username) return;

    if (!permissionRequested) {
      setPermissionRequested(true);
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            const city = getNearestCity(latitude, longitude);
            setUserLocation({ city, lat: latitude, lon: longitude });
          },
          (err) => {
            console.error('Geolocation error:', err);
            alert('Unable to access your location. Defaulting to "Unknown" city.');
            setUserLocation({ city: 'Unknown', lat: 0, lon: 0 });
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
      } else {
        alert('Geolocation is not supported by your browser. Defaulting to "Unknown" city.');
        setUserLocation({ city: 'Unknown', lat: 0, lon: 0 });
      }
    }

    // Initialize or reconnect WebSocket
    const initializeWebSocket = () => {
      if (!ws) {
        const websocket = new WebSocket('ws://localhost:8080');
        setWs(websocket);

        websocket.onopen = () => {
          console.log('WebSocket connected');
          setIsLoading(false); // End loading when connected
        };

        websocket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'message') {
              // Store message in the appropriate group
              const groupName = data.group;
              setGroupMessages((prev) => ({
                ...prev,
                [groupName]: [...(prev[groupName] || []), data]
              }));
            } else if (data.type === 'users') {
              setUsers(data.users || []);
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        websocket.onclose = () => {
          console.log('WebSocket disconnected');
          setWs(null);
          // Attempt to reconnect
          if (!reconnectTimeout.current) {
            reconnectTimeout.current = setTimeout(() => {
              initializeWebSocket();
              reconnectTimeout.current = null;
            }, 2000); // Retry after 2 seconds
          }
        };

        websocket.onerror = (error) => {
          console.error('WebSocket error:', error);
        };
      }
    };

    initializeWebSocket();

    return () => {
      if (ws) {
        ws.close();
      }
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
    };
  }, [permissionRequested, ws, isAuthenticated, username]);

  // Initialize all city groups when WebSocket connects
  useEffect(() => {
    if (ws && ws.readyState === WebSocket.OPEN && userId) {
      // Create all city groups
      const cityGroups = ALL_CITIES.map(city => `${city} Group`);
      setAllCityGroups(cityGroups);
      
      // Auto-join user's current city group
      if (userLocation.city && !currentGroup) {
        const defaultGroup = `${userLocation.city} Group`;
        setCurrentGroup(defaultGroup);

        const joinGroupMessage = {
          type: 'join',
          userId,
          username,
          city: userLocation.city,
          group: defaultGroup,
        };
        ws.send(JSON.stringify(joinGroupMessage));
      }
    }
  }, [userLocation.city, ws, username, currentGroup, userId]);

  // Scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle click outside dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Send a message with reconnection check
  const sendMessage = () => {
    if (newMessage.trim() && ws) {
      if (ws.readyState === WebSocket.OPEN) {
        const message = {
          type: 'message',
          userId,
          username,
          text: newMessage,
          city: userLocation.city,
          group: currentGroup,
          timestamp: new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }), // Include date
        };
        ws.send(JSON.stringify(message));
        setNewMessage('');
      } else {
        alert('WebSocket is not connected. Please try again.');
      }
    }
  };

  // Join a group
  const joinGroup = (groupName) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      setCurrentGroup(groupName);
      ws.send(JSON.stringify({
        type: 'join',
        userId,
        username,
        city: userLocation.city,
        group: groupName,
      }));
      // Don't clear messages - they're now stored per group
    } else {
      alert('WebSocket is not connected. Cannot join group.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading chat...</p>
      </div>
    );
  }

  return (
    <motion.div
      className="flex flex-col items-center min-h-screen p-2 sm:p-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Language Selector - Top Right */}
      {/* <div className="fixed top-2 right-2 sm:top-4 sm:right-4 z-50">
        <GoogleTranslate />
      </div> */}

      <div className="bg-gradient-to-r from-blue-600 to-teal-600 p-3 sm:p-5 rounded-full mb-4 sm:mb-6">
        <FiActivity size={32} className="text-white sm:w-10 sm:h-10" />
      </div>
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2 sm:mb-4 text-center px-2">Live Chat</h2>
      <p className="text-sm sm:text-base text-gray-600 max-w-md text-center mb-4 sm:mb-8 px-4">
        Real-time communication with disaster response teams and volunteers
      </p>

      {/* Location Info */}
      {userLocation.city && (
        <div className="flex items-center text-sm sm:text-base text-gray-600 mb-2 sm:mb-4">
          <FiMapPin className="mr-1 sm:mr-2" />
          <span>You are chatting from: {userLocation.city}</span>
        </div>
      )}

      {/* Group Selection - Two Sections */}
      <div className="w-full max-w-4xl mb-4 sm:mb-6 px-2 sm:px-0">
        {/* Section 1: Your City Group */}
        <div className="mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 sm:mb-3 flex items-center">
            <FiMapPin className="mr-1 sm:mr-2 text-blue-600" />
            Your City Group
          </h3>
          {userLocation.city && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full px-4 sm:px-6 py-3 sm:py-4 rounded-xl flex items-center justify-between shadow-lg ${
                currentGroup === `${userLocation.city} Group`
                  ? 'bg-gradient-to-r from-blue-600 to-teal-600 text-white'
                  : 'bg-white border-2 border-blue-200 text-gray-700 hover:border-blue-400'
              }`}
              onClick={() => joinGroup(`${userLocation.city} Group`)}
              disabled={!ws || ws.readyState !== WebSocket.OPEN}
            >
              <span className="font-semibold text-base sm:text-lg">{userLocation.city} Group</span>
              {groupMessages[`${userLocation.city} Group`]?.length > 0 && (
                <span className={`text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-full ${
                  currentGroup === `${userLocation.city} Group`
                    ? 'bg-white text-blue-600'
                    : 'bg-blue-600 text-white'
                }`}>
                  {groupMessages[`${userLocation.city} Group`].length} messages
                </span>
              )}
            </motion.button>
          )}
        </div>

        {/* Section 2: Other Cities Dropdown */}
        <div ref={dropdownRef} className="relative">
          <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 sm:mb-3 flex items-center">
            <FiUsers className="mr-1 sm:mr-2 text-teal-600" />
            Other Cities
          </h3>
          
          {/* Dropdown Button */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-white border-2 border-teal-200 rounded-xl flex items-center justify-between hover:border-teal-400 transition-colors shadow-md"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            disabled={!ws || ws.readyState !== WebSocket.OPEN}
          >
            <span className="font-semibold text-sm sm:text-base text-gray-700 truncate mr-2">
              {currentGroup && currentGroup !== `${userLocation.city} Group`
                ? currentGroup
                : 'Select a city group'}
            </span>
            <motion.div
              animate={{ rotate: isDropdownOpen ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <FiChevronDown className="text-teal-600" size={24} />
            </motion.div>
          </motion.button>

          {/* Dropdown Menu */}
          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute z-50 w-full mt-2 bg-white border-2 border-teal-200 rounded-xl shadow-2xl overflow-hidden"
              >
                {/* Search Bar */}
                <div className="p-3 border-b border-gray-200 bg-gray-50">
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder="Search city groups..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>

                {/* City Groups List */}
                <div className="max-h-80 overflow-y-auto">
                  {allCityGroups
                    .filter(group => group !== `${userLocation.city} Group`) // Exclude user's city
                    .sort((a, b) => a.localeCompare(b)) // Alphabetical order
                    .filter(group => 
                      group.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((group) => {
                      const messageCount = groupMessages[group]?.length || 0;
                      const isActive = currentGroup === group;
                      
                      return (
                        <motion.button
                          key={group}
                          whileHover={{ backgroundColor: '#f0fdfa' }}
                          className={`w-full px-4 py-3 flex items-center justify-between border-b border-gray-100 transition-colors ${
                            isActive ? 'bg-teal-50' : 'bg-white'
                          }`}
                          onClick={() => {
                            joinGroup(group);
                            setIsDropdownOpen(false);
                            setSearchQuery('');
                          }}
                        >
                          <span className={`font-medium ${
                            isActive ? 'text-teal-700' : 'text-gray-700'
                          }`}>
                            {group}
                          </span>
                          {messageCount > 0 && (
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              isActive 
                                ? 'bg-teal-600 text-white' 
                                : 'bg-gray-200 text-gray-600'
                            }`}>
                              {messageCount}
                            </span>
                          )}
                        </motion.button>
                      );
                    })}
                  
                  {/* No Results Message */}
                  {allCityGroups
                    .filter(group => group !== `${userLocation.city} Group`)
                    .filter(group => 
                      group.toLowerCase().includes(searchQuery.toLowerCase())
                    ).length === 0 && (
                    <div className="p-4 text-center text-gray-500">
                      No city groups found
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* User List */}
      <div className="w-full max-w-md mb-4 sm:mb-6 px-2 sm:px-0">
        {(() => {
          // Extract city name from current group (format: "CityName Group")
          const groupCity = currentGroup ? currentGroup.replace(' Group', '') : null;
          // Filter users who belong to the current group's city
          const filteredUsers = groupCity 
            ? users.filter(user => user.city === groupCity)
            : users;
          
          return (
            <>
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 flex items-center">
                <FiUsers className="mr-1 sm:mr-2" />
                <span className="truncate">Online Users in {currentGroup || 'Chat'} ({filteredUsers.length})</span>
              </h3>
              <div className="bg-gray-50 p-3 sm:p-4 rounded-xl max-h-32 overflow-y-auto">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user, index) => (
                    <div 
                      key={index} 
                      className={`text-sm sm:text-base text-gray-700 ${user.username === username ? 'font-bold text-blue-600' : ''}`}
                    >
                      {user.username} ({user.city}) {user.username === username ? '(You)' : ''}
                    </div>
                  ))
                ) : (
                  <div className="text-sm sm:text-base text-gray-500">No users online from {groupCity || 'this group'}</div>
                )}
              </div>
            </>
          );
        })()}
      </div>

      {/* Chat Area */}
      <div className="w-full max-w-md bg-white rounded-xl shadow-md p-2 sm:p-4 mb-4 sm:mb-6 mx-2 sm:mx-0">
        <div className="bg-gradient-to-r from-blue-600 to-teal-600 text-white p-2 sm:p-3 rounded-t-xl -mx-2 sm:-mx-4 -mt-2 sm:-mt-4 mb-2 sm:mb-4">
          <h3 className="font-semibold text-sm sm:text-base text-center truncate px-2">
            {currentGroup || 'Select a group to start chatting'}
          </h3>
        </div>
        <div className="h-64 sm:h-96 overflow-y-auto p-2 sm:p-4 space-y-2 sm:space-y-3">
          {messages.length > 0 ? (
            messages.map((msg, index) => {
              const isOwnMessage = msg.userId === userId;
              return (
                <div
                  key={index}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] sm:max-w-[70%]`}>
                    {!isOwnMessage && (
                      <div className="text-xs text-gray-600 mb-1 ml-2">
                        {msg.username}
                      </div>
                    )}
                    <div
                      className={`p-2 sm:p-3 rounded-2xl ${
                        isOwnMessage
                          ? 'bg-blue-600 text-white rounded-br-sm'
                          : 'bg-gray-200 text-gray-800 rounded-bl-sm'
                      }`}
                    >
                      <div className="break-words text-sm sm:text-base">{msg.text}</div>
                      <div className={`text-xs ${isOwnMessage ? 'text-blue-100' : 'text-gray-500'} mt-1`}>
                        {msg.timestamp}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center text-sm sm:text-base text-gray-400 mt-16 sm:mt-20">
              No messages yet. Start the conversation!
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="flex items-center p-2 border-t border-gray-200 gap-1 sm:gap-2">
          <input
            type="text"
            placeholder="Type a message..."
            className="flex-1 px-2 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 text-black rounded-xl focus:ring-2 focus:ring-blue-500"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            disabled={!ws || ws.readyState !== WebSocket.OPEN}
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-xl flex items-center"
            onClick={sendMessage}
            disabled={!ws || ws.readyState !== WebSocket.OPEN}
          >
            <FiSend className="w-4 h-4 sm:w-5 sm:h-5" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}