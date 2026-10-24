import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';

export default function CreateCommunityModal({ isOpen, onClose, onSuccess, skills = [] }) {
  const [name, setName] = useState('');
  const [skillId, setSkillId] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [availableSkills, setAvailableSkills] = useState(skills);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Sync or fetch skills if none provided
  useEffect(() => {
    if (skills && skills.length > 0) {
      setAvailableSkills(skills);
      if (!skillId) {
        setSkillId(skills[0].id || skills[0]._id || skills[0].name);
      }
    } else if (isOpen) {
      api.getSkills()
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            setAvailableSkills(data);
            setSkillId(data[0].id || data[0]._id || data[0].name);
          }
        })
        .catch(err => console.error('Failed to load skills:', err));
    }
  }, [skills, isOpen]);

  // Compute live slug preview
  const formatSlug = (input) => {
    const cleaned = input.toLowerCase().trim().replace(/^[#]/, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    return cleaned ? `#${cleaned}` : '#community-name';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMsg('Community name is required');
      return;
    }

    if (!skillId) {
      setErrorMsg('Please select an associated skill');
      return;
    }

    setIsLoading(true);
    try {
      // Format slug for name
      const slugName = trimmedName.startsWith('#') ? trimmedName : `#${trimmedName}`;

      const created = await api.createChannel({
        name: slugName,
        skillId,
        description: description.trim(),
        isPrivate
      });

      if (onSuccess) {
        onSuccess(created);
      }
      handleClose();
    } catch (err) {
      console.error('Failed to create channel:', err);
      setErrorMsg(err.message || 'Failed to create community channel');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setIsPrivate(false);
    setErrorMsg('');
    if (onClose) onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
            onClick={handleClose}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-surface-container rounded-xl border border-white/[0.08] p-6 w-full max-w-lg pointer-events-auto flex flex-col shadow-2xl relative"
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary border border-primary/30 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]">forum</span>
                  </div>
                  <div>
                    <h2 className="font-headline-lg-mobile text-on-surface text-lg">Create Community Channel</h2>
                    <p className="font-mono-sm text-xs text-on-surface-variant">Launch a hub for discussion and skill growth</p>
                  </div>
                </div>
                <button 
                  onClick={handleClose} 
                  className="text-on-surface-variant hover:text-on-surface transition-colors p-1 rounded-lg hover:bg-white/[0.06] cursor-pointer"
                  title="Close"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              {/* Error feedback */}
              {errorMsg && (
                <div className="bg-error-container/20 text-error p-3 rounded-lg mb-4 text-sm font-body-md border border-error-container/30 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">error</span>
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="font-mono-sm text-on-surface-variant block mb-1.5 uppercase text-xs">
                    Community Name
                  </label>
                  <input 
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-surface-container-low border border-white/[0.08] rounded-lg py-2.5 px-4 focus:outline-none focus:border-primary transition-colors text-on-surface font-body-md placeholder:text-on-surface-variant/40"
                    placeholder="e.g. Next.js Developers or python-help"
                  />
                  <p className="font-mono-sm text-[11px] text-on-surface-variant/70 mt-1.5 flex items-center gap-1">
                    <span>Channel handle:</span>
                    <span className="text-primary font-mono">{formatSlug(name)}</span>
                  </p>
                </div>

                <div>
                  <label className="font-mono-sm text-on-surface-variant block mb-1.5 uppercase text-xs">
                    Associated Skill / Domain
                  </label>
                  <select
                    value={skillId}
                    onChange={(e) => setSkillId(e.target.value)}
                    className="w-full bg-surface-container-low border border-white/[0.08] rounded-lg py-2.5 px-4 focus:outline-none focus:border-primary transition-colors text-on-surface font-body-md cursor-pointer"
                  >
                    {availableSkills.map((sk) => {
                      const idVal = sk.id || sk._id || sk.name;
                      return (
                        <option key={idVal} value={idVal} className="bg-surface-container text-on-surface">
                          {sk.name}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="font-mono-sm text-on-surface-variant block mb-1.5 uppercase text-xs">
                    Description (Optional)
                  </label>
                  <textarea 
                    rows="3"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-surface-container-low border border-white/[0.08] rounded-lg py-2.5 px-4 focus:outline-none focus:border-primary transition-colors text-on-surface font-body-md resize-none placeholder:text-on-surface-variant/40"
                    placeholder="Share the purpose, guidelines, or topics discussed in this channel..."
                  />
                </div>

                <div className="flex items-center gap-3 py-1">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input 
                      type="checkbox"
                      checked={isPrivate}
                      onChange={(e) => setIsPrivate(e.target.checked)}
                      className="w-4 h-4 rounded bg-surface-container-low border border-white/20 text-primary focus:ring-0 focus:outline-none cursor-pointer"
                    />
                    <span className="font-body-md text-sm text-on-surface flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-on-surface-variant">lock</span>
                      Make channel private (invite-only)
                    </span>
                  </label>
                </div>

                {/* Actions */}
                <div className="flex justify-end items-center gap-3 mt-4 pt-4 border-t border-white/[0.06]">
                  <button 
                    type="button" 
                    onClick={handleClose}
                    className="px-4 py-2 font-button-text text-sm rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-white/[0.05] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isLoading}
                    className="bg-primary text-on-primary font-button-text text-sm px-6 py-2 rounded-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-sm"
                  >
                    {isLoading ? (
                      <>
                        <span className="material-symbols-outlined animate-spin text-[18px]">refresh</span>
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[18px]">add_circle</span>
                        <span>Create Channel</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
