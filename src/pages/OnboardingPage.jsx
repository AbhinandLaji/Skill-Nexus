import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import SkillCard from '../components/SkillCard';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [skills, setSkills] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    api.getSkills()
      .then(setSkills)
      .catch(console.error);
  }, []);

  const getIconForSkill = (name) => {
    switch (name) {
      case 'Python': return 'terminal';
      case 'MERN Stack': return 'dns';
      case 'AI/ML': return 'psychology';
      case 'DSA': return 'account_tree';
      case 'UI/UX': return 'design_services';
      case 'Cybersecurity': return 'shield';
      default: return 'code';
    }
  };

  const toggleSkill = (id) => {
    setSelectedSkills(prev => 
      prev.includes(id) ? prev.filter(skillId => skillId !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (selectedSkills.length === 0) return;
    
    setIsLoading(true);
    setErrorMsg('');
    
    try {
      await api.updateUserSkills({ skills: selectedSkills });
      navigate('/dashboard');
    } catch (err) {
      setErrorMsg(err.message || 'An error occurred while saving your skills.');
      setIsLoading(false);
    }
  };

  const isValid = selectedSkills.length > 0;

  return (
    <main className="w-full flex min-h-screen items-center justify-center bg-background text-on-background font-body-md">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col w-full h-full justify-between pb-8 min-h-screen"
      >
        <div className="flex flex-col w-full px-4 sm:px-6 md:px-12 lg:px-[48px] max-w-[1280px] mx-auto pt-16 flex-1">
          <div className="w-full flex items-center justify-between mb-12">
            <div className="flex space-x-2">
              <div className="w-8 h-1 bg-surface-variant rounded-full overflow-hidden">
                <div className="w-full h-full bg-primary-fixed"></div>
              </div>
              <div className="w-8 h-1 bg-surface-variant rounded-full overflow-hidden">
                <div className="w-1/2 h-full bg-primary-fixed"></div>
              </div>
              <div className="w-8 h-1 bg-surface-variant rounded-full"></div>
            </div>
            <div className="font-mono-sm text-mono-sm text-tertiary-fixed-dim uppercase tracking-widest text-right">
              Step 2 of 3
            </div>
          </div>
          
          <div className="flex flex-col mb-12 relative z-10">
            <h1 className="font-display text-display text-on-background mb-4 text-center md:text-left">
              What do you want to build?
            </h1>
            <p className="font-body-md text-body-md text-surface-variant text-center md:text-left">
              Pick as many as you like. This helps us customize your terminal environment.
            </p>
          </div>
          
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8 w-full z-10"
          >
            {skills.map(skill => (
              <SkillCard
                key={skill.id}
                id={skill.id}
                name={skill.name}
                icon={getIconForSkill(skill.name)}
                isSelected={selectedSkills.includes(skill.id)}
                onClick={toggleSkill}
              />
            ))}
          </motion.div>
        </div>
        
        <div className="sticky bottom-0 left-0 right-0 w-full bg-background/90 backdrop-blur-md border-t border-white/10 p-6 md:px-12 flex flex-col sm:flex-row items-center justify-end gap-4 z-50 mt-16">
          {errorMsg && (
            <span className="text-error font-body-md text-sm">{errorMsg}</span>
          )}
          <button 
            onClick={handleSubmit}
            disabled={!isValid || isLoading}
            className={`px-8 py-4 rounded-xl font-button-text text-button-text transition-all duration-300 flex items-center justify-center gap-3 ${
              isValid
                ? 'bg-primary-fixed text-on-primary hover:scale-[1.02] cursor-pointer shadow-md'
                : 'bg-surface-variant text-on-background/50 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <span className="material-symbols-outlined animate-spin">refresh</span>
            ) : (
              <>
                <span>Continue to Terminal</span>
                <span className="material-symbols-outlined">arrow_forward</span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </main>
  );
}
