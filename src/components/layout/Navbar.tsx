import React, { useState, useEffect, useRef } from 'react';
import { MosaicLogo } from '../brand/MosaicLogo';
import { GoogleAuthButton } from '../common/GoogleAuthButton';
import { Avatar } from '../common/Avatar';
import { useAuth } from '../../context/AuthContext';
import {
  Search,
  Menu,
  X,
  Compass,
  PlusCircle,
  Users,
  Info,
  Home,
  Settings,
  LogOut,
  User,
  ChevronDown,
  Sparkles,
  Layers,
  Wallet,
  GitFork,
} from 'lucide-react';
import { WalletButton } from '../wallet/WalletButton';

interface NavbarProps {
  onOpenAuth: (mode?: 'signin' | 'signup') => void;
  onOpenSearch: () => void;
  onOpenCreateProject?: () => void;
  onOpenCreateRelay?: () => void;
  activeSection?: string;
  onNavigate: (sectionId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAuth,
  onOpenSearch,
  onOpenCreateProject,
  onOpenCreateRelay,
  activeSection = 'home',
  onNavigate,
}) => {
  const { user, signOut } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const createDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (createDropdownRef.current && !createDropdownRef.current.contains(event.target as Node)) {
        setIsCreateMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'explore', label: 'Explore', icon: Compass },
    { id: 'create', label: 'Create', icon: PlusCircle },
    { id: 'community', label: 'Community', icon: Users },
    { id: 'about', label: 'About', icon: Info },
  ];

  const handleNavClick = (id: string) => {
    onNavigate(id);
    setIsMobileMenuOpen(false);
  };

  const handleSignOut = async () => {
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
    await signOut();
    onNavigate('/');
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-[#06070a]/90 backdrop-blur-md border-b border-white/10 shadow-lg shadow-black/40 py-3.5'
            : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Left: Brand Logo */}
            <div
              className="cursor-pointer transition-opacity hover:opacity-90"
              onClick={() => handleNavClick('home')}
            >
              <MosaicLogo
                size="md"
                withText
                textClassName="text-white font-extrabold tracking-[0.18em] text-lg sm:text-xl"
              />
            </div>

            {/* Desktop Navigation Center */}
            <nav className="hidden md:flex items-center gap-8 lg:gap-10">
              {navItems.map((item) => {
                const isActive = activeSection === item.id;

                if (item.id === 'create') {
                  return (
                    <div key={item.id} className="relative" ref={createDropdownRef}>
                      <button
                        onClick={() => setIsCreateMenuOpen(!isCreateMenuOpen)}
                        className={`relative flex items-center gap-1.5 text-sm font-medium transition-colors py-1 cursor-pointer ${
                          isCreateMenuOpen ? 'text-cyan-300 font-bold' : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        <span>Create</span>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isCreateMenuOpen ? 'rotate-180 text-cyan-300' : ''}`} />
                      </button>

                      {isCreateMenuOpen && (
                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 rounded-2xl bg-[#090c1a] border border-cyan-500/30 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                          <button
                            onClick={() => {
                              setIsCreateMenuOpen(false);
                              if (onOpenCreateProject) onOpenCreateProject();
                              else onNavigate('create');
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-cyan-300 hover:text-white hover:bg-cyan-950/40 rounded-xl transition-colors cursor-pointer text-left"
                          >
                            <Layers className="w-4 h-4 text-cyan-400 shrink-0" />
                            <div>
                              <p className="font-bold">NFT Project</p>
                              <p className="text-[10px] text-slate-400 font-normal">Launch dedicated identity</p>
                            </div>
                          </button>

                          <button
                            onClick={() => {
                              setIsCreateMenuOpen(false);
                              onNavigate('/home');
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors cursor-pointer text-left"
                          >
                            <PlusCircle className="w-4 h-4 text-purple-400 shrink-0" />
                            <div>
                              <p className="font-bold">New Post</p>
                              <p className="text-[10px] text-slate-400 font-normal">Post to Social Hub</p>
                            </div>
                          </button>

                          <button
                            onClick={() => {
                              setIsCreateMenuOpen(false);
                              if (onOpenCreateRelay) onOpenCreateRelay();
                              else onNavigate('/relay');
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors cursor-pointer text-left"
                          >
                            <Sparkles className="w-4 h-4 text-pink-400 shrink-0" />
                            <div>
                              <p className="font-bold">Relay Experience</p>
                              <p className="text-[10px] text-slate-400 font-normal">Collaborative artifact lore</p>
                            </div>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`relative text-sm font-medium transition-colors py-1 cursor-pointer ${
                      isActive ? 'text-white font-semibold' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {item.label}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 rounded-full" />
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Right Side Controls */}
            <div className="hidden sm:flex items-center gap-4">
              {/* Search Button */}
              <button
                type="button"
                onClick={onOpenSearch}
                aria-label="Search Mosaic"
                className="p-2.5 rounded-full text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                <Search className="w-4.5 h-4.5" />
              </button>

              {/* Optional Web3 Wallet Connection */}
              <WalletButton variant="nav" />

              {/* Authentication State: Logged Out vs Logged In */}
              {user ? (
                /* Authenticated User Menu */
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-full bg-[#0f1322] border border-white/15 hover:border-purple-400/40 hover:bg-[#151b30] transition-all cursor-pointer shadow-sm group"
                  >
                    <div className="relative">
                      <Avatar src={user.photoURL} name={user.displayName} size="xs" />
                      <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-slate-900" />
                    </div>
                    <span className="text-xs font-semibold text-slate-200 group-hover:text-white max-w-[110px] truncate">
                      @{user.username}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                        isUserMenuOpen ? 'rotate-180 text-white' : ''
                      }`}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#0a0d1a] border border-white/10 shadow-2xl shadow-purple-950/60 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                      {/* User Profile Card inside Dropdown - clickable to go to profile */}
                      <div
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onNavigate('/profile');
                        }}
                        className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 mb-1.5 space-y-1 cursor-pointer transition-colors group"
                        title="View your profile"
                      >
                        <div className="flex items-center gap-2.5">
                          <Avatar src={user.photoURL} name={user.displayName} size="sm" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors truncate">{user.displayName}</p>
                            <p className="text-[11px] text-purple-400 truncate">@{user.username}</p>
                          </div>
                        </div>
                        <div className="pt-1 flex items-center justify-between text-[10px]">
                          <span className="text-slate-400 truncate max-w-[130px]">{user.email}</span>
                          <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-semibold uppercase">
                            {user.accountType}
                          </span>
                        </div>
                      </div>

                      {/* Incomplete profile warning */}
                      {!user.profileCompleted && (
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onNavigate('/onboarding');
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/10 rounded-lg transition-colors cursor-pointer text-left"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>Complete Profile Setup</span>
                        </button>
                      )}

                      {/* Dropdown Actions */}
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          if (onOpenCreateRelay) onOpenCreateRelay();
                          else onNavigate('relay');
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-pink-300 hover:text-white hover:bg-pink-950/40 rounded-lg transition-colors cursor-pointer text-left"
                      >
                        <GitFork className="w-3.5 h-3.5 text-pink-400" />
                        <span>Create NFT Relay</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          if (onOpenCreateProject) onOpenCreateProject();
                          else onNavigate('create');
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-cyan-300 hover:text-white hover:bg-cyan-950/40 rounded-lg transition-colors cursor-pointer text-left"
                      >
                        <Layers className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Create NFT Project</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onNavigate('/profile');
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer text-left"
                      >
                        <User className="w-3.5 h-3.5 text-purple-400" />
                        <span>Profile</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onNavigate('/profile');
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-cyan-300 hover:text-white hover:bg-cyan-950/40 rounded-lg transition-colors cursor-pointer text-left"
                      >
                        <Wallet className="w-3.5 h-3.5 text-cyan-400" />
                        <span>My NFTs</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onNavigate('/settings');
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer text-left"
                      >
                        <Settings className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Settings</span>
                      </button>

                      <div className="my-1 border-t border-white/5" />

                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 rounded-lg transition-colors cursor-pointer text-left"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* Logged Out: Google Sign In / Sign Up */
                <GoogleAuthButton
                  variant="nav"
                  label="Sign up / Sign in"
                  onClick={() => onOpenAuth('signup')}
                />
              )}
            </div>

            {/* Mobile Actions Hamburger */}
            <div className="flex sm:hidden items-center gap-2">
              <button
                type="button"
                onClick={onOpenSearch}
                aria-label="Search"
                className="p-2 text-slate-300 hover:text-white active:scale-95"
              >
                <Search className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label={isMobileMenuOpen ? 'Close Menu' : 'Open Menu'}
                className="p-2 text-slate-300 hover:text-white active:scale-95"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Redesigned Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 sm:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer content */}
          <div className="fixed top-16 inset-x-0 bottom-0 bg-[#090b14] border-t border-white/10 p-6 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-top duration-300">
            <div className="space-y-6">
              {/* Authenticated user top banner in mobile menu */}
              {user ? (
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                  <div
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onNavigate('/profile');
                    }}
                    className="flex items-center gap-3 cursor-pointer group"
                    title="View your profile"
                  >
                    <Avatar src={user.photoURL} name={user.displayName} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors truncate">{user.displayName}</p>
                      <p className="text-xs text-purple-400">@{user.username}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onNavigate('/profile');
                      }}
                      className="flex-1 py-1.5 px-3 rounded-lg bg-white/5 text-xs text-slate-300 text-center font-medium hover:text-white"
                    >
                      Profile
                    </button>
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onNavigate('/settings');
                      }}
                      className="flex-1 py-1.5 px-3 rounded-lg bg-white/5 text-xs text-slate-300 text-center font-medium hover:text-white"
                    >
                      Settings
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="py-1.5 px-3 rounded-lg bg-rose-950/30 text-xs text-rose-400 text-center font-medium hover:bg-rose-950/50"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Quick Search trigger in mobile drawer */}
              <div
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenSearch();
                }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-sm cursor-pointer"
              >
                <Search className="w-4 h-4" />
                <span>Search creators, collections, relays...</span>
              </div>

              {/* Navigation links with comfortable touch targets (min 44px) */}
              <div className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-base font-medium transition-all ${
                        isActive
                          ? 'bg-purple-900/30 text-white font-semibold border border-purple-500/30'
                          : 'text-slate-300 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Auth button for Mobile if logged out */}
            {!user ? (
              <div className="pt-6 border-t border-white/10 space-y-3">
                <GoogleAuthButton
                  variant="primary"
                  label="Sign in with Google"
                  showArrow
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenAuth('signin');
                  }}
                  className="w-full justify-center py-3.5"
                />
                <p className="text-center text-xs text-slate-400">
                  Join thousands of creators shaping stories on Mosaic.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </>
  );
};
