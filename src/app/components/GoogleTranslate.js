// Google Translate Widget Component
'use client';

import { useEffect, useState } from 'react';
import { FiGlobe } from 'react-icons/fi';

export default function GoogleTranslate() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [elementId] = useState(() => `google_translate_element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  
  // Detect current language from cookie
  const getCurrentLangFromCookie = () => {
    if (typeof window === 'undefined') return 'en';
    
    const cookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('googtrans='));
    
    if (cookie) {
      const value = cookie.split('=')[1];
      const match = value.match(/\/en\/([a-z]{2})/);
      if (match && match[1]) {
        return match[1];
      }
    }
    return 'en';
  };
  
  const [currentLang, setCurrentLang] = useState(getCurrentLangFromCookie());

  useEffect(() => {
    // Check if Google Translate is already fully initialized globally
    if (window.googleTranslateFullyInitialized) {
      console.log('Google Translate already fully initialized globally');
      setIsLoaded(true);
      return;
    }
    
    // Prevent multiple script additions
    if (window.googleTranslateInitializing) {
      console.log('Google Translate already initializing');
      return;
    }
    
    window.googleTranslateInitializing = true;

    // Initialize Google Translate
    window.googleTranslateElementInit = () => {
      // Find the first available element
      const element = document.querySelector('[id^="google_translate_element"]');
      if (!element) {
        console.error('Google Translate container element not found');
        return;
      }

      if (window.google && window.google.translate && window.google.translate.TranslateElement) {
        try {
          console.log('✅ Initializing Google Translate...');
          
          // Only initialize once globally
          if (!window.googleTranslateInstance) {
            window.googleTranslateInstance = new window.google.translate.TranslateElement(
              {
                pageLanguage: 'en',
                includedLanguages: 'en,hi,mr,te,ta,kn,gu,bn,ml,pa,ur',
                layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
                autoDisplay: false
              },
              element.id
            );
          }
          
          console.log('✅ Google Translate initialized');
          window.googleTranslateFullyInitialized = true;
          
          // Wait for the select element with retry
          let attempts = 0;
          const maxAttempts = 20;
          
          const checkSelect = () => {
            attempts++;
            const select = document.querySelector('.goog-te-combo');
            
            if (select) {
              console.log('✅ Google Translate select found');
              console.log('📋 Available languages:', Array.from(select.options).map(o => o.value).filter(v => v));
              setIsLoaded(true);
            } else if (attempts < maxAttempts) {
              console.log(`⏳ Waiting for select... (${attempts}/${maxAttempts})`);
              setTimeout(checkSelect, 200);
            } else {
              console.warn('⚠️ Select element not found after waiting. Translation may still work.');
              setIsLoaded(true); // Set loaded anyway to allow cookie method
            }
          };
          
          setTimeout(checkSelect, 500);
          
        } catch (error) {
          console.error('❌ Error initializing Google Translate:', error);
          setIsLoaded(true); // Set loaded to allow fallback method
        }
      } else {
        console.error('❌ Google Translate API not available');
        // Retry after a delay
        setTimeout(() => {
          if (window.google && window.google.translate) {
            window.googleTranslateElementInit();
          }
        }, 1000);
      }
    };

    // Add Google Translate script
    const addScript = () => {
      // Check if script already exists
      const existingScript = document.querySelector('script[src*="translate.google.com"]');
      if (existingScript) {
        console.log('📝 Google Translate script already exists');
        // If script exists but not initialized, try to initialize
        if (window.google && window.google.translate) {
          window.googleTranslateElementInit();
        }
        return;
      }

      console.log('📥 Loading Google Translate script...');
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        console.log('✅ Google Translate script loaded');
      };
      
      script.onerror = (error) => {
        // Only log warning, not error (to avoid console noise)
        console.warn('⚠️ Google Translate unavailable. Translation feature disabled.');
        // Don't log the error object as it's often empty
      };
      
      document.head.appendChild(script);
    };

    // Small delay to ensure DOM is ready
    setTimeout(addScript, 100);

    // Cleanup
    return () => {
      // Keep script for performance
    };
  }, []);

  const languages = [
    { code: 'en', name: 'English', native: 'English' },
    { code: 'hi', name: 'Hindi', native: 'हिंदी' },
    { code: 'mr', name: 'Marathi', native: 'मराठी' },
    { code: 'te', name: 'Telugu', native: 'తెలుగు' },
    { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
    { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
    { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
    { code: 'bn', name: 'Bengali', native: 'বাংলা' },
    { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
    { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
    { code: 'ur', name: 'Urdu', native: 'اردو' },
  ];

  const changeLanguage = (langCode) => {
    console.log('\n🌐 === LANGUAGE CHANGE REQUEST ===');
    console.log('Target language:', langCode);
    
    setIsOpen(false);
    
    // Method 1: Try using the select element (fast, no reload)
    const select = document.querySelector('.goog-te-combo');
    
    if (select) {
      console.log('✅ Method 1: Using select element');
      console.log('Current value:', select.value);
      
      // Set the value
      select.value = langCode;
      
      // Trigger change event
      select.dispatchEvent(new Event('change', { bubbles: true }));
      
      console.log('✅ Change event dispatched');
      
      setCurrentLang(langCode);
      
      // Verify translation after a delay
      setTimeout(() => {
        const isTranslated = document.querySelector('html.translated-ltr') || 
                           document.querySelector('html.translated-rtl') ||
                           document.querySelector('font[style*="vertical-align"]');
        
        console.log('📊 Translation status:', !!isTranslated);
        
        if (!isTranslated && langCode !== 'en') {
          console.log('⚠️ Select method failed, switching to Method 2...');
          useCookieMethod(langCode);
        } else {
          console.log('✅ Translation active via select method');
        }
      }, 1500);
      
    } else {
      console.log('⚠️ Select element not found, using Method 2 directly');
      useCookieMethod(langCode);
    }
  };
  
  const useCookieMethod = (langCode) => {
    console.log('🍪 Method 2: Using cookie + reload method');
    
    // Clear old cookie first
    document.cookie = 'googtrans=; path=/; max-age=0';
    document.cookie = `googtrans=; path=/; domain=${window.location.hostname}; max-age=0`;
    
    if (langCode !== 'en') {
      // Set new language cookie
      const langPair = `/en/${langCode}`;
      document.cookie = `googtrans=${langPair}; path=/;`;
      document.cookie = `googtrans=${langPair}; path=/; domain=${window.location.hostname};`;
      console.log('✅ Cookie set to:', langPair);
    } else {
      console.log('✅ Cookie cleared (returning to English)');
    }
    
    setCurrentLang(langCode);
    
    console.log('🔄 Reloading page in 500ms...');
    console.log('=================================\n');
    
    // Reload the page
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  return (
    <>
      {/* Google Translate Container - Hidden but accessible */}
      <div 
        id={elementId}
        style={{ 
          position: 'absolute',
          left: '-9999px',
          width: '1px',
          height: '1px',
          overflow: 'hidden'
        }}
        aria-hidden="true"
      ></div>

      {/* Backdrop - Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[10000]"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        ></div>
      )}

      {/* Custom Language Selector */}
      <div className="relative inline-block z-[10002]">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-4 py-2.5 bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 border-2 ${
            isOpen 
              ? 'border-blue-500 ring-2 ring-blue-200' 
              : 'border-gray-200 hover:border-blue-400'
          }`}
          title="Change Language"
          aria-label="Select Language"
          aria-expanded={isOpen}
        >
          <FiGlobe className={`w-5 h-5 text-blue-600 ${!isLoaded ? 'animate-spin' : ''}`} />
          <span className="text-sm font-semibold text-gray-800">
            {languages.find(l => l.code === currentLang)?.native || 'English'}
          </span>
          <svg
            className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-72 bg-white rounded-lg shadow-2xl border border-gray-200 z-[10001] max-h-[32rem] overflow-y-auto">
            <div className="p-2">
              <div className="text-xs font-semibold text-gray-500 px-3 py-2 uppercase tracking-wide border-b border-gray-100 mb-1">
                Select Language
              </div>
              
              {/* Loading Indicator */}
              {!isLoaded && (
                <div className="mx-3 mb-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-center gap-2 text-xs text-blue-700">
                    <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading translation service...</span>
                  </div>
                </div>
              )}
              
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  className={`w-full text-left px-3 py-2.5 rounded-md transition-colors flex items-center justify-between group ${
                    currentLang === lang.code 
                      ? 'bg-blue-50 border border-blue-200' 
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <div className="flex-1">
                    <div className={`text-sm font-medium ${
                      currentLang === lang.code 
                        ? 'text-blue-700' 
                        : 'text-gray-900 group-hover:text-blue-600'
                    }`}>
                      {lang.name}
                    </div>
                    <div className="text-xs text-gray-500">{lang.native}</div>
                  </div>
                  {currentLang === lang.code ? (
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : lang.code === 'en' ? (
                    <span className="text-xs text-gray-400 font-medium">
                      Default
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Custom CSS to hide Google's default UI */}
      <style jsx global>{`
        /* Hide all Google Translate default UI elements */
        .goog-te-banner-frame {
          display: none !important;
          visibility: hidden !important;
        }
        .goog-te-balloon-frame {
          display: none !important;
          visibility: hidden !important;
        }
        body {
          top: 0 !important;
        }
        .goog-logo-link {
          display: none !important;
          visibility: hidden !important;
        }
        .goog-te-gadget {
          display: none !important;
          visibility: hidden !important;
          color: transparent !important;
        }
        .goog-te-gadget .goog-te-combo {
          display: none !important;
          visibility: hidden !important;
        }
        .goog-te-gadget select {
          display: none !important;
          visibility: hidden !important;
        }
        .goog-te-menu-value {
          display: none !important;
          visibility: hidden !important;
        }
        .goog-te-menu-value span {
          display: none !important;
          visibility: hidden !important;
        }
        [id^="google_translate_element"] {
          display: none !important;
          visibility: hidden !important;
          position: absolute !important;
          left: -9999px !important;
        }
        [id^="google_translate_element"] * {
          display: none !important;
          visibility: hidden !important;
        }
        /* Fix for translated page layout */
        .skiptranslate {
          display: none !important;
          visibility: hidden !important;
        }
        body > .skiptranslate {
          display: none !important;
          visibility: hidden !important;
        }
        iframe.skiptranslate {
          display: none !important;
          visibility: hidden !important;
        }
        /* Hide Google Translate iframe and toolbar */
        .goog-te-banner-frame.skiptranslate {
          display: none !important;
        }
        #goog-gt-tt {
          display: none !important;
          visibility: hidden !important;
        }
      `}</style>
    </>
  );
}
