import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { getRealtimeSocket } from '../services/realtime';

export default function MessageThread({ channelId, parentMessage, onClose, onReplyCountChanged }) {
  const [replies, setReplies] = useState([]);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    const socket = getRealtimeSocket();
    const handleReply = (event) => {
      if (event.parentMessageId !== parentMessage.id) return;
      setReplies((current) => current.some((reply) => reply.id === event.message.id) ? current : [...current, event.message]);
      onReplyCountChanged?.(parentMessage.id, event.threadCount);
    };
    api.getMessageReplies(channelId, parentMessage.id).then((data) => { if (active) setReplies(data); })
      .catch((loadError) => { if (active) setError(loadError.message || 'Could not load replies.'); });
    socket.on('channel:thread-reply', handleReply);
    return () => { active = false; socket.off('channel:thread-reply', handleReply); };
  }, [channelId, parentMessage.id]);

  const sendReply = async (event) => {
    event.preventDefault();
    const value = text.trim();
    if (!value || busy) return;
    setBusy(true); setError('');
    try {
      const result = await api.sendMessageReply(channelId, parentMessage.id, value);
      setReplies((current) => current.some((reply) => reply.id === result.message.id) ? current : [...current, result.message]);
      onReplyCountChanged?.(parentMessage.id, result.threadCount);
      setText('');
    } catch (sendError) { setError(sendError.message || 'Could not send reply.'); }
    finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-[75] bg-black/40" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <aside className="absolute right-0 top-0 bottom-0 flex w-full max-w-lg flex-col border-l border-white/10 bg-surface-container shadow-2xl">
        <header className="flex items-center justify-between border-b border-white/10 p-4"><div><h2 className="font-semibold text-on-surface">Thread</h2><p className="text-xs text-on-surface-variant">Replies to {parentMessage.authorName}</p></div><button type="button" onClick={onClose} aria-label="Close thread" className="rounded p-1 text-on-surface-variant hover:bg-white/5"><span className="material-symbols-outlined">close</span></button></header>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <article className="rounded-xl bg-surface-container-low p-4"><p className="text-xs font-semibold text-on-surface">{parentMessage.authorName}<span className="ml-2 font-normal text-on-surface-variant">{parentMessage.timestamp}</span></p><p className="mt-2 whitespace-pre-wrap break-words text-sm text-on-surface">{parentMessage.text}</p></article>
          <div className="border-l-2 border-primary/20 pl-4 space-y-4"><p className="text-xs text-on-surface-variant">{replies.length} {replies.length === 1 ? 'reply' : 'replies'}</p>{replies.map((reply) => <article key={reply.id}><p className="text-xs font-semibold text-on-surface">{reply.authorName}<span className="ml-2 font-normal text-on-surface-variant">{reply.timestamp}</span></p><p className="mt-1 whitespace-pre-wrap break-words text-sm text-on-surface/90">{reply.text}</p></article>)}</div>
          {error && <p role="alert" className="text-sm text-error">{error}</p>}
        </div>
        <form onSubmit={sendReply} className="flex gap-2 border-t border-white/10 p-4"><textarea rows={2} maxLength={4000} value={text} onChange={(event) => setText(event.target.value)} placeholder="Reply to this thread…" className="min-w-0 flex-1 resize-none rounded-lg bg-surface-container-low px-3 py-2 text-sm text-on-surface" /><button disabled={!text.trim() || busy} className="self-end rounded-lg bg-primary px-4 py-2 text-sm text-on-primary disabled:opacity-40">Reply</button></form>
      </aside>
    </div>
  );
}
