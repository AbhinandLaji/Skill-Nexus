import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOutletContext, useParams } from 'react-router-dom';
import { api } from '../services/api';
import ProfileHeader from '../components/ProfileHeader';
import ReputationBoard from '../components/ReputationBoard';
import PortfolioGrid from '../components/PortfolioGrid';
import EditProfileModal from '../components/EditProfileModal';

export default function UserProfile() {
  const { user: currentUser } = useOutletContext();
  const { userId } = useParams();
  
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Default to the current logged-in user if no specific ID is provided
  const targetUserId = userId || currentUser?.id || 'me';

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const data = await api.getUserProfile(targetUserId);
        
        // Let's ensure the data matches the expected shape from the mockup if missing
        const enrichedData = {
          ...data,
          bio: data.bio || 'Building scalable ML pipelines and mentoring junior devs in systems architecture. Currently obsessed with Rust optimization and edge computing. Always down to debug weird memory leaks over coffee.',
          skills: data.skills || ['Python', 'AI/ML', 'Distributed Systems', 'Rust'],
          isMentor: data.isMentor !== undefined ? data.isMentor : true,
          stats: data.stats || {
            queriesResolved: 342,
            teamsAdvised: 14,
            sessionsLed: 28
          },
          projects: data.projects || []
        };
        
        setProfileData(enrichedData);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [targetUserId]);

  const handleProfileUpdate = (updatedData) => {
    setProfileData(updatedData);
    setToastMessage('Profile updated successfully!');
    setTimeout(() => setToastMessage(''), 3000);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col w-full px-[48px] py-[32px] gap-12">
        <div className="w-full h-32 bg-surface-container rounded-xl animate-pulse"></div>
        <div className="grid grid-cols-12 gap-[24px]">
          <div className="col-span-12 lg:col-span-4 h-64 bg-surface-container rounded-xl animate-pulse"></div>
          <div className="col-span-12 lg:col-span-8 h-96 bg-surface-container rounded-xl animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return <div className="p-12 text-center text-on-surface-variant">Profile not found.</div>;
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col w-full px-6 lg:px-[48px] py-8 relative"
    >
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-8 z-50 bg-primary-container text-on-primary-container px-6 py-3 rounded-lg shadow-lg font-mono-sm font-semibold border border-primary/20 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <ProfileHeader 
        user={profileData} 
        onEditClick={() => setIsEditModalOpen(true)} 
      />

      <div className="grid grid-cols-12 gap-[24px]">
        {/* Left Column (Stats & About) */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-[24px]">
          <ReputationBoard user={profileData} />
          
          {/* About Card */}
          <div className="bg-surface-container rounded-xl p-[24px] border border-white/[0.08] hover:-translate-y-0.5 hover:border-white/20 transition-all duration-200">
            <h3 className="font-mono-sm text-mono-sm text-on-tertiary-container uppercase tracking-widest mb-[16px]">Terminal Log</h3>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              {profileData.bio}
            </p>
          </div>
          
          {/* Visual Element */}
          <div className="w-full h-48 rounded-xl bg-surface-container border border-white/[0.08] relative overflow-hidden flex items-center justify-center group cursor-pointer hover:border-primary/50 transition-colors hidden md:flex">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background"></div>
            <svg className="w-32 h-32 text-primary opacity-50 group-hover:opacity-80 transition-opacity" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 100 100">
              <path className="animate-[spin_20s_linear_infinite]" d="M50 10 L90 30 L90 70 L50 90 L10 70 L10 30 Z" strokeDasharray="4 4" style={{ animation: 'spin 20s linear infinite' }}></path>
              <circle cx="50" cy="50" r="25"></circle>
              <circle cx="50" cy="50" fill="currentColor" r="4"></circle>
            </svg>
            <div className="absolute bottom-4 left-4 font-mono-sm text-mono-sm text-primary/60">SYS_ACTIVITY_INDEX // HIGH</div>
          </div>
        </div>

        {/* Right Column (Active Teams) */}
        <PortfolioGrid projects={profileData.projects} />
      </div>

      <EditProfileModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        user={profileData}
        onSuccess={handleProfileUpdate}
      />
    </motion.div>
  );
}
