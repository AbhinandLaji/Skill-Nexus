import React, { useState, useRef } from 'react';
import { api } from '../services/api';

export default function MessageInput({ channelId, onMessageSent }) {
  const [content, setContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef(null);

  const handleInput = (e) => {
    setContent(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const handleSend = async () => {
    if (!content.trim()) return;
    setIsSending(true);
    try {
      const payload = {
        channelId,
        content: content.trim(),
        type: 'text' // We are only implementing text sending for now
      };
      await api.sendChannelMessage(payload);
      // Optimistically or explicitly return the message structure to parent
      onMessageSent({
        id: Date.now().toString(),
        type: 'text',
        text: content.trim(),
        authorName: 'Me',
        authorAvatar: null,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      setContent('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background to-transparent z-20">
      <div className="bg-surface-container-low border border-white/[0.08] rounded-xl flex flex-col focus-within:border-primary-fixed/50 transition-colors shadow-2xl">
        <div className="p-3 pb-0">
          <textarea 
            ref={textareaRef}
            value={content}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            disabled={isSending}
            className="w-full bg-transparent border-none resize-none font-body-md text-body-md text-on-surface placeholder-on-surface-variant focus:outline-none focus:ring-0 min-h-[44px] max-h-32 custom-scrollbar"
            placeholder="Message #python-help..." 
            rows="1"
          />
        </div>
        <div className="flex items-center justify-between p-2 pl-3">
          <div className="flex items-center gap-1">
            <button className="w-8 h-8 rounded flex items-center justify-center text-on-surface-variant hover:bg-surface-variant hover:text-on-surface transition-colors" title="Attach file">
              <span className="material-symbols-outlined text-[20px]">add_circle</span>
            </button>
            <button className="w-8 h-8 rounded flex items-center justify-center text-on-surface-variant hover:bg-surface-variant hover:text-on-surface transition-colors" title="Code snippet">
              <span className="material-symbols-outlined text-[20px]">code</span>
            </button>
            <button className="w-8 h-8 rounded flex items-center justify-center text-on-surface-variant hover:bg-surface-variant hover:text-on-surface transition-colors" title="Format">
              <span className="material-symbols-outlined text-[20px]">format_bold</span>
            </button>
          </div>
          <button 
            onClick={handleSend}
            disabled={!content.trim() || isSending}
            className="px-4 py-1.5 bg-primary-fixed text-on-primary-fixed font-button-text text-button-text rounded hover:scale-[1.02] transition-transform flex items-center gap-2 shadow-lg shadow-primary-fixed/20 disabled:opacity-50 disabled:hover:scale-100"
          >
            {isSending ? 'Sending...' : 'Send'}
            <span className="material-symbols-outlined text-[16px]">
              {isSending ? 'refresh' : 'send'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
