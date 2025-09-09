'use client';

import { useEffect } from 'react';
import { preloadAllAdminData } from '@/hooks/useAdminData';

// Global admin data preloader - triggers on any admin page visit
export default function GlobalAdminPreloader(): null {
  useEffect(() => {
    // Check if we're on an admin page
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
      console.log('🎯 Admin page detected - starting IMMEDIATE data preload');

      // Start preloading IMMEDIATELY when any admin page is accessed
      preloadAllAdminData().then(() => {
        console.log('⚡ Global admin preloader: All data ready!');
      });
    }
  }, []);

  return null;
}
