import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WalletProvider } from './context/WalletContext';
import { authService } from './services/authService';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { HeroSection } from './components/sections/HeroSection';
import { WhyMosaicSection } from './components/sections/WhyMosaicSection';
import { ProfilesSection } from './components/sections/ProfilesSection';
import { NftProjectsSection } from './components/sections/NftProjectsSection';
import { SocialHubSection } from './components/sections/SocialHubSection';
import { NftRelaySection } from './components/sections/NftRelaySection';
import { DiscoverSection } from './components/sections/DiscoverSection';
import { FinalCtaSection } from './components/sections/FinalCtaSection';
import { AuthModal } from './components/modals/AuthModal';
import { SearchModal } from './components/modals/SearchModal';
import { NftDetailModal } from './components/modals/NftDetailModal';
import { CreateProjectModal } from './components/projects/CreateProjectModal';
import { CreateRelayModal } from './components/relay/CreateRelayModal';
import { LoginPage } from './pages/LoginPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { SettingsPage } from './pages/SettingsPage';
import { ProfilePage } from './pages/ProfilePage';
import { SocialHubPage } from './pages/SocialHubPage';
import { RelayExperiencePage } from './pages/RelayExperiencePage';
import { relayService } from './services/relayService';
import { NftItem, CommunityProject } from './types';
import { Sparkles } from 'lucide-react';

const PROTECTED_ROUTES = [
  '/home',
  '/community',
  '/communities',
  '/create',
  '/quests',
  '/notifications',
  '/messages',
  '/bookmarks',
  '/settings',
  '/profile',
];

const SOCIAL_ROUTES = [
  '/home',
  '/community',
  '/communities',
  '/explore',
  '/quests',
  '/notifications',
  '/messages',
  '/bookmarks',
  '/profile',
  '/settings',
];

