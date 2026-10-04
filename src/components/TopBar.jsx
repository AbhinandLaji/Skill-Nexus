import React from 'react';
import { Link } from 'react-router-dom';

export default function TopBar({ user, skills, isSidebarExpanded, setIsSidebarExpanded }) {
  const userSkills = user?.skills?.map(skillId => skills?.find(s => s.id === skillId)).filter(Boolean) || [];

  return (
    <header 
      className={`fixed top-0 right-0 h-16 bg-background/80 backdrop-blur-xl border-b border-white/[0.08] z-40 px-4 lg:px-8 flex items-center justify-between transition-all duration-300 ${
        isSidebarExpanded ? 'left-[260px]' : 'left-[80px]'
      }`}
    >
      <div className="flex items-center flex-1 max-w-xl gap-4">
        {/* Hamburger for mobile, or to toggle on desktop if desired */}
        <button 
          className="lg:hidden text-on-surface-variant hover:text-on-surface"
          onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        
        <div className="relative flex items-center flex-1">
          <span className="material-symbols-outlined absolute left-3 text-on-surface-variant">search</span>
          <input 
            type="text" 
            placeholder="Search skills, teams, or projects..." 
            className="w-full bg-surface-container-low border border-white/[0.08] rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-4 lg:gap-6 ml-4">
        <div className="relative cursor-pointer">
          <span className="material-symbols-outlined text-on-surface-variant">notifications</span>
          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-secondary border-2 border-background rounded-full"></div>
        </div>
        
        {user && (
          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-sm font-button-text text-on-surface">{user.name}</span>
              <div className="flex gap-1">
                {userSkills.slice(0, 2).map((skill, i) => (
                  <span 
                    key={i} 
                    className="text-[10px] px-1.5 rounded-full border bg-transparent whitespace-nowrap"
                    style={{ borderColor: skill.colorAccent, color: skill.colorAccent }}
                  >
                    {skill.name}
                  </span>
                ))}
              </div>
            </div>
            <Link to="/dashboard/profile" className="flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity">
              {user.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user.name} 
                  className="w-8 h-8 rounded-full border border-white/[0.1] object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
                </div>
              )}
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
