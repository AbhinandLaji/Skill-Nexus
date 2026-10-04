import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function CodeSnippetBlock({ language, code }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-surface-container-low rounded-lg overflow-hidden border border-white/[0.08] max-w-3xl group/code mt-2">
      <div className="flex items-center justify-between px-4 py-2 bg-surface-container-lowest border-b border-white/[0.04]">
        <span className="font-mono-sm text-[11px] text-primary-fixed uppercase tracking-wider">{language}</span>
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={handleCopy}
          className="text-on-surface-variant hover:text-primary-fixed transition-colors flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-[16px]">
            {copied ? 'check' : 'content_copy'}
          </span>
          <span className="font-mono-sm text-[11px] opacity-0 group-hover/code:opacity-100 transition-opacity">
            {copied ? 'Copied' : 'Copy'}
          </span>
        </motion.button>
      </div>
      <pre className="p-4 font-mono-sm text-sm leading-relaxed overflow-x-auto text-on-surface custom-scrollbar">
        <code>{code}</code>
      </pre>
    </div>
  );
}
