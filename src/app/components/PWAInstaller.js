'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiDownload, FiX, FiWifi, FiWifiOff } from 'react-icons/fi';

export default function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [showOfflineBanner, setShowOfflineBanner] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration);

          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            newWorker.addEventListener('statechange', () => {
              if (
                newWorker.state === 'installed' &&
                navigator.serviceWorker.controller
              ) {
                setUpdateAvailable(true);
              }
            });
          });
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
          setUpdateAvailable(true);
        }
      });
    }

    // PWA install prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Check if already installed
      if (!window.matchMedia('(display-mode: standalone)').matches) {
        setShowInstallPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Online/Offline detection
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineBanner(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial online status
    setIsOnline(navigator.onLine);
    if (!navigator.onLine) {
      setShowOfflineBanner(true);
    }

    // Check if installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      console.log('App is running as PWA');
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    console.log(`User response to install prompt: ${outcome}`);
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }
    
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleUpdateClick = () => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };

  return (
    <>
      {/* Install App Prompt */}
      <AnimatePresence>
        {showInstallPrompt && (
          <motion.div
            className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-[9999]"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
          >
            <div className="bg-gradient-to-r from-blue-600 to-teal-600 rounded-2xl shadow-2xl p-4 text-white">
              <button
                onClick={() => setShowInstallPrompt(false)}
                className="absolute top-2 right-2 p-1 hover:bg-white/20 rounded-full transition-colors"
                aria-label="Close"
              >
                <FiX size={20} />
              </button>
              
              <div className="flex items-start gap-3">
                <div className="bg-white/20 p-3 rounded-full">
                  <FiDownload size={24} />
                </div>
                
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-1">Install RescueConnect</h3>
                  <p className="text-sm text-blue-100 mb-3">
                    Install our app for offline access and faster performance!
                  </p>
                  
                  <button
                    onClick={handleInstallClick}
                    className="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors w-full"
                  >
                    Install App
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Update Available Notification */}
      <AnimatePresence>
        {updateAvailable && (
          <motion.div
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] max-w-md"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
          >
            <div className="bg-white rounded-lg shadow-2xl p-4 border-2 border-blue-500">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-full">
                  <FiDownload size={20} className="text-blue-600" />
                </div>
                
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900">Update Available</h4>
                  <p className="text-sm text-gray-600">
                    A new version is ready to install
                  </p>
                </div>
                
                <button
                  onClick={handleUpdateClick}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm"
                >
                  Update
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Offline Banner */}
      <AnimatePresence>
        {showOfflineBanner && (
          <motion.div
            className="fixed top-0 left-0 right-0 z-[9998]"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
          >
            <div className="bg-yellow-500 text-white py-2 px-4 text-center">
              <div className="flex items-center justify-center gap-2">
                <FiWifiOff size={18} />
                <span className="font-semibold">You're offline</span>
                <span className="text-sm">- Some features may be limited</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Online Banner (brief) */}
      <AnimatePresence>
        {isOnline && !showOfflineBanner && (
          <motion.div
            className="fixed top-0 left-0 right-0 z-[9998]"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            onAnimationComplete={() => {
              setTimeout(() => setIsOnline(true), 3000);
            }}
          >
            {/* This will auto-hide after animation */}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
