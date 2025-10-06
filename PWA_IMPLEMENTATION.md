# Progressive Web App (PWA) Implementation

## Overview
RescueConnect has been transformed into a Progressive Web App (PWA), enabling offline functionality, app-like installation, and enhanced performance.

## Implementation Date
October 6, 2025

## What is a PWA?
A Progressive Web App is a web application that uses modern web capabilities to deliver an app-like experience to users. Key features include:
- **Offline Access**: Works without internet connection
- **Installable**: Can be installed on devices like native apps
- **Fast**: Cached resources load instantly
- **Reliable**: Works in low/no network conditions
- **Engaging**: Push notifications and home screen access

## Features Implemented

### 1. Service Worker (`public/sw.js`)
The service worker enables offline functionality and caching strategies.

**Caching Strategies:**
- **Precache**: Essential pages cached on install
  - Homepage (`/`)
  - Login (`/login`)
  - Signup (`/signup`)
  - User Dashboard (`/userdashboard`)
  - Volunteers Dashboard (`/volunteersdashboard`)
  - Maps (`/maps`)
  - Chat (`/chat`)
  - AI Chat (`/ai`)
  - Offline page (`/offline.html`)

- **Runtime Cache**: Dynamic content cached as accessed
  - API responses
  - Navigation requests
  - Images

- **Network First**: API calls try network first, fallback to cache
- **Cache First**: Images and static assets served from cache

**Cache Names:**
- `rescueconnect-v1` - Main precache
- `rescueconnect-runtime-v1` - Runtime cache
- `rescueconnect-images-v1` - Image cache

### 2. Web App Manifest (`public/manifest.json`)
Defines how the app appears when installed.

**Configuration:**
- **Name**: RescueConnect - Emergency Response Platform
- **Short Name**: RescueConnect
- **Start URL**: `/`
- **Display Mode**: `standalone` (full-screen app experience)
- **Theme Color**: `#2563eb` (blue)
- **Background Color**: `#ffffff` (white)
- **Orientation**: `portrait-primary`

**Icons Required:**
- 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512

**App Shortcuts:**
1. Request Help → `/userdashboard`
2. View Map → `/maps`
3. Live Chat → `/chat`

### 3. Offline Page (`public/offline.html`)
Custom offline experience when user tries to access uncached pages.

**Features:**
- Connection status indicator
- Auto-reload when back online
- List of offline-available features
- Attractive, user-friendly design

### 4. PWA Installer Component (`src/app/components/PWAInstaller.js`)
React component for PWA functionality.

**Features:**
- Install prompt for desktop/mobile
- Update notification when new version available
- Online/offline status banner
- Auto-registration of service worker
- Update handling with reload

### 5. Layout Updates (`src/app/layout.js`)
Enhanced metadata and PWA support.

**Added:**
- Manifest link
- Theme color meta tags
- Apple mobile web app meta tags
- PWAInstaller component

## Installation

### For Users

#### Desktop (Chrome/Edge)
1. Visit the website
2. Look for install button in address bar (⊕ icon)
3. Or click install prompt that appears
4. App will be added to desktop

#### Mobile (Android)
1. Visit the website in Chrome
2. Tap "Add to Home Screen" banner
3. Or tap menu (⋮) → "Install app"
4. App appears on home screen

#### Mobile (iOS)
1. Visit in Safari
2. Tap Share button (⬆)
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add"

### For Developers

#### Requirements
- HTTPS connection (or localhost for development)
- Valid manifest.json
- Service worker registered
- Icons in required sizes

#### Setup Steps
1. ✅ Service worker created (`public/sw.js`)
2. ✅ Manifest created (`public/manifest.json`)
3. ✅ Offline page created (`public/offline.html`)
4. ✅ PWA installer component added
5. ⚠️ **TODO**: Add actual icon images (currently placeholders)
6. ✅ Metadata configured in layout

## Offline Capabilities

### What Works Offline:
- ✅ Previously visited pages
- ✅ Cached map data
- ✅ Cached images
- ✅ Static content
- ✅ UI navigation
- ✅ Form drafts (stored locally)
- ✅ View cached requests

