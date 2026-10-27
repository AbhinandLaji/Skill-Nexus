import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export default function ActivityFeedItem({ item, colorClass }) {
  const navigate = useNavigate();
  const [isJoining, setIsJoining] = useState(false);
  const [isJoined, setIsJoined] = useState(item.isMember || false);
  const [joinError, setJoinError] = useState('');

  const isCommunityCreated = item.type === 'COMMUNITY_CREATED';
  const rawChannelName = item.channelName || item.channel?.name || '';
  const channelDisplayName = rawChannelName ? (rawChannelName.startsWith('#') ? rawChannelName : `#${rawChannelName}`) : '#community';
  const channelId = item.channelId || item.channel?.id || item.channel?._id || item.channel;

  const handleJoinCommunity = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!channelId || isJoined) {
      if (channelId) navigate(`/dashboard/channels/${channelId}`);
      return;
    }

    setIsJoining(true);
    setJoinError('');
    try {
      await api.joinChannel(channelId);
      setIsJoined(true);
      navigate(`/dashboard/channels/${channelId}`);
    } catch (err) {
      if (err.message && err.message.toLowerCase().includes('already a member')) {
        setIsJoined(true);
        navigate(`/dashboard/channels/${channelId}`);
      } else {
        setJoinError(err.message || 'Failed to join');
      }
    } finally {
      setIsJoining(false);
    }
  };

  const authorName = item.authorName || item.userName || 'User';
  const displayText = isCommunityCreated
    ? `${authorName} created a new community: ${channelDisplayName}`
    : item.text;

  return (
    <div className="relative bg-surface-container-low rounded-lg border border-white/[0.08] p-5 overflow-hidden group">
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${colorClass || (isCommunityCreated ? 'bg-primary' : 'bg-primary')}`}></div>

      <div className="flex gap-4">
        <div className="w-10 h-10 rounded-sm bg-surface-container-high border border-white/[0.08] flex items-center justify-center shrink-0 overflow-hidden">
          {item.authorAvatar ? (
            <img src={item.authorAvatar.startsWith('/uploads') ? `${import.meta.env.VITE_BACKEND_URL}${item.authorAvatar}` : item.authorAvatar} alt={authorName} className="w-full h-full object-cover" />
          ) : (
            <span className="material-symbols-outlined text-on-surface-variant">
              {isCommunityCreated ? 'hub' : 'person'}
            </span>
          )}
        </div>

        <div className="flex flex-col flex-1 gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-button-text text-button-text text-on-surface">{authorName}</span>
              <span className="font-mono-sm text-mono-sm text-on-surface-variant/60">• {item.timeAgo || 'Recently'}</span>
            </div>
            <span
              className="font-mono-sm text-mono-sm px-2 py-0.5 rounded-sm border"
              style={{
                color: item.skillColor || (isCommunityCreated ? '#a855f7' : '#4bb1f9'),
                borderColor: `${item.skillColor || (isCommunityCreated ? '#a855f7' : '#4bb1f9')}40`,
                backgroundColor: `${item.skillColor || (isCommunityCreated ? '#a855f7' : '#4bb1f9')}15`
              }}
            >
              {isCommunityCreated ? 'Community' : (item.skillName || 'General')}
            </span>
          </div>

          <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
            {displayText}
          </p>

          {isCommunityCreated && item.channelDescription && (
            <p className="text-xs text-on-surface-variant/80 italic mt-0.5">
              "{item.channelDescription}"
            </p>
          )}

          {/* Quick "Join Community" button for COMMUNITY_CREATED activity type */}
          {isCommunityCreated && (
            <div className="mt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={handleJoinCommunity}
                disabled={isJoining}
                className={`font-button-text text-xs px-4 py-1.5 rounded-md transition-all flex items-center gap-1.5 shadow-sm cursor-pointer ${
                  isJoined
                    ? 'bg-white/10 text-on-surface-variant hover:bg-white/15'
                    : 'bg-primary text-on-primary hover:bg-primary/90 hover:scale-[1.02]'
                }`}
              >
                {isJoining ? (
                  <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                ) : isJoined ? (
                  <>
                    <span className="material-symbols-outlined text-[16px]">check</span>
                    Joined Community
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">group_add</span>
                    Join Community
                  </>
                )}
              </button>
              {joinError && <span className="text-xs text-error font-mono-sm">{joinError}</span>}
            </div>
          )}

          {item.codeSnippet && (
            <div className="bg-surface-dim rounded-sm p-3 mt-2 border border-white/[0.04] font-mono-sm text-mono-sm text-on-surface-variant overflow-x-auto">
              <code>{item.codeSnippet.code}</code>
            </div>
          )}

          {item.attachment && item.attachment.type === 'image' && (
            <div className="mt-3 w-full h-32 rounded-sm border border-white/[0.08] overflow-hidden relative group-hover:border-primary/30 transition-colors">
              <div
                className="bg-cover bg-center w-full h-full opacity-60 mix-blend-screen"
                style={{ backgroundImage: `url('${item.attachment.url}')` }}
              ></div>
              {item.attachment.cta && (
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent flex items-end p-4">
                  <button className="bg-primary text-background font-button-text px-4 py-1.5 rounded-sm hover:scale-[1.02] transition-transform duration-150">
                    {item.attachment.cta}
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/[0.04]">
            <button className="flex items-center gap-1.5 text-on-surface-variant hover:text-primary transition-colors font-mono-sm">
              <span className="material-symbols-outlined text-[16px]">terminal</span> Reply
            </button>
            <button className="flex items-center gap-1.5 text-on-surface-variant hover:text-secondary transition-colors font-mono-sm">
              <span className="material-symbols-outlined text-[16px]">favorite</span> {item.likes || 0}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