function MosaicApp() {
  const { currentUser, loading } = useAuth();
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    const path = window.location.pathname;
    const hash = window.location.hash.replace('#', '');
    const clean = path !== '/' ? path : hash ? `/${hash}` : '/';
    // If user is already authenticated in session cache, take them straight to their account /home
    const cachedUser = authService.getCurrentUser();
    if (cachedUser && (clean === '/' || clean === '/login' || clean === '/signup')) {
      return '/home';
    }
    return clean;
  });

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [createProjectModalOpen, setCreateProjectModalOpen] = useState(false);
  const [createRelayModalOpen, setCreateRelayModalOpen] = useState(false);
  const [createRelayInitialNft, setCreateRelayInitialNft] = useState<{
    name?: string;
    image?: string;
    collection?: string;
    tokenId?: string;
  } | null>(null);
  const [selectedNft, setSelectedNft] = useState<NftItem | null>(null);
  const [activeSection, setActiveSection] = useState('home');

  // Sync route with browser history
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const hash = window.location.hash.replace('#', '');
      const clean = path !== '/' ? path : hash ? `/${hash}` : '/';
      setCurrentRoute(clean);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Protected route enforcement
  useEffect(() => {
    if (!loading && !currentUser) {
      if (PROTECTED_ROUTES.includes(currentRoute)) {
        setCurrentRoute('/login');
        window.history.pushState({}, '', '/login');
      }
    }
  }, [currentUser, loading, currentRoute]);

  // Authenticated user direct flow: if logged in, visiting '/' or '/login' or '/signup' brings you straight to /home
  useEffect(() => {
    if (!loading && currentUser) {
      if (currentRoute === '/' || currentRoute === '/login' || currentRoute === '/signup') {
        setCurrentRoute('/home');
        window.history.replaceState({}, '', '/home');
      }
    }
  }, [currentUser, loading, currentRoute]);

  const navigateTo = (route: string) => {
    if (route === 'create-project' || route === '/create/project' || route === '/create') {
      if (!currentUser) {
        handleOpenAuth('signup');
        return;
      }
      setCreateProjectModalOpen(true);
      return;
    }

    if (route === 'create-relay' || route === '/create/relay') {
      if (!currentUser) {
        handleOpenAuth('signup');
        return;
      }
      setCreateRelayModalOpen(true);
      return;
    }

    if (route.startsWith('/relay') || route === 'relay') {
      const activeRelay = relayService.getActiveRelay();
      let targetRoute = route;
      if (route === 'relay' || route === '/relay') {
        targetRoute = activeRelay ? `/relay/${activeRelay.id}` : '/explore';
      }
      setCurrentRoute(targetRoute);
      window.history.pushState({}, '', targetRoute);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (route === 'explore' || route === '/explore') {
      setCurrentRoute('/explore');
      window.history.pushState({}, '', '/explore');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (route === 'community' || route === '/community') {
      if (!currentUser) {
        setAuthMode('signin');
        setCurrentRoute('/login');
        window.history.pushState({}, '', '/login');
        return;
      }
      setCurrentRoute('/community');
      window.history.pushState({}, '', '/community');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (route === 'social' || route === 'home' || route === '/home') {
      if (!currentUser) {
        setAuthMode('signin');
        setCurrentRoute('/login');
        window.history.pushState({}, '', '/login');
        return;
      }
      setCurrentRoute('/home');
      window.history.pushState({}, '', '/home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (route.startsWith('/')) {
      // Check if trying to access a protected route while unauthenticated
      if (!currentUser && PROTECTED_ROUTES.includes(route)) {
        setAuthMode('signin');
        setCurrentRoute('/login');
        window.history.pushState({}, '', '/login');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      setCurrentRoute(route);
      window.history.pushState({}, '', route);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Section anchor on landing page
      if (currentRoute !== '/') {
        setCurrentRoute('/');
        window.history.pushState({}, '', '/');
      }
      setActiveSection(route);

      if (route === 'home') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      const mapping: Record<string, string> = {
        explore: 'explore',
        create: 'relay',
        about: 'why-mosaic',
        profiles: 'profiles',
        projects: 'projects',
        relay: 'relay',
      };

      const targetId = mapping[route] || route;
      setTimeout(() => {
        const element = document.getElementById(targetId);
        if (element) {
          const navOffset = 80;
          const elementPosition = element.getBoundingClientRect().top + window.scrollY;
          window.scrollTo({
            top: elementPosition - navOffset,
            behavior: 'smooth',
          });
        }
      }, 50);
    }
  };

  const handleOpenAuth = (mode: 'signin' | 'signup' = 'signup') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  // Route 1: /login
  if (currentRoute === '/login') {
    return (
      <LoginPage
        initialMode="signin"
        onNavigate={navigateTo}
      />
    );
  }

  // Route 2: /signup
  if (currentRoute === '/signup') {
    return (
      <LoginPage
        initialMode="signup"
        onNavigate={navigateTo}
      />
    );
  }

  // Route 3: /onboarding (Protected Route)
  if (currentRoute === '/onboarding') {
    if (!currentUser && !loading) {
      return <LoginPage initialMode="signin" onNavigate={navigateTo} />;
    }
    return (
      <OnboardingPage
        onComplete={() => navigateTo('/home')}
      />
    );
  }


  // Route 6: /home, /community, /explore, /notifications, /bookmarks, /hashtag/:tag (Mosaic Social Hub)
  const isHashtagRoute = currentRoute.startsWith('/hashtag/');
  const isExploreRoute = currentRoute.startsWith('/explore');
  const isSocialRoute = SOCIAL_ROUTES.includes(currentRoute) || isExploreRoute || isHashtagRoute;
  if (isSocialRoute) {
    if (loading && PROTECTED_ROUTES.includes(currentRoute)) {
      return (
        <div className="min-h-screen bg-[#06070a] flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-2 border-purple-500 border-t-cyan-400 rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Loading Mosaic...</p>
          </div>
        </div>
      );
    }
    if (PROTECTED_ROUTES.includes(currentRoute) && !currentUser && !loading) {
      return <LoginPage initialMode="signin" onNavigate={navigateTo} />;
    }
    return (
      <SocialHubPage
        initialRoute={currentRoute}
        onNavigateHomeLanding={() => navigateTo('/')}
        onOpenRelayLanding={() => navigateTo('relay')}
      />
    );
  }

  // Route 6b: /relay or /relay/:id (NFT Relay Living Lore Experience)
  if (currentRoute.startsWith('/relay')) {
    const relayId = currentRoute.startsWith('/relay/')
      ? currentRoute.replace('/relay/', '')
      : undefined;
    return (
      <RelayExperiencePage
        relayId={relayId}
        onBack={() => navigateTo('/')}
        onNavigateHome={() => navigateTo('/home')}
        onSelectUser={(_u) => navigateTo('/home')}
      />
    );
  }

  // Route 7: Landing Page (Preserved UI exactly)
  return (
    <div className="min-h-screen bg-[#06070a] text-slate-100 flex flex-col selection:bg-purple-600/30 selection:text-white">
      {/* Global Navigation */}
      <Navbar
        onOpenAuth={handleOpenAuth}
        onOpenSearch={() => navigateTo('/explore')}
        onOpenCreateProject={() => {
          if (!currentUser) handleOpenAuth('signup');
          else setCreateProjectModalOpen(true);
        }}
        onOpenCreateRelay={() => {
          if (!currentUser) handleOpenAuth('signup');
          else setCreateRelayModalOpen(true);
        }}
        activeSection={activeSection}
        onNavigate={navigateTo}
      />

      {/* Main Content Sections */}
      <main className="flex-1">
        {/* 1. Hero Section */}
        <HeroSection
          onOpenAuth={handleOpenAuth}
          onExploreClick={() => navigateTo('/explore')}
          onSelectNft={(nft) => setSelectedNft(nft)}
        />

        {/* 2. Why Mosaic Section */}
        <WhyMosaicSection
          onLearnMoreRelay={() => navigateTo('relay')}
          onExploreProfiles={() => navigateTo('/explore')}
          onExploreProjects={() => navigateTo('/community')}
          onExploreSocial={() => navigateTo('/home')}
        />

        {/* 3. Profiles Section */}
        <ProfilesSection
          onOpenAuth={() => handleOpenAuth('signup')}
          onSelectNft={(nft) => setSelectedNft(nft)}
        />

        {/* 4. NFT Projects Section */}
        <NftProjectsSection
          onSelectProject={(_project) => {
            if (!currentUser) {
              handleOpenAuth('signup');
            } else {
              navigateTo('/community');
            }
          }}
          onOpenAuth={() => handleOpenAuth('signup')}
        />

        {/* 5. Social Hub Section */}
        <SocialHubSection
          onOpenAuth={() => handleOpenAuth('signin')}
          onExploreRelays={() => navigateTo('/home')}
        />

        {/* 6. NFT Relay Section */}
        <NftRelaySection
          onLearnMore={() => navigateTo('/explore')}
          onOpenAuth={() => handleOpenAuth('signup')}
        />

        {/* 7. Discover Section */}
        <DiscoverSection
          onSelectNft={(nft) => setSelectedNft(nft)}
          onOpenAuth={() => handleOpenAuth('signup')}
        />

        {/* 8. Final Call to Action */}
        <FinalCtaSection onOpenAuth={handleOpenAuth} />
      </main>

      {/* 9. Global Footer */}
      <Footer onNavigate={navigateTo} onOpenAuth={() => handleOpenAuth('signup')} />

      {/* Interactive Modals */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
        onOnboardingRedirect={() => navigateTo('/onboarding')}
        onSuccessRedirect={(r) => navigateTo(r)}
      />

      <SearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onSelectNft={(nft) => setSelectedNft(nft)}
        onSelectUser={(_username) => navigateTo('/home')}
      />

      <NftDetailModal
        nft={selectedNft}
        onClose={() => setSelectedNft(null)}
        onOpenAuth={() => {
          setSelectedNft(null);
          handleOpenAuth('signup');
        }}
        onOpenRelay={(rId) => {
          setSelectedNft(null);
          const active = rId || relayService.getActiveRelay()?.id;
          if (active) {
            navigateTo(`/relay/${active}`);
          } else {
            navigateTo('/explore');
          }
        }}
        onCreateRelay={(nft) => {
          setSelectedNft(null);
          if (!currentUser) {
            handleOpenAuth('signup');
          } else {
            setCreateRelayInitialNft({
              name: nft.name,
              image: nft.image,
              collection: nft.collection,
              tokenId: nft.tokenId,
            });
            setCreateRelayModalOpen(true);
          }
        }}
      />

      <CreateProjectModal
        isOpen={createProjectModalOpen}
        onClose={() => setCreateProjectModalOpen(false)}
        onProjectCreated={(_proj) => {
          setCreateProjectModalOpen(false);
          navigateTo('/home');
        }}
      />

      <CreateRelayModal
        isOpen={createRelayModalOpen}
        onClose={() => {
          setCreateRelayModalOpen(false);
          setCreateRelayInitialNft(null);
        }}
        initialNft={createRelayInitialNft || undefined}
        onRelayCreated={(relay) => {
          setCreateRelayModalOpen(false);
          navigateTo(`/relay/${relay.id}`);
        }}
      />
    </div>
  );
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Mosaic ErrorBoundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#06070a] text-slate-100 flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md space-y-4">
            <div className="w-12 h-12 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center mx-auto text-purple-400 font-bold text-xl">
              M
            </div>
            <h1 className="text-xl font-bold text-white">Something went wrong</h1>
            <p className="text-sm text-slate-400">
              Mosaic encountered an issue rendering this view. You can return to the home page or reload.
            </p>
            <div className="flex gap-3 justify-center pt-2">
              <button
                type="button"
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.href = '/';
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-purple-500 text-slate-950 font-semibold text-sm hover:opacity-90 transition-opacity cursor-pointer"
              >
                Go to Landing Page
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <WalletProvider>
          <MosaicApp />
        </WalletProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