### What Requires Connection:
- ❌ API calls (new data)
- ❌ Real-time chat
- ❌ Live map updates
- ❌ Image uploads
- ❌ Authentication
- ❌ WebSocket connections

### Fallback Behavior:
- API failures return cached data if available
- New requests can be queued for sync when online
- Graceful degradation with user notifications

## Background Sync
Service worker supports background sync for offline requests.

**Implementation:**
```javascript
// When user submits request offline
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-requests') {
    event.waitUntil(syncOfflineRequests());
  }
});
```

## Push Notifications
Service worker is configured for push notifications.

**Features:**
- Emergency alerts
- Request updates
- Volunteer notifications
- Custom actions (View/Dismiss)

**Implementation:**
```javascript
self.addEventListener('push', (event) => {
  const data = event.data.json();
  self.registration.showNotification(title, options);
});
```

## Update Strategy

### Automatic Updates
1. Service worker detects new version
2. Installs new service worker in background
3. Shows "Update Available" notification
4. User clicks to reload and activate

### Manual Updates
Developers can force update by:
1. Incrementing cache version in `sw.js`
2. Users will see update prompt on next visit

## Testing PWA

### Chrome DevTools
1. Open DevTools (F12)
2. Go to "Application" tab
3. Check sections:
   - **Manifest**: Verify manifest.json
   - **Service Workers**: Check registration
   - **Cache Storage**: View cached files
   - **Offline**: Test offline mode

### Lighthouse Audit
1. Open DevTools
2. Go to "Lighthouse" tab
3. Select "Progressive Web App"
4. Click "Generate report"

**Target Scores:**
- PWA: 100/100
- Performance: 90+
- Accessibility: 90+
- Best Practices: 90+
- SEO: 90+

## Browser Support

| Browser | Install | Offline | Push |
|---------|---------|---------|------|
| Chrome (Desktop) | ✅ | ✅ | ✅ |
| Chrome (Android) | ✅ | ✅ | ✅ |
| Edge | ✅ | ✅ | ✅ |
| Safari (iOS) | ⚠️ | ✅ | ❌ |
| Firefox | ⚠️ | ✅ | ✅ |
| Samsung Internet | ✅ | ✅ | ✅ |

⚠️ = Limited support or different UX

## File Structure

```
public/
├── manifest.json          # PWA manifest
├── sw.js                  # Service worker
├── offline.html           # Offline fallback page
├── icon-72x72.png        # App icon (72x72)
├── icon-96x96.png        # App icon (96x96)
├── icon-128x128.png      # App icon (128x128)
├── icon-144x144.png      # App icon (144x144)
├── icon-152x152.png      # App icon (152x152)
├── icon-192x192.png      # App icon (192x192)
├── icon-384x384.png      # App icon (384x384)
└── icon-512x512.png      # App icon (512x512)

src/app/
├── layout.js             # Root layout with PWA metadata
└── components/
    └── PWAInstaller.js   # PWA installation component
```

## Creating App Icons

### Required Sizes
- 72x72 (Android, iOS)
- 96x96 (Android, iOS)
- 128x128 (Android, iOS)
- 144x144 (Android, iOS)
- 152x152 (iOS)
- 192x192 (Android standard)
- 384x384 (Android)
- 512x512 (Android splash screen)

