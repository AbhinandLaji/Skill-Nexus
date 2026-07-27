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
          api.getMe(),
          api.getChannels(),
          api.getSkills()
        ]);
        
        setUser(userData);
        setChannels(channelsData);
        setSkills(skillsData);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Partition channels
  // Using user.skills to figure out "Joined" vs "Suggested"
  // For demo, first 2 matching are joined, rest matching are suggested
  const userSkillIds = user?.skills || [];
  
  const matchingChannels = channels.filter(c => userSkillIds.includes(c.skillId));
  const joinedChannels = matchingChannels.slice(0, 2);
  const suggestedChannels = matchingChannels.slice(2);

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
