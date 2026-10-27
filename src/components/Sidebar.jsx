import React, { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import CreateCommunityModal from './CreateCommunityModal';
import { api } from '../services/api';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0 }
};

const groupChannels = (channels) => {
  const groups = new Map();
  channels.forEach((channel) => {
    const category = channel.category?.trim() || 'General';
    groups.set(category, [...(groups.get(category) || []), channel]);
  });
  return [...groups.entries()];
};

export default function Sidebar({ joinedChannels = [], suggestedChannels = [], isExpanded, isLoading, skills = [], onChannelCreated, onChannelDeleted, user }) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [localChannels, setLocalChannels] = useState(joinedChannels || []);
  const [suggestedList, setSuggestedList] = useState(suggestedChannels || []);
  const [joiningChannels, setJoiningChannels] = useState({});
  const [channelToDelete, setChannelToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  const handleConfirmDelete = async () => {
    if (!channelToDelete) return;
    const chanId = channelToDelete.id || channelToDelete._id;
    setIsDeleting(true);
    try {
      await api.deleteChannel(chanId);
      setLocalChannels(prev => prev.filter(c => c.id !== chanId && c._id !== chanId));
      onChannelDeleted?.(chanId);
      if (typeof window !== 'undefined' && window.location.pathname.includes(chanId)) {
        navigate('/dashboard');
      }
      setChannelToDelete(null);
    } catch (err) {
      console.error('Failed to delete channel:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const fetchSuggestedChannels = async () => {
    try {
      const data = await api.getSuggestedChannels();
      if (Array.isArray(data)) {
        setSuggestedList(data);
      }
    } catch (err) {
      console.error('Failed to load suggested channels:', err);
    }
  };

  useEffect(() => {
    fetchSuggestedChannels();
  }, []);

  useEffect(() => {
    setLocalChannels(joinedChannels || []);
  }, [joinedChannels]);

  useEffect(() => {
    if (suggestedChannels && suggestedChannels.length > 0 && suggestedList.length === 0) {
      setSuggestedList(suggestedChannels);
    }
  }, [suggestedChannels]);

  const handleJoinChannel = async (e, channel) => {
    e.preventDefault();
    e.stopPropagation();
    const chanId = channel.id || channel._id;
    if (!chanId) return;

    setJoiningChannels(prev => ({ ...prev, [chanId]: true }));
    try {
      await api.joinChannel(chanId);
      // Remove from suggested list
      setSuggestedList(prev => prev.filter(c => (c.id !== chanId && c._id !== chanId)));
      // Add to localChannels
      const joinedChan = {
        ...channel,
        id: chanId,
        _id: chanId,
        memberCount: (channel.memberCount || 1) + 1,
        isMember: true
      };
      setLocalChannels(prev => {
        const exists = prev.some(c => (c.id === chanId || c._id === chanId));
        if (exists) return prev;
        return [joinedChan, ...prev];
      });
      if (onChannelCreated) {
        onChannelCreated(joinedChan);
      }
      navigate(`/dashboard/channels/${chanId}`);
    } catch (err) {
      console.error('Failed to join channel:', err);
    } finally {
      setJoiningChannels(prev => ({ ...prev, [chanId]: false }));
    }
  };

  const handleChannelSuccess = (newChannel) => {
    const formattedChan = {
      ...newChannel,
      id: newChannel.id || newChannel._id,
      _id: newChannel._id || newChannel.id,
      name: newChannel.name,
      skillId: newChannel.skillId,
      memberCount: newChannel.memberCount || 1,
      unreadCount: 0
    };

    setLocalChannels(prev => {
      const exists = prev.some(c => (c.id === formattedChan.id || c._id === formattedChan.id));
      if (exists) return prev;
      return [formattedChan, ...prev];
    });

    if (onChannelCreated) {
      onChannelCreated(formattedChan);
    }

    if (formattedChan.id) {
      navigate(`/dashboard/channels/${formattedChan.id}`);
    }
  };

  return (
    <aside 
      className={`fixed left-0 top-0 h-full bg-surface-container-lowest border-r border-white/[0.08] z-50 flex flex-col transition-all duration-300 ${
        isExpanded ? 'w-[260px]' : 'w-[80px]'
      } overflow-hidden`}
    >
      <Link 
        to="/dashboard"
        className={`p-6 mb-4 flex items-center ${isExpanded ? 'gap-3' : 'justify-center'} h-[80px] hover:opacity-90 transition-opacity cursor-pointer`}
      >
        <div className="w-8 h-8 shrink-0 bg-primary rounded flex items-center justify-center">
          <span className="material-symbols-outlined text-on-primary">hub</span>
        </div>
        {isExpanded && (
          <span className="font-headline-lg text-lg tracking-tighter text-on-surface whitespace-nowrap">
            SKILL NEXUS
          </span>
        )}
      </Link>

      <nav className="flex-1 overflow-y-auto px-4 custom-scrollbar">
        {isLoading ? (
          <div className="space-y-4">
            <div className="h-4 bg-white/5 rounded w-24 mb-4"></div>
            {[1, 2, 3].map(i => (
              <div key={i} className="h-10 bg-white/5 rounded-lg w-full animate-pulse"></div>
            ))}
          </div>
        ) : (
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex flex-col gap-6">
            
            {/* Top Navigation: Dashboard, Matchmaking, Growth Hub, Messages */}
            <div>
              <div className="space-y-1">
                <motion.div variants={itemVariants}>
                  <NavLink
                    to="/dashboard"
                    end
                    title="Dashboard"
                    className={({ isActive }) =>
                      `group flex items-center justify-between py-2 rounded-lg transition-all duration-300 ${
                        isActive
                          ? 'bg-surface-variant text-on-surface ring-1 ring-white/[0.08]'
                          : 'text-on-surface-variant hover:bg-surface-variant'
                      } ${isExpanded ? 'px-4' : 'px-0 justify-center'}`
                    }
                  >
                    <div className={`flex items-center ${isExpanded ? 'gap-3' : 'justify-center w-full'}`}>
                      <span className="material-symbols-outlined text-[20px]">dashboard</span>
                      {isExpanded && <span className="truncate max-w-[170px]">Dashboard</span>}
                    </div>
                  </NavLink>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <NavLink
                    to="/dashboard/matchmaking"
                    title="Matchmaking"
                    className={({ isActive }) =>
                      `group flex items-center justify-between py-2 rounded-lg transition-all duration-300 ${
                        isActive 
                          ? 'bg-surface-variant text-on-surface ring-1 ring-white/[0.08]' 
                          : 'text-on-surface-variant hover:bg-surface-variant'
                      } ${isExpanded ? 'px-4' : 'px-0 justify-center'}`
                    }
                  >
                    <div className={`flex items-center ${isExpanded ? 'gap-3' : 'justify-center w-full'}`}>
                      <span className="material-symbols-outlined text-[20px]">groups</span>
                      {isExpanded && <span className="truncate max-w-[170px]">Matchmaking</span>}
                    </div>
                  </NavLink>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <NavLink
                    to="/dashboard/mentorship"
                    title="Growth Hub"
                    className={({ isActive }) =>
                      `group flex items-center justify-between py-2 rounded-lg transition-all duration-300 ${
                        isActive 
                          ? 'bg-surface-variant text-on-surface ring-1 ring-white/[0.08]' 
                          : 'text-on-surface-variant hover:bg-surface-variant'
                      } ${isExpanded ? 'px-4' : 'px-0 justify-center'}`
                    }
                  >
                    <div className={`flex items-center ${isExpanded ? 'gap-3' : 'justify-center w-full'}`}>
                      <span className="material-symbols-outlined text-[20px]">school</span>
                      {isExpanded && <span className="truncate max-w-[170px]">Growth Hub</span>}
                    </div>
                  </NavLink>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <NavLink
                    to="/dashboard/messages"
                    title="Messages"
                    className={({ isActive }) =>
                      `group flex items-center justify-between py-2 rounded-lg transition-all duration-300 ${
                        isActive
                          ? 'bg-surface-variant text-on-surface ring-1 ring-white/[0.08]'
                          : 'text-on-surface-variant hover:bg-surface-variant'
                      } ${isExpanded ? 'px-4' : 'px-0 justify-center'}`
                    }
                  >
                    <div className={`flex items-center ${isExpanded ? 'gap-3' : 'justify-center w-full'}`}>
                      <span className="material-symbols-outlined text-[20px]">chat</span>
                      {isExpanded && <span className="truncate max-w-[170px]">Messages</span>}
                    </div>
                  </NavLink>
                </motion.div>
              </div>
            </div>

            {/* My Communities */}
            <div>
              {isExpanded ? (
                <div className="flex items-center justify-between px-4 mb-2">
                  <h3 className="font-mono-sm text-on-tertiary-container uppercase tracking-wider text-xs whitespace-nowrap">
                    My Communities
                  </h3>
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="w-6 h-6 rounded flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-white/[0.08] transition-colors cursor-pointer"
                    title="Create Community"
                    aria-label="Create Community"
                  >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                  </button>
                </div>
              ) : (
                <div className="flex justify-center mb-2">
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-white/[0.08] transition-colors cursor-pointer"
                    title="Create Community"
                    aria-label="Create Community"
                  >
                    <span className="material-symbols-outlined text-[20px]">add</span>
                  </button>
                </div>
              )}
              <div className="space-y-1">
                {localChannels.length === 0 ? (
                  isExpanded && (
                    <div className="px-4 py-2 text-xs text-on-surface-variant/70 italic">
                      No communities joined yet.
                    </div>
                  )
                ) : (
                  groupChannels(localChannels).map(([category, categoryChannels]) => (
                    <div key={category}>
                      {isExpanded && <p className="px-4 pt-2 pb-1 text-[10px] font-mono-sm uppercase tracking-wider text-on-surface-variant/70">{category}</p>}
                      {categoryChannels.map(channel => {
                        const skill = skills?.find(s => s.id === channel.skillId);
                        const currentUserId = user?.id || user?._id;
                        const isOwner = Boolean(
                          channel.isAdmin ||
                          (currentUserId && (
                            String(channel.admin) === String(currentUserId) ||
                            (channel.admin?._id && String(channel.admin._id) === String(currentUserId))
                          ))
                        );
                        return (
                          <motion.div key={channel.id} variants={itemVariants}>
                            <NavLink
                              to={`/dashboard/channels/${channel.id}`}
                              title={channel.name}
                              className={({ isActive }) =>
                                `group flex items-center justify-between py-2 rounded-lg transition-all duration-300 ${
                                  isActive 
                                    ? 'bg-surface-variant text-on-surface ring-1 ring-white/[0.08]' 
                                    : 'text-on-surface-variant hover:bg-surface-variant'
                                } ${isExpanded ? 'px-4' : 'px-0 justify-center'}`
                              }
                            >
                              <div className={`flex items-center min-w-0 ${isExpanded ? 'gap-3 flex-1' : 'justify-center w-full'}`}>
                                {channel.channelType === 'voice' ? (
                                  <span className="material-symbols-outlined text-[18px] text-primary-fixed shrink-0">volume_up</span>
                                ) : channel.channelType === 'forum' ? (
                                  <span className="material-symbols-outlined text-[18px] text-primary-fixed shrink-0">forum</span>
                                ) : (
                                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: skill?.colorAccent || '#8c937e' }} />
                                )}
                                {isExpanded && <span className="truncate max-w-[170px]">{channel.name}</span>}
                              </div>
                              <div className="flex items-center">
                                {isExpanded && channel.unreadCount > 0 && (
                                  <span className="bg-secondary-container text-on-secondary-container font-mono-sm px-1.5 rounded shrink-0 ml-1">
                                    {channel.unreadCount}
                                  </span>
                                )}
                                {isExpanded && isOwner && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setChannelToDelete(channel);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 p-1 text-on-surface-variant hover:text-error hover:bg-error/15 rounded transition-all shrink-0 cursor-pointer ml-1"
                                    title={`Delete ${channel.name}`}
                                    aria-label={`Delete ${channel.name}`}
                                  >
                                    <span className="material-symbols-outlined text-[15px]">delete</span>
                                  </button>
                                )}
                              </div>
                            </NavLink>
                          </motion.div>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Suggested Channels */}
            {suggestedList.length > 0 && (
              <div>
                {isExpanded && (
                  <h3 className="font-mono-sm text-on-tertiary-container uppercase tracking-wider text-xs px-4 mb-2 whitespace-nowrap">
                    Suggested Channels
                  </h3>
                )}
                <div className="space-y-1">
                  {groupChannels(suggestedList).map(([category, categoryChannels]) => (
                    <div key={`suggested-${category}`}>
                      {isExpanded && <p className="px-4 pt-2 pb-1 text-[10px] font-mono-sm uppercase tracking-wider text-on-surface-variant/70">{category}</p>}
                      {categoryChannels.map(channel => {
                        const chanId = channel.id || channel._id;
                        const skill = skills?.find(s => s.id === channel.skillId);
                        const isJoining = joiningChannels[chanId];
                        return (
                          <motion.div key={chanId} variants={itemVariants}>
                            <div className={`group flex items-center justify-between rounded-lg hover:bg-surface-variant transition-all duration-300 ${isExpanded ? 'px-3 pr-2' : 'px-0 justify-center'}`}>
                              <NavLink
                                to={`/dashboard/channels/${chanId}`}
                                title={`Preview ${channel.name}`}
                                className={({ isActive }) =>
                                  `flex items-center min-w-0 flex-1 py-2 text-on-surface-variant hover:text-on-surface transition-colors ${isActive ? 'text-primary font-medium' : ''} ${isExpanded ? 'gap-2.5' : 'justify-center w-full'}`
                                }
                              >
                                <span 
                                  className="material-symbols-outlined text-[18px] shrink-0"
                                  style={{ color: skill?.colorAccent || '#8c937e' }}
                                >
                                  {channel.channelType === 'voice' ? 'volume_up' : channel.channelType === 'forum' ? 'forum' : 'tag'}
                                </span>
                                {isExpanded && <span className="truncate max-w-[120px] text-xs">{channel.name}</span>}
                              </NavLink>

                              {isExpanded && (
                                <button
                                  type="button"
                                  onClick={(e) => handleJoinChannel(e, channel)}
                                  disabled={isJoining}
                                  className="text-[11px] font-mono-sm px-2 py-0.5 rounded bg-primary/15 text-primary hover:bg-primary hover:text-on-primary transition-all shrink-0 cursor-pointer disabled:opacity-50"
                                  title={`Join ${channel.name}`}
                                >
                                  {isJoining ? '...' : 'Join'}
                                </button>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
          </motion.div>
        )}
      </nav>

      {isCreateModalOpen && (
        <CreateCommunityModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleChannelSuccess}
          skills={skills}
        />
      )}

      {/* Delete Community Modal in Sidebar */}
      {channelToDelete && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container border border-white/[0.08] rounded-xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-error mb-4">
              <div className="w-10 h-10 rounded-full bg-error/15 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">warning</span>
              </div>
              <div>
                <h3 className="font-headline-sm text-lg font-semibold text-on-surface">Delete Community</h3>
                <p className="text-xs text-on-surface-variant font-mono-sm">This action cannot be undone</p>
              </div>
            </div>

            <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
              Are you sure you want to permanently delete <span className="font-semibold text-on-surface">#{channelToDelete.name.replace(/^#/, '')}</span>? All discussions, messages, attachments, and associated events will be permanently removed.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setChannelToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg text-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg text-sm bg-error text-white hover:bg-error/90 transition-colors font-medium flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">delete_forever</span>
                    <span>Delete Community</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
