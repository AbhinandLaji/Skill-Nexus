import React, { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import CreateCommunityModal from './CreateCommunityModal';

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

export default function Sidebar({ joinedChannels = [], suggestedChannels = [], isExpanded, isLoading, skills = [], onChannelCreated }) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [localChannels, setLocalChannels] = useState(joinedChannels || []);
  const navigate = useNavigate();

  useEffect(() => {
    setLocalChannels(joinedChannels || []);
  }, [joinedChannels]);

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
          <motion.div variants={containerVariants} initial="hidden" animate="show">
            
            <div className="mb-8">
              {isExpanded ? (
                <div className="flex items-center justify-between px-4 mb-4">
                  <h3 className="font-mono-sm text-on-tertiary-container uppercase whitespace-nowrap">
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
                <div className="flex justify-center mb-4">
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
                  localChannels.map(channel => {
                    const skill = skills?.find(s => s.id === channel.skillId);
                    return (
                      <motion.div key={channel.id} variants={itemVariants}>
                        <NavLink
                          to={`/dashboard/channels/${channel.id}`}
                          className={({ isActive }) =>
                            `group flex items-center justify-between py-2 rounded-lg transition-all duration-300 ${
                              isActive 
                                ? 'bg-surface-variant text-on-surface ring-1 ring-white/[0.08]' 
                                : 'text-on-surface-variant hover:bg-surface-variant'
                            } ${isExpanded ? 'px-4' : 'px-0 justify-center'}`
                          }
                        >
                          <div className={`flex items-center ${isExpanded ? 'gap-3' : 'justify-center w-full'}`}>
                            <div 
                              className="w-2 h-2 rounded-full shrink-0" 
                              style={{ backgroundColor: skill?.colorAccent || '#8c937e' }}
                            ></div>
                            {isExpanded && <span className="truncate max-w-[120px]">{channel.name}</span>}
                          </div>
                          {isExpanded && channel.unreadCount > 0 && (
                            <span className="bg-secondary-container text-on-secondary-container font-mono-sm px-1.5 rounded">
                              {channel.unreadCount}
                            </span>
                          )}
                        </NavLink>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="mb-8">
              {isExpanded && (
                <h3 className="font-mono-sm text-on-tertiary-container uppercase px-4 mb-4 whitespace-nowrap">
                  Suggested For You
                </h3>
              )}
              <div className="space-y-1">
                <motion.div variants={itemVariants}>
                  <NavLink
                    to="/dashboard/matchmaking"
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
                      {isExpanded && <span className="truncate max-w-[120px]">Matchmaking</span>}
                    </div>
                  </NavLink>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <NavLink
                    to="/dashboard/mentorship"
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
                      {isExpanded && <span className="truncate max-w-[120px]">Growth Hub</span>}
                    </div>
                  </NavLink>
                </motion.div>

                {suggestedChannels.map(channel => {
                  const skill = skills?.find(s => s.id === channel.skillId);
                  return (
                    <motion.div key={channel.id} variants={itemVariants}>
                      <NavLink
                        to={`/dashboard/channels/${channel.id}`}
                        className={({ isActive }) =>
                          `group flex items-center justify-between py-2 rounded-lg transition-all duration-300 ${
                            isActive 
                              ? 'bg-surface-variant text-on-surface ring-1 ring-white/[0.08]' 
                              : 'text-on-surface-variant hover:bg-surface-variant'
                          } ${isExpanded ? 'px-4' : 'px-0 justify-center'}`
                        }
                      >
                        <div className={`flex items-center ${isExpanded ? 'gap-3' : 'justify-center w-full'}`}>
                          <span 
                            className="material-symbols-outlined text-[20px]"
                            style={{ color: skill?.colorAccent || '#8c937e' }}
                          >
                            tag
                          </span>
                          {isExpanded && <span className="truncate max-w-[120px]">{channel.name}</span>}
                        </div>
                      </NavLink>
                    </motion.div>
                  );
                })}
              </div>
            </div>
            
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
    </aside>
  );
}
