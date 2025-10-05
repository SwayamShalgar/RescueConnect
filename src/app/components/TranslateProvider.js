'use client';

import { usePathname } from 'next/navigation';

export default function TranslateProvider({ children }) {
  const pathname = usePathname();
  
  // Language switcher is now embedded in each page's navbar
  // No longer using fixed positioning

  return (
    <>
      {children}
    </>
  );
}
