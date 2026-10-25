import React, { useRef, useEffect } from 'react';
import MessageItem from './MessageItem';

export default function ChatArea({ messages, channelId, canPin, onOpenThread, onToggleReaction, onTogglePin }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!messages || messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-on-surface-variant">
        <span className="material-symbols-outlined text-4xl mb-2 text-on-surface-variant/40">chat_bubble_outline</span>
        <p className="font-body-md text-sm">No messages yet. Start the conversation.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-8 pb-32 pt-6 flex flex-col gap-8 custom-scrollbar">
      <div className="flex items-center justify-center relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full h-px bg-white/[0.04]"></div>
        </div>
        <span className="relative bg-background px-4 font-mono-sm text-mono-sm text-on-surface-variant uppercase tracking-wider">
          Today
        </span>
      </div>

      {messages.map(msg => (
        <MessageItem key={msg._id || msg.id} message={msg} channelId={channelId} canPin={canPin} onOpenThread={onOpenThread} onToggleReaction={onToggleReaction} onTogglePin={onTogglePin} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
