import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const SkillPill = ({ label, colorClass }) => (
  <span className={`px-4 py-2 rounded-full border font-mono-sm bg-transparent shadow-sm whitespace-nowrap ${colorClass}`}>
    {label}
  </span>
);

const FeatureCard = ({ id, title, description, icon, iconColorClass, glowColorClass }) => (
  <motion.div 
    whileHover={{ y: -4 }}
    className="bg-surface-container rounded-[12px] p-card-padding flex flex-col gap-4 shadow-sm relative overflow-hidden group"
  >
    <div className={`absolute -right-8 -top-8 w-32 h-32 rounded-full blur-2xl transition-colors ${glowColorClass}`}></div>
    <div className="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center shadow-sm relative z-10">
      <span className={`material-symbols-outlined ${iconColorClass}`} style={{ fontVariationSettings: "'FILL' 1" }}>
        {icon}
      </span>
    </div>
    <div className="flex flex-col gap-2 relative z-10 mt-4">
      <span className="font-mono-sm text-outline">{id}</span>
      <h3 className="font-headline-lg-mobile text-on-surface">{title}</h3>
      <p className="font-body-md text-on-surface-variant">{description}</p>
    </div>
  </motion.div>
);

export default function LandingPage() {
  const skills = [
    { label: 'Python', colorClass: 'border-[#84cc16] text-[#84cc16]' },
    { label: 'MERN', colorClass: 'border-[#06b6d4] text-[#06b6d4]' },
    { label: 'AI/ML', colorClass: 'border-[#f43f5e] text-[#f43f5e]' },
    { label: 'DSA', colorClass: 'border-[#eab308] text-[#eab308]' },
    { label: 'UI/UX', colorClass: 'border-[#a855f7] text-[#a855f7]' },
    { label: 'Cybersecurity', colorClass: 'border-[#3b82f6] text-[#3b82f6]' },
  ];

  return (
    <main className="w-full flex min-h-screen items-center justify-center">
      <div className="flex flex-col w-full">
        {/* Hero Section */}
        <section className="relative w-full overflow-hidden bg-surface-dim pt-24 pb-32 px-section-margin flex flex-col items-center justify-center min-h-[716px]">
          <div className="absolute inset-0 z-0 pointer-events-none opacity-20 flex items-center justify-center">
            <svg height="100%" preserveAspectRatio="xMidYMid slice" viewBox="0 0 1000 1000" width="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <radialGradient cx="50%" cy="50%" fx="50%" fy="50%" id="glow" r="50%">
                  <stop offset="0%" stopColor="#b4f461" stopOpacity="0.3"></stop>
                  <stop offset="100%" stopColor="#121317" stopOpacity="0"></stop>
                </radialGradient>
              </defs>
              <circle cx="500" cy="500" fill="url(#glow)" r="400"></circle>
              <path d="M 0 500 Q 250 400 500 500 T 1000 500" fill="none" opacity="0.5" stroke="#424938" strokeWidth="1"></path>
              <path d="M 0 400 Q 250 600 500 400 T 1000 600" fill="none" opacity="0.3" stroke="#424938" strokeWidth="1"></path>
            </svg>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto gap-element-gap"
          >
            <div className="flex items-center justify-center gap-2 mb-4 bg-surface-container-high px-4 py-2 rounded-full shadow-sm">
              <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse"></span>
              <span className="font-mono-sm text-on-surface-variant">Campus Terminal Beta Live</span>
            </div>
            
            <h1 className="font-display text-on-surface tracking-tighter max-w-3xl leading-[1.1]">
              Find your people. <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-container to-surface-tint">Build something real.</span>
            </h1>
            
            <p className="font-body-md text-on-surface-variant max-w-2xl mt-4 mb-8 text-lg">
              Connecting verified TKMCE students by skill. Drop the noise, find the signal, and ship projects with peers who speak your stack.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
              <Link to="/auth">
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-primary-container text-on-primary-fixed font-button-text px-8 py-4 rounded-lg shadow-md transition-colors flex items-center justify-center gap-2 group w-full sm:w-auto"
                >
                  Join with your college email
                  <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </motion.button>
              </Link>
              <button className="bg-transparent border border-outline font-button-text text-on-surface px-8 py-4 rounded-lg hover:bg-surface-container hover:border-outline-variant transition-colors duration-150 flex items-center justify-center gap-2">
                View public projects
              </button>
            </div>
          </motion.div>
        </section>

        {/* Social Proof Strip */}
        <section className="w-full bg-surface-container-low py-8 border-y border-outline-variant/30 flex overflow-hidden relative">
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-surface-container-low to-transparent z-10 pointer-events-none"></div>
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-surface-container-low to-transparent z-10 pointer-events-none"></div>
          
          <div className="flex gap-4 animate-[scroll_40s_linear_infinite] whitespace-nowrap items-center px-4">
            {skills.map((skill, i) => (
              <SkillPill key={`set1-${i}`} {...skill} />
            ))}
            {/* Tag Set 2 for seamless looping */}
            <div className="ml-8 flex gap-4">
              {skills.map((skill, i) => (
                <SkillPill key={`set2-${i}`} {...skill} />
              ))}
            </div>
          </div>
        </section>

        {/* Feature Grid Section */}
        <section className="w-full max-w-container-max-width mx-auto px-section-margin py-24 flex flex-col gap-12">
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex flex-col gap-2"
          >
            <span className="font-mono-label text-primary-container uppercase tracking-wider">Infrastructure</span>
            <h2 className="font-headline-lg text-on-surface">Designed for Builders.</h2>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard 
              id="SYS.01"
              title="Skill Communities"
              description="Dedicated technical channels. Swap resources, debate architectures, and level up together."
              icon="forum"
              iconColorClass="text-primary-container"
              glowColorClass="bg-primary-container/5 group-hover:bg-primary-container/10"
            />
            <FeatureCard 
              id="SYS.02"
              title="Team Matchmaking"
              description="Find the missing node in your stack. Connect with front-end devs, backend engineers, or UI designers instantly."
              icon="extension"
              iconColorClass="text-secondary"
              glowColorClass="bg-secondary/5 group-hover:bg-secondary/10"
            />
            <FeatureCard 
              id="SYS.03"
              title="Mentorship Hub"
              description="Connect with alumni and senior students. Get code reviews, career advice, and real-world insights."
              icon="trending_up"
              iconColorClass="text-tertiary-fixed-dim"
              glowColorClass="bg-tertiary-fixed-dim/5 group-hover:bg-tertiary-fixed-dim/10"
            />
          </div>
        </section>
      </div>
    </main>
  );
}
