# Google Translate Not Working - Troubleshooting Guide

## Issue: Translation Not Happening

If the language switcher appears but text is not translating, follow these steps:

### Step 1: Check Browser Console

1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for these messages:
   - ✅ "Google Translate initialized" - Good!
   - ✅ "Attempting to change language to: hi" - Good!
   - ✅ "Found select element, changing to: hi" - Good!
   - ❌ "Failed to load Google Translate script" - Problem!
   - ❌ "Select element not found" - Problem!

### Step 2: Verify Script Loading

Check if Google Translate script is loaded:

```javascript
// In browser console, run:
console.log(window.google?.translate ? 'Loaded ✓' : 'Not loaded ✗');
```

**If NOT loaded:**
- Check your internet connection
- Check if any ad blocker is blocking Google scripts
- Disable browser extensions temporarily

### Step 3: Check for Conflicting CSS

Some CSS might hide translated elements. Add this to your `globals.css`:

```css
/* Remove any notranslate classes */
.notranslate {
  /* Don't set display: none or visibility: hidden */
}

/* Ensure translated content is visible */
body {
  top: 0 !important;
  position: relative !important;
}
```

### Step 4: Manual Test

Try manually triggering translation:

```javascript
// In browser console:
const select = document.querySelector('.goog-te-combo');
if (select) {
  console.log('Select found:', select);
  select.value = 'hi'; // Change to Hindi
  select.dispatchEvent(new Event('change', { bubbles: true }));
} else {
  console.log('Select NOT found - Google Translate not initialized');
}
```

### Step 5: Check Element Visibility

The Google Translate element should exist in the DOM:

```javascript
// Check if element exists:
const element = document.getElementById('google_translate_element');
console.log('Element exists:', !!element);
console.log('Has select:', !!document.querySelector('.goog-te-combo'));
```

## Common Issues & Fixes

### Issue 1: "Select element not found"

**Cause:** Google Translate script not loaded yet

**Fix:** Add a retry mechanism (already implemented in the code)

### Issue 2: Script loads but no translation

**Cause:** Page content might have `translate="no"` attribute

**Fix:** Check your HTML for:
```html
<!-- Remove these if present -->
<html translate="no">
<meta name="google" content="notranslate">
<div class="notranslate">
```

### Issue 3: Translation happens but reverts immediately

**Cause:** React re-rendering might be resetting the page

**Fix:** Avoid full page refreshes when language changes

### Issue 4: Some text not translating

**Cause:** Dynamic content loaded after translation

**Fix:** Retrigger translation after loading new content:
```javascript
if (window.google?.translate) {
  const select = document.querySelector('.goog-te-combo');
  if (select && select.value !== 'en') {
    // Trigger translation again
    select.dispatchEvent(new Event('change', { bubbles: true }));
  }
}
```

## Testing Steps

### Test 1: Basic Translation
1. Open your site
2. Wait 2-3 seconds for Google Translate to load
3. Click language switcher (top-right)
4. Select "Hindi" (हिंदी)
5. Wait 2-3 seconds
6. **Check if text changes to Hindi**

### Test 2: Check Specific Element
1. Right-click on any text
2. Inspect element
3. Look for `<font>` tag wrapping - this means it's translated
4. Check for `lang="hi"` attribute

Example of translated text:
```html
<!-- Before translation -->
<p>Welcome to our site</p>

<!-- After translation to Hindi -->
<p><font style="vertical-align: inherit;">
  <font style="vertical-align: inherit;">हमारी साइट पर आपका स्वागत है</font>
</font></p>
```

### Test 3: Console Logs
Enable debug mode by adding to GoogleTranslate.js:

```javascript
useEffect(() => {
  // Add this at the start
  console.log('GoogleTranslate component mounted');
  
  // After initialization
  console.log('Translate initialized, loaded:', isLoaded);
}, [isLoaded]);
```

## Advanced Debugging

### Check Google Translate Status

