'use client';

import { useState } from 'react';

export default function TranslationTestPage() {
  const [testResults, setTestResults] = useState([]);

  const runTest = (testName, testFn) => {
    const result = testFn();
    setTestResults(prev => [...prev, { name: testName, result, passed: !!result }]);
    return result;
  };

  const runAllTests = () => {
    setTestResults([]);
    
    setTimeout(() => {
      console.log('Running translation tests...');
      
      // Test 1: Google object exists
      runTest('Google Translate Object', () => {
        return window.google && window.google.translate;
      });

      // Test 2: Translate element exists
      runTest('Translate Element', () => {
        return document.getElementById('google_translate_element');
      });

      // Test 3: Select element exists
      runTest('Select Dropdown', () => {
        return document.querySelector('.goog-te-combo');
      });

      // Test 4: Get available languages
      const select = document.querySelector('.goog-te-combo');
      if (select) {
        const langs = Array.from(select.options).map(o => o.value).filter(v => v);
        runTest(`Available Languages (${langs.length})`, () => langs.join(', '));
      }

      // Test 5: Check if translation is active
      runTest('Translation Active', () => {
        return !!document.querySelector('font[style*="vertical-align"]');
      });

      // Test 6: Current language
      runTest('Current Language', () => {
        const select = document.querySelector('.goog-te-combo');
        return select ? select.value || 'en' : 'Not found';
      });
    }, 1000);
  };

  const testLanguage = (langCode) => {
    const select = document.querySelector('.goog-te-combo');
    if (select) {
      console.log(`Testing language: ${langCode}`);
      select.value = langCode;
      select.dispatchEvent(new Event('change', { bubbles: true }));
      
      setTimeout(() => {
        const translated = !!document.querySelector('font[style*="vertical-align"]');
        alert(translated ? `✅ Translation to ${langCode} successful!` : `❌ Translation to ${langCode} failed!`);
      }, 3000);
    } else {
      alert('❌ Google Translate not initialized');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Google Translate Test Page
          </h1>
          <p className="text-gray-600">
            This page helps you test if Google Translate is working correctly
          </p>
        </div>

        {/* Test Content */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Sample Content to Translate
          </h2>
          <div className="space-y-4 text-gray-700">
            <p>
              Welcome to RescueConnect. This is a disaster management and rescue coordination platform.
            </p>
            <p>
              We provide emergency services, volunteer coordination, and real-time disaster response.
            </p>
            <p>
              Our mission is to save lives and help communities during emergencies.
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Emergency Alert System</li>
              <li>Volunteer Management</li>
              <li>Real-time Location Tracking</li>
              <li>Multi-language Support</li>
              <li>Chat and Communication</li>
            </ul>
          </div>
        </div>

        {/* Test Controls */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Quick Tests
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <button
              onClick={runAllTests}
              className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Run All Tests
            </button>
            
            <button
              onClick={() => testLanguage('hi')}
              className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Test Hindi (हिंदी)
            </button>
            
            <button
              onClick={() => testLanguage('mr')}
              className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              Test Marathi (मराठी)
            </button>
            
            <button
              onClick={() => testLanguage('te')}
              className="px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
            >
              Test Telugu (తెలుగు)
            </button>
            
            <button
              onClick={() => testLanguage('ta')}
              className="px-4 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors font-medium"
            >
              Test Tamil (தமிழ்)
            </button>
            
            <button
              onClick={() => testLanguage('en')}
              className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              Back to English
            </button>
          </div>

          {/* Test Results */}
          {testResults.length > 0 && (
            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-900 mb-3">Test Results:</h3>
              <div className="space-y-2">
                {testResults.map((test, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg flex items-start justify-between ${
                      test.passed ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className={`text-lg ${test.passed ? 'text-green-600' : 'text-red-600'}`}>
                        {test.passed ? '✅' : '❌'}
                      </span>
                      <div>
                        <div className="font-medium text-gray-900">{test.name}</div>
                        <div className="text-sm text-gray-600 mt-1 font-mono">
                          {typeof test.result === 'boolean' 
                            ? (test.result ? 'True' : 'False')
                            : String(test.result).substring(0, 100)
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Manual Console Commands */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Manual Console Commands
          </h2>
          <p className="text-gray-600 mb-4">
            Open browser console (F12) and run these commands:
          </p>
          
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="text-sm font-medium text-gray-700 mb-2">Check if loaded:</div>
              <code className="text-xs text-blue-600 block bg-white p-2 rounded border">
                console.log(window.google?.translate ? 'Loaded ✓' : 'Not loaded ✗');
              </code>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="text-sm font-medium text-gray-700 mb-2">Force translate to Hindi:</div>
              <code className="text-xs text-blue-600 block bg-white p-2 rounded border">
                {`const s = document.querySelector('.goog-te-combo'); s.value = 'hi'; s.dispatchEvent(new Event('change', {bubbles: true}));`}
              </code>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="text-sm font-medium text-gray-700 mb-2">Check available languages:</div>
              <code className="text-xs text-blue-600 block bg-white p-2 rounded border">
                {`Array.from(document.querySelector('.goog-te-combo').options).map(o => o.value).filter(v => v)`}
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
