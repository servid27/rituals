'use client';

import { useState, useEffect } from 'react';
import { useMonitoring } from '@/libs/monitoring';
import { analytics } from '@/libs/analytics';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const { trackPWAInstall, trackPWAPromptShown, trackUserAction } = useMonitoring();

  useEffect(() => {
    // Check if app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppiOS = (window.navigator as any).standalone === true;
    setIsInstalled(isStandalone || isInWebAppiOS);

    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      // Show install prompt after a delay to not be too pushy
      setTimeout(() => {
        setShowInstallPrompt(true);
        trackPWAPromptShown();
        analytics.trackPWAEvent('prompt_shown');
      }, 5000);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      trackPWAInstall();
      analytics.trackPWAEvent('installed');
    };

    // Listen for install prompt event
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
      trackUserAction('pwa_install_accepted', {
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
      });
      analytics.trackPWAEvent('prompt_accepted', {
        userAgent: navigator.userAgent,
      });
    } else {
      console.log('User dismissed the install prompt');
      trackUserAction('pwa_install_dismissed', {
        timestamp: Date.now(),
      });
      analytics.trackPWAEvent('prompt_dismissed');
    }

    // Clear the deferredPrompt
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    // Don't show again for this session
    sessionStorage.setItem('pwa-install-dismissed', 'true');
    trackUserAction('pwa_prompt_dismissed', {
      timestamp: Date.now(),
    });
  };

  // Don't show if already installed or dismissed this session
  if (isInstalled || !showInstallPrompt || sessionStorage.getItem('pwa-install-dismissed')) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:w-80 z-50">
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-900 mb-1">Install Rituals Quest</h3>
            <p className="text-xs text-gray-600 mb-3">Install our app for faster access and offline functionality!</p>
            <div className="flex space-x-2">
              <button
                onClick={handleInstallClick}
                className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded hover:bg-blue-700 transition-colors"
              >
                Install
              </button>
              <button
                onClick={handleDismiss}
                className="text-gray-500 text-xs px-3 py-1.5 rounded hover:text-gray-700 transition-colors"
              >
                Not now
              </button>
            </div>
          </div>
          <button onClick={handleDismiss} className="text-gray-400 hover:text-gray-600 ml-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
