'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheckCircle, FiAlertCircle, FiLoader, FiUploadCloud, FiX } from 'react-icons/fi';
import { offlineStorage, syncManager } from '../utils/offlineStorage';

export default function SyncNotification() {
  const [notifications, setNotifications] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [unsyncedCount, setUnsyncedCount] = useState(0);

  useEffect(() => {
    // Initialize and get unsynced count
    const init = async () => {
      try {
        await offlineStorage.init();
        const count = await offlineStorage.getUnsyncedCount();
        setUnsyncedCount(count);
      } catch (error) {
        console.warn('⚠️ Offline storage unavailable:', error.message);
        // Set count to 0 if storage fails
        setUnsyncedCount(0);
      }
    };

    init();

    // Listen for sync events
    const handleSyncEvent = (event, data) => {
      switch (event) {
        case 'sync-start':
          setIsSyncing(true);
          addNotification({
            type: 'info',
            title: 'Syncing Offline Requests',
            message: 'Uploading saved requests to server...',
            icon: <FiLoader className="animate-spin" />,
            duration: null, // Don't auto-hide
            id: 'sync-progress'
          });
          break;

        case 'sync-progress':
          updateNotification('sync-progress', {
            message: `Synced ${data.synced} of ${data.total} requests...`
          });
          break;

        case 'sync-complete':
          setIsSyncing(false);
          removeNotification('sync-progress');
          
          if (data.synced > 0) {
            addNotification({
              type: 'success',
              title: 'Sync Complete!',
              message: `Successfully uploaded ${data.synced} offline request${data.synced > 1 ? 's' : ''}`,
              icon: <FiCheckCircle />,
              duration: 5000
            });
          }

          if (data.failed > 0) {
            addNotification({
              type: 'error',
              title: 'Some Requests Failed',
              message: `${data.failed} request${data.failed > 1 ? 's' : ''} could not be synced. Will retry later.`,
              icon: <FiAlertCircle />,
              duration: 7000
            });
          }

          // Update count
          offlineStorage.getUnsyncedCount().then(setUnsyncedCount);
          break;

        case 'sync-error':
          setIsSyncing(false);
          removeNotification('sync-progress');
          addNotification({
            type: 'error',
            title: 'Sync Failed',
            message: 'Could not sync offline requests. Will retry when connection is stable.',
            icon: <FiAlertCircle />,
            duration: 5000
          });
          break;
      }
    };

    syncManager.onSync(handleSyncEvent);

    // Check for unsynced requests periodically
    const interval = setInterval(async () => {
      try {
        const count = await offlineStorage.getUnsyncedCount();
        setUnsyncedCount(count);
      } catch (error) {
        // Silently fail - storage might not be available
        console.warn('⚠️ Could not check unsynced count:', error.message);
      }
    }, 10000); // Check every 10 seconds

    return () => {
      clearInterval(interval);
    };
  }, []);

  const addNotification = (notification) => {
    const id = notification.id || Date.now().toString();
    const newNotification = { ...notification, id };

    setNotifications(prev => {
      // Remove existing notification with same id
      const filtered = prev.filter(n => n.id !== id);
      return [...filtered, newNotification];
    });

    // Auto-remove after duration
    if (notification.duration) {
      setTimeout(() => {
        removeNotification(id);
      }, notification.duration);
    }
  };

  const updateNotification = (id, updates) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, ...updates } : n))
    );
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleManualSync = () => {
    if (!isSyncing && navigator.onLine) {
      syncManager.syncAll();
    }
  };

  return (
    <>
      {/* Unsynced Count Badge */}
      <AnimatePresence>
        {unsyncedCount > 0 && !isSyncing && (
          <motion.div
            className="fixed bottom-20 right-4 z-[9998]"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <button
              onClick={handleManualSync}
              className="bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-lg px-4 py-3 flex items-center gap-2 transition-all"
              title="Click to sync now"
            >
              <FiUploadCloud size={20} />
              <span className="font-semibold">{unsyncedCount} pending</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notifications */}
      <div className="fixed top-20 right-4 z-[9999] flex flex-col gap-2 max-w-md">
        <AnimatePresence>
          {notifications.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              className={`rounded-lg shadow-2xl p-4 ${
                notification.type === 'success'
                  ? 'bg-green-500'
                  : notification.type === 'error'
                  ? 'bg-red-500'
                  : 'bg-blue-500'
              } text-white`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {notification.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm mb-1">{notification.title}</h4>
                  <p className="text-sm opacity-90">{notification.message}</p>
                </div>

                {notification.duration && (
                  <button
                    onClick={() => removeNotification(notification.id)}
                    className="flex-shrink-0 hover:bg-white/20 rounded p-1 transition-colors"
                  >
                    <FiX size={18} />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}

// Export function to show notification from outside
export const showOfflineNotification = (message, type = 'info') => {
  // This will be handled by the component through custom events
  const event = new CustomEvent('offline-notification', {
    detail: { message, type }
  });
  window.dispatchEvent(event);
};
