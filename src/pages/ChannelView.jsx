import React, { useState, useEffect } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import ChatArea from '../components/ChatArea';
import MessageInput from '../components/MessageInput';

export default function ChannelView() {
  const { channelId } = useParams();
  const { channels = [] } = useOutletContext() || {};
  const [messages, setMessages] = useState([]);
  const [isPinnedOpen, setIsPinnedOpen] = useState(false);
  const [isFilesOpen, setIsFilesOpen] = useState(false);

  // Fetch live messages whenever channelId changes
  useEffect(() => {
    let isMounted = true;
    async function fetchChannelMessages() {
      if (!channelId) return;
      try {
        const data = await api.getMessages(channelId);
        if (isMounted) {
          setMessages(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Failed to fetch channel messages:', err);
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

  const handleNewMessage = (msg) => {
    setMessages(prev => [...prev, msg]);
  };

  // Find active channel dynamically from context
  const activeChannel = channels.find(c => c.id === channelId || c._id === channelId || c.name === channelId || c.name === `#${channelId}`);
  const rawName = activeChannel?.name || (!channelId?.match(/^[0-9a-fA-F]{24}$/) && !channelId?.match(/^[0-9a-fA-F-]{36}$/) ? channelId : 'python-help');
  const cleanName = rawName.startsWith('#') ? rawName.slice(1) : rawName;
  const displayChannelName = cleanName;

  const memberCount = activeChannel?.memberCount || 124;

  return (
    <div className="flex flex-col w-full h-[calc(100vh-64px)] relative overflow-hidden">
      <div className="flex items-center justify-between px-8 py-6 sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-white/[0.04]">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <h1 className="font-headline-lg text-headline-lg text-on-background flex items-center gap-2">
              <span className="text-primary-fixed">#</span>{displayChannelName}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <div className="flex -space-x-2">
                <img className="w-6 h-6 rounded-full border border-surface-container object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCQED614lkvQ_aaxJErJGIKKMKASdSfPvQTc70v2Mm-JFiket8nehfSe_60IuoU6H0xHUKlutBd0N8ZA4ubX_3hhK3_sBM0wUfk3Aq679b0EOnuLY65-BgK1z9vrWTF3wRj8UMeQx8J1r7klrNuHUA--9mODtHtCCDTeQFSopTCzEgnV210NqHs5IVay74LtpnkqdtLoC4imrf1zvetS4J71fMb2hHbAPDAPqwZ88_ZL2jDaBSEnDKiLwvp8nuCnd3f4I4sL6zX_vuV" alt="avatar" />
                <img className="w-6 h-6 rounded-full border border-surface-container object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBYTh0qc9-tiAjH2RLBqYg94uWe9YMRVZLRwWd12PMeJwkdl5K4Cv_dmetkzKrkv5i_t1hRzRi4zhO88TDF0F0o_XcffTtIIsaFKgnIAZT0vblaWynr5Ug09Z7BQ3x93xpIDTyWwSajnjJOFsY0DfkprdvlDxnCZob5KMxpy2GR3782s1bpmRrQUWXkshoNHdPefhNgdFt-hvmM5JcL54FPjYc0s88cb-TD9X9j7WPekK3ewTIoY8YMKAy6cstycCBWOF81LiO3pDui" alt="avatar" />
                <img className="w-6 h-6 rounded-full border border-surface-container object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD839fXHRhH_KhnGk7YzDyDZDqEhg37Vr0z1z6-BVhfTssvrieMkbA2wm5_jBGaOx2hq41REGlB-mi4ZNyhqOcNuuC7FRLrlp7ZJnR7DYtM11GxFE1wI36G0jr3ugPZOmnv2zrFv0IAkcXRDwklfuCWbh0TYK1ldIq5JuuLc0emUydRoLIjmkUFNER1vwXZsafxSMPbZL6-grDv2DTkOvuyFc5EN2rvU0jnm4xxqLJ7oPkiRuA8qdbp95WyyeRgkcTCVT7LR-NvIRWq" alt="avatar" />
              </div>
              <span className="font-mono-sm text-mono-sm text-on-surface-variant">
                {memberCount.toLocaleString()} members
              </span>
              <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
              <span className="font-mono-sm text-mono-sm text-primary-fixed flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-primary-fixed animate-pulse"></span>
                14 active
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
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
          </button>
          
          <button
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
          </button>
        </div>
      </div>

      <ChatArea messages={messages} />
      <MessageInput channelId={channelId} onMessageSent={handleNewMessage} />

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

              {/* Body Empty State */}
              <div className="flex-1 p-6 flex flex-col items-center justify-center text-center gap-3 overflow-y-auto">
                {isPinnedOpen ? (
                  <>
                    <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-1">
                      <span className="material-symbols-outlined text-2xl">push_pin</span>
                    </div>
                    <h3 className="font-button-text text-sm text-on-surface">No pinned messages yet</h3>
                    <p className="font-body-md text-xs text-on-surface-variant leading-relaxed max-w-[260px]">
                      No pinned messages in this channel yet. Pin key discussions or resources to keep them easily accessible.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="w-14 h-14 rounded-full bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary mb-1">
                      <span className="material-symbols-outlined text-2xl">folder_open</span>
                    </div>
                    <h3 className="font-button-text text-sm text-on-surface">Shared resources</h3>
                    <p className="font-body-md text-xs text-on-surface-variant leading-relaxed max-w-[260px]">
                      Shared resources will appear here. Datasets, files, and snippets uploaded in #{displayChannelName} will be organized here.
                    </p>
                  </>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
