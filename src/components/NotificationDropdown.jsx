import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function NotificationDropdown({
  isOpen,
  onClose,
  triggerRef,
  notifications = [],
  onRespond,
  onMarkAllRead
}) {
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'requests'
  const [loadingActions, setLoadingActions] = useState({}); // { [id]: 'accept' | 'decline' }

  // Close on outside click or Escape
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        (!triggerRef?.current || !triggerRef.current.contains(event.target))
      ) {
        onClose();
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, triggerRef]);

  const handleAction = async (e, id, action) => {
    e.stopPropagation();
    setLoadingActions(prev => ({ ...prev, [id]: action }));
    try {
      await onRespond(id, action);
    } finally {
      setLoadingActions(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const handleCardClick = (link) => {
    if (link) {
      navigate(link);
      onClose();
    }
  };

  const isRequestType = (type) =>
    ['match_request', 'team_invite', 'team_join_request', 'channel_invite'].includes(type);

  const unreadCount = notifications.filter(
    n => !n.read && n.status !== 'read' && n.status !== 'accepted' && n.status !== 'declined'
  ).length;

  const requestCount = notifications.filter(n => isRequestType(n.type)).length;

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'requests') {
      return isRequestType(n.type);
    }
    return true;
  });

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'match_request':
      case 'team_join_request':
        return 'diversity_3';
      case 'team_invite':
        return 'group_add';
      case 'announcement':
        return 'campaign';
      case 'mention':
        return 'alternate_email';
      case 'system':
        return 'info';
      case 'channel_invite':
        return 'tag';
      default:
        return 'notifications';
    }
  };

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={dropdownRef}
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.96 }}
          transition={{ duration: 0.15 }}
          className="absolute right-0 top-12 w-[380px] sm:w-[420px] max-w-[calc(100vw-24px)] bg-surface-container border border-white/[0.12] rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur-2xl"
          style={{ maxHeight: '82vh' }}
        >
          {/* Header */}
          <div className="p-4 border-b border-white/[0.08] flex items-center justify-between bg-surface-container-high/60">
            <div className="flex items-center gap-2">
              <span className="font-button-text text-on-surface text-base">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-mono-sm rounded-full bg-secondary/20 text-secondary border border-secondary/30">
                  {unreadCount} unread
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={onMarkAllRead}
                  className="text-xs text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                  title="Mark all as read"
                >
                  Mark all as read
                </button>
              )}
              <button
                onClick={onClose}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-md transition-colors cursor-pointer"
                aria-label="Close"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex border-b border-white/[0.06] bg-surface-container-low px-4 pt-2 gap-4">
            <button
              onClick={() => setActiveTab('all')}
              className={`pb-2 text-xs font-mono-label relative transition-colors cursor-pointer ${
                activeTab === 'all' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              All ({notifications.length})
              {activeTab === 'all' && (
                <motion.div
                  layoutId="notifTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`pb-2 text-xs font-mono-label relative transition-colors cursor-pointer ${
                activeTab === 'requests' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Requests ({requestCount})
              {activeTab === 'requests' && (
                <motion.div
                  layoutId="notifTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                />
              )}
            </button>
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto divide-y divide-white/[0.04]" style={{ maxHeight: 'calc(82vh - 120px)' }}>
            {filteredNotifications.length === 0 ? (
              <div className="py-12 px-6 text-center flex flex-col items-center justify-center gap-2">
                <div className="w-12 h-12 rounded-full bg-surface-variant/40 flex items-center justify-center text-on-surface-variant mb-1">
                  <span className="material-symbols-outlined text-2xl">notifications_off</span>
                </div>
                <p className="font-button-text text-on-surface text-sm">All caught up!</p>
                <p className="font-body-md text-xs text-on-surface-variant">
                  {activeTab === 'requests'
                    ? 'No pending join requests or invitations.'
                    : 'No notifications at the moment.'}
                </p>
              </div>
            ) : (
              filteredNotifications.map((n) => {
                const isActionLoading = loadingActions[n.id];
                const isPending = n.status === 'pending';
                const isUnread = !n.read && n.status !== 'read' && n.status !== 'accepted' && n.status !== 'declined';
                const hasLink = Boolean(n.link);

                return (
                  <div
                    key={n.id}
                    onClick={() => handleCardClick(n.link)}
                    className={`p-4 transition-colors flex flex-col gap-3 ${
                      hasLink ? 'cursor-pointer hover:bg-white/[0.04]' : 'hover:bg-white/[0.02]'
                    } ${isUnread ? 'bg-surface-container-high/40' : 'opacity-85'}`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar or Icon */}
                      {n.senderAvatar ? (
                        <img
                          src={n.senderAvatar.startsWith('/uploads') ? `${import.meta.env.VITE_BACKEND_URL}${n.senderAvatar}` : n.senderAvatar}
                          alt={n.senderName || 'Sender'}
                          className="w-9 h-9 rounded-full object-cover border border-white/10 flex-shrink-0 mt-0.5"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0 text-primary mt-0.5">
                          <span className="material-symbols-outlined text-[18px]">
                            {getNotificationIcon(n.type)}
                          </span>
                        </div>
                      )}

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="font-button-text text-sm text-on-surface truncate">
                              {n.title || n.senderName || 'Notification'}
                            </span>
                            {isUnread && (
                              <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" title="Unread" />
                            )}
                          </div>
                          <span className="font-mono-sm text-[11px] text-on-surface-variant flex-shrink-0">
                            {formatTimeAgo(n.createdAt)}
                          </span>
                        </div>

                        <p className="font-body-md text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                          {n.message}
                        </p>

                        {/* Tag/Target or Route Link */}
                        {(n.targetTitle || n.link) && (
                          <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface-variant/40 border border-white/5 text-[11px] font-mono-sm text-on-surface-variant">
                            <span className="material-symbols-outlined text-[13px] text-primary">
                              {n.targetType === 'channel' ? 'forum' : n.targetType === 'team' ? 'diversity_3' : 'arrow_forward'}
                            </span>
                            <span className="truncate max-w-[200px]">
                              {n.targetTitle || (n.link ? 'View Details' : '')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions or Status Badge */}
                    <div className="flex items-center justify-end gap-2 pt-1">
                      {isPending && isRequestType(n.type) ? (
                        <>
                          <button
                            onClick={(e) => handleAction(e, n.id, 'decline')}
                            disabled={Boolean(isActionLoading)}
                            className="px-3 py-1.5 rounded-lg border border-white/10 text-xs font-button-text text-on-surface-variant hover:text-error hover:bg-error/10 hover:border-error/20 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                          >
                            {isActionLoading === 'decline' ? (
                              <span className="material-symbols-outlined text-[14px] animate-spin">refresh</span>
                            ) : (
                              <span className="material-symbols-outlined text-[14px]">close</span>
                            )}
                            Decline
                          </button>

                          <button
                            onClick={(e) => handleAction(e, n.id, 'accept')}
                            disabled={Boolean(isActionLoading)}
                            className="px-3.5 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-button-text hover:opacity-90 shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                          >
                            {isActionLoading === 'accept' ? (
                              <span className="material-symbols-outlined text-[14px] animate-spin">refresh</span>
                            ) : (
                              <span className="material-symbols-outlined text-[14px]">check</span>
                            )}
                            Accept
                          </button>
                        </>
                      ) : n.status === 'accepted' ? (
                        <span className="inline-flex items-center gap-1 text-xs text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full">
                          <span className="material-symbols-outlined text-[14px]">check</span>
                          Accepted
                        </span>
                      ) : n.status === 'declined' ? (
                        <span className="inline-flex items-center gap-1 text-xs text-on-surface-variant/70 bg-surface-variant/40 border border-white/5 px-2.5 py-1 rounded-full">
                          <span className="material-symbols-outlined text-[14px]">close</span>
                          Declined
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-on-surface-variant/60">
                          <span className="material-symbols-outlined text-[14px]">done_all</span>
                          Read
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
