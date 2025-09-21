'use client';

import { motion } from 'framer-motion';
import { FiActivity, FiSend, FiUsers, FiPlus, FiMapPin } from 'react-icons/fi';
import { useState, useEffect, useRef } from 'react';
import { getNearestCity } from '../utils/cities';

export default function LiveChatPage() {
  const [userLocation, setUserLocation] = useState({ city: null, lat: null, lon: null });
  const [permissionRequested, setPermissionRequested] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [groups, setGroups] = useState([]);
  const [currentGroup, setCurrentGroup] = useState(null);
  const [users, setUsers] = useState([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [ws, setWs] = useState(null);
  const [username, setUsername] = useState(localStorage.getItem('username') || '');
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const reconnectTimeout = useRef(null);

  // Set username on first mount only
  useEffect(() => {
    if (!username) {
      const user = prompt('Enter your username:') || `User${Math.floor(Math.random() * 1000)}`;
      localStorage.setItem('username', user);
      setUsername(user);
    }
    setIsLoading(false); // Username setup is quick, so loading can end here
  }, [username]);

  // Request geolocation and initialize WebSocket
  useEffect(() => {
    if (!permissionRequested) {
      setPermissionRequested(true);
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            const city = getNearestCity(latitude, longitude);
            setUserLocation({ city, lat: latitude, lon: longitude });
            setIsLoading(false);
          },
          (err) => {
            console.error('Geolocation error:', err);
            alert('Unable to access your location. Defaulting to "Unknown" city.');
            setUserLocation({ city: 'Unknown', lat: 0, lon: 0 });
            setIsLoading(false);
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
      } else {
        alert('Geolocation is not supported by your browser. Defaulting to "Unknown" city.');
        setUserLocation({ city: 'Unknown', lat: 0, lon: 0 });
        setIsLoading(false);
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
              setMessages((prev) => [...prev, data]);
            } else if (data.type === 'users') {
              setUsers(data.users || []);
            } else if (data.type === 'groups') {
              setGroups(data.groups || []);
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
  }, [permissionRequested, ws]);

  // Handle group creation and joining when location and WebSocket are ready
  useEffect(() => {
    if (ws && ws.readyState === WebSocket.OPEN && userLocation.city && !currentGroup) {
      const defaultGroup = `${userLocation.city} Group`;
      setCurrentGroup(defaultGroup);

      const createGroupMessage = {
        type: 'createGroup',
        groupName: defaultGroup,
        username,
        city: userLocation.city,
      };
      ws.send(JSON.stringify(createGroupMessage));

      const joinGroupMessage = {
        type: 'join',
        username,
        city: userLocation.city,
        group: defaultGroup,
      };
      ws.send(JSON.stringify(joinGroupMessage));
    }
  }, [userLocation.city, ws, username, currentGroup]);

  // Scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send a message with reconnection check
  const sendMessage = () => {
    if (newMessage.trim() && ws) {
      if (ws.readyState === WebSocket.OPEN) {
        const message = {
          type: 'message',
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

  // Create a new group
  const createGroup = () => {
    if (newGroupName.trim() && ws && ws.readyState === WebSocket.OPEN) {
      const groupMessage = {
        type: 'createGroup',
        groupName: newGroupName,
        username,
        city: userLocation.city,
      };
      ws.send(JSON.stringify(groupMessage));
      setNewGroupName('');
    } else if (ws && ws.readyState !== WebSocket.OPEN) {
      alert('WebSocket is not connected. Cannot create group.');
    }
  };

  // Join a group
  const joinGroup = (groupName) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      setCurrentGroup(groupName);
      ws.send(JSON.stringify({
        type: 'join',
        username,
        city: userLocation.city,
        group: groupName,
      }));
      setMessages([]); // Clear messages when switching groups
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
      className="flex flex-col items-center min-h-screen p-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="bg-gradient-to-r from-blue-600 to-teal-600 p-5 rounded-full mb-6">
        <FiActivity size={40} className="text-white" />
      </div>
      <h2 className="text-3xl font-bold text-gray-800 mb-4">Live Chat</h2>
      <p className="text-gray-600 max-w-md text-center mb-8">
        Real-time communication with disaster response teams and volunteers
      </p>

      {/* Location Info */}
      {userLocation.city && (
        <div className="flex items-center text-gray-600 mb-4">
          <FiMapPin className="mr-2" />
          <span>You are chatting from: {userLocation.city}</span>
        </div>
      )}

      {/* Group Creation and Selection */}
      <div className="w-full max-w-md mb-6">
        <div className="flex items-center mb-4">
          <input
            type="text"
            placeholder="New group name"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            disabled={!ws || ws.readyState !== WebSocket.OPEN}
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="ml-2 px-4 py-2 bg-blue-600 text-white rounded-xl flex items-center"
            onClick={createGroup}
            disabled={!ws || ws.readyState !== WebSocket.OPEN}
          >
            <FiPlus className="mr-2" />
            Create Group
          </motion.button>
        </div>
        <div className="flex flex-wrap gap-2">
          {groups.map((group) => (
            <motion.button
              key={group}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-4 py-2 rounded-xl ${
                currentGroup === group
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
              onClick={() => joinGroup(group)}
              disabled={!ws || ws.readyState !== WebSocket.OPEN}
            >
              {group}
            </motion.button>
          ))}
        </div>
      </div>

      {/* User List */}
      <div className="w-full max-w-md mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
          <FiUsers className="mr-2" />
          Online Users ({users.length})
        </h3>
        <div className="bg-gray-50 p-4 rounded-xl max-h-32 overflow-y-auto">
          {users.length > 0 ? (
            users.map((user, index) => (
              <div key={index} className="text-gray-700">
                {user.username} ({user.city})
              </div>
            ))
          ) : (
            <div className="text-gray-500">No users online</div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="w-full max-w-md bg-white rounded-xl shadow-md p-4 mb-6">
        <div className="h-96 overflow-y-auto p-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`mb-4 ${
                msg.username === username ? 'text-right' : 'text-left'
              }`}
            >
              <div
                className={`inline-block p-3 rounded-lg ${
                  msg.username === username
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-800'
                }`}
              >
                <div className="text-sm font-semibold">{msg.username}</div>
                <div>{msg.text}</div>
                <div className="text-xs text-gray-400 mt-1">{msg.timestamp}</div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div className="flex items-center p-2 border-t border-gray-200">
          <input
            type="text"
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            disabled={!ws || ws.readyState !== WebSocket.OPEN}
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="ml-2 px-4 py-2 bg-blue-600 text-white rounded-xl flex items-center"
            onClick={sendMessage}
            disabled={!ws || ws.readyState !== WebSocket.OPEN}
          >
            <FiSend />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}