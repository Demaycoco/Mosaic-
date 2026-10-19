import React from 'react';
import { MosaicLogo } from '../brand/MosaicLogo';
import { Avatar } from '../common/Avatar';
import { useAuth } from '../../context/AuthContext';
import { shardService } from '../../services/shardService';
import { Gem } from 'lucide-react';
import {
  Home,
  Compass,
  Users,
  GitFork,
  Trophy,
  Bell,
  MessageSquare,
  Bookmark,
  User,
  Settings,
  PenSquare,
  Layers,
  LogOut,
} from 'lucide-react';
import { WalletButton } from '../wallet/WalletButton';

interface SocialLeftNavProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  onOpenQuickPost?: () => void;
  onOpenCreateProject?: () => void;
  unreadNotificationsCount?: number;
  unreadMessagesCount?: number;
}

export const SocialLeftNav: React.FC<SocialLeftNavProps> = ({
  currentRoute,
  onNavigate,
  onOpenQuickPost,
  onOpenCreateProject,
  unreadNotificationsCount = 0,
  unreadMessagesCount = 0,
}) => {
  const { currentUser, signOut } = useAuth();
  const [shardBalance, setShardBalance] = React.useState<number>(0);

  React.useEffect(() => {
    if (!currentUser) return;
    const unsub = shardService.subscribeAccount(currentUser.id, (acc) => {
      setShardBalance(acc.balance);
    });
    return () => unsub();
  }, [currentUser]);

  // Navigation items strictly in user-requested order:
  // Mosaic logo and wordmark, Home, Explore, Communities, NFT Relays, Quests, Notifications, Messages, Bookmarks, Profile, Settings
  const navItems = [
    { id: '/home', label: 'Home', icon: Home },
    { id: '/explore', label: 'Explore', icon: Compass },
    { id: '/community', label: 'Communities', icon: Users },
    { id: '/relay', label: 'NFT Relays', icon: GitFork },
    { id: '/quests', label: 'Quests', icon: Trophy },
    {
      id: '/notifications',
      label: 'Notifications',
      icon: Bell,
      badge: unreadNotificationsCount > 0 ? unreadNotificationsCount : undefined,
    },
    {
      id: '/messages',
      label: 'Messages',
      icon: MessageSquare,
      badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined,
    },
    { id: '/bookmarks', label: 'Bookmarks', icon: Bookmark },
    { id: '/profile', label: 'Profile', icon: User },
    { id: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="social-sidebar hidden md:flex flex-col justify-between w-[240px] px-3.5 py-4 border-r border-white/10 shrink-0 select-none bg-[#05060b] scrollbar-none">
      {/* Top Section: Logo & Nav Items */}
      <div className="space-y-4">
        {/* 1. Mosaic Logo and Wordmark */}
        <div
          onClick={() => onNavigate('/home')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onNavigate('/home');
            }
          }}
          tabIndex={0}
          className="cursor-pointer px-2.5 py-1.5 rounded-xl hover:bg-white/5 transition-colors inline-flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          title="Mosaic Home"
        >
          <MosaicLogo size="md" withText={true} />
        </div>

        {/* Vertically Aligned Navigation Links (Items 2-11) */}
        <nav className="space-y-1" aria-label="Main Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              currentRoute === item.id ||
              (item.id === '/community' && (currentRoute === '/community' || currentRoute === '/communities')) ||
              (item.id === '/relay' && currentRoute.startsWith('/relay')) ||
              (item.id === '/explore' && currentRoute.startsWith('/explore'));

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                title={item.label}
                aria-current={isActive ? 'page' : undefined}
                className={`w-full flex items-center justify-start gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05060b] ${
                  isActive
                    ? 'text-white font-bold bg-white/10'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="relative shrink-0 flex items-center justify-center">
                  <Icon
                    className={`w-5 h-5 transition-transform group-hover:scale-105 ${
                      isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-white'
                    }`}
                  />
                  {item.badge && (
                    <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 rounded-full bg-pink-500 text-[10px] font-bold text-white flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </div>

                <span className="tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Primary Create Post Button below the primary navigation items */}
        <div className="pt-2 space-y-2">
          <button
            onClick={onOpenQuickPost || (() => onNavigate('/home'))}
            className="w-full flex items-center justify-center gap-2 h-11 rounded-full bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 hover:opacity-95 text-slate-950 font-bold text-sm transition-all shadow-md shadow-purple-950/40 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05060b]"
            title="Create Post"
          >
            <PenSquare className="w-4.5 h-4.5 text-slate-950 stroke-[2.2]" />
            <span>Create Post</span>
          </button>

          {onOpenCreateProject && (
            <button
              onClick={onOpenCreateProject}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-cyan-300 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
              title="Launch NFT Project Guild"
            >
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Launch NFT Project</span>
            </button>
          )}
        </div>
      </div>

      {/* Bottom Area: Wallet & User Profile */}
      <div className="pt-4 border-t border-white/10 space-y-3">
        {/* Wallet Connection Status */}
        <div className="w-full">
          <WalletButton variant="full" className="w-full justify-center py-2" />
        </div>

        {/* User Account Capsule */}
        {currentUser && (
          <div
            onClick={() => onNavigate('/profile')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onNavigate('/profile');
              }
            }}
            tabIndex={0}
            className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            title="View Profile"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar src={currentUser.photoURL} name={currentUser.displayName} size="sm" />
              <div className="min-w-0 flex-1 text-left">
                <p className="text-xs font-bold text-white truncate">{currentUser.displayName}</p>
                <div className="flex items-center gap-1.5 text-[11px] text-purple-400">
                  <span className="truncate">@{currentUser.username}</span>
                  {shardBalance > 0 && (
                    <span className="text-[10px] text-cyan-300 font-extrabold bg-cyan-950/60 px-1.5 py-0.5 rounded-full border border-cyan-500/30 shrink-0 flex items-center gap-0.5">
                      <Gem className="w-2.5 h-2.5 text-cyan-400" />
                      <span>{shardBalance}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={async (e) => {
                e.stopPropagation();
                await signOut();
                onNavigate('/');
              }}
              title="Log out and return to landing page"
              className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
