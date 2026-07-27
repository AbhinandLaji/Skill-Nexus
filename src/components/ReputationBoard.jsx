import React from 'react';

export default function ReputationBoard({ user }) {
  return (
    <div className="bg-surface-container rounded-xl p-[24px] border border-white/[0.08] hover:-translate-y-0.5 hover:border-white/20 transition-all duration-200">
      <h3 className="font-mono-sm text-mono-sm text-on-tertiary-container uppercase tracking-widest mb-[24px]">Nexus Contributions</h3>
      <div className="flex flex-col gap-[16px]">
        <div className="flex flex-row justify-between items-center py-2 border-b border-white/[0.08]">
          <div className="flex items-center gap-3 text-on-surface-variant font-body-md text-body-md">
            <span className="material-symbols-outlined text-[20px] text-primary/70">forum</span>
            Queries Resolved
          </div>
          <span className="font-mono-label text-mono-label text-primary">{user.stats?.queriesResolved || 342}</span>
        </div>
        
        <div className="flex flex-row justify-between items-center py-2 border-b border-white/[0.08]">
          <div className="flex items-center gap-3 text-on-surface-variant font-body-md text-body-md">
            <span className="material-symbols-outlined text-[20px] text-secondary/70">group</span>
            Teams Advised
          </div>
          <span className="font-mono-label text-mono-label text-secondary">{user.stats?.teamsAdvised || 14}</span>
        </div>
        
        <div className="flex flex-row justify-between items-center py-2">
          <div className="flex items-center gap-3 text-on-surface-variant font-body-md text-body-md">
            <span className="material-symbols-outlined text-[20px] text-tertiary-fixed-dim/70">video_camera_front</span>
            Sessions Led
          </div>
          <span className="font-mono-label text-mono-label text-tertiary-fixed-dim">{user.stats?.sessionsLed || 28}</span>
        </div>
      </div>
    </div>
  );
}
