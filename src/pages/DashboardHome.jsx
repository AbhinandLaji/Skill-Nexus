import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api } from '../services/api';
import ActivityFeedItem from '../components/ActivityFeedItem';
import TeammateWidget from '../components/TeammateWidget';

export default function DashboardHome() {
  const { user, isLoading } = useOutletContext();
  const [feedItems, setFeedItems] = useState([]);
  const [radarMatches, setRadarMatches] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadDashboardData() {
      setIsDataLoading(true);
      try {
        const [questionsData, oppsData, teamsData] = await Promise.all([
          api.getQuestions().catch(() => []),
          api.getOpportunities().catch(() => []),
          api.getTeamRecommendations().catch(() => [])
        ]);

        if (isMounted) {
          // Live feed from campus discussions / Q&A (NOT matchmaking team listings)
          const formattedFeed = (questionsData || []).map((q) => ({
            id: q.id || q._id,
            authorName: q.askedByName || 'Campus Member',
            authorAvatar: null,
            timeAgo: 'Discussion',
            skillName: (q.skillTags && q.skillTags[0]) || 'General',
            skillColor: '#4bb1f9',
            title: q.question || '',
            text: (q.answers && q.answers.length > 0)
              ? `${q.answers[0].answeredByName}: "${q.answers[0].text}"`
              : 'Open technical question in Growth Hub.',
            likes: q.answerCount || 0
          }));
          setFeedItems(formattedFeed);

          setRadarMatches((teamsData || []).slice(0, 3));

          // Upcoming events from live opportunities
          setUpcomingEvents(oppsData || []);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        if (isMounted) {
          setIsDataLoading(false);
        }
      }
    }

    loadDashboardData();
    return () => {
      isMounted = false;
    };
  }, [user]);

  const totalLoading = isLoading || isDataLoading;

  return (
    <div className="flex flex-col w-full h-full relative overflow-hidden p-4 lg:p-8 gap-8">
      {/* Decorative Ambient Background Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary-container opacity-5 rounded-full blur-[100px] -z-10 pointer-events-none translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 left-1/2 w-[500px] h-[500px] bg-secondary-container opacity-[0.03] rounded-full blur-[120px] -z-10 pointer-events-none -translate-x-1/2 translate-y-1/3"></div>
      
      <div className="flex flex-col xl:flex-row gap-8 h-full relative z-0">
        
        {/* Left/Main Column: Welcome & Activity Feed */}
        <div className="flex-1 flex flex-col gap-6 w-full xl:w-3/4">
          
          {/* Welcome Header Section */}
          <div className="flex flex-col gap-2 mb-2">
            <div className="flex items-center gap-3">
              <span className="font-mono-sm text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-sm border border-primary/20 backdrop-blur-sm">
                System.out.println("Hello");
              </span>
              <div className="h-[1px] flex-1 bg-gradient-to-r from-outline-variant/40 to-transparent"></div>
            </div>
            
            <h1 className="font-display text-on-surface tracking-tight mt-2 relative inline-block">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-surface-tint">
                {isLoading ? '...' : (user?.name?.split(' ')[0] || 'Builder')}
              </span>.
              <span className="absolute -bottom-2 left-0 w-1/3 h-[2px] bg-gradient-to-r from-primary to-transparent"></span>
            </h1>
            
            <p className="font-body-md text-on-surface-variant max-w-2xl mt-4 border-l-2 border-outline-variant/30 pl-4">
              Your terminal is active. {upcomingEvents.length > 0 
                ? `${upcomingEvents.length} active opportunities available in the hub.` 
                : 'Connect with peers, collaborate on teams, and build projects.'}
            </p>
          </div>
          
          {/* Activity Feed Section */}
          <div className="flex flex-col gap-4 flex-1">
            <div className="flex items-center justify-between sticky top-[64px] lg:top-0 z-10 bg-background/90 backdrop-blur-md py-2 border-b border-white/[0.04]">
              <h2 className="font-headline-lg-mobile text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">switch_account</span>
                Live Feed
              </h2>
              <div className="flex gap-2">
                <button className="px-4 py-1.5 font-button-text text-on-surface bg-surface-container hover:bg-surface-variant rounded-sm border border-white/[0.08] transition-colors">
                  All
                </button>
                <button className="px-4 py-1.5 font-button-text text-primary bg-primary/10 rounded-sm border border-primary/20 transition-colors">
                  Following
                </button>
              </div>
            </div>
            
            <div className="flex flex-col gap-4 pr-2 pb-10">
              {totalLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-40 bg-surface-container-low border border-white/5 rounded-lg animate-pulse"></div>
                  ))}
                </div>
              ) : feedItems.length === 0 ? (
                <div className="bg-surface-container-low border border-white/[0.08] rounded-xl p-8 flex flex-col items-center justify-center text-center gap-3 my-2">
                  <div className="w-12 h-12 rounded-full bg-surface-variant/40 flex items-center justify-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-2xl">dynamic_feed</span>
                  </div>
                  <h3 className="font-button-text text-on-surface text-base">No active feed items yet</h3>
                  <p className="font-body-md text-on-surface-variant text-xs max-w-md">
                    Posts and squad listings created by you and fellow students will appear here in real time.
                  </p>
                </div>
              ) : (
                feedItems.map((item, index) => (
                  <ActivityFeedItem 
                    key={item.id || index} 
                    item={item} 
                    colorClass={
                      index % 3 === 0 ? 'bg-secondary' : 
                      index % 3 === 1 ? 'bg-primary' : 'bg-[#4bb1f9]'
                    } 
                  />
                ))
              )}
            </div>
          </div>
        </div>
        
        {/* Right Column: Widgets */}
        <div className="w-full xl:w-1/4 flex flex-col gap-6">
          <TeammateWidget matches={radarMatches} />
          
          {/* Upcoming Events Widget */}
          <div className="bg-surface-container-low rounded-lg border border-white/[0.08] p-5 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-mono-label text-on-surface uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-primary">calendar_today</span>
                Upcoming
              </h3>
            </div>
            {upcomingEvents.length === 0 ? (
              <div className="p-4 rounded-lg bg-surface-container-high/40 border border-white/[0.04] text-center flex flex-col items-center gap-2">
                <span className="material-symbols-outlined text-on-surface-variant/60 text-xl">event_busy</span>
                <p className="font-mono-sm text-xs text-on-surface-variant/80">No upcoming events scheduled</p>
                <span className="font-mono-sm text-[11px] text-on-surface-variant/50">Check Growth Hub for new opportunities.</span>
              </div>
            ) : (
              <div className="relative pl-3 border-l border-white/[0.08] flex flex-col gap-6">
                {upcomingEvents.map((event, idx) => (
                  <div key={event.id || idx} className="relative">
                    <div className="absolute -left-[17px] top-1 w-2 h-2 rounded-full bg-primary ring-4 ring-background"></div>
                    <div className="flex flex-col gap-1">
                      <span className="font-mono-sm text-primary">{event.deadline || 'Upcoming'}</span>
                      <span className="font-button-text text-on-surface">{event.title}</span>
                      <span className="font-body-md text-on-surface-variant text-sm line-clamp-1">{event.company || event.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}
