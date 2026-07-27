import React, { useRef, useEffect } from 'react';
import MessageItem from './MessageItem';

export default function ChatArea({ messages }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
        <MessageItem key={msg.id} message={msg} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
