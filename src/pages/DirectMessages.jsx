import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import DirectCall from '../components/DirectCall';
import { api } from '../services/api';
import { getRealtimeSocket } from '../services/realtime';

const mergeMessages = (first = [], second = []) => {
  const byId = new Map();
  [...first, ...second].forEach((message) => {
    if (message?.id) byId.set(message.id, message);
  });
  return [...byId.values()];
};

const getConversationTitle = (conversation, currentUserId) => {
  if (!conversation) return '';
  if (conversation.type === 'group') {
    const otherMembers = conversation.members.filter((member) => String(member.id) !== String(currentUserId));
    return conversation.name || otherMembers.map((member) => member.name).join(', ');
  }
  const otherMember = conversation.members.find((member) => String(member.id) !== String(currentUserId));
  return otherMember?.name || otherMember?.email || 'Direct message';
};

const formatTime = (date) => {
  if (!date) return '';
  const value = new Date(date);
  return Number.isNaN(value.getTime()) ? '' : value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function DirectMessages() {
  const { user } = useOutletContext() || {};
  const currentUserId = user?.id || user?._id;
  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSocketReady, setIsSocketReady] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [inviteEmails, setInviteEmails] = useState('');
  const [groupName, setGroupName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const bottomRef = useRef(null);
  const selectedConversation = conversations.find((conversation) => conversation.id === selectedId);

  useEffect(() => {
    let active = true;
    api.getConversations()
      .then((data) => {
        if (!active) return;
        const list = Array.isArray(data) ? data : [];
        setConversations(list);
        setSelectedId((current) => current || list[0]?.id || '');
      })
      .catch((loadError) => { if (active) setError(loadError.message || 'Could not load messages.'); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      setIsSocketReady(false);
      return undefined;
    }

    let active = true;
    setMessages([]);
    setError('');
    setIsSocketReady(false);
    const socket = getRealtimeSocket();
    const joinConversation = () => socket.emit('dm:join', selectedId, (result) => {
      if (!active) return;
      if (!result?.ok) {
        setError(result?.error || 'Could not join this conversation.');
        return;
      }
      setIsSocketReady(true);
      if (result.activeCall) {
        setIncomingCall({ conversationId: selectedId, mode: result.activeCall });
      } else {
        setIncomingCall((current) => current?.conversationId === selectedId ? null : current);
        setActiveCall((current) => current?.conversationId === selectedId ? null : current);
      }
    });
    const handleMessage = (message) => {
      if (!active || message.conversationId !== selectedId) return;
      setMessages((current) => mergeMessages(current, [message]));
      setConversations((current) => current.map((conversation) => conversation.id === selectedId
        ? { ...conversation, lastMessageText: message.text, lastMessageAt: message.createdAt }
        : conversation).sort((a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0)));
    };
    const handleCallStarted = (call) => {
      if (!active || call.conversationId !== selectedId) return;
      setIncomingCall({ conversationId: selectedId, mode: call.mode });
    };
    const handleCallEnded = (conversationId) => {
      if (conversationId !== selectedId) return;
      setIncomingCall(null);
      setActiveCall((current) => current?.conversationId === selectedId ? null : current);
    };
    const handleSocketDisconnect = () => setIsSocketReady(false);

    socket.on('connect', joinConversation);
    socket.on('disconnect', handleSocketDisconnect);
    socket.on('dm:message', handleMessage);
    socket.on('dmcall:started', handleCallStarted);
    socket.on('dmcall:ended', handleCallEnded);
    if (socket.connected) joinConversation();

    api.getConversationMessages(selectedId)
      .then((data) => { if (active) setMessages((current) => mergeMessages(Array.isArray(data) ? data : [], current)); })
      .catch((loadError) => { if (active) setError(loadError.message || 'Could not load conversation history.'); });

    return () => {
      active = false;
      socket.emit('dm:leave', selectedId);
      socket.off('connect', joinConversation);
      socket.off('disconnect', handleSocketDisconnect);
      socket.off('dm:message', handleMessage);
      socket.off('dmcall:started', handleCallStarted);
      socket.off('dmcall:ended', handleCallEnded);
    };
  }, [selectedId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const conversationTitle = useMemo(
    () => getConversationTitle(selectedConversation, currentUserId),
    [selectedConversation, currentUserId]
  );

  const handleCreateConversation = async (event) => {
    event.preventDefault();
    setError('');
    const emails = [...new Set(inviteEmails.split(/[\s,;]+/).map((email) => email.trim().toLowerCase()).filter(Boolean))];
    if (!emails.length) {
      setError('Add at least one registered email address.');
      return;
    }
    setIsCreating(true);
    try {
      const conversation = await api.createConversation({ emails, name: groupName.trim() });
      setConversations((current) => [conversation, ...current.filter((item) => item.id !== conversation.id)]);
      setSelectedId(conversation.id);
      setInviteEmails('');
      setGroupName('');
      setNewChatOpen(false);
    } catch (createError) {
      setError(createError.message || 'Could not start this conversation.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();
    const text = messageText.trim();
    if (!text || !selectedId || isSending) return;
    setIsSending(true);
    setError('');
    try {
      const message = await api.sendConversationMessage(selectedId, text);
      setMessages((current) => mergeMessages(current, [message]));
      setConversations((current) => current.map((conversation) => conversation.id === selectedId
        ? { ...conversation, lastMessageText: message.text, lastMessageAt: message.createdAt }
        : conversation).sort((a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0)));
      setMessageText('');
    } catch (sendError) {
      setError(sendError.message || 'Could not send this message.');
    } finally {
      setIsSending(false);
    }
  };

  const startCall = (mode) => {
    if (!selectedId || !isSocketReady) return;
    setIncomingCall(null);
    setActiveCall({ conversationId: selectedId, mode });
  };

  const acceptCall = () => {
    if (!incomingCall) return;
    setActiveCall(incomingCall);
    setIncomingCall(null);
  };

  const callForSelected = activeCall?.conversationId === selectedId ? activeCall : null;
  const incomingForSelected = incomingCall?.conversationId === selectedId ? incomingCall : null;

  return (
    <div className="h-[calc(100vh-64px)] min-h-[520px] p-3 sm:p-5">
      <div className="h-full flex overflow-hidden rounded-2xl border border-white/[0.08] bg-surface-container-low">
        <aside className="w-[290px] shrink-0 border-r border-white/[0.08] flex flex-col max-sm:w-[37%]">
          <div className="px-4 py-4 border-b border-white/[0.08] flex items-center justify-between gap-2">
            <div>
              <h1 className="text-lg font-semibold text-on-surface">Messages</h1>
              <p className="text-xs text-on-surface-variant">Direct and group chats</p>
            </div>
            <button type="button" onClick={() => setNewChatOpen(true)} aria-label="New message" title="New message" className="w-9 h-9 rounded-lg bg-primary text-on-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">edit_square</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {isLoading && <p className="p-3 text-sm text-on-surface-variant">Loading conversations…</p>}
            {!isLoading && conversations.length === 0 && <p className="p-3 text-sm text-on-surface-variant">Start a direct or group conversation.</p>}
            {conversations.map((conversation) => {
              const title = getConversationTitle(conversation, currentUserId);
              const avatarMember = conversation.members.find((member) => String(member.id) !== String(currentUserId));
              return (
                <button key={conversation.id} type="button" onClick={() => setSelectedId(conversation.id)} className={`w-full flex items-center gap-3 p-3 rounded-xl text-left mb-1 ${selectedId === conversation.id ? 'bg-surface-variant text-on-surface' : 'text-on-surface-variant hover:bg-surface-container'}`}>
                  {conversation.type === 'group' ? (
                    <span className="w-10 h-10 shrink-0 rounded-full bg-primary/15 text-primary flex items-center justify-center"><span className="material-symbols-outlined">groups</span></span>
                  ) : avatarMember?.avatar ? (
                    <img src={avatarMember.avatar} alt="" className="w-10 h-10 shrink-0 rounded-full object-cover" />
                  ) : (
                    <span className="w-10 h-10 shrink-0 rounded-full bg-secondary-container/30 text-secondary flex items-center justify-center font-semibold">{title?.[0]?.toUpperCase() || '?'}</span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{title}</span>
                    <span className="block truncate text-xs opacity-70">{conversation.lastMessageText || (conversation.type === 'group' ? `${conversation.members.length} members` : 'No messages yet')}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="flex-1 min-w-0 flex flex-col">
          {selectedConversation ? (
            <>
              <header className="min-h-[68px] px-4 sm:px-6 py-3 border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-semibold text-on-surface truncate">{conversationTitle}</h2>
                  <p className="text-xs text-on-surface-variant truncate">
                    {selectedConversation.type === 'group' ? selectedConversation.members.map((member) => member.name).join(' · ') : 'Direct message'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button type="button" disabled={!isSocketReady} onClick={() => startCall('audio')} title="Start audio call" aria-label="Start audio call" className="w-9 h-9 rounded-lg bg-surface-container-high text-on-surface disabled:opacity-40"><span className="material-symbols-outlined text-[20px]">call</span></button>
                  <button type="button" disabled={!isSocketReady} onClick={() => startCall('video')} title="Start video call" aria-label="Start video call" className="w-9 h-9 rounded-lg bg-surface-container-high text-on-surface disabled:opacity-40"><span className="material-symbols-outlined text-[20px]">videocam</span></button>
                </div>
              </header>

              {incomingForSelected && !callForSelected && (
                <div className="px-4 sm:px-6 py-3 bg-primary/10 border-b border-primary/20 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-sm text-on-surface">Incoming {incomingForSelected.mode} call</span>
                  <div className="flex gap-2">
                    <button type="button" onClick={acceptCall} className="px-3 py-1.5 rounded-lg bg-primary text-on-primary text-sm">Join call</button>
                    <button type="button" onClick={() => setIncomingCall(null)} className="px-3 py-1.5 rounded-lg bg-surface-container text-on-surface text-sm">Dismiss</button>
                  </div>
                </div>
              )}

              {error && <div role="alert" className="mx-4 sm:mx-6 mt-3 rounded-lg bg-error-container/20 text-error p-3 text-sm">{error}</div>}

              <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-4">
                {messages.length === 0 && <p className="text-center text-sm text-on-surface-variant mt-12">This is the beginning of your conversation.</p>}
                {messages.map((message) => {
                  const isMine = String(message.authorId) === String(currentUserId);
                  return (
                    <div key={message.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-3 ${isMine ? 'bg-primary text-on-primary rounded-br-md' : 'bg-surface-container text-on-surface rounded-bl-md'}`}>
                        {!isMine && selectedConversation.type === 'group' && <p className="text-[11px] font-semibold opacity-75 mb-1">{message.authorName}</p>}
                        <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
                        <p className={`text-[10px] mt-1 text-right ${isMine ? 'text-on-primary/70' : 'text-on-surface-variant'}`}>{formatTime(message.createdAt)}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              <form onSubmit={handleSendMessage} className="px-4 sm:px-6 pb-4 flex gap-2">
                <input value={messageText} onChange={(event) => setMessageText(event.target.value)} maxLength={4000} disabled={!isSocketReady || isSending} placeholder={`Message ${conversationTitle}…`} className="flex-1 min-w-0 rounded-xl bg-surface-container border border-white/[0.08] px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary" />
                <button type="submit" disabled={!messageText.trim() || !isSocketReady || isSending} className="w-12 rounded-xl bg-primary text-on-primary disabled:opacity-40 flex items-center justify-center" aria-label="Send message"><span className="material-symbols-outlined">send</span></button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-on-surface-variant">
              <span className="material-symbols-outlined text-5xl mb-3">forum</span>
              <p className="text-lg font-medium text-on-surface">Your messages</p>
              <p className="text-sm mt-1">Choose a conversation or start a new one.</p>
            </div>
          )}
        </section>
      </div>

      {newChatOpen && (
        <div className="fixed inset-0 z-[90] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setNewChatOpen(false); }}>
          <form onSubmit={handleCreateConversation} className="w-full max-w-lg rounded-2xl bg-surface-container border border-white/[0.1] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-on-surface">Start a conversation</h2>
              <button type="button" onClick={() => setNewChatOpen(false)} className="text-on-surface-variant" aria-label="Close"><span className="material-symbols-outlined">close</span></button>
            </div>
            <label className="block text-xs font-mono-sm uppercase text-on-surface-variant mb-2">Member emails</label>
            <textarea autoFocus rows={3} value={inviteEmails} onChange={(event) => setInviteEmails(event.target.value)} placeholder="alex@example.edu, sam@example.edu" className="w-full resize-none rounded-lg bg-surface-container-low border border-white/[0.08] px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary" />
            <p className="text-xs text-on-surface-variant mt-2">One email starts a direct message. Add more for a group chat (up to 8 people total).</p>
            {inviteEmails.split(/[\s,;]+/).filter(Boolean).length > 1 && (
              <div className="mt-4">
                <label className="block text-xs font-mono-sm uppercase text-on-surface-variant mb-2">Group name (optional)</label>
                <input value={groupName} onChange={(event) => setGroupName(event.target.value)} maxLength={80} placeholder="Project team" className="w-full rounded-lg bg-surface-container-low border border-white/[0.08] px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary" />
              </div>
            )}
            {error && <p role="alert" className="text-sm text-error mt-3">{error}</p>}
            <div className="flex justify-end gap-2 mt-6">
              <button type="button" onClick={() => setNewChatOpen(false)} className="px-4 py-2 rounded-lg bg-surface-container-high text-on-surface text-sm">Cancel</button>
              <button type="submit" disabled={isCreating} className="px-4 py-2 rounded-lg bg-primary text-on-primary text-sm disabled:opacity-50">{isCreating ? 'Starting…' : 'Start chat'}</button>
            </div>
          </form>
        </div>
      )}

      {callForSelected && (
        <DirectCall
          key={`${callForSelected.conversationId}:${callForSelected.mode}`}
          conversationId={callForSelected.conversationId}
          mode={callForSelected.mode}
          onLeave={() => setActiveCall(null)}
        />
      )}
    </div>
  );
}
