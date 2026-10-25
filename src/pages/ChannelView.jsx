import React, { useState, useEffect } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import ChatArea from '../components/ChatArea';
import MessageInput from '../components/MessageInput';
import VoiceChannel from '../components/VoiceChannel';
import ForumChannel from '../components/ForumChannel';
import CommunityEvents from '../components/CommunityEvents';
import MessageThread from '../components/MessageThread';
import { getRealtimeSocket } from '../services/realtime';

const mergeMessages = (...groups) => {
  const messagesById = new Map();
  groups.flat().forEach((message) => {
    if (message?.id) messagesById.set(message.id, message);
  });
  return [...messagesById.values()];
};

export default function ChannelView() {
  const { channelId } = useParams();
  const { channels = [], onChannelUpdated, user } = useOutletContext() || {};
  const currentUserId = user?.id || user?._id;
  const [messages, setMessages] = useState([]);
  const [channel, setChannel] = useState(null);
  const [channelError, setChannelError] = useState('');
  const [busy, setBusy] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [notice, setNotice] = useState('');
  const [showMembers, setShowMembers] = useState(false);
  const [isPinnedOpen, setIsPinnedOpen] = useState(false);
  const [isFilesOpen, setIsFilesOpen] = useState(false);
  const [showEvents, setShowEvents] = useState(false);
  const [threadMessage, setThreadMessage] = useState(null);
  const [pinnedMessages, setPinnedMessages] = useState([]);

  // Fetch live messages whenever channelId changes
  useEffect(() => {
    let isMounted = true;
    async function fetchChannelMessages() {
      if (!channelId) return;
      setMessages([]);
      setChannelError('');
      try {
        const details = await api.getChannel(channelId);
        if (isMounted) {
          setChannel(details);
          onChannelUpdated?.(details);
        }
        const data = await api.getMessages(channelId);
        if (isMounted) {
          setMessages(previous => mergeMessages(Array.isArray(data) ? data : [], previous));
        }
      } catch (err) {
        if (isMounted) setChannelError(err.message || 'Could not load this channel.');
        if (isMounted) {
          setMessages([]);
        }
      }
    }

    fetchChannelMessages();
    return () => {
      isMounted = false;
    };
  }, [channelId]);

  useEffect(() => {
    if (!channelId) return undefined;

    const socket = getRealtimeSocket();
    const joinChannel = () => socket.emit('channel:join', channelId);
    const handleMessage = (message) => {
      setMessages((previous) => mergeMessages(previous, [message]));
    };
    const handleMessageUpdated = (updated) => {
      const personalized = { ...updated, reactions: (updated.reactions || []).map((reaction) => ({
        ...reaction,
        reactedByMe: reaction.userIds?.some((id) => String(id) === String(currentUserId)) || false
      })) };
      setMessages((previous) => previous.map((message) => message.id === personalized.id ? personalized : message));
      setPinnedMessages((previous) => personalized.isPinned
        ? [personalized, ...previous.filter((message) => message.id !== personalized.id)]
        : previous.filter((message) => message.id !== personalized.id));
    };
    const handleThreadReply = ({ parentMessageId, threadCount }) => {
      setMessages((previous) => previous.map((message) => message.id === parentMessageId ? { ...message, threadCount } : message));
    };

    socket.on('connect', joinChannel);
    socket.on('channel:message', handleMessage);
    socket.on('channel:message-updated', handleMessageUpdated);
    socket.on('channel:thread-reply', handleThreadReply);
    if (socket.connected) joinChannel();

    return () => {
      socket.emit('channel:leave', channelId);
      socket.off('connect', joinChannel);
      socket.off('channel:message', handleMessage);
      socket.off('channel:message-updated', handleMessageUpdated);
      socket.off('channel:thread-reply', handleThreadReply);
    };
  }, [channelId]);

  useEffect(() => {
    if (!isPinnedOpen || !channelId) return;
    let active = true;
    api.getPinnedMessages(channelId).then((items) => { if (active) setPinnedMessages(items); })
      .catch((error) => { if (active) setChannelError(error.message || 'Could not load pinned messages.'); });
    return () => { active = false; };
  }, [isPinnedOpen, channelId]);

  const refreshChannel = async () => {
    const details = await api.getChannel(channelId);
    setChannel(details);
    onChannelUpdated?.(details);
    return details;
  };

  const handleJoin = async () => {
    setBusy(true); setChannelError('');
    try {
      await api.joinChannel(channelId);
      await refreshChannel();
      getRealtimeSocket().emit('channel:join', channelId);
      const data = await api.getMessages(channelId);
      setMessages(previous => mergeMessages(Array.isArray(data) ? data : [], previous));
      setNotice('You joined this channel.');
    } catch (err) { setChannelError(err.message || 'Unable to join this channel.'); }
    finally { setBusy(false); }
  };

  const handleLeave = async () => {
    setBusy(true); setChannelError('');
    try {
      await api.leaveChannel(channelId);
      await refreshChannel();
      setMessages([]); setNotice('You left this channel.');
    } catch (err) { setChannelError(err.message || 'Unable to leave this channel.'); }
    finally { setBusy(false); }
  };

  const handleInvite = async (event) => {
    event.preventDefault(); setBusy(true); setChannelError('');
    try {
      const result = await api.inviteToChannel(channelId, inviteEmail);
      setInviteEmail(''); setNotice(result.message || 'Invitation created.');
      await refreshChannel();
    } catch (err) { setChannelError(err.message || 'Unable to invite this user.'); }
    finally { setBusy(false); }
  };

  const handleNewMessage = (msg) => {
    setMessages(prev => mergeMessages(prev, [msg]));
  };

  const handleToggleReaction = async (messageId, emoji) => {
    try {
      const updated = await api.toggleMessageReaction(channelId, messageId, emoji);
      setMessages((previous) => previous.map((message) => message.id === messageId ? updated : message));
    } catch (error) { setChannelError(error.message || 'Could not update reaction.'); }
  };

  const handleTogglePin = async (messageId) => {
    try {
      const updated = await api.toggleMessagePin(channelId, messageId);
      setMessages((previous) => previous.map((message) => message.id === messageId ? updated : message));
      setPinnedMessages((previous) => updated.isPinned
        ? [updated, ...previous.filter((message) => message.id !== messageId)]
        : previous.filter((message) => message.id !== messageId));
    } catch (error) { setChannelError(error.message || 'Could not update pin.'); }
  };

  const updateThreadCount = (messageId, threadCount) => {
    setMessages((previous) => previous.map((message) => message.id === messageId ? { ...message, threadCount } : message));
  };

  // Find active channel dynamically from context
  const activeChannel = channels.find(c => c.id === channelId || c._id === channelId || c.name === channelId || c.name === `#${channelId}`);
  const rawName = activeChannel?.name || (!channelId?.match(/^[0-9a-fA-F]{24}$/) && !channelId?.match(/^[0-9a-fA-F-]{36}$/) ? channelId : 'python-help');
  const cleanName = rawName.startsWith('#') ? rawName.slice(1) : rawName;
  const displayChannelName = cleanName;

  const currentChannel = channel || activeChannel;
  const memberCount = currentChannel?.memberCount || currentChannel?.members?.length || 0;
  const isMember = Boolean(currentChannel?.isMember);

  return (
    <div className="flex flex-col w-full h-[calc(100vh-64px)] relative overflow-hidden">
      <div className="flex items-center justify-between px-8 py-6 sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-white/[0.04]">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <h1 className="font-headline-lg text-headline-lg text-on-background flex items-center gap-2">
              <span className="material-symbols-outlined text-primary-fixed">{currentChannel?.channelType === 'voice' ? 'volume_up' : currentChannel?.channelType === 'forum' ? 'forum' : 'tag'}</span>{displayChannelName}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <button onClick={() => setShowMembers(v => !v)} className="font-mono-sm text-mono-sm text-on-surface-variant hover:text-primary">
                {memberCount.toLocaleString()} members
              </button>
              {currentChannel?.isPrivate && <span className="text-xs rounded bg-white/10 px-2 py-1">Private</span>}
              <span className="text-xs rounded bg-primary/10 text-primary px-2 py-1">{currentChannel?.category || 'General'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {currentChannel?.isAdmin && currentChannel?.isPrivate && (
            <form onSubmit={handleInvite} className="flex gap-1">
              <input aria-label="Invite by email" type="email" required placeholder="Invite email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} className="w-36 bg-surface-container rounded px-2 text-xs" />
              <button disabled={busy} className="px-2 rounded bg-primary text-on-primary text-xs">Invite</button>
            </form>
          )}
          {!isMember ? (
            <button onClick={handleJoin} disabled={busy} className="px-3 py-2 rounded-lg bg-primary text-on-primary text-sm">{busy ? 'Please wait…' : 'Join channel'}</button>
          ) : !currentChannel?.isAdmin ? (
            <button onClick={handleLeave} disabled={busy} className="px-3 py-2 rounded-lg bg-surface-container text-on-surface text-sm">Leave</button>
          ) : null}
          {isMember && <button type="button" onClick={() => setShowEvents((value) => !value)} className={`px-3 py-2 rounded-lg text-sm ${showEvents ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface'}`}><span className="material-symbols-outlined align-middle text-[18px] mr-1">event</span>Events</button>}
          {isMember && currentChannel?.channelType === 'text' && <button
            onClick={() => {
              setIsPinnedOpen(prev => !prev);
              setIsFilesOpen(false);
            }}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all p-1 cursor-pointer group ${
              isPinnedOpen
                ? 'bg-primary/20 text-primary border border-primary/40'
                : 'bg-surface-container text-on-surface hover:bg-white/[0.08] hover:text-primary-fixed border border-white/[0.06]'
            }`}
            title="Pinned Messages"
            aria-label="Pinned Messages"
          >
            <span className="material-symbols-outlined text-[20px] transition-colors">push_pin</span>
          </button>}
          
          {isMember && currentChannel?.channelType === 'text' && <button
            onClick={() => {
              setIsFilesOpen(prev => !prev);
              setIsPinnedOpen(false);
            }}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all p-1 cursor-pointer group ${
              isFilesOpen
                ? 'bg-primary/20 text-primary border border-primary/40'
                : 'bg-surface-container text-on-surface hover:bg-white/[0.08] hover:text-primary-fixed border border-white/[0.06]'
            }`}
            title="Shared Resources"
            aria-label="Shared Resources"
          >
            <span className="material-symbols-outlined text-[20px] transition-colors">folder</span>
          </button>}
        </div>
      </div>

      {channelError && <div role="alert" className="mx-6 mt-3 rounded-lg bg-error-container/20 text-error p-3 text-sm">{channelError}</div>}
      {notice && <div role="status" className="mx-6 mt-2 text-xs text-primary">{notice}</div>}
      {showEvents && isMember && <CommunityEvents channelId={channelId} />}
      {showMembers && (
        <section className="mx-6 mt-3 p-4 rounded-xl bg-surface-container border border-white/10">
          <h2 className="font-semibold mb-3">Members ({currentChannel?.members?.length || 0})</h2>
          <ul className="flex flex-wrap gap-3">
            {(currentChannel?.members || []).map(member => <li key={member.id || member._id} className="flex items-center gap-2 text-sm">
              {member.avatar ? <img src={member.avatar} alt="" className="w-7 h-7 rounded-full object-cover" /> : <span className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">{(member.name || '?')[0]}</span>}
              <span>{member.name}{String(member.id || member._id) === String(currentChannel.admin) ? ' · owner' : ''}</span>
            </li>)}
          </ul>
          {currentChannel?.isAdmin && currentChannel?.isPrivate && currentChannel?.pendingInvitations?.length > 0 && <p className="mt-3 text-xs text-on-surface-variant">Pending invitations: {currentChannel.pendingInvitations.join(', ')}</p>}
        </section>
      )}
      {isMember ? currentChannel?.channelType === 'voice' ? (
        <VoiceChannel channelId={channelId} channelName={displayChannelName} />
      ) : currentChannel?.channelType === 'forum' ? (
        <ForumChannel channelId={channelId} />
      ) : <><ChatArea messages={messages} channelId={channelId} canPin={currentChannel?.isAdmin} onOpenThread={setThreadMessage} onToggleReaction={handleToggleReaction} onTogglePin={handleTogglePin} /><MessageInput channelId={channelId} onMessageSent={handleNewMessage} /></> : (
        <div className="flex-1 flex items-center justify-center text-center p-8 text-on-surface-variant">
          {currentChannel?.isPrivate ? 'This private channel is only visible to invited members.' : 'Join this channel to read and send messages.'}
        </div>
      )}

      {/* Conditional UI Slide-out Panels */}
      <AnimatePresence>
        {(isPinnedOpen || isFilesOpen) && (
          <>
            {/* Backdrop for click outside */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsPinnedOpen(false);
                setIsFilesOpen(false);
              }}
              className="absolute inset-0 bg-background/50 backdrop-blur-xs z-20"
            />

            <motion.aside
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 26, stiffness: 260 }}
              className="absolute right-0 top-0 bottom-0 w-80 sm:w-96 bg-surface-container border-l border-white/[0.08] shadow-2xl z-30 flex flex-col backdrop-blur-2xl"
            >
              {/* Header */}
              <div className="p-5 border-b border-white/[0.08] flex items-center justify-between bg-surface-container-high/40">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-primary text-[22px]">
                    {isPinnedOpen ? 'push_pin' : 'folder_open'}
                  </span>
                  <h2 className="font-button-text text-base text-on-surface">
                    {isPinnedOpen ? 'Pinned Messages' : 'Shared Resources'}
                  </h2>
                </div>
                <button
                  onClick={() => {
                    setIsPinnedOpen(false);
                    setIsFilesOpen(false);
                  }}
                  className="p-1 rounded-md text-on-surface-variant hover:text-on-surface hover:bg-white/[0.06] transition-colors cursor-pointer"
                  aria-label="Close panel"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              {/* Body Empty State / File List */}
              <div className="flex-1 p-5 flex flex-col gap-3 overflow-y-auto custom-scrollbar">
                {isPinnedOpen ? (
                  pinnedMessages.length ? pinnedMessages.map((message) => <article key={message.id} className="rounded-lg bg-surface-container p-3"><div className="flex justify-between gap-2"><span className="text-xs font-semibold text-on-surface">{message.authorName}</span>{currentChannel?.isAdmin && <button type="button" onClick={() => handleTogglePin(message.id)} className="text-xs text-primary">Unpin</button>}</div><p className="mt-2 text-sm text-on-surface-variant line-clamp-4">{message.text}</p><span className="mt-2 flex items-center gap-1 text-[10px] text-primary"><span className="material-symbols-outlined text-[13px]">push_pin</span>Pinned message</span></article>) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center gap-3"><div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-1"><span className="material-symbols-outlined text-2xl">push_pin</span></div><h3 className="font-button-text text-sm text-on-surface">No pinned messages yet</h3><p className="font-body-md text-xs text-on-surface-variant leading-relaxed max-w-[260px]">Channel owners can pin key discussions or resources here.</p></div>
                  )
                ) : (() => {
                  const channelFiles = messages
                    .filter(m => (m.attachment?.fileName || m.payload?.fileName))
                    .map(m => m.attachment || m.payload);

                  if (channelFiles.length === 0) {
                    return (
                      <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
                        <div className="w-14 h-14 rounded-full bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary mb-1">
                          <span className="material-symbols-outlined text-2xl">folder_open</span>
                        </div>
                        <h3 className="font-button-text text-sm text-on-surface">Shared resources</h3>
                        <p className="font-body-md text-xs text-on-surface-variant leading-relaxed max-w-[260px]">
                          Datasets, files, and snippets uploaded in #{displayChannelName} will be organized here.
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="flex flex-col gap-2">
                      <span className="font-mono-sm text-xs text-on-surface-variant uppercase tracking-wider mb-1">
                        Files in #{displayChannelName} ({channelFiles.length})
                      </span>
                      {channelFiles.map((file, idx) => {
                        const storedFilename = file.fileUrl ? file.fileUrl.split('/').pop() : '';
                        const fileUrl = `http://localhost:5000/api/channels/${channelId}/files/${encodeURIComponent(storedFilename)}`;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={async () => {
                              const token = localStorage.getItem('auth_token');
                              const response = await fetch(fileUrl, { headers: { Authorization: `Bearer ${token}` } });
                              if (!response.ok) return;
                              const blobUrl = URL.createObjectURL(await response.blob());
                              const link = document.createElement('a');
                              link.href = blobUrl; link.download = file.fileName; link.click();
                              URL.revokeObjectURL(blobUrl);
                            }}
                            className="flex items-center gap-3 p-3 bg-surface-container rounded-lg border border-white/[0.04] hover:bg-surface-variant transition-colors group/file no-underline"
                          >
                            <div className="w-9 h-9 rounded bg-secondary-container/20 flex items-center justify-center shrink-0">
                              <span className="material-symbols-outlined text-secondary-container text-[18px]">
                                {file.fileType === 'CSV' ? 'csv' : 'description'}
                              </span>
                            </div>
                            <div className="flex flex-col flex-1 min-w-0">
                              <span className="font-mono-label text-xs text-on-surface truncate">{file.fileName}</span>
                              <span className="font-mono-sm text-[10px] text-on-surface-variant">
                                {file.fileSize ? `${file.fileSize} • ` : ''}{file.fileType || 'FILE'}
                              </span>
                            </div>
                            <span className="material-symbols-outlined text-[18px] text-on-surface-variant group-hover/file:text-on-surface">
                              download
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
      {threadMessage && <MessageThread key={`${channelId}:${threadMessage.id}`} channelId={channelId} parentMessage={threadMessage} onClose={() => setThreadMessage(null)} onReplyCountChanged={updateThreadCount} />}
    </div>
  );
}
