import React from 'react';
import { motion } from 'framer-motion';
import CodeSnippetBlock from './CodeSnippetBlock';

export default function MessageItem({ message }) {
  // If the message has a thread property, we render the thread snippet.
  // For standard messages, we render text, code, or attachments.
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-4 group"
    >
      <div className="w-10 h-10 rounded overflow-hidden mt-1 shrink-0 bg-surface-container border border-white/[0.08] flex items-center justify-center">
        {message.authorAvatar ? (
          <img src={message.authorAvatar} alt={message.authorName} className="w-full h-full object-cover" />
        ) : (
          <span className="font-mono-sm text-on-surface">{message.authorName?.charAt(0) || '?'}</span>
        )}
      </div>
      
      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex items-baseline gap-3 mb-1">
          <span className="font-body-md text-[15px] font-semibold text-on-surface">{message.authorName}</span>
          <span className="font-mono-sm text-[11px] text-on-surface-variant">{message.timestamp}</span>
        </div>
        
        {message.text && (
          <p className="font-body-md text-body-md text-on-surface/90 leading-relaxed max-w-3xl">
            {message.text}
          </p>
        )}
        
        {message.type === 'code' && message.payload && (
          <CodeSnippetBlock language={message.payload.language} code={message.payload.code} />
        )}
        
        {message.type === 'file' && message.payload && (
          <div className="flex items-center gap-4 p-3 bg-surface-container rounded-lg border border-white/[0.04] max-w-sm hover:bg-surface-variant transition-colors cursor-pointer group/file mt-2">
            <div className="w-10 h-10 rounded bg-secondary-container/20 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-secondary-container">
                {message.payload.fileType === 'CSV' ? 'csv' : 'description'}
              </span>
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="font-mono-label text-mono-label text-on-surface truncate">{message.payload.fileName}</span>
              <span className="font-mono-sm text-[11px] text-on-surface-variant">{message.payload.fileSize} • {message.payload.fileType}</span>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant group-hover/file:text-on-surface">download</span>
          </div>
        )}

        {message.threadCount > 0 && (
          <div className="mt-3 flex items-center gap-3">
            <div className="flex -space-x-2">
              {message.threadParticipants?.map((avatar, idx) => (
                avatar ? (
                  <img key={idx} src={avatar} className="w-5 h-5 rounded-full border border-surface-container object-cover" alt="reply" />
                ) : (
                  <div key={idx} className="w-5 h-5 rounded-full border border-surface-container bg-surface flex items-center justify-center">
                    <span className="text-[8px] text-on-surface">?</span>
                  </div>
                )
              ))}
            </div>
            <button className="font-mono-sm text-mono-sm text-primary-fixed hover:underline flex items-center gap-1">
              {message.threadCount} replies
              <span className="text-on-surface-variant text-[11px] ml-1">Last reply {message.lastReplyAt}</span>
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
