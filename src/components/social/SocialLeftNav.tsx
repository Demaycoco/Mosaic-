import React from 'react';
import { MosaicLogo } from '../brand/MosaicLogo';
import { Avatar } from '../common/Avatar';
import { useAuth } from '../../context/AuthContext';
import {
  Home,
  Compass,
  Bell,
  Bookmark,
  Users,
  User,
  Settings,
  Send,
  LogOut,
  Sparkles,
  Layers,
} from 'lucide-react';

interface SocialLeftNavProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  onOpenQuickPost?: () => void;
  onOpenCreateProject?: () => void;
  unreadNotificationsCount?: number;
}

export const SocialLeftNav: React.FC<SocialLeftNavProps> = ({
  currentRoute,
  onNavigate,
  onOpenQuickPost,
  onOpenCreateProject,
  unreadNotificationsCount = 0,
}) => {
  const { currentUser, signOut } = useAuth();

  const navItems = [
    { id: '/home', label: 'Home', icon: Home },
    { id: '/explore', label: 'Explore', icon: Compass },
    {
      id: '/notifications',
      label: 'Notifications',
      icon: Bell,
      badge: unreadNotificationsCount > 0 ? unreadNotificationsCount : undefined,
    },
    { id: '/bookmarks', label: 'Bookmarks', icon: Bookmark },
    { id: '/community', label: 'Community', icon: Users },
    { id: '/profile', label: 'Profile', icon: User },
    { id: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="hidden md:flex flex-col justify-between w-20 xl:w-64 h-screen sticky top-0 px-2 xl:px-4 py-4 border-r border-white/10 shrink-0 select-none bg-[#05060b]">
      {/* Top Section: Logo & Nav Items */}
      <div className="space-y-6">
        {/* Brand Logo */}
        <div
          onClick={() => onNavigate('/home')}
          className="cursor-pointer p-2.5 rounded-2xl hover:bg-white/5 transition-colors inline-block"
          title="Mosaic Home"
        >
          <MosaicLogo size="md" withText className="hidden xl:inline-flex" />
          <div className="xl:hidden">
            <MosaicLogo size="md" withText={false} />
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentRoute === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-4 px-3.5 py-3 rounded-full text-base font-medium transition-all group cursor-pointer ${
                  isActive
                    ? 'text-white font-bold bg-white/10'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="relative">
                  <Icon
                    className={`w-6 h-6 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-white'
                    }`}
                  />
                  {item.badge && (
                    <span className="absolute -top-1 -right-1.5 w-4 h-4 rounded-full bg-pink-500 text-[10px] font-bold text-white flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </div>

                <span className="hidden xl:inline">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Post & Create Actions */}
        <div className="space-y-2 mt-4">
          <button
            onClick={onOpenQuickPost || (() => onNavigate('/home'))}
            className="w-full flex items-center justify-center gap-2 p-3.5 xl:py-3.5 rounded-full bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 hover:opacity-95 text-slate-950 font-bold text-base transition-opacity shadow-lg shadow-purple-900/30 cursor-pointer"
          >
            <Send className="w-5 h-5 xl:hidden text-slate-950" />
            <span className="hidden xl:inline">Post</span>
          </button>

          {onOpenCreateProject && (
            <button
              onClick={onOpenCreateProject}
              className="w-full flex items-center justify-center gap-2 p-2.5 xl:py-2.5 rounded-full bg-[#0d1224] hover:bg-[#141b33] border border-cyan-500/30 text-cyan-300 font-semibold text-xs xl:text-sm transition-all cursor-pointer shadow-sm group"
              title="Create NFT Project"
            >
              <Layers className="w-4 h-4 text-cyan-400 group-hover:rotate-12 transition-transform" />
              <span className="hidden xl:inline">NFT Project</span>
            </button>
          )}
        </div>
      </div>

      {/* Bottom User Profile Capsule */}
      {currentUser && (
        <div className="pt-4 border-t border-white/5">
          <div
            onClick={() => onNavigate('/profile')}
            className="flex items-center justify-between p-2 rounded-2xl hover:bg-white/5 transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <Avatar src={currentUser.photoURL} name={currentUser.displayName} size="md" />
              <div className="hidden xl:block min-w-0 flex-1 text-left">
                <p className="text-sm font-bold text-white truncate">{currentUser.displayName}</p>
                <p className="text-xs text-purple-400 truncate">@{currentUser.username}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={async (e) => {
                e.stopPropagation();
                await signOut();
                onNavigate('/');
              }}
              title="Log Out and return to landing page"
              className="hidden xl:inline-flex p-2 text-slate-500 hover:text-rose-400 rounded-full transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};
