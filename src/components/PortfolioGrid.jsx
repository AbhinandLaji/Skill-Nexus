import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();

  if (!projects || projects.length === 0) {
    return (
      <div className="col-span-12 lg:col-span-8">
        <div className="flex items-center justify-between mb-[24px]">
          <h2 className="font-headline-lg text-headline-lg text-on-background">Active Squads</h2>
        </div>
        <div className="bg-surface-container rounded-xl p-8 border border-white/[0.08] text-center flex flex-col items-center justify-center min-h-[220px]">
          <span className="material-symbols-outlined text-4xl mb-2 text-on-surface-variant/40">groups</span>
          <p className="font-body-md text-sm text-on-surface-variant">No active squads yet</p>
        </div>
      </div>
    );
  }

  const displayProjects = projects;

  return (
    <div className="col-span-12 lg:col-span-8">
      <div className="flex items-center justify-between mb-[24px]">
        <h2 className="font-headline-lg text-headline-lg text-on-background">Active Squads</h2>
      </div>
      
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="flex flex-col gap-[16px]"
      >
        {displayProjects.map((project, idx) => {
          const role = project.role || 'CONTRIBUTOR';
          const status = project.status || 'ACTIVE_BUILD';
          const statusColor = project.statusColor || 'primary';
          const title = project.title || 'Untitled Squad';
          const description = project.description || 'Collaborative project squad.';
          const projectId = project.id || project._id || idx;

          return (
            <motion.div 
              key={projectId} 
              variants={itemVariants}
              onClick={() => {
                if (project.channelId) {
                  navigate(`/dashboard/channels/${project.channelId}`);
                }
              }}
              className="group bg-surface-container rounded-xl p-[24px] border border-white/[0.08] hover:-translate-y-1 hover:border-white/20 transition-all duration-300 relative overflow-hidden flex flex-col md:flex-row gap-[24px] items-start md:items-center cursor-pointer"
            >
              <div className={`absolute left-0 top-0 bottom-0 w-1 bg-${statusColor} scale-y-0 group-hover:scale-y-100 transition-transform origin-top duration-300`}></div>
              <div className="w-20 h-20 rounded-lg flex-shrink-0 border border-white/[0.08] overflow-hidden bg-surface-variant flex items-center justify-center">
                {project.image ? (
                  <img className="w-full h-full object-cover" src={project.image} alt={title} />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 via-surface-variant to-secondary/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-2xl">terminal</span>
                  </div>
                )}
              </div>
              <div className="flex flex-col flex-grow min-w-0 h-full">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface truncate">{title}</h3>
                  <span className="px-2 py-0.5 rounded bg-surface-variant text-on-surface-variant font-mono-sm text-[10px] uppercase">{role}</span>
                </div>
                <p className="font-body-md text-body-md text-on-surface-variant line-clamp-2 mb-4">
                  {description}
                </p>
                <div className="flex items-center justify-between mt-auto">
                  {Array.isArray(project.members) && project.members.length > 0 ? (
                    <div className="flex -space-x-2">
                      {project.members.slice(0, 3).map((m, idx) => {
                        const name = typeof m === 'string' ? m : (m?.name || m?.authorName || '?');
                        const avatar = typeof m === 'object' ? m?.avatar : null;
                        return avatar ? (
                          <img key={idx} src={avatar} alt={name} className="w-7 h-7 rounded-full border-2 border-surface-container object-cover" />
                        ) : (
                          <div key={idx} className="w-7 h-7 rounded-full bg-surface-variant border-2 border-surface-container flex items-center justify-center text-[10px] font-mono-sm text-on-surface">
                            {name.charAt(0).toUpperCase()}
                          </div>
                        );
                      })}
                      {project.members.length > 3 && (
                        <div className="w-7 h-7 rounded-full bg-surface-variant border-2 border-surface-container flex items-center justify-center text-[10px] font-mono-sm text-on-surface">
                          +{project.members.length - 3}
                        </div>
                      )}
                    </div>
                  ) : <div />}
                  <div className="flex items-center gap-3">
                    {project.channelId && (
                      <span className="flex items-center gap-1 font-mono-sm text-xs text-primary group-hover:underline">
                        <span className="material-symbols-outlined text-[14px]">forum</span>
                        Channel
                      </span>
                    )}
                    <div className={`font-mono-sm text-mono-sm text-${statusColor}`}>
                      {status}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
