import React, { useState, useRef } from 'react';
import { api } from '../services/api';

export default function MessageInput({ channelId, onMessageSent }) {
  const [content, setContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isCodeMode, setIsCodeMode] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('python');
  const [codeContent, setCodeContent] = useState('');

  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const handleInput = (e) => {
    setContent(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`;
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleSend = async () => {
    const hasText = content.trim().length > 0;
    const hasFile = Boolean(selectedFile);
    const hasCode = isCodeMode && codeContent.trim().length > 0;

    if (!hasText && !hasFile && !hasCode) return;

    setIsSending(true);

    try {
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // Determine message type and payload
      let messageType = 'text';
      let payload = null;

      if (hasCode) {
        messageType = 'code';
        payload = {
          language: selectedLanguage,
          code: codeContent.trim(),
          content: codeContent.trim()
        };
      }
      let attachmentPayload = null;
      if (hasFile) {
        messageType = 'file';
        try {
          // Upload the real file to Express via Multer
          const uploadRes = await api.uploadAttachment(selectedFile);
          attachmentPayload = {
            fileUrl: uploadRes.fileUrl,
            fileName: uploadRes.fileName,
            fileSize: uploadRes.fileSize,
            fileType: uploadRes.fileType
          };
        } catch (uploadErr) {
          console.error('File upload failed, falling back to metadata:', uploadErr);
          attachmentPayload = {
            fileUrl: null,
            fileName: selectedFile.name,
            fileSize: formatFileSize(selectedFile.size),
            fileType: selectedFile.name.split('.').pop()?.toUpperCase() || 'FILE'
          };
        }
        payload = attachmentPayload;
      }


      const newMsg = {
        id: Date.now().toString(),
        type: messageType,
        text: content.trim() || (messageType === 'file' ? `Shared a file: ${selectedFile.name}` : ''),
        payload,
        attachment: attachmentPayload,
        authorName: 'Me',
        authorAvatar: null,
        timestamp: now,
        threadCount: 0
      };

      // Call API if channelId is available
      if (channelId) {
        try {
          await api.sendChannelMessage({
            channelId,
            text: newMsg.text,
            type: messageType,
            codeSnippet: hasCode ? { language: selectedLanguage, code: codeContent.trim() } : null,
            attachment: attachmentPayload
          });
        } catch (apiErr) {
          console.warn('Backend message sync error (optimistic update used):', apiErr.message);
        }
      }

      // Update parent ChatArea state
      onMessageSent(newMsg);

      // Reset all form states
      setContent('');
      setCodeContent('');
      setSelectedFile(null);
      setIsCodeMode(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e) => {
    // In code mode, Enter should create a newline; Ctrl+Enter or Cmd+Enter submits
    if (isCodeMode) {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSend();
      }
      return;
    }

    // In regular mode, plain Enter submits; Shift+Enter adds newline
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = content.trim().length > 0 || Boolean(selectedFile) || (isCodeMode && codeContent.trim().length > 0);

  return (
    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background to-transparent z-20">
      <div className="bg-surface-container-low border border-white/[0.08] rounded-xl flex flex-col focus-within:border-primary-fixed/50 transition-colors shadow-2xl overflow-hidden">

        {/* Hidden File Input */}
        <input
          type="file"
          id="file-upload"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Pending File Attachment Preview */}
        {selectedFile && (
          <div className="mx-3 mt-3 p-2.5 px-3 bg-surface-container rounded-lg border border-white/[0.08] flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-on-surface truncate">
              <span className="material-symbols-outlined text-secondary text-[20px]">
                {selectedFile.name.endsWith('.csv') ? 'csv' : 'attach_file'}
              </span>
              <span className="font-mono-label truncate">{selectedFile.name}</span>
              <span className="text-on-surface-variant text-[11px] font-mono-sm">
                ({formatFileSize(selectedFile.size)})
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="text-on-surface-variant hover:text-error hover:bg-error/10 p-1 rounded transition-colors cursor-pointer"
              title="Remove attachment"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        )}

        {/* Code Snippet Editor Mode */}
        {isCodeMode && (
          <div className="m-3 p-3 bg-surface-container-lowest/80 border border-white/[0.08] rounded-lg flex flex-col gap-2">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]">terminal</span>
                <span className="font-mono-sm text-xs text-primary uppercase tracking-wider font-semibold">
                  Code Snippet
                </span>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="bg-surface-container border border-white/[0.1] text-on-surface text-xs font-mono-sm rounded px-2.5 py-1 focus:outline-none focus:border-primary cursor-pointer"
                >
                  <option value="python">Python</option>
                  <option value="javascript">JavaScript</option>
                  <option value="typescript">TypeScript</option>
                  <option value="cpp">C++</option>
                  <option value="rust">Rust</option>
                  <option value="html">HTML/CSS</option>
                  <option value="sql">SQL</option>
                </select>
                <button
                  type="button"
                  onClick={() => setIsCodeMode(false)}
                  className="text-on-surface-variant hover:text-on-surface p-1 rounded transition-colors cursor-pointer"
                  title="Cancel code snippet"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
            </div>
            <textarea
              value={codeContent}
              onChange={(e) => setCodeContent(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSending}
              rows="5"
              className="w-full bg-transparent border-none resize-y font-mono-sm text-xs text-on-surface placeholder:text-outline-variant focus:outline-none focus:ring-0 min-h-[96px] max-h-56 custom-scrollbar"
              placeholder={`// Write or paste ${selectedLanguage} code here... (Ctrl+Enter to send)`}
            />
          </div>
        )}

        {/* Main Text Input */}
        <div className="p-3 pb-0">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            disabled={isSending}
            className="w-full bg-transparent border-none resize-none font-body-md text-body-md text-on-surface placeholder-on-surface-variant focus:outline-none focus:ring-0 min-h-[44px] max-h-32 custom-scrollbar"
            placeholder={isCodeMode ? "Add an optional description for this snippet..." : "Message #python-help..."}
            rows="1"
          />
        </div>

        {/* Bottom Actions Bar */}
        <div className="flex items-center justify-between p-2 pl-3">
          <div className="flex items-center gap-1">
            {/* File Upload ('+') Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`w-8 h-8 rounded flex items-center justify-center transition-colors cursor-pointer ${selectedFile
                ? 'bg-secondary/20 text-secondary'
                : 'text-on-surface-variant hover:bg-surface-variant hover:text-on-surface'
                }`}
              title="Attach file"
            >
              <span className="material-symbols-outlined text-[20px]">add_circle</span>
            </button>

            {/* Code Snippet ('< >') Button */}
            <button
              type="button"
              onClick={() => setIsCodeMode(prev => !prev)}
              className={`w-8 h-8 rounded flex items-center justify-center transition-colors cursor-pointer ${isCodeMode
                ? 'bg-primary/20 text-primary border border-primary/30'
                : 'text-on-surface-variant hover:bg-surface-variant hover:text-on-surface'
                }`}
              title="Code snippet"
            >
              <span className="material-symbols-outlined text-[20px]">code</span>
            </button>
          </div>

          {/* Lime-green Send Button */}
          <button
            type="button"
            onClick={handleSend}
            disabled={!canSend || isSending}
            className="px-4 py-1.5 bg-primary-fixed text-on-primary-fixed font-button-text text-button-text rounded hover:scale-[1.02] transition-transform flex items-center gap-2 shadow-lg shadow-primary-fixed/20 disabled:opacity-50 disabled:hover:scale-100 cursor-pointer"
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
