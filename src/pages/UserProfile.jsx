import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOutletContext, useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import ProfileHeader from '../components/ProfileHeader';
import ReputationBoard from '../components/ReputationBoard';
import PortfolioGrid from '../components/PortfolioGrid';
import EditProfileModal from '../components/EditProfileModal';

export default function UserProfile() {
  const { user: currentUser, skills: allSkills = [] } = useOutletContext();
  const { userId } = useParams();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    navigate('/auth');
  };
  
  const [mockUserProfile, setMockUserProfile] = useState({
    name: currentUser?.name || 'Alex Chen',
    email: currentUser?.email || 'alex.c@tkmce.ac.in',
    avatar: currentUser?.avatar || null,
    batch: currentUser?.batch || null,
    isMentor: true,
    skills: ["Python", "MERN Stack", "AWS", "UI/UX"],
    stats: {
      queriesResolved: 342,
      teamsAdvised: 14,
      sessionsLed: 28
    },
    bio: 'Building scalable ML pipelines and mentoring junior devs in systems architecture. Currently obsessed with Rust optimization and edge computing. Always down to debug weird memory leaks over coffee.',
    projects: [
      {
        id: '1',
        title: 'Nexus AI Swarm Platform',
        description: 'Multi-agent system for automated code verification and syntax testing.',
        role: 'Lead Architect',
        status: 'Active'
      },
      {
        id: '2',
        title: 'ZK Campus Voting Protocol',
        description: 'Decentralized cryptographic voting engine deployed for collegiate council elections.',
        role: 'Core Contributor',
        status: 'Completed'
      }
    ]
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Default to the current logged-in user if no specific ID is provided
  const targetUserId = userId || currentUser?.id || 'me';

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        let skillsPool = allSkills;
        if (!skillsPool || skillsPool.length === 0) {
          skillsPool = await api.getSkills().catch(() => []);
        }
        const [data, userTeams] = await Promise.all([
          api.getUserProfile(targetUserId).catch(() => null),
          api.getTeams().catch(() => [])
        ]);

        if (data) {
          // Resolve raw ObjectIDs to human-readable names if present
          const resolvedSkills = Array.isArray(data.skills) && data.skills.length > 0
            ? data.skills.map(s => {
                if (typeof s === 'string') {
                  const matched = skillsPool.find(sk => sk.id === s || sk._id === s);
                  if (matched) return matched.name;
                  if (s.match(/^[0-9a-fA-F]{24}$/) || s.match(/^[0-9a-fA-F-]{36}$/)) {
                    return null;
                  }
                  return s;
                }
                return s?.name || null;
              }).filter(Boolean)
            : [];

          const currentUid = data._id || data.id;
          const activeSquadProjects = (userTeams || [])
            .filter(t => {
              if (t.authorId && currentUid && String(t.authorId) === String(currentUid)) return true;
              if (t.members && currentUid && t.members.some(m => String(m) === String(currentUid))) return true;
              return false;
            })
            .map(t => ({
              id: t.id || t._id,
              title: t.title,
              description: t.description,
              role: (t.authorId && String(t.authorId) === String(currentUid)) ? 'Squad Lead' : 'Member',
              status: t.status === 'filled' ? 'FULL' : 'RECRUITING',
              channelId: t.channelId,
              statusColor: t.status === 'filled' ? 'secondary' : 'primary'
            }));

          setMockUserProfile(prev => ({
            ...prev,
            ...data,
            batch: data.batch || prev.batch,
            skills: resolvedSkills.length > 0 ? resolvedSkills : prev.skills,
            projects: activeSquadProjects.length > 0 ? activeSquadProjects : (data.projects && data.projects.length > 0 ? data.projects : prev.projects),
            stats: {
              queriesResolved: data.stats?.queriesResolved ?? prev.stats.queriesResolved,
              teamsAdvised: data.stats?.teamsAdvised ?? prev.stats.teamsAdvised,
              sessionsLed: data.stats?.sessionsLed ?? prev.stats.sessionsLed
            },
            bio: data.bio || prev.bio
          }));
        }
      } catch (err) {
        console.error("Using mockUserProfile defaults:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [targetUserId, allSkills]);

  const handleProfileUpdate = (updatedData) => {
    setMockUserProfile(prev => ({ ...prev, ...updatedData }));
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
        user={mockUserProfile} 
        onEditClick={() => setIsEditModalOpen(true)} 
        onLogout={handleLogout}
      />

      <div className="grid grid-cols-12 gap-[24px]">
        {/* Left Column (Stats & About) */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-[24px]">
          <ReputationBoard user={mockUserProfile} />
          
          {/* About Card */}
          <div className="bg-surface-container rounded-xl p-[24px] border border-white/[0.08] hover:-translate-y-0.5 hover:border-white/20 transition-all duration-200">
            <h3 className="font-mono-sm text-mono-sm text-on-tertiary-container uppercase tracking-widest mb-[16px]">Terminal Log</h3>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              {mockUserProfile.bio}
            </p>
          </div>
        </div>

        {/* Right Column (Active Teams) */}
        <PortfolioGrid projects={mockUserProfile.projects} />
      </div>

      <EditProfileModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        user={mockUserProfile}
        onSuccess={handleProfileUpdate}
      />
    </motion.div>
  );
}
