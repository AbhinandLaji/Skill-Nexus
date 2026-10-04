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

  // Compute unique filter options from fetched data or static list
  const skillFilters = ['All', 'React / Next.js', 'Python (AI/ML)', 'Rust', 'UI/UX Design'];
  const typeFilters = ['All', 'Hackathon', 'Long-term', 'Study Group'];

  const filteredTeams = teams.filter(team => {
    const matchesType = activeTypeFilter === 'All' || team.projectType === activeTypeFilter;
    const matchesSkill = activeSkillFilter === 'All' || team.requiredSkills.some(s => {
      // Very naive matching for the demo
      if (activeSkillFilter === 'React / Next.js' && (s.name.includes('Next.js') || s.name.includes('React'))) return true;
      if (activeSkillFilter === 'Python (AI/ML)' && (s.name.includes('Python') || s.name.includes('AI/ML'))) return true;
      if (activeSkillFilter === 'Rust' && s.name.includes('Rust')) return true;
      if (activeSkillFilter === 'UI/UX Design' && s.name.includes('UI/UX')) return true;
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
            <button className="px-4 py-2 bg-surface-variant text-on-surface font-button-text text-button-text rounded-md transition-colors whitespace-nowrap">
              Browse listings
            </button>
            <button className="px-4 py-2 text-on-surface-variant hover:text-on-surface font-button-text text-button-text rounded-md transition-colors whitespace-nowrap">
              My posted listings
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
                  <TeamCard key={team.id} team={team} />
                ))}
              </AnimatePresence>
            </motion.div>
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
