import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import NotificationDropdown from './NotificationDropdown';
import { api } from '../services/api';

export default function TopBar({ user, _skills, isSidebarExpanded, setIsSidebarExpanded }) {
  const notifButtonRef = useRef(null);
  const [notifications, setNotifications] = useState([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isLoadingNotifs, setIsLoadingNotifs] = useState(false);

  const fetchNotifications = async () => {
    try {
      setIsLoadingNotifs(true);
      const data = await api.getNotifications();
      if (Array.isArray(data)) {
        setNotifications(data);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setIsLoadingNotifs(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRespondNotification = async (id, action) => {
    try {
      await api.respondToNotification(id, action);
      setNotifications(prev =>
        prev.map(n =>
          n.id === id ? { ...n, status: action === 'accept' ? 'accepted' : 'declined' } : n
        )
      );
    } catch (err) {
      console.error('Failed to respond to notification:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markNotificationsRead();
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true, status: n.status === 'pending' ? 'read' : n.status }))
      );
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const unreadCount = notifications.filter(n => !n.read && n.status !== 'read' && n.status !== 'accepted' && n.status !== 'declined').length;
  return (
    <header 
      className={`fixed top-0 right-0 h-16 bg-background/80 backdrop-blur-xl border-b border-white/[0.08] z-40 px-4 lg:px-8 flex items-center justify-between transition-all duration-300 ${
        isSidebarExpanded ? 'left-[260px]' : 'left-[80px]'
      }`}
    >
      <div className="flex items-center flex-1 max-w-xl gap-4">
        {/* Hamburger for mobile, or to toggle on desktop if desired */}
        <button 
          className="lg:hidden text-on-surface-variant hover:text-on-surface"
          onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        
        <div className="relative flex items-center flex-1">
          <span className="material-symbols-outlined absolute left-3 text-on-surface-variant">search</span>
          <input 
            type="text" 
            placeholder="Search skills, teams, or projects..." 
            className="w-full bg-surface-container-low border border-white/[0.08] rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-4 lg:gap-6 ml-4">
        {/* Notifications Icon Button & Dropdown */}
        <div className="relative">
          <button
            ref={notifButtonRef}
            type="button"
            onClick={() => setIsNotificationsOpen(prev => !prev)}
            className="relative cursor-pointer p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-white/[0.05] transition-colors focus:outline-none flex items-center justify-center"
            aria-label="Notifications"
          >
            <span className="material-symbols-outlined text-[22px]">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-secondary text-on-secondary rounded-full text-[10px] font-mono-sm flex items-center justify-center shadow-md animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <NotificationDropdown
            isOpen={isNotificationsOpen}
            onClose={() => setIsNotificationsOpen(false)}
            triggerRef={notifButtonRef}
            notifications={notifications}
            onRespond={handleRespondNotification}
            onMarkAllRead={handleMarkAllRead}
            isLoading={isLoadingNotifs}
          />
        </div>
        
        {/* Profile Button / Link */}
        {user ? (
          <Link 
            to="/dashboard/profile" 
            className="flex items-center gap-3 py-1.5 px-2.5 rounded-xl hover:bg-white/[0.06] border border-transparent hover:border-white/[0.08] transition-all cursor-pointer group"
            title="View Profile"
          >
            <span className="hidden md:inline text-sm font-button-text text-on-surface group-hover:text-primary transition-colors">
              {user.name || 'Profile'}
            </span>
            <div className="flex-shrink-0">
              {user.avatar ? (
                <img 
                  src={user.avatar.startsWith('/uploads') ? `http://localhost:5000${user.avatar}` : user.avatar} 
                  alt={user.name || 'User'} 
                  className="w-8 h-8 rounded-full border border-white/[0.1] object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary font-medium text-xs shadow-sm group-hover:scale-105 transition-transform">
                  {user.name ? user.name.charAt(0).toUpperCase() : (
                    <span className="material-symbols-outlined text-[18px]">person</span>
                  )}
                </div>
              )}
            </div>
          </Link>
        ) : (
          <Link 
            to="/dashboard/profile" 
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container border border-white/[0.08] hover:bg-surface-variant hover:border-white/[0.15] transition-all text-on-surface text-sm cursor-pointer shadow-sm"
            title="View Profile"
          >
            <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">person</span>
            </div>
            <span className="hidden sm:inline font-button-text text-sm">Profile</span>
          </Link>
        )}
      </div>
    </header>
  );
}
