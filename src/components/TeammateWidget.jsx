import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

export default function TeammateWidget({ matches = [] }) {
  const [requested, setRequested] = useState({});

  const handleRequest = async (teamId) => {
    setRequested(current => ({ ...current, [teamId]: 'loading' }));
    try {
      await api.requestToJoinTeam(teamId);
      setRequested(current => ({ ...current, [teamId]: 'sent' }));
    } catch (error) {
      console.error('Failed to request to join recommended team:', error);
      setRequested(current => ({ ...current, [teamId]: 'error' }));
    }
  };

  return (
    <div className="bg-surface-container rounded-lg border border-white/[0.08] p-5 relative overflow-hidden group hover:border-white/[0.15] transition-colors">
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-secondary via-primary to-transparent opacity-50" />
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-mono-label text-on-surface uppercase tracking-wider flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-secondary">group_add</span>
          Teammate matches
        </h3>
        <span className="font-mono-sm text-[10px] text-secondary">SKILL BASED</span>
      </div>
      <p className="font-mono-sm text-on-surface-variant/70 mb-4 border-b border-white/[0.08] pb-3">
        Open teams ranked by how well your skills fit their needs.
      </p>

      <div className="flex flex-col gap-3">
        {matches.length === 0 ? (
          <div className="p-4 rounded-lg bg-surface-container-high/40 border border-white/[0.04] text-center">
            <p className="font-mono-sm text-xs text-on-surface-variant/80">No open team matches yet</p>
            <span className="font-mono-sm text-[11px] text-on-surface-variant/50">Add skills to your profile or check back later.</span>
          </div>
        ) : matches.map(team => {
          const id = team.id || team._id;
          const skills = team.matchedSkills || [];
          const status = requested[id];
          return (
            <div key={id} className="p-3 rounded-lg bg-surface-container-high/30 border border-white/[0.05]">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-button-text text-on-surface text-sm truncate">{team.title}</p>
                  <p className="font-mono-sm text-[10px] text-on-surface-variant mt-1">
                    {team.matchScore}% skill fit{skills.length ? ` · Matches: ${skills.join(', ')}` : ' · No direct skill overlap'}
                  </p>
                </div>
                <span className="font-mono-sm text-[10px] text-primary-fixed-dim shrink-0">{team.lookingForCount} spots</span>
              </div>
              {status === 'sent' ? (
                <span className="mt-2 inline-block font-mono-sm text-xs text-secondary">Request sent</span>
              ) : (
                <button
                  onClick={() => handleRequest(id)}
                  disabled={status === 'loading'}
                  className="mt-2 font-mono-sm text-xs text-primary-fixed-dim hover:underline disabled:opacity-50"
                >
                  {status === 'loading' ? 'Sending…' : status === 'error' ? 'Retry request' : 'Request to join'}
                </button>
              )}
            </div>
          );
        })}
      </div>
      <Link to="/dashboard/matchmaking" className="block w-full mt-4 py-2 border border-outline-variant/50 rounded-sm font-mono-sm text-on-surface-variant hover:text-primary hover:border-primary/50 transition-all text-center">
        Browse all teams
      </Link>
    </div>
  );
}
