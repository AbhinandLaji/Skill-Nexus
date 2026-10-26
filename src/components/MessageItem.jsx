import React from 'react';
import { motion } from 'framer-motion';
import CodeSnippetBlock from './CodeSnippetBlock';

const REACTION_CHOICES = ['👍', '❤️', '😂', '😮', '🎉', '✅', '🔥'];

export default function MessageItem({ message, channelId, canPin, onOpenThread, onToggleReaction, onTogglePin }) {
  const isPersisted = /^[a-f\d]{24}$/i.test(message.id || '');
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
          <img 
            src={message.authorAvatar.startsWith('/uploads') ? `${import.meta.env.VITE_BACKEND_URL}${message.authorAvatar}` : message.authorAvatar} 
            alt={message.authorName} 
            className="w-full h-full object-cover" 
          />
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
        
        {(() => {
          const fileData = message.attachment || message.payload;
          if (!fileData || (!fileData.fileName && !fileData.filename)) return null;
          const fileName = fileData.fileName || fileData.filename;
          const fileSize = fileData.fileSize || fileData.size || '';
          const fileType = fileData.fileType || fileName.split('.').pop()?.toUpperCase() || 'FILE';
          const storedFilename = fileData.fileUrl ? fileData.fileUrl.split('/').pop() : '';
          const downloadUrl = channelId && storedFilename
            ? `${import.meta.env.VITE_BACKEND_URL}/api/channels/${channelId}/files/${encodeURIComponent(storedFilename)}`
            : '#';

          return (
            <button
              type="button"
              onClick={async () => {
                const token = localStorage.getItem('auth_token');
                const response = await fetch(downloadUrl, { headers: { Authorization: `Bearer ${token}` } });
                if (!response.ok) return;
                const blobUrl = URL.createObjectURL(await response.blob());
                const link = document.createElement('a');
                link.href = blobUrl; link.download = fileName; link.click();
                URL.revokeObjectURL(blobUrl);
              }}
              className="flex items-center gap-4 p-3 bg-surface-container rounded-lg border border-white/[0.04] max-w-sm hover:bg-surface-variant transition-colors cursor-pointer group/file mt-2 no-underline"
            >
              <div className="w-10 h-10 rounded bg-secondary-container/20 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-secondary-container">
                  {fileType === 'CSV' ? 'csv' : 'description'}
                </span>
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="font-mono-label text-mono-label text-on-surface truncate">{fileName}</span>
                <span className="font-mono-sm text-[11px] text-on-surface-variant">
                  {fileSize ? `${fileSize} • ` : ''}{fileType}
                </span>
              </div>
              {/* Download icon kept in code but hidden per requirement 10 */}
              {/* <span className="material-symbols-outlined text-on-surface-variant group-hover/file:text-on-surface">download</span> */}
            </button>
          );
        })()}

        {isPersisted && <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {(message.reactions || []).map((reaction) => (
            <button key={reaction.emoji} type="button" onClick={() => onToggleReaction?.(message.id, reaction.emoji)} aria-pressed={reaction.reactedByMe} className={`rounded-full border px-2 py-0.5 text-xs ${reaction.reactedByMe ? 'border-primary bg-primary/15 text-primary' : 'border-white/10 bg-surface-container text-on-surface-variant'}`}>
              {reaction.emoji} {reaction.count}
            </button>
          ))}
          <div className="flex gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
            {REACTION_CHOICES.map((emoji) => <button key={emoji} type="button" title={`React ${emoji}`} aria-label={`React ${emoji}`} onClick={() => onToggleReaction?.(message.id, emoji)} className="rounded px-1 py-0.5 text-sm hover:bg-surface-container">{emoji}</button>)}
          </div>
          <button type="button" onClick={() => onOpenThread?.(message)} className="flex items-center gap-1 rounded px-2 py-1 text-xs text-primary-fixed hover:bg-surface-container">
            <span className="material-symbols-outlined text-[15px]">forum</span>{message.threadCount ? `${message.threadCount} replies` : 'Reply in thread'}
          </button>
          {canPin && <button type="button" onClick={() => onTogglePin?.(message.id)} title={message.isPinned ? 'Unpin message' : 'Pin message'} aria-label={message.isPinned ? 'Unpin message' : 'Pin message'} className="rounded px-1.5 py-1 text-on-surface-variant hover:bg-surface-container hover:text-primary">
            <span className="material-symbols-outlined text-[16px]">{message.isPinned ? 'keep_off' : 'push_pin'}</span>
          </button>}
          {message.isPinned && <span className="flex items-center gap-1 text-[10px] text-primary"><span className="material-symbols-outlined text-[13px]">push_pin</span>Pinned</span>}
        </div>}

      </div>
    </motion.div>
  );
}