```javascript
// Run in browser console
function checkGoogleTranslate() {
  console.log('=== Google Translate Debug ===');
  console.log('1. Script loaded:', !!window.google?.translate);
  console.log('2. Element exists:', !!document.getElementById('google_translate_element'));
  console.log('3. Select exists:', !!document.querySelector('.goog-te-combo'));
  console.log('4. Current value:', document.querySelector('.goog-te-combo')?.value);
  console.log('5. All options:', Array.from(document.querySelectorAll('.goog-te-combo option')).map(o => o.value));
  console.log('6. Translate frame:', !!document.querySelector('.goog-te-menu-frame'));
  console.log('7. Banner:', !!document.querySelector('.goog-te-banner-frame'));
}

checkGoogleTranslate();
```

### Force Translation

```javascript
// Force translate to specific language
function forceTranslate(langCode) {
  const select = document.querySelector('.goog-te-combo');
  if (!select) {
    console.error('Google Translate not initialized');
    return;
  }
  
  // Set language
  select.value = langCode;
  
  // Trigger change event
  const event = new Event('change', { 
    bubbles: true,
    cancelable: true 
  });
  select.dispatchEvent(event);
  
  console.log('Translation triggered to:', langCode);
  
  // Check after 2 seconds
  setTimeout(() => {
    const hasFont = document.querySelector('font');
    console.log('Translation applied:', !!hasFont);
  }, 2000);
}

// Usage:
forceTranslate('hi'); // Hindi
forceTranslate('mr'); // Marathi
forceTranslate('en'); // Back to English
```

## Quick Fix Script

If translation isn't working, try this quick fix:

```javascript
// Copy-paste this in browser console
(function() {
  console.log('🔧 Quick Fix Script Running...');
  
  // Remove notranslate classes
  document.querySelectorAll('.notranslate').forEach(el => {
    el.classList.remove('notranslate');
    console.log('Removed notranslate from:', el.tagName);
  });
  
  // Remove translate="no" attributes
  document.querySelectorAll('[translate="no"]').forEach(el => {
    el.removeAttribute('translate');
    console.log('Removed translate=no from:', el.tagName);
  });
  
  // Reload Google Translate
  const select = document.querySelector('.goog-te-combo');
  if (select) {
    console.log('✅ Google Translate found');
    console.log('Available languages:', 
      Array.from(select.options).map(o => o.value).join(', ')
    );
    
    // Try translating
    select.value = 'hi';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    console.log('🌐 Translation triggered');
    
    setTimeout(() => {
      console.log('Check if translated:', !!document.querySelector('font'));
    }, 3000);
  } else {
    console.log('❌ Google Translate NOT found - Script may not be loaded');
    
    // Try loading script
    window.googleTranslateElementInit = function() {
      new window.google.translate.TranslateElement(
        {
          pageLanguage: 'en',
          includedLanguages: 'en,hi,mr,te,ta,kn,gu,bn,ml,pa,ur'
        },
        'google_translate_element'
      );
      console.log('✅ Google Translate initialized!');
    };
    
    const script = document.createElement('script');
    script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    document.head.appendChild(script);
    console.log('📥 Loading Google Translate script...');
  }
})();
```

## Still Not Working?

If none of the above works:

1. **Clear browser cache** - Hard refresh (Ctrl+Shift+R)
2. **Try different browser** - Test in Chrome, Firefox, Edge
3. **Check network tab** - Verify `translate.google.com` is loading
4. **Disable extensions** - Ad blockers can block Google services
5. **Check console errors** - Look for any JavaScript errors
6. **Test on localhost** - Google Translate works on localhost

## Expected Behavior

### ✅ Working Correctly:
- Language button appears top-right
- Dropdown shows 11 languages
- Clicking a language changes text after 2-3 seconds
- Console shows "Google Translate initialized"
- Console shows "Found select element, changing to: XX"
- Inspecting text shows `<font>` tags wrapping content

### ❌ Not Working:
- Button appears but clicking language does nothing
- Text doesn't change after selecting language
- Console shows "Select element not found"
- No `<font>` tags in inspected elements
- Page refreshes instead of translating

## Contact

If you're still having issues, provide these details:
1. Browser and version
2. Console error messages
3. Output of `checkGoogleTranslate()` function
4. Screenshot of Network tab showing translate.google.com requests
