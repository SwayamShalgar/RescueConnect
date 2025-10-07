'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { FiUser, FiLock, FiMail, FiPhone, FiAlertCircle, FiMapPin } from 'react-icons/fi';

// Dynamically import GoogleTranslate with SSR disabled
const GoogleTranslate = dynamic(() => import('../components/GoogleTranslate'), {
  ssr: false,
});

export default function LoginPage() {
  const router = useRouter();
  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginMethod, setLoginMethod] = useState('email'); // 'email' or 'phone'
  const [currentDateTime, setCurrentDateTime] = useState(null);
  const [isMounted, setIsMounted] = useState(false);
  const [locationStatus, setLocationStatus] = useState('');
  const [locationFetched, setLocationFetched] = useState(false);

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return 'Email is required';
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return '';
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^\+?\d{1,4}[-.\s]?\(?\d{1,3}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}$/;
    if (!phone) return 'Phone number is required';
    if (!phoneRegex.test(phone)) return 'Please enter a valid phone number (e.g., +1234567890 or (123) 456-7890)';
    return '';
  };

  const validatePassword = (password) => {
    if (!password) return 'Password is required';
    return '';
  };

  // Update current date and time every second (client-side only)
  useEffect(() => {
    setIsMounted(true);
    setCurrentDateTime(new Date()); // Set initial date on mount
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Manual location fetch function
  const handleFetchLocation = async () => {
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation is not supported by your browser');
      return;
    }

    setLocationStatus('Fetching location...');
    setLocationFetched(false);

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      
      setLocationStatus(`✓ Location detected: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
      setLocationFetched(true);
      console.log('Location manually fetched:', latitude, longitude);
    } catch (geoError) {
      setLocationStatus(`✗ Failed to get location: ${geoError.message}`);
      setLocationFetched(false);
    }
  };

  // Auto-request location when component mounts
  useEffect(() => {
    const requestLocation = async () => {
      if (navigator.geolocation) {
        try {
          setLocationStatus('📍 Requesting your location...');
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0
            });
          });
          
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setLocation({ latitude: lat, longitude: lng });
          setLocationStatus(`✓ Location detected: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
          console.log('Location automatically captured:', lat, lng);
        } catch (error) {
          console.warn('Auto-location failed:', error.message);
          setLocationStatus('⚠️ Location access denied. Click "Get Current Location" to enable.');
        }
      } else {
        setLocationStatus('⚠️ Geolocation not supported by browser');
      }
    };
    
    requestLocation();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Validate contact based on login method
    if (loginMethod === 'email') {
      const emailError = validateEmail(contact);
      if (emailError) {
        setError(emailError);
        setIsLoading(false);
        return;
      }
    } else {
      const phoneError = validatePhone(contact);
      if (phoneError) {
        setError(phoneError);
        setIsLoading(false);
        return;
      }
    }

    // Validate password
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      setIsLoading(false);
      return;
    }

    try {
      // Use stored location or try to get it again
      let latitude = location?.latitude || null;
      let longitude = location?.longitude || null;
      
      if (!latitude || !longitude) {
        if (navigator.geolocation) {
          try {
            const position = await new Promise((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
              });
            });
            
            latitude = position.coords.latitude;
            longitude = position.coords.longitude;
            console.log('Location captured on login:', latitude, longitude);
          } catch (geoError) {
            console.warn('Could not get location:', geoError.message);
            // Continue with login even if location fails
          }
        }
      } else {
        console.log('Using pre-captured location:', latitude, longitude);
      }

      const res = await fetch('/api/staff/login', {
        method: 'POST',
        body: JSON.stringify({ contact, password, latitude, longitude }),
        headers: { 'Content-Type': 'application/json' }
      });

      const text = await res.text();
      console.log("Raw response from server:", text);

      let data;
      try {
        data = JSON.parse(text);
      } catch (jsonErr) {
        console.error("Failed to parse response as JSON:", jsonErr);
        throw new Error("Server did not return valid JSON. See console for raw response.");
      }

      if (!res.ok) throw new Error(data.message || 'Login failed');

      // Store the JWT token in localStorage
      if (data.token) {
        localStorage.setItem('token', data.token);
        console.log('Token stored successfully');
      }

      router.push('/volunteersdashboard');
    } catch (err) {
      console.error("Frontend error:", err);
      setError(err.message || 'Invalid credentials. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-teal-100 p-4">
      {/* Language Selector - Top Right */}
      <div className="fixed top-4 right-4 z-50">
        {isMounted && <GoogleTranslate />}
      </div>

      {/* Decorative elements */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-20 left-10 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/3 w-60 h-60 bg-cyan-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <motion.div 
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-10">
          <motion.div
            className="mx-auto bg-blue-600 w-16 h-16 rounded-xl flex items-center justify-center shadow-lg"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <FiUser className="h-8 w-8 text-white" />
          </motion.div>
          <motion.h1 
            className="text-3xl font-bold mt-4 text-gray-800"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            Welcome Back
          </motion.h1>
          <motion.p 
            className="text-gray-600 mt-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            Sign in to your Disaster Response account{isMounted && currentDateTime && ` as of ${currentDateTime.toLocaleTimeString('en-IN', { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: true 
            })} IST on ${currentDateTime.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}`}.
          </motion.p>
        </div>

        <motion.div 
          className="bg-white rounded-2xl shadow-xl overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          {/* Tabs for login method */}
          <div className="flex border-b border-gray-200">
            <button
              className={`flex-1 py-4 font-medium text-center transition-colors ${
                loginMethod === 'email' 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setLoginMethod('email')}
            >
              <div className="flex items-center justify-center">
                <FiMail className="mr-2" />
                Email
              </div>
            </button>
            <button
              className={`flex-1 py-4 font-medium text-center transition-colors ${
                loginMethod === 'phone' 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setLoginMethod('phone')}
            >
              <div className="flex items-center justify-center">
                <FiPhone className="mr-2" />
                Phone
              </div>
            </button>
          </div>

          <div className="p-6 sm:p-8">
            <form onSubmit={handleLogin} className="flex flex-col gap-5">
              {loginMethod === 'email' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiMail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      placeholder="name@example.com"
                      className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiPhone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <a href="#" className="text-sm text-blue-600 hover:underline">
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Location Status */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-blue-900 mb-1 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Location Sharing
                    </h3>
                    <p className="text-xs text-blue-700">
                      {locationStatus || 'Share your location to appear on the volunteer map'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleFetchLocation}
                  className={`w-full py-2 px-4 rounded-lg font-medium transition-all flex items-center justify-center ${
                    locationFetched
                      ? 'bg-green-500 text-white hover:bg-green-600'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  {locationFetched ? 'Location Ready' : 'Get Current Location'}
                </button>
              </div>

              {error && (
                <motion.div 
                  className="flex items-center p-3 bg-red-50 text-red-700 rounded-lg border border-red-200"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <FiAlertCircle className="h-5 w-5 mr-2" />
                  <span>{error}</span>
                </motion.div>
              )}

              <motion.button
                type="submit"
                className={`w-full py-3.5 px-4 rounded-xl font-medium text-white shadow-md transition-all ${
                  isLoading 
                    ? 'bg-blue-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 hover:shadow-lg'
                }`}
                whileHover={!isLoading ? { scale: 1.02 } : {}}
                whileTap={!isLoading ? { scale: 0.98 } : {}}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </div>
                ) : (
                  'Sign In'
                )}
              </motion.button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>

              {/* <div className="mt-6 grid grid-cols-3 gap-3">
                <button className="w-full flex items-center justify-center py-2.5 px-4 border border-gray-300 rounded-xl hover:bg-gray-50 transition">
                  <div className="h-5 w-5">
                    <svg className="text-gray-700" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z"/>
                    </svg>
                  </div>
                </button>
                <button className="w-full flex items-center justify-center py-2.5 px-4 border border-gray-300 rounded-xl hover:bg-gray-50 transition">
                  <div className="h-5 w-5">
                    <svg className="text-gray-700" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.675 0H1.325C.593 0 0 .593 0 1.325v21.351C0 23.407.593 24 1.325 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116c.73 0 1.323-.593 1.323-1.325V1.325C24 .593 23.407 0 22.675 0z"/>
                    </svg>
                  </div>
                </button>
                <button className="w-full flex items-center justify-center py-2.5 px-4 border border-gray-300 rounded-xl hover:bg-gray-50 transition">
                  <div className="h-5 w-5">
                    <svg className="text-gray-700" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.373 0 0 5.373 0 12c0 5.302 3.438 9.8 8.205 11.385.6.113.82-.26.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.745.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.807 1.305 3.495.998.108-.775.42-1.305.763-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.312.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.908 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.605-.015 2.905-.015 3.3 0 .315.21.69.825.57C20.565 21.795 24 17.298 24 12c0-6.627-5.373-12-12-12z"/>
                    </svg>
                  </div>
                </button>
              </div> */}
            </div>
          </div>

          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <p className="text-sm text-center text-gray-600">
              Don't have an account?{' '}
              <a href="/signup" className="font-medium text-blue-600 hover:text-blue-500 hover:underline">
                Sign up
              </a>
            </p>
          </div>
        </motion.div>

        <motion.div 
          className="mt-8 text-center text-sm text-gray-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <p>© {new Date().getFullYear()} Disaster Crisis Response Platform. All rights reserved.</p>
        </motion.div>
      </motion.div>
    </div>
  );
}