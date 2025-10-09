'use client';

import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { FiActivity, FiSend, FiUpload, FiCamera, FiAlertTriangle, FiCheckCircle, FiXCircle, FiLoader } from 'react-icons/fi';
import { useState, useEffect, useRef } from 'react';
import { getNearestCity } from '../utils/cities';
import Image from 'next/image';

// Dynamically import GoogleTranslate with SSR disabled
const GoogleTranslate = dynamic(() => import('../components/GoogleTranslate'), {
  ssr: false,
});

// Component to format AI responses with sections and styling
function FormattedAIResponse({ text }) {
  // Parse sections based on emoji headers
  const sections = text.split(/(?=🔍|⚠️|🆘|🛡️|📋)/g).filter(Boolean);

  return (
    <div className="space-y-3">
      {sections.map((section, idx) => {
        const lines = section.trim().split('\n').filter(Boolean);
        if (lines.length === 0) return null;

        const header = lines[0];
        const content = lines.slice(1);

        // Determine section styling
        let bgColor = 'bg-blue-50';
        let borderColor = 'border-blue-200';
        let textColor = 'text-blue-900';
        
        if (header.includes('⚠️')) {
          bgColor = 'bg-orange-50';
          borderColor = 'border-orange-200';
          textColor = 'text-orange-900';
        } else if (header.includes('🆘')) {
          bgColor = 'bg-red-50';
          borderColor = 'border-red-200';
          textColor = 'text-red-900';
        } else if (header.includes('🛡️')) {
          bgColor = 'bg-green-50';
          borderColor = 'border-green-200';
          textColor = 'text-green-900';
        } else if (header.includes('📋')) {
          bgColor = 'bg-purple-50';
          borderColor = 'border-purple-200';
          textColor = 'text-purple-900';
        }

        return (
          <div
            key={idx}
            className={`${bgColor} ${borderColor} border-l-4 rounded-r-lg p-3 ${textColor}`}
          >
            <div className="font-bold text-sm mb-2">{header}</div>
            <div className="space-y-1 text-xs sm:text-sm">
              {content.map((line, i) => (
                <div key={i} className="leading-relaxed">
                  {line.trim().startsWith('•') ? (
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5">•</span>
                      <span className="flex-1">{line.trim().substring(1).trim()}</span>
                    </div>
                  ) : line.trim().startsWith('**') ? (
                    <div className="font-semibold mt-1">{line.replace(/\*\*/g, '')}</div>
                  ) : (
                    <div>{line}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function DisasterAIPage() {
  const [userLocation, setUserLocation] = useState({ city: null, lat: null, lon: null });
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [permissionRequested, setPermissionRequested] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Request geolocation permission
  useEffect(() => {
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
            setUserLocation({ city: 'Unknown', lat: 0, lon: 0 });
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
      } else {
        setUserLocation({ city: 'Unknown', lat: 0, lon: 0 });
      }

      // Initial AI greeting
      setMessages([
        {
          sender: 'AI',
          text: `🤖 **Disaster Response AI Assistant**\n\nHello! I'm your intelligent disaster response assistant.\n\n**I can help you with:**\n• 📸 Analyze disaster images and provide expert guidance\n• 🔍 Identify disaster types and severity levels\n• 🚨 Provide immediate safety recommendations\n• 📋 Suggest emergency supplies and evacuation plans\n• 🆘 Guide you through emergency response procedures\n\n**How to use:**\n1. Upload or capture an image of the disaster situation\n2. Add any additional context (optional)\n3. Get instant AI-powered analysis and guidance\n\nStay safe! 🛡️`,
          timestamp: new Date().toLocaleString()
        }
      ]);
    }
  }, [permissionRequested]);

  // Scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle image selection
  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        alert('Image size must be less than 10MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file');
        return;
      }

      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Convert image to base64
  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  // Analyze image with AI
  const analyzeImage = async () => {
    if (!selectedImage) {
      alert('Please select an image first');
      return;
    }

    setIsAnalyzing(true);

    try {
      // Add user message with image
      const userMessage = {
        sender: 'User',
        text: newMessage || 'Please analyze this disaster image',
        image: imagePreview,
        timestamp: new Date().toLocaleString(),
        location: userLocation.city || 'Unknown'
      };
      setMessages((prev) => [...prev, userMessage]);

      // Convert image to base64
      const base64Image = await convertToBase64(selectedImage);

      // Call API to analyze image
      const response = await fetch('/api/ai/analyze-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64Image,
          prompt: newMessage ? `User location: ${userLocation.city || 'Unknown'}. User query: ${newMessage}. Now analyze this disaster image and provide detailed guidance.` : undefined
        })
      });

      const data = await response.json();

      if (data.success) {
        // Add AI response
        setMessages((prev) => [
          ...prev,
          {
            sender: 'AI',
            text: data.analysis,
            timestamp: new Date().toLocaleString(),
            metadata: data.metadata
          }
        ]);
      } else {
        throw new Error(data.error || 'Analysis failed');
      }

    } catch (error) {
      console.error('Error analyzing image:', error);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'AI',
          text: `❌ **Analysis Failed**\n\nI encountered an error while analyzing the image: ${error.message}\n\nPlease try:\n• Uploading a different image\n• Checking your internet connection\n• Ensuring the image is clear and relevant\n• Contacting support if the issue persists`,
          timestamp: new Date().toLocaleString(),
          isError: true
        }
      ]);
    } finally {
      setIsAnalyzing(false);
      setNewMessage('');
      setSelectedImage(null);
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Send text message (without image)
  const sendMessage = () => {
    if (!newMessage.trim()) return;

    const userMessage = {
      sender: 'User',
      text: newMessage,
      timestamp: new Date().toLocaleString()
    };

    setMessages((prev) => [...prev, userMessage]);

    // Simple text response
    const aiResponse = {
      sender: 'AI',
      text: `I'm designed to analyze disaster images. To get the most accurate guidance:\n\n1. 📸 Upload a clear image of the disaster situation\n2. 💬 Add any additional context about what you're experiencing\n3. 🤖 I'll provide detailed analysis and safety recommendations\n\nYou can also ask questions like:\n• "What emergency supplies do I need for floods?"\n• "How do I prepare for an earthquake?"\n• "What are the signs of a severe storm?"\n\nOr simply upload an image for instant analysis!`,
      timestamp: new Date().toLocaleString()
    };

    setMessages((prev) => [...prev, aiResponse]);
    setNewMessage('');
  };

  // Clear image selection
  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <motion.div
      className="flex flex-col items-center min-h-screen p-2 sm:p-4 bg-gradient-to-br from-blue-50 via-white to-teal-50"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Language Selector - Top Right */}
      <div className="fixed top-2 right-2 sm:top-4 sm:right-4 z-50">
        <GoogleTranslate />
      </div>

      {/* Header */}
      <motion.div
        className="flex flex-col items-center mb-4 sm:mb-6"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="bg-gradient-to-r from-blue-600 to-teal-600 p-3 sm:p-5 rounded-full mb-3 sm:mb-4 shadow-lg">
          <FiActivity size={32} className="text-white sm:w-10 sm:h-10" />
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-2 text-center px-2">
          🤖 AI Disaster Analysis
        </h1>
        <p className="text-sm sm:text-base text-gray-600 max-w-2xl text-center px-4">
          Upload disaster images for instant AI-powered analysis and expert guidance
        </p>
        {userLocation.city && (
          <p className="text-xs sm:text-sm text-gray-500 mt-2">
            📍 Your location: {userLocation.city}
          </p>
        )}
      </motion.div>

      {/* Chat Area */}
      <motion.div
        className="w-full max-w-4xl bg-white rounded-2xl shadow-xl mb-4 sm:mb-6 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {/* Messages */}
        <div className="h-[400px] sm:h-[500px] overflow-y-auto p-3 sm:p-6 space-y-4">
          <AnimatePresence>
            {messages.map((msg, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className={`flex ${msg.sender === 'User' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3 sm:p-4 shadow-md ${
                    msg.sender === 'User'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                      : msg.isError
                      ? 'bg-red-50 border-2 border-red-200 text-gray-800'
                      : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800'
                  }`}
                >
                  <div className="flex items-start gap-2 mb-2">
                    <div className={`flex-shrink-0 ${msg.sender === 'User' ? 'text-blue-200' : 'text-blue-600'}`}>
                      {msg.sender === 'User' ? '👤' : '🤖'}
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-semibold mb-1 opacity-75">
                        {msg.sender} {msg.location && `• ${msg.location}`}
                      </div>
                      {msg.image && (
                        <div className="mb-3 rounded-lg overflow-hidden">
                          <img
                            src={msg.image}
                            alt="Uploaded disaster"
                            className="w-full h-auto max-h-64 object-contain bg-gray-900"
                          />
                        </div>
                      )}
                      <div className="text-sm sm:text-base break-words">
                        {msg.sender === 'AI' && !msg.isError ? (
                          <FormattedAIResponse text={msg.text} />
                        ) : (
                          <div className="whitespace-pre-wrap">{msg.text}</div>
                        )}
                      </div>
                      <div className="text-xs mt-2 opacity-60">
                        {msg.timestamp}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t-2 border-gray-200 p-3 sm:p-4 bg-gray-50">
          {/* Image Preview */}
          {imagePreview && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-3 relative"
            >
              <div className="relative inline-block">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-h-32 sm:max-h-48 rounded-lg border-2 border-blue-300 shadow-md"
                />
                <button
                  onClick={clearImage}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
                  disabled={isAnalyzing}
                >
                  <FiXCircle size={20} />
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                ✅ Image ready for analysis • {selectedImage?.name}
              </p>
            </motion.div>
          )}

          {/* Input Controls */}
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Text Input */}
            <input
              type="text"
              placeholder={selectedImage ? "Add context (optional)..." : "Ask a question or upload an image..."}
              className="flex-1 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border-2 border-gray-300 text-black rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  selectedImage ? analyzeImage() : sendMessage();
                }
              }}
              disabled={isAnalyzing}
            />

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
              disabled={isAnalyzing}
            />

            {/* Upload Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => fileInputRef.current?.click()}
              disabled={isAnalyzing}
            >
              <FiUpload size={18} />
              <span className="hidden sm:inline text-sm">Upload</span>
            </motion.button>

            {/* Send/Analyze Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-3 sm:px-6 py-2 sm:py-3 rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base ${
                selectedImage
                  ? 'bg-gradient-to-r from-green-600 to-green-700 text-white'
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
              }`}
              onClick={selectedImage ? analyzeImage : sendMessage}
              disabled={isAnalyzing || (!newMessage.trim() && !selectedImage)}
            >
              {isAnalyzing ? (
                <>
                  <FiLoader className="animate-spin" size={18} />
                  <span className="hidden sm:inline">Analyzing...</span>
                </>
              ) : selectedImage ? (
                <>
                  <FiCheckCircle size={18} />
                  <span>Analyze</span>
                </>
              ) : (
                <>
                  <FiSend size={18} />
                  <span className="hidden sm:inline">Send</span>
                </>
              )}
            </motion.button>
          </div>

          {/* Helper Text */}
          <p className="text-xs text-gray-500 mt-2 text-center">
            💡 Tip: Upload clear images for better analysis • Max 10MB • 
          </p>
        </div>
      </motion.div>

      {/* Features Info */}
      <motion.div
        className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="bg-white rounded-xl p-4 shadow-md text-center">
          <FiAlertTriangle className="text-red-600 mx-auto mb-2" size={24} />
          <h3 className="font-semibold text-black text-sm sm:text-base mb-1">Disaster Detection</h3>
          <p className="text-xs  text-gray-600">Identify disaster types instantly</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-md text-center">
          <FiCheckCircle className="text-green-600 mx-auto mb-2" size={24} />
          <h3 className="font-semibold text-black  text-sm sm:text-base mb-1">Safety Guidance</h3>
          <p className="text-xs text-gray-600">Get actionable safety advice</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-md text-center">
          <FiCamera className="text-blue-600 mx-auto mb-2" size={24} />
          <h3 className="font-semibold text-black text-sm sm:text-base mb-1">Visual Analysis</h3>
          <p className="text-xs text-gray-600">AI-powered image recognition</p>
        </div>
      </motion.div>
    </motion.div>
  );
}
