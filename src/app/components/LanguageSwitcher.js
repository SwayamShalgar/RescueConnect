'use client';

import GoogleTranslate from './GoogleTranslate';

export default function LanguageSwitcher() {
  return (
    <div className="fixed top-6 right-6 z-[10000]">
      <GoogleTranslate />
    </div>
  );
}
