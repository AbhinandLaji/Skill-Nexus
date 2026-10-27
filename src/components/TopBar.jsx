import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import NotificationDropdown from './NotificationDropdown';
import { api } from '../services/api';

export default function TopBar({ user, _skills, isSidebarExpanded, setIsSidebarExpanded }) {
  const navigate = useNavigate();
  const notifButtonRef = useRef(null);
  const searchContainerRef = useRef(null);

  const [notifications, setNotifications] = useState([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isLoadingNotifs, setIsLoadingNotifs] = useState(false);

  // Global search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [joiningChannels, setJoiningChannels] = useState({});
  const [joinedMap, setJoinedMap] = useState({});

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      setIsSearchDropdownOpen(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setIsSearchDropdownOpen(true);

    const timeout = setTimeout(async () => {
      try {
        const data = await api.search(searchQuery.trim());
        setSearchResults(data);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsSearchDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleJoinCommunity = async (e, channel) => {
    e.preventDefault();
    e.stopPropagation();
    if (!channel?.id && !channel?._id) return;
    const chanId = channel.id || channel._id;
    setJoiningChannels(prev => ({ ...prev, [chanId]: true }));
    try {
      await api.joinChannel(chanId);
      setJoinedMap(prev => ({ ...prev, [chanId]: true }));
      setIsSearchDropdownOpen(false);
      setSearchQuery('');
      navigate(`/dashboard/channels/${chanId}`);
    } catch (err) {
      console.error('Failed to join channel from search:', err);
    } finally {
      setJoiningChannels(prev => ({ ...prev, [chanId]: false }));
    }
  };

  const handleSelectChannel = (channelId) => {
    setIsSearchDropdownOpen(false);
    setSearchQuery('');
    navigate(`/dashboard/channels/${channelId}`);
  };

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
  const communityResults = searchResults?.communities || searchResults?.channels || [];
  const skillResults = searchResults?.skills || [];
  const teamResults = searchResults?.teams || searchResults?.projects || [];
  const hasResults = communityResults.length > 0 || skillResults.length > 0 || teamResults.length > 0;

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
        
        {/* Global Search Bar Container */}
        <div ref={searchContainerRef} className="relative flex items-center flex-1">
          <span className="material-symbols-outlined absolute left-3 text-on-surface-variant text-[20px] pointer-events-none">search</span>
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => {
              if (searchQuery.trim()) setIsSearchDropdownOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setIsSearchDropdownOpen(false);
            }}
            placeholder="Search skills, teams, or projects..." 
            className="w-full bg-surface-container-low border border-white/[0.08] rounded-lg py-2 pl-10 pr-10 text-sm focus:outline-none focus:border-primary transition-colors text-on-surface placeholder:text-on-surface-variant"
          />

          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setIsSearchDropdownOpen(false);
              }}
              className="absolute right-3 text-on-surface-variant hover:text-on-surface transition-colors"
              aria-label="Clear search"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}

          {/* Search Dropdown */}
          {isSearchDropdownOpen && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-surface-container border border-white/[0.1] rounded-xl shadow-2xl overflow-hidden z-50 backdrop-blur-xl max-h-[440px] overflow-y-auto">
              {isSearching && (
                <div className="p-4 text-center text-xs text-on-surface-variant flex items-center justify-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                  <span>Searching communities, skills, and teams...</span>
                </div>
              )}

              {/* Communities / Channels Section */}
              {communityResults.length > 0 && (
                <div className="p-2">
                  <div className="px-3 py-1.5 text-[11px] font-mono-sm uppercase tracking-wider text-primary flex items-center justify-between border-b border-white/[0.04] mb-1">
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[15px]">hub</span>
                      Communities
                    </span>
                    <span className="text-[10px] text-on-surface-variant font-normal">{communityResults.length} found</span>
                  </div>

                  <div className="space-y-1">
                    {communityResults.map((channel) => {
                      const isJoined = channel.isMember || joinedMap[channel.id];
                      return (
                        <div
                          key={channel.id}
                          onClick={() => handleSelectChannel(channel.id)}
                          className="flex items-center justify-between gap-3 p-2.5 rounded-lg hover:bg-surface-container-high transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <span className="w-7 h-7 rounded-md bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0 text-xs font-mono-sm">
                              {channel.channelType === 'voice' ? (
                                <span className="material-symbols-outlined text-[16px]">volume_up</span>
                              ) : channel.channelType === 'forum' ? (
                                <span className="material-symbols-outlined text-[16px]">forum</span>
                              ) : (
                                '#'
                              )}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-on-surface truncate group-hover:text-primary transition-colors">
                                  {channel.name}
                                </p>
                                <span className="text-[10px] font-mono-sm px-1.5 py-0.5 bg-white/5 rounded text-on-surface-variant shrink-0">
                                  {channel.category || 'General'}
                                </span>
                              </div>
                              {channel.description && (
                                <p className="text-xs text-on-surface-variant truncate mt-0.5">
                                  {channel.description}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[11px] font-mono-sm text-on-surface-variant hidden sm:inline">
                              {channel.memberCount} {channel.memberCount === 1 ? 'member' : 'members'}
                            </span>
                            {isJoined ? (
                              <span className="px-2.5 py-1 text-xs font-mono-sm rounded bg-white/10 text-on-surface-variant flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">check</span>
                                Joined
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => handleJoinCommunity(e, channel)}
                                disabled={joiningChannels[channel.id]}
                                className="px-3 py-1 text-xs font-button-text rounded bg-primary text-on-primary hover:bg-primary/90 transition-all shadow-sm flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              >
                                {joiningChannels[channel.id] ? (
                                  <span className="inline-block w-3 h-3 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></span>
                                ) : (
                                  <>
                                    <span className="material-symbols-outlined text-[14px]">add</span>
                                    Join
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Skills Section */}
              {skillResults.length > 0 && (
                <div className="p-2 border-t border-white/[0.04]">
                  <div className="px-3 py-1 text-[11px] font-mono-sm uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5 mb-1">
                    <span className="material-symbols-outlined text-[14px]">psychology</span>
                    Skills
                  </div>
                  <div className="flex flex-wrap gap-1.5 px-3 py-1">
                    {skillResults.map(s => (
                      <span
                        key={s.id}
                        className="text-xs px-2 py-0.5 rounded-full border border-white/10 bg-white/5 text-on-surface flex items-center gap-1"
                        style={{ borderColor: s.colorAccent ? `${s.colorAccent}40` : undefined }}
                      >
                        {s.colorAccent && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.colorAccent }}></span>}
                        {s.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Teams & Projects Section */}
              {teamResults.length > 0 && (
                <div className="p-2 border-t border-white/[0.04]">
                  <div className="px-3 py-1 text-[11px] font-mono-sm uppercase tracking-wider text-secondary flex items-center gap-1.5 mb-1">
                    <span className="material-symbols-outlined text-[14px]">groups</span>
                    Teams & Projects
                  </div>
                  <div className="space-y-1">
                    {teamResults.map(t => (
                      <div
                        key={t.id}
                        onClick={() => {
                          setIsSearchDropdownOpen(false);
                          navigate('/dashboard/matchmaking');
                        }}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-container-high cursor-pointer transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-on-surface truncate">{t.title}</p>
                          <p className="text-xs text-on-surface-variant truncate">{t.projectType || 'Matchmaking Team'}</p>
                        </div>
                        <span className="material-symbols-outlined text-on-surface-variant text-[16px]">chevron_right</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state */}
              {!isSearching && !hasResults && (
                <div className="p-6 text-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-3xl mb-1 text-on-surface-variant/50">search_off</span>
                  <p className="text-sm font-medium text-on-surface">No results found</p>
                  <p className="text-xs mt-0.5">No communities, skills, or teams match "{searchQuery}"</p>
                </div>
              )}
            </div>
          )}
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
                  src={user.avatar.startsWith('/uploads') ? `${import.meta.env.VITE_BACKEND_URL}${user.avatar}` : user.avatar} 
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