### Tools to Create Icons
1. **Online Tools:**
   - [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator)
   - [RealFaviconGenerator](https://realfavicongenerator.net/)
   - [PWA Builder](https://www.pwabuilder.com/)

2. **Command Line:**
   ```bash
   npx @pwa/asset-generator [logo.svg] public/icons
   ```

3. **Design Requirements:**
   - Use transparent background for maskable icons
   - Include safe zone (10% padding)
   - High contrast for visibility
   - Recognizable at small sizes

## Security Considerations

### HTTPS Required
PWAs require HTTPS in production:
- Localhost works for development
- Use SSL certificate in production
- Service workers won't register on HTTP

### Permissions
Request user permission for:
- Push notifications
- Location access (already implemented)
- Background sync

### Data Privacy
- Cache sensitive data carefully
- Clear cache on logout
- Don't cache authentication tokens
- Use IndexedDB for secure storage

## Performance Optimization

### Cache Size Management
- Limit cache entries
- Remove old caches on activate
- Prioritize critical resources

### Network Strategy
- Use appropriate caching strategy per resource type
- Implement timeouts for network requests
- Provide offline fallbacks

### Load Time
- Precache critical resources
- Lazy load non-critical assets
- Optimize images before caching

## Debugging

### Common Issues

**Service Worker Not Registering:**
- Check HTTPS/localhost
- Verify file path to `sw.js`
- Check browser console for errors
- Clear browser cache

**Offline Not Working:**
- Check cache names match
- Verify fetch event listeners
- Test in DevTools offline mode
- Check network requests in DevTools

**Install Prompt Not Showing:**
- Verify manifest.json is valid
- Check all required fields present
- Ensure icons exist
- May not show if already installed

### Debug Commands

```javascript
// Check service worker status
navigator.serviceWorker.getRegistrations()
  .then(registrations => console.log(registrations));

// Unregister service worker
navigator.serviceWorker.getRegistrations()
  .then(registrations => {
    registrations.forEach(reg => reg.unregister());
  });

// Check cache contents
caches.keys().then(keys => console.log(keys));
caches.open('rescueconnect-v1')
  .then(cache => cache.keys())
  .then(keys => console.log(keys));

// Clear all caches
caches.keys().then(keys => {
  keys.forEach(key => caches.delete(key));
});
```

## Deployment Checklist

- [ ] Generate all icon sizes (72px to 512px)
- [ ] Update icon paths in manifest.json
- [ ] Test service worker registration
- [ ] Test offline functionality
- [ ] Test install prompt on mobile/desktop
- [ ] Run Lighthouse PWA audit
- [ ] Verify HTTPS certificate
- [ ] Test on multiple browsers
- [ ] Test push notifications (if implemented)
- [ ] Update cache version for deployment
- [ ] Document for users how to install

## Future Enhancements

### Planned Features:
1. **IndexedDB Integration**
   - Store offline requests
   - Sync when connection restored

2. **Advanced Background Sync**
   - Queue failed requests
   - Retry with exponential backoff

3. **Push Notification Server**
   - Real-time emergency alerts
   - Volunteer assignment notifications

4. **Periodic Background Sync**
   - Update cached data periodically
   - Refresh emergency information

5. **Share Target API**
   - Share content to RescueConnect
   - Quick emergency reporting

6. **Advanced Offline Features**
   - Offline maps with vector tiles
   - Offline chat with local storage
   - Conflict resolution for sync

## Resources

### Documentation
- [MDN: Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [web.dev: PWA](https://web.dev/progressive-web-apps/)
- [Google: Service Worker Guide](https://developers.google.com/web/fundamentals/primers/service-workers)

### Tools
- [Workbox](https://developers.google.com/web/tools/workbox) - PWA libraries
- [PWA Builder](https://www.pwabuilder.com/) - PWA generator
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - PWA auditing

### Community
- [PWA Slack](https://bit.ly/join-pwa-slack)
- [Stack Overflow: PWA Tag](https://stackoverflow.com/questions/tagged/progressive-web-apps)

## Support

For issues or questions about PWA implementation:
1. Check browser console for errors
2. Review service worker status in DevTools
3. Test with Lighthouse PWA audit
4. Refer to this documentation

## Version History

### v1.0.0 (October 6, 2025)
- Initial PWA implementation
- Service worker with offline support
- Install prompts and update notifications
- Manifest configuration
- Offline page
- PWA metadata in layout

## Maintenance

### Regular Tasks:
1. Update service worker version on changes
2. Test offline functionality after updates
3. Monitor cache sizes
4. Update manifest when adding features
5. Regenerate icons if logo changes
6. Test on new browser versions

### Update Process:
1. Modify service worker
2. Increment `CACHE_NAME` version
3. Test in development
4. Deploy to production
5. Users see update notification
6. Users reload to get new version

---

**Status**: ✅ PWA Implemented - Ready for icon generation and testing

**Next Steps**:
1. Generate actual icon files (replace placeholders)
2. Test installation on various devices
3. Run Lighthouse audit
4. Deploy to HTTPS production server
5. Test push notifications (when backend ready)
