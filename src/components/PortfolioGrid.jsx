import React from 'react';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function PortfolioGrid({ projects }) {
  // If no projects provided, fallback to the hardcoded ones from the design
  const displayProjects = projects && projects.length > 0 ? projects : [
    {
      id: 1,
      title: 'Project Nebula',
      role: 'Lead',
      description: 'Distributed training orchestrator for LLMs on heterogeneous edge devices. Implementing consensus protocols in Rust.',
      status: 'ACTV_BUILD_PHASE',
      statusColor: 'primary',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBFdLH-Lrc7W_mWR6tgRhp6cUIfF71-63lEviEjFnZMioivrAymSPJnYlNAjHbHyindCgFa8UF4mU-aKtBrjxuw-o1MBYaRDNiUvXa9Zuv4-4Np7hUO5ktgAleylzlihw-mHYewgw7ssIymxE7LVP-GNBMmHBYgiZu4waXZnB6SsdZE5R-4IimIGx9D_XzXMxh6nQhcE492ci624VwVJWEK0U4--GtnvzM4fg5k8AKmxzzbAheypB60hn2DwdT5kNY5Clkd1YpQWbfj'
    },
    {
      id: 2,
      title: 'Cyber Sec CTF Prep',
      role: 'Contributor',
      description: 'Weekly deep dives into binary exploitation and reverse engineering. Preparing for DEF CON qualifiers.',
      status: 'WEEKLY_SYNC_SCHEDULED',
      statusColor: 'secondary',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDnyntXNs4yZdDKrs15fuYxf0UIbsYdIze9dORKZEla4gUjzAOYHXBtyHYZETvwBPKPnmVgFszImfqucfAKTpwd-2nzULmXfbZazMspKQFtw5BIavV2DLCw2EoH3_dGXjPTSBbPEO6g2IxRLRUoqaILDU-Q9PhfIcC05MeCuzBxtURKruWCPhKLbb-cJxoBSNaRUu-X7MSCek0cZ9trevyeNJ02LJCTbMbTZLUgov4Me9WHu9YqKwSNA4k2JyfKXzouyl0u-c4zXomn'
    }
  ];

  return (
    <div className="col-span-12 lg:col-span-8">
      <div className="flex items-center justify-between mb-[24px]">
        <h2 className="font-headline-lg text-headline-lg text-on-background">Active Squads</h2>
        <button className="text-primary font-mono-sm text-mono-sm uppercase tracking-widest hover:text-primary-fixed transition-colors">
          View Archive [4]
        </button>
      </div>
      
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="flex flex-col gap-[16px]"
      >
        {displayProjects.map((project) => (
          <motion.div 
            key={project.id} 
            variants={itemVariants}
            className="group bg-surface-container rounded-xl p-[24px] border border-white/[0.08] hover:-translate-y-1 hover:border-white/20 transition-all duration-300 relative overflow-hidden flex flex-col md:flex-row gap-[24px] items-start md:items-center cursor-pointer"
          >
            <div className={`absolute left-0 top-0 bottom-0 w-1 bg-${project.statusColor} scale-y-0 group-hover:scale-y-100 transition-transform origin-top duration-300`}></div>
            <div className="w-20 h-20 rounded-lg flex-shrink-0 border border-white/[0.08] overflow-hidden">
              <img className="w-full h-full object-cover" src={project.image} alt={project.title} />
            </div>
            <div className="flex flex-col flex-grow min-w-0 h-full">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface truncate">{project.title}</h3>
                <span className="px-2 py-0.5 rounded bg-surface-variant text-on-surface-variant font-mono-sm text-[10px] uppercase">{project.role}</span>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant line-clamp-2 mb-4">
                {project.description}
              </p>
              <div className="flex items-center justify-between mt-auto">
                <div className="flex -space-x-3">
                  <div className="w-8 h-8 rounded-full bg-surface-variant border-2 border-surface-container flex items-center justify-center text-xs font-mono-sm text-on-surface">JD</div>
                  <div className="w-8 h-8 rounded-full bg-surface-variant border-2 border-surface-container flex items-center justify-center text-xs font-mono-sm text-on-surface">MK</div>
                  <div className="w-8 h-8 rounded-full bg-surface-variant border-2 border-surface-container flex items-center justify-center text-xs font-mono-sm text-on-surface">+2</div>
                </div>
                <div className={`font-mono-sm text-mono-sm text-${project.statusColor}`}>
                  {project.status}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
