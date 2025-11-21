'use client';

import { ReactNode, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Crisp } from 'crisp-sdk-web';
import { SessionProvider } from 'next-auth/react';
import NextTopLoader from 'nextjs-toploader';
import { Toaster } from 'react-hot-toast';
import { Tooltip } from 'react-tooltip';
import config from '@/config';
import PWAInstallPrompt from './PWAInstallPrompt';
import OfflineIndicator from './OfflineIndicator';
import MonitoringProvider from './MonitoringProvider';
import SpeedInsightsProvider from './SpeedInsightsProvider';
import VercelAnalyticsProvider from './VercelAnalyticsProvider';
import Navbar from './navbar';

// Crisp customer chat support:
// This component is separated from ClientLayout because it needs to be wrapped with <SessionProvider> to use useSession() hook
const CrispChat = (): null => {
  const pathname = usePathname();
  const { data } = useSession();

  useEffect(() => {
    if (config?.crisp?.id) {
      // Set up Crisp
      Crisp.configure(config.crisp.id);

      // (Optional) If onlyShowOnRoutes array is not empty in config.js file, Crisp will be hidden on the routes in the array.
      // Use <AppButtonSupport> instead to show it (user clicks on the button to show Crisp—it cleans the UI)
      if (config.crisp.onlyShowOnRoutes && !config.crisp.onlyShowOnRoutes?.includes(pathname)) {
        Crisp.chat.hide();
        Crisp.chat.onChatClosed(() => {
          Crisp.chat.hide();
        });
      }
    }
  }, [pathname]);

  // Add User Unique ID to Crisp to easily identify users when reaching support (optional)
  useEffect(() => {
    if (data?.user && config?.crisp?.id) {
      Crisp.session.setData({ userId: data.user?.id });
    }
  }, [data]);

  return null;
};

// All the client wrappers are here (they can't be in server components)
// 1. SessionProvider: Allow the useSession from next-auth (find out if user is auth or not)
// 2. NextTopLoader: Show a progress bar at the top when navigating between pages
// 3. Toaster: Show Success/Error messages anywhere from the app with toast()
// 4. Tooltip: Show a tooltip if any JSX element has these 2 attributes: data-tooltip-id="tooltip" data-tooltip-content=""
// 5. CrispChat: Set Crisp customer chat support (see above)
const ClientLayout = ({ children }: { children: ReactNode }) => {
  return (
    <>
      <SessionProvider>
        <VercelAnalyticsProvider>
          <MonitoringProvider>
            <SpeedInsightsProvider>
              {/* Show a progress bar at the top when navigating between pages */}
              <NextTopLoader color={config.colors.main} showSpinner={false} />

              {/* Navigation */}
              <Navbar />

              {/* Content inside app/page.js files  - only offset when sidebar is visible */}
              {/**
               * ContentWrapper consumes the client session (useSession) and
               * conditionally applies the left margin that reserves space for the
               * desktop sidebar. This avoids the layout being constrained to
               * 80vw when the sidebar is hidden for unauthenticated users.
               */}
              <ContentWrapper>{children}</ContentWrapper>

              {/* PWA Components */}
              <PWAInstallPrompt />
              <OfflineIndicator />

              {/* Show Success/Error messages anywhere from the app with toast() */}
              <Toaster
                toastOptions={{
                  duration: 3000,
                }}
              />

              {/* Show a tooltip if any JSX element has these 2 attributes: data-tooltip-id="tooltip" data-tooltip-content="" */}
              <Tooltip id="tooltip" className="z-[60] !opacity-100 max-w-sm shadow-lg" />

              {/* Set Crisp customer chat support */}
              <CrispChat />
            </SpeedInsightsProvider>
          </MonitoringProvider>
        </VercelAnalyticsProvider>
      </SessionProvider>
    </>
  );
};

export default ClientLayout;

// Small wrapper component that reads the client session and conditionally
// applies left margin to reserve space for the desktop sidebar only when the
// user is authenticated.
function ContentWrapper({ children }: { children: ReactNode }) {
  const { data: session } = useSession();

  // When session?.user is truthy, the desktop sidebar is rendered and we
  // need to offset content with the same classes used previously. When not
  // authenticated, we avoid applying the left margin so content uses full
  // available width.
  const className = session?.user ? 'md:ml-20 lg:ml-64 pb-20 md:pb-0' : 'pb-20 md:pb-0';

  return <div className={className}>{children}</div>;
}
