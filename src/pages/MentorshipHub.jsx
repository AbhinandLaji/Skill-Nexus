import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import MentorCard from '../components/MentorCard';
import OpportunityCard from '../components/OpportunityCard';

const tabVariants = {
  hidden: { opacity: 0, x: 20 },
  show: {
    opacity: 1, x: 0,
    transition: { staggerChildren: 0.1 }
  },
  exit: { opacity: 0, x: -20, transition: { duration: 0.2 } }
};

export default function MentorshipHub() {
  const [activeTab, setActiveTab] = useState('opportunities'); // 'opportunities' | 'mentors'
  const [opportunities, setOpportunities] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [oppsData, mentorsData] = await Promise.all([
          api.getOpportunities(),
          api.getMentors()
        ]);
        setOpportunities(oppsData);
        setMentors(mentorsData);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="flex flex-col w-full px-4 lg:px-8 pb-12 pt-8">
      <div className="mb-12 relative flex items-center justify-between">
        <div className="flex flex-col gap-2 relative z-10">
          <h1 className="font-display text-display text-on-surface">Growth Hub</h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
            Discover curated opportunities and get advice from verified industry professionals.
          </p>
        </div>
        <div className="hidden lg:block relative w-48 h-48 opacity-20 pointer-events-none absolute right-0 top-[-20px] z-0">
          <svg className="w-full h-full animate-[spin_60s_linear_infinite]" style={{ animation: 'spin 60s linear infinite' }} viewBox="0 0 100 100">
            <defs>
              <linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#b4f461"></stop>
                <stop offset="100%" stopColor="#ffb4a2"></stop>
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="45" fill="none" stroke="url(#glow)" strokeWidth="0.5" strokeDasharray="2 4"></circle>
            <circle cx="50" cy="50" r="35" fill="none" stroke="url(#glow)" strokeWidth="0.5" strokeDasharray="4 2"></circle>
            <path d="M 50 10 L 50 90 M 10 50 L 90 50 M 22 22 L 78 78 M 22 78 L 78 22" stroke="url(#glow)" strokeWidth="0.2"></path>
          </svg>
        </div>
      </div>
      
      {/* Tabs Container */}
      <div className="flex flex-nowrap overflow-x-auto items-center gap-6 mb-8 relative before:absolute before:bottom-0 before:left-0 before:w-full before:h-px before:bg-white/[0.08] custom-scrollbar">
        <button 
          onClick={() => setActiveTab('opportunities')}
          className={`font-headline-lg text-headline-lg-mobile pb-4 relative transition-colors whitespace-nowrap px-1 ${
            activeTab === 'opportunities' ? 'text-on-surface' : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Opportunities
          <div className={`absolute bottom-0 left-0 w-full h-[2px] bg-primary rounded-t-full transition-transform duration-300 transform origin-left ${
            activeTab === 'opportunities' ? 'scale-x-100' : 'scale-x-0'
          }`}></div>
        </button>
        <button 
          onClick={() => setActiveTab('mentors')}
          className={`font-headline-lg text-headline-lg-mobile pb-4 relative transition-colors whitespace-nowrap px-1 ${
            activeTab === 'mentors' ? 'text-on-surface' : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          Mentors
          <div className={`absolute bottom-0 left-0 w-full h-[2px] bg-primary rounded-t-full transition-transform duration-300 transform origin-left ${
            activeTab === 'mentors' ? 'scale-x-100' : 'scale-x-0'
          }`}></div>
        </button>
      </div>
      
      {/* Feeds */}
      <div className="relative min-h-[500px]">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-surface-container border border-white/[0.08] rounded-xl animate-pulse"></div>
            ))}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {activeTab === 'opportunities' && (
              <motion.div 
                key="feed-opportunities"
                variants={tabVariants}
                initial="hidden"
                animate="show"
                exit="exit"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {opportunities.map(opp => (
                  <OpportunityCard key={opp.id} opportunity={opp} />
                ))}
              </motion.div>
            )}
            
            {activeTab === 'mentors' && (
              <motion.div 
                key="feed-mentors"
                variants={tabVariants}
                initial="hidden"
                animate="show"
                exit="exit"
                className="flex flex-col gap-6"
              >
                {mentors.map(mentor => (
                  <MentorCard key={mentor.id} mentor={mentor} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
