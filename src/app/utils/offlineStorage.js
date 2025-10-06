// IndexedDB helper for offline storage
const DB_NAME = 'rescueconnect-db';
const DB_VERSION = 1;
const STORE_NAME = 'offline-requests';

class OfflineStorage {
  constructor() {
    this.db = null;
  }

  // Initialize database
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = db.createObjectStore(STORE_NAME, { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          
          // Create indexes
          objectStore.createIndex('timestamp', 'timestamp', { unique: false });
          objectStore.createIndex('synced', 'synced', { unique: false });
          objectStore.createIndex('type', 'type', { unique: false });
        }
      };
    });
  }

  // Save request offline
  async saveRequest(requestData) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      const request = store.add({
        ...requestData,
        timestamp: Date.now(),
        synced: false,
        retryCount: 0
      });

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Get all unsynced requests
  async getUnsyncedRequests() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        // Filter for unsynced requests
        const allRequests = request.result || [];
        const unsyncedRequests = allRequests.filter(req => req.synced === false);
        resolve(unsyncedRequests);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Mark request as synced
  async markAsSynced(id) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        const data = request.result;
        if (data) {
          data.synced = true;
          data.syncedAt = Date.now();
          const updateRequest = store.put(data);
          updateRequest.onsuccess = () => resolve(true);
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          resolve(false);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  // Delete synced request
  async deleteRequest(id) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  // Increment retry count
  async incrementRetryCount(id) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        const data = request.result;
        if (data) {
          data.retryCount = (data.retryCount || 0) + 1;
          data.lastRetry = Date.now();
          const updateRequest = store.put(data);
          updateRequest.onsuccess = () => resolve(data.retryCount);
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          resolve(0);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  // Get count of unsynced requests
  async getUnsyncedCount() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        // Count unsynced requests
        const allRequests = request.result || [];
        const count = allRequests.filter(req => req.synced === false).length;
        resolve(count);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Clear all synced requests (cleanup)
  async clearSyncedRequests() {
    if (!this.db) await this.init();

    const synced = await this.getSyncedRequests();
    const promises = synced.map(req => this.deleteRequest(req.id));
    return Promise.all(promises);
  }

  // Get synced requests
  async getSyncedRequests() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        // Filter for synced requests
        const allRequests = request.result || [];
        const syncedRequests = allRequests.filter(req => req.synced === true);
        resolve(syncedRequests);
      };
      request.onerror = () => reject(request.error);
    });
  }
}

// Create singleton instance
const offlineStorage = new OfflineStorage();

// Sync manager for handling background sync
class SyncManager {
  constructor(storage) {
    this.storage = storage;
    this.isSyncing = false;
    this.syncCallbacks = [];
  }

  // Register callback for sync events
  onSync(callback) {
    this.syncCallbacks.push(callback);
  }

  // Notify all listeners
  notifyListeners(event, data) {
    this.syncCallbacks.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Error in sync callback:', error);
      }
    });
  }

  // Sync all pending requests
  async syncAll() {
    if (this.isSyncing) {
      console.log('Sync already in progress');
      return;
    }

    if (!navigator.onLine) {
      console.log('Cannot sync: offline');
      return;
    }

    this.isSyncing = true;
    this.notifyListeners('sync-start', null);

    try {
      const requests = await this.storage.getUnsyncedRequests();
      console.log(`Syncing ${requests.length} offline requests`);

      if (requests.length === 0) {
        this.notifyListeners('sync-complete', { synced: 0, failed: 0 });
        this.isSyncing = false;
        return;
      }

      let synced = 0;
      let failed = 0;

      for (const request of requests) {
        try {
          await this.syncRequest(request);
          await this.storage.markAsSynced(request.id);
          synced++;
          this.notifyListeners('sync-progress', { synced, failed, total: requests.length });
        } catch (error) {
          console.error('Failed to sync request:', error);
          await this.storage.incrementRetryCount(request.id);
          failed++;
          this.notifyListeners('sync-progress', { synced, failed, total: requests.length });
        }
      }

      // Clean up synced requests after 24 hours
      setTimeout(() => {
        this.storage.clearSyncedRequests();
      }, 24 * 60 * 60 * 1000);

      this.notifyListeners('sync-complete', { synced, failed });
      
    } catch (error) {
      console.error('Sync error:', error);
      this.notifyListeners('sync-error', error);
    } finally {
      this.isSyncing = false;
    }
  }

  // Sync individual request
  async syncRequest(request) {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No authentication token found. Please log in again.');
    }
    
    // Prepare form data
    const formData = new FormData();
    formData.append('name', request.name);
    formData.append('contact', request.contact);
    formData.append('type', request.type);
    formData.append('urgency', request.urgency);
    formData.append('description', request.description);
    formData.append('latitude', request.latitude);
    formData.append('longitude', request.longitude);

    // Handle image if it exists
    if (request.imageData) {
      try {
        // Convert base64 back to blob
        const blob = await fetch(request.imageData).then(r => r.blob());
        formData.append('image', blob, request.imageName || 'image.jpg');
      } catch (error) {
        console.warn('⚠️ Failed to process image, syncing without it:', error.message);
        // Continue without image
      }
    }

    const response = await fetch('/api/staff/requests', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      // Try to get error message from response
      let errorMessage = `Failed to sync request (${response.status} ${response.statusText})`;
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const error = await response.json();
          errorMessage = error.error || error.message || errorMessage;
        } else {
          const text = await response.text();
          if (text) errorMessage = text;
        }
      } catch (parseError) {
        // Use default error message if parsing fails
        console.warn('⚠️ Could not parse error response:', parseError.message);
      }
      throw new Error(errorMessage);
    }

    // Try to parse JSON response, but don't fail if it's empty
    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        // Non-JSON response (like plain text success message)
        const text = await response.text();
        return { message: text || 'Request synced successfully' };
      }
    } catch (jsonError) {
      // If JSON parsing fails, just return success
      console.log('✅ Request synced (non-JSON response)');
      return { message: 'Request synced successfully' };
    }
  }
}

// Create singleton instance
const syncManager = new SyncManager(offlineStorage);

// Auto-sync when online
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('Connection restored, syncing offline requests...');
    syncManager.syncAll();
  });
}

export { offlineStorage, syncManager };
export default offlineStorage;
