import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOutletContext } from 'react-router-dom';
import { api } from '../services/api';
import TeamCard from '../components/TeamCard';
import CreatePostModal from '../components/CreatePostModal';

export default function TeamMatchmaking() {
  const { user } = useOutletContext();
  const [teams, setTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('browse'); // 'browse' | 'my-listings'
  
  // Filters state
  const [activeSkillFilter, setActiveSkillFilter] = useState('All');
  const [activeTypeFilter, setActiveTypeFilter] = useState('All');

  const fetchTeams = async () => {
    setIsLoading(true);
    try {
      const data = await api.getTeams();
      setTeams(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleDeleteTeam = async (teamId) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;
    try {
      await api.deleteTeam(teamId);
      setTeams(prev => prev.filter(t => (t.id !== teamId && t._id !== teamId)));
    } catch (err) {
      console.error('Failed to delete team:', err);
    }
  };

  // Compute unique filter options from fetched data or static list
  const skillFilters = ['All', 'React / Next.js', 'Python (AI/ML)', 'Rust', 'UI/UX Design'];
  const typeFilters = ['All', 'Hackathon', 'Long-term', 'Study Group'];

  const currentUserId = user?.id || user?._id;
  const isMyTeam = (team) => {
    if (!user) return false;
    if (team.authorId && currentUserId && String(team.authorId) === String(currentUserId)) return true;
    if (team.authorName && user.name && team.authorName.trim().toLowerCase() === user.name.trim().toLowerCase()) return true;
    return false;
  };

  const myTeamsCount = teams.filter(isMyTeam).length;

  const filteredTeams = teams.filter(team => {
    if (activeTab === 'my-listings' && !isMyTeam(team)) {
      return false;
    }
    const matchesType = activeTypeFilter === 'All' || team.projectType === activeTypeFilter;
    const matchesSkill = activeSkillFilter === 'All' || (team.requiredSkills || []).some(s => {
      const skillName = typeof s === 'string' ? s : (s.name || '');
      if (activeSkillFilter === 'React / Next.js' && (skillName.includes('Next.js') || skillName.includes('React'))) return true;
      if (activeSkillFilter === 'Python (AI/ML)' && (skillName.includes('Python') || skillName.includes('AI/ML') || skillName === 'AI')) return true;
      if (activeSkillFilter === 'Rust' && skillName.includes('Rust')) return true;
      if (activeSkillFilter === 'UI/UX Design' && skillName.includes('UI/UX')) return true;
      return false;
    });
    return matchesType && matchesSkill;
  });

  return (
    <div className="flex flex-col w-full h-full pb-12 px-4 lg:px-12 mt-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 relative z-10 gap-4">
        <div>
          <h1 className="font-display text-display text-on-background mb-4">Find your team</h1>
          <div className="inline-flex bg-surface-container rounded-lg p-1 border border-white/[0.08] overflow-x-auto max-w-full">
            <button 
              onClick={() => setActiveTab('browse')}
              className={`px-4 py-2 font-button-text text-button-text rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'browse'
                  ? 'bg-surface-variant text-on-surface shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Browse listings
            </button>
            <button 
              onClick={() => setActiveTab('my-listings')}
              className={`px-4 py-2 font-button-text text-button-text rounded-md transition-colors whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                activeTab === 'my-listings'
                  ? 'bg-surface-variant text-on-surface shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              My posted listings
              {myTeamsCount > 0 && (
                <span className="px-1.5 py-0.5 text-[11px] rounded-full bg-primary/20 text-primary font-mono-sm">
                  {myTeamsCount}
                </span>
              )}
            </button>
          </div>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-on-primary font-button-text text-button-text px-6 py-3 rounded-lg hover:scale-[1.02] transition-transform duration-150 flex items-center gap-2 shrink-0"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Post a listing
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 relative z-10">
        
        {/* Sidebar Filters */}
        <aside className="w-full lg:w-64 shrink-0 flex flex-col gap-8">
          <div className="bg-surface-container rounded-xl p-[24px] border border-white/[0.08]">
            <h3 className="font-mono-label text-mono-label text-on-surface uppercase mb-4 tracking-wider">Filters</h3>
            
            <div className="mb-6">
              <label className="font-mono-sm text-mono-sm text-on-surface-variant block mb-3 uppercase">Skills Required</label>
              <div className="flex flex-col gap-2">
                {skillFilters.map(filter => {
                  const isActive = activeSkillFilter === filter;
                  return (
                    <label key={filter} className="flex items-center gap-3 cursor-pointer group" onClick={() => setActiveSkillFilter(filter)}>
                      <div className={`w-4 h-4 border rounded flex items-center justify-center transition-colors ${
                        isActive ? 'border-primary-fixed-dim bg-primary-fixed-dim' : 'border-outline-variant bg-surface group-hover:border-primary-fixed-dim'
                      }`}>
                        {isActive && <span className="material-symbols-outlined text-on-primary-fixed text-[14px]">check</span>}
                      </div>
                      <span className={`font-body-md text-body-md transition-colors ${
                        isActive ? 'text-on-surface' : 'text-on-surface-variant group-hover:text-on-surface'
                      }`}>
                        {filter}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
            
            <div className="mb-6">
              <label className="font-mono-sm text-mono-sm text-on-surface-variant block mb-3 uppercase">Project Type</label>
              <div className="flex flex-col gap-2">
                {typeFilters.map(filter => {
                  const isActive = activeTypeFilter === filter;
                  return (
                    <label key={filter} className="flex items-center gap-3 cursor-pointer group" onClick={() => setActiveTypeFilter(filter)}>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                        isActive ? 'border-primary-fixed-dim' : 'border-outline-variant group-hover:border-primary-fixed-dim'
                      }`}>
                        {isActive && <div className="w-2 h-2 rounded-full bg-primary-fixed-dim"></div>}
                      </div>
                      <span className={`font-body-md text-body-md transition-colors ${
                        isActive ? 'text-on-surface' : 'text-on-surface-variant group-hover:text-on-surface'
                      }`}>
                        {filter}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </aside>

        {/* Grid of Team Cards */}
        <div className="flex-1">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-[16px]">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-64 bg-surface-container border border-white/[0.08] rounded-xl animate-pulse"></div>
              ))}
            </div>
          ) : filteredTeams.length > 0 ? (
            <motion.div 
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-[16px]"
            >
              <AnimatePresence>
                {filteredTeams.map(team => (
                  <TeamCard 
                    key={team.id || team._id} 
                    team={team} 
                    currentUser={user}
                    onDelete={handleDeleteTeam}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          ) : activeTab === 'my-listings' ? (
            <div className="flex flex-col items-center justify-center h-64 text-on-surface-variant border border-white/[0.08] border-dashed rounded-xl p-8 text-center">
              <span className="material-symbols-outlined text-[48px] mb-4 opacity-50 text-primary">groups</span>
              <p className="font-button-text text-on-surface text-base mb-1">You haven't posted any listings yet</p>
              <p className="font-body-md text-xs text-on-surface-variant max-w-sm mb-4">
                Looking for teammates for a hackathon, study group, or project? Post a listing to find collaborators.
              </p>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-primary text-on-primary font-button-text text-sm px-4 py-2 rounded-lg hover:scale-[1.02] transition-transform duration-150 flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                Post a listing
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-on-surface-variant border border-white/[0.08] border-dashed rounded-xl">
              <span className="material-symbols-outlined text-[48px] mb-4 opacity-50">search_off</span>
              <p>No teams match your current filters.</p>
              <button 
                onClick={() => { setActiveSkillFilter('All'); setActiveTypeFilter('All'); }}
                className="mt-4 text-primary-fixed-dim hover:underline font-mono-sm"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>

      <CreatePostModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchTeams}
      />
    </div>
  );
}
