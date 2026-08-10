import React from 'react';

export default function ActivityFeedItem({ item, colorClass }) {
  // `item` should match the schema of a message from our DB
  // For the UI, we'll try to map db.messages to this layout
  // Or just use the HTML provided if it's static. The user says "The actual dashboard content... activity feed widget".
  // Since we don't have a specific global feed API, I'll pass item as props and render the layout.

  return (
    <div className="relative bg-surface-container-low rounded-lg border border-white/[0.08] p-5 overflow-hidden group">
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${colorClass || 'bg-primary'}`}></div>

      <div className="flex gap-4">
        <div className="w-10 h-10 rounded-sm bg-surface-container-high border border-white/[0.08] flex items-center justify-center shrink-0 overflow-hidden">
          {item.authorAvatar ? (
            <img src={item.authorAvatar} alt={item.authorName} className="w-full h-full object-cover" />
          ) : (
            <span className="material-symbols-outlined text-on-surface-variant">person</span>
          )}
        </div>

        <div className="flex flex-col flex-1 gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-button-text text-button-text text-on-surface">{item.authorName}</span>
              <span className="font-mono-sm text-mono-sm text-on-surface-variant/60">• {item.timeAgo || 'Recently'}</span>
            </div>
            <span
              className="font-mono-sm text-mono-sm px-2 py-0.5 rounded-sm border"
              style={{ color: item.skillColor, borderColor: `${item.skillColor}40`, backgroundColor: `${item.skillColor}15` }}
            >
              {item.skillName}
            </span>
          </div>

          <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
            {item.text}
          </p>

          {item.codeSnippet && (
            <div className="bg-surface-dim rounded-sm p-3 mt-2 border border-white/[0.04] font-mono-sm text-mono-sm text-on-surface-variant overflow-x-auto">
              <code>{item.codeSnippet.code}</code>
            </div>
          )}

          {item.attachment && item.attachment.type === 'image' && (
            <div className="mt-3 w-full h-32 rounded-sm border border-white/[0.08] overflow-hidden relative group-hover:border-primary/30 transition-colors">
              <div
                className="bg-cover bg-center w-full h-full opacity-60 mix-blend-screen"
                style={{ backgroundImage: `url('${item.attachment.url}')` }}
              ></div>
              {item.attachment.cta && (
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent flex items-end p-4">
                  <button className="bg-primary text-background font-button-text px-4 py-1.5 rounded-sm hover:scale-[1.02] transition-transform duration-150">
                    {item.attachment.cta}
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/[0.04]">
            <button className="flex items-center gap-1.5 text-on-surface-variant hover:text-primary transition-colors font-mono-sm">
              <span className="material-symbols-outlined text-[16px]">terminal</span> Reply
            </button>
            <button className="flex items-center gap-1.5 text-on-surface-variant hover:text-secondary transition-colors font-mono-sm">
              <span className="material-symbols-outlined text-[16px]">favorite</span> {item.likes || 0}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
