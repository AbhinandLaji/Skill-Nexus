import React from 'react';

export default function SkillPill({ skill, label, colorClass, index = 0 }) {
  const text = skill || label;
  
  const defaultColors = [
    'border-primary/40 text-primary bg-primary/5',
    'border-secondary/40 text-secondary bg-secondary/5',
    'border-tertiary-fixed-dim/40 text-tertiary-fixed-dim bg-tertiary-fixed-dim/5',
    'border-cyan-400/40 text-cyan-400 bg-cyan-400/5',
    'border-lime-400/40 text-lime-400 bg-lime-400/5'
  ];

  const appliedClass = colorClass || defaultColors[index % defaultColors.length];

  return (
    <span className={`px-3 py-1.5 rounded-full border font-mono-sm text-mono-sm whitespace-nowrap inline-flex items-center transition-colors ${appliedClass}`}>
      {text}
    </span>
  );
}
