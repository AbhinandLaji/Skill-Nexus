import React from 'react';
import { useOutletContext } from 'react-router-dom';
import ActivityFeedItem from '../components/ActivityFeedItem';
import TeammateWidget from '../components/TeammateWidget';

export default function DashboardHome() {
  const { user, isLoading } = useOutletContext();

  const dummyFeed = [
    {
      authorName: 'Sarah Chen',
      authorAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAb93CSjt1IHN0QHNnvVx-NGsHVXVy7IUutUkE8N3BE0ZtP4caOutNihWVsqOEQ1e4BTa-Xr6d8JDY19VN3c_i2Q-GcW9nYFDY1Dwql_GF2BrXutah1jvMsxAmWP0MWaXjqg0itpYCeNkhznhOuVkUxDdRaMiyI6OiNbaVdqSpEt9P0obOlwrt810u1tw0mpS5cJtbKrjltY95N5qx-_azUes_Ou6ZSK7ObhEX3fvOZZUAJRfM0aWvKyVY-6f2GIWz8Z7twSlU9HHrU',
      timeAgo: '12m ago',
      skillName: 'AI Builders',
      skillColor: '#ffb4a2',
      text: 'Just pushed the initial commit for our new distributed training cluster. Looking for someone with PyTorch experience to review the data loading pipeline before we scale it up.',
      likes: 4,
    },
    {
      authorName: 'System Announcement',
      timeAgo: '1h ago',
      skillName: 'Global',
      skillColor: '#b4f461',
      text: 'The Fall Hackathon registration is now open. Form teams of up to 4 members. Total prize pool: $5,000 + cloud credits.',
      attachment: {
        type: 'image',
        url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBIcIuMXV1Rt7T09VHmvgd9qAPWi04s0hb0bMDuhvqUkHyyWcq1Vhm-y-b9kaP9soKKIeVKrELuQSwt7L0b8nyu6N7HRJIOQvbyNGYrudMFP613Ir1vudhrZSq28x2YLs3A_FHVa-nfRPaHiuU21sdRAoHHgPYHjY9lnbf5EoGZk1CznF-on7144Dzl9QLWr7e7Z5sxOc4SIJNCV1L5WUC6w_KYNwqsjtS5Sg_GZI86ZLMv6l6BoFa3s4b_fq6ksOMB8U162YCJ9-g1',
        cta: 'Register Now'
      }
    },
    {
      authorName: 'David Kim',
      authorAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAFx3WH4np6LVGcQvQloH3eMsAQLy-hASuD2wVcOgT9pD48CuIZHq7YeNNeE8E3KeDHqX3gSquKQPGJwfnP42hRWBlRx4DJy2BX7aVoNsO_msXkzn7SNoRT8xExJ4iYkAI8VVuhJ-y9O1RCPHwobtExlA64hauBYp5oJuOcBq-v1Qk1tUfJLJLyYml4QtJEkBlEHm6dEBn3ijTuNr1hsMTwAIa7VuKnFwtjufjRE0ZaTRhG3EmGZkGWEtXA6jSvZCpwi8B1Anr6lSPs',
      timeAgo: '3h ago',
      skillName: 'Cyber Sec',
      skillColor: '#4bb1f9',
      text: 'Found an interesting vulnerability pattern in standard JWT implementations during my audit today. Wrote a quick script to test for it. Anyone want to collaborate on a write-up?',
      codeSnippet: {
        language: 'python',
        code: 'import jwt\ndef analyze_token(token):\n    # Analysis logic here...'
      }
    }
  ];

  const dummyMatches = [
    {
      name: 'Elena R.',
      needs: 'Rust/WASM',
      colorAccent: '#B4F461',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDllj9DoM1ymulpHp3TYn1PW56cDxx3-wIVQVddKjG1Gi10j4qXf2a5r--Ew57rPAETB4MJ8edOd6ZuvocBqbboRS1oK0gNOmFKrsE--43BqbLjdZg8se37L89--9Y3AN7NSnmOnfyYmarp-v2-QFfboask1Ttr4Dy7kqmPGbTEapnr4GA_jl2JbzEN166fcbQIGKJ_UJ-qKrVjwcoixiFjx1JXc63ralqcNyqhc1oc-uoE68tLeHApZQp86MrbGMpW6HPA80Pg6_OJ'
    },
    {
      name: 'Jamal T.',
      needs: 'React Native',
      colorAccent: '#FFB4A2'
    }
  ];

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
              Your terminal is active. 3 new opportunities match your skill matrix in AI/ML and Rust.
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
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-40 bg-surface-container-low border border-white/5 rounded-lg animate-pulse"></div>
                  ))}
                </div>
              ) : (
                dummyFeed.map((item, index) => (
                  <ActivityFeedItem 
                    key={index} 
                    item={item} 
                    colorClass={
                      index === 0 ? 'bg-secondary' : 
                      index === 1 ? 'bg-primary' : 'bg-[#4bb1f9]'
                    } 
                  />
                ))
              )}
            </div>
          </div>
        </div>
        
        {/* Right Column: Widgets */}
        <div className="w-full xl:w-1/4 flex flex-col gap-6">
          <TeammateWidget matches={dummyMatches} />
          
          {/* Upcoming Events Widget */}
          <div className="bg-surface-container-low rounded-lg border border-white/[0.08] p-5 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-mono-label text-on-surface uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-primary">calendar_today</span>
                Upcoming
              </h3>
            </div>
            <div className="relative pl-3 border-l border-white/[0.08] flex flex-col gap-6">
              <div className="relative">
                <div className="absolute -left-[17px] top-1 w-2 h-2 rounded-full bg-primary ring-4 ring-background"></div>
                <div className="flex flex-col gap-1">
                  <span className="font-mono-sm text-primary">Today, 18:00</span>
                  <span className="font-button-text text-on-surface">System Design Study Group</span>
                  <span className="font-body-md text-on-surface-variant text-sm line-clamp-1">Virtual • Voice Channel Alpha</span>
                </div>
              </div>
              <div className="relative">
                <div className="absolute -left-[17px] top-1 w-2 h-2 rounded-full bg-outline-variant ring-4 ring-background"></div>
                <div className="flex flex-col gap-1">
                  <span className="font-mono-sm text-on-surface-variant">Tomorrow, 14:00</span>
                  <span className="font-button-text text-on-surface">Guest Lecture: Vercel Eng</span>
                  <span className="font-body-md text-on-surface-variant text-sm line-clamp-1">Main Auditorium • Hybrid</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Skill Matrix Visualization */}
          <div className="bg-surface-container-low rounded-lg border border-white/[0.08] p-5 flex flex-col items-center justify-center opacity-80 mt-auto hidden xl:flex">
            <h3 className="font-mono-sm text-on-surface-variant/70 uppercase tracking-widest mb-4 w-full text-left">
              Skill Matrix Alignment
            </h3>
            <svg className="w-full h-32 text-outline-variant" fill="none" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <polygon fill="none" points="50,10 90,30 90,70 50,90 10,70 10,30" stroke="currentColor" strokeWidth="1"></polygon>
              <polygon fill="none" points="50,30 75,45 75,65 50,75 25,65 25,45" stroke="currentColor" strokeWidth="1"></polygon>
              <polygon fill="none" points="50,45 62,52 62,60 50,65 38,60 38,52" stroke="currentColor" strokeWidth="1"></polygon>
              <line stroke="currentColor" strokeWidth="1" x1="50" x2="50" y1="50" y2="10"></line>
              <line stroke="currentColor" strokeWidth="1" x1="50" x2="90" y1="50" y2="30"></line>
              <line stroke="currentColor" strokeWidth="1" x1="50" x2="90" y1="50" y2="70"></line>
              <line stroke="currentColor" strokeWidth="1" x1="50" x2="50" y1="50" y2="90"></line>
              <line stroke="currentColor" strokeWidth="1" x1="50" x2="10" y1="50" y2="70"></line>
              <line stroke="currentColor" strokeWidth="1" x1="50" x2="10" y1="50" y2="30"></line>
              <polygon fill="#B4F461" fillOpacity="0.1" points="50,15 80,35 60,65 50,85 20,60 30,35" stroke="#B4F461" strokeWidth="1.5"></polygon>
              <circle cx="50" cy="15" fill="#B4F461" r="2"></circle>
              <circle cx="80" cy="35" fill="#B4F461" r="2"></circle>
              <circle cx="60" cy="65" fill="#B4F461" r="2"></circle>
              <circle cx="50" cy="85" fill="#B4F461" r="2"></circle>
              <circle cx="20" cy="60" fill="#B4F461" r="2"></circle>
              <circle cx="30" cy="35" fill="#B4F461" r="2"></circle>
            </svg>
          </div>
          
        </div>
      </div>
    </div>
  );
}
