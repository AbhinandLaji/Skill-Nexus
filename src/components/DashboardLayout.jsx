import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { api } from '../services/api';

export default function DashboardLayout() {
  const [user, setUser] = useState(null);
  const [skills, setSkills] = useState([]);
  const [channels, setChannels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Mobile responsive sidebar toggle
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarExpanded(true);
      } else {
        setIsSidebarExpanded(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        const [userData, channelsData, skillsData] = await Promise.all([
          api.getMe().catch(() => null),
          api.getChannels().catch(() => []),
          api.getSkills().catch(() => [])
        ]);
        
        setUser(userData);
        setChannels(channelsData || []);
        setSkills(skillsData || []);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Partition channels
  // Bridge user.skills (name strings vs ObjectIds) and channel.skillId mismatch
  const rawUserSkills = user?.skills || [];
  
  // Map user.skills to a normalized set of both skill IDs and lowercase skill names
  const userSkillNames = new Set();
  const userSkillIdSet = new Set();

  rawUserSkills.forEach(s => {
    if (!s) return;
    const str = String(s).trim();
    userSkillIdSet.add(str);
    userSkillNames.add(str.toLowerCase());
    
    // If str is a skill ID, find skill name from skills array
    const matchedById = skills.find(sk => sk.id === str || sk._id === str);
    if (matchedById?.name) {
      userSkillNames.add(matchedById.name.toLowerCase());
    }
    // If str is a skill name, find skill ID from skills array
    const matchedByName = skills.find(sk => sk.name.toLowerCase() === str.toLowerCase());
    if (matchedByName) {
      if (matchedByName.id) userSkillIdSet.add(String(matchedByName.id));
      if (matchedByName._id) userSkillIdSet.add(String(matchedByName._id));
    }
  });

  const currentUserId = user?.id || user?._id;
  const isDirectMember = (c) => {
    if (!currentUserId || !c.members || !Array.isArray(c.members)) return false;
    return c.members.some(m => String(m) === String(currentUserId) || (m._id && String(m._id) === String(currentUserId)));
  };

  const memberChannels = channels.filter(isDirectMember);
  const otherChannels = channels.filter(c => !isDirectMember(c));

  const matchingChannels = otherChannels.filter(c => {
    // 1. Direct match on channel.skillId
    if (c.skillId && userSkillIdSet.has(String(c.skillId))) return true;

    // 2. Match if skill object corresponding to channel.skillId has its name in user.skills
    const skillObj = skills.find(sk => sk.id === c.skillId || sk._id === c.skillId);
    if (skillObj && userSkillNames.has(skillObj.name.toLowerCase())) return true;

    // 3. Normalized channel name (e.g., #python-help -> python) match
    const cleanChanName = (c.name || '').replace(/^[#]/, '').toLowerCase();
    for (const skillName of userSkillNames) {
      const normalizedSkill = skillName.replace(/[^a-z0-9]/g, '');
      const normalizedChan = cleanChanName.replace(/[^a-z0-9]/g, '');
      if (normalizedSkill && normalizedChan && (normalizedChan.includes(normalizedSkill) || normalizedSkill.includes(normalizedChan))) {
        return true;
      }
    }
    return false;
  });

  const joinedChannels = memberChannels.length > 0 
    ? [...memberChannels, ...matchingChannels.filter(mc => !memberChannels.some(m => m.id === mc.id || m._id === mc._id)).slice(0, 2)]
    : (matchingChannels.length > 0 ? matchingChannels.slice(0, 2) : channels.slice(0, 2));

  const suggestedChannels = channels.filter(c => !joinedChannels.some(jc => jc.id === c.id || jc._id === c._id));

  return (
    <div className="bg-background min-h-screen text-on-background font-body-md flex">
      <Sidebar 
        joinedChannels={joinedChannels} 
        suggestedChannels={suggestedChannels} 
        isExpanded={isSidebarExpanded}
        isLoading={isLoading}
        skills={skills}
      />
      
      <div 
        className={`flex-1 transition-all duration-300 ${isSidebarExpanded ? 'pl-[260px]' : 'pl-[80px]'}`}
      >
        <TopBar 
          user={user} 
          skills={skills}
          isSidebarExpanded={isSidebarExpanded}
          setIsSidebarExpanded={setIsSidebarExpanded}
        />
        
        <main className="pt-16 min-h-screen">
          <Outlet context={{ user, skills, channels, isLoading }} />
        </main>
      </div>
    </div>
  );
}
