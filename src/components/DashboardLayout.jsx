import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { api } from '../services/api';

export default function DashboardLayout() {
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });
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
        
        if (userData) {
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        } else {
          setUser(userData);
        }
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

  // Partition channels by actual membership, not skill preferences.
  const currentUserId = user?.id || user?._id;

  // 1. Communities I created
  const isCreatedByMe = (c) => {
    if (!currentUserId) return false;
    return c.admin && (String(c.admin) === String(currentUserId) || (c.admin._id && String(c.admin._id) === String(currentUserId)));
  };

  // 2. Communities I joined
  const isAcceptedMember = (c) => {
    if (c.isMember) return true;
    if (!currentUserId || !c.members || !Array.isArray(c.members)) return false;
    return c.members.some(m => {
      if (!m) return false;
      const memberId = typeof m === 'object' && m._id ? m._id.toString() : (m.id ? m.id.toString() : m.toString());
      return memberId === String(currentUserId);
    });
  };

  // Membership is based on actual channel membership, not the user's skill preferences.
  const myCommunitiesMap = new Map();
  channels.forEach(c => {
    if (isCreatedByMe(c) || isAcceptedMember(c)) {
      myCommunitiesMap.set(c.id || c._id, c);
    }
  });

  const joinedChannels = Array.from(myCommunitiesMap.values());
  const suggestedChannels = channels.filter(c => !myCommunitiesMap.has(c.id || c._id));

  const handleChannelDeleted = (deletedChannelId) => {
    setChannels(prev => prev.filter(c => {
      const cId = c.id || c._id;
      return cId !== deletedChannelId && c.name !== deletedChannelId && c.name !== `#${deletedChannelId}`;
    }));
  };

  return (
    <div className="bg-background min-h-screen text-on-background font-body-md flex">
      <Sidebar 
        user={user}
        joinedChannels={joinedChannels} 
        suggestedChannels={suggestedChannels} 
        isExpanded={isSidebarExpanded}
        isLoading={isLoading}
        skills={skills}
        onChannelCreated={(newChan) => {
          setChannels(prev => {
            const exists = prev.some(c => (c.id === newChan.id || c._id === newChan.id));
            if (exists) return prev;
            return [newChan, ...prev];
          });
        }}
        onChannelDeleted={handleChannelDeleted}
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
          <Outlet context={{
            user, skills, channels, isLoading,
            onChannelUpdated: (updatedChannel) => {
              setChannels(prev => prev.map(c => ((c.id || c._id) === (updatedChannel.id || updatedChannel._id) || c.name === updatedChannel.id || c.name === `#${updatedChannel.id}` || c.name === updatedChannel.name) ? { ...c, ...updatedChannel } : c));
            },
            onResetChannelUnread: (targetChannelId) => {
              setChannels(prev => prev.map(c => ((c.id || c._id) === targetChannelId || c.name === targetChannelId || c.name === `#${targetChannelId}`) ? { ...c, unreadCount: 0 } : c));
            },
            onChannelDeleted: handleChannelDeleted
          }} />
        </main>
      </div>
    </div>
  );
}
