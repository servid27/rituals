'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAdminRoutes } from '@/libs/admin';
import { preloadAllAdminData } from '@/hooks/useAdminData';

export default function AdminPreloader(): null {
  const router = useRouter();

  useEffect(() => {
    console.log('🚀 AdminPreloader: Starting immediate preload...');

    // Start AGGRESSIVE preloading immediately - no waiting
    const adminRoutes = getAdminRoutes();

    // Prefetch routes immediately
    adminRoutes.forEach((route) => {
      router.prefetch(route.path);
    });

    // Start data preloading immediately (not in idle callback)
    preloadAllAdminData().then(() => {
      console.log('✅ All admin data preloaded and ready!');
    });

    // Also do a secondary preload in case the first one fails
    setTimeout(() => {
      console.log('🔄 Secondary preload starting...');
      preloadAllAdminData();
    }, 2000);
  }, [router]);

  return null; // This component doesn't render anything
}
