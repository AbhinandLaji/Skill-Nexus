import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';

export default function EditProfileModal({ isOpen, onClose, user, onSuccess }) {
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [bio, setBio] = useState('');
  const [skillsStr, setSkillsStr] = useState('');
  const [batch, setBatch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user && isOpen) {
      setName(user.name || '');
      setAvatar(user.avatar || '');
      setBio(user.bio || '');
      setSkillsStr(user.skills ? user.skills.join(', ') : '');
      setBatch(user.batch || '');
      setErrorMsg('');
    }
  }, [user, isOpen]);

  const handleAvatarFile = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg('Image size should be less than 5MB');
        return;
      }
      setErrorMsg('');
      setSelectedFile(file);
      // Instant local preview
      setAvatar(URL.createObjectURL(file));
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Username / Name cannot be empty');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    const skillsArray = skillsStr.split(',').map(s => s.trim()).filter(Boolean);

    try {
      let finalAvatarUrl = avatar;

      if (selectedFile) {
        const uploadRes = await api.uploadAvatar(selectedFile);
        finalAvatarUrl = uploadRes.avatarUrl;
      }

      const updatePayload = {
        name: name.trim(),
        avatar: finalAvatarUrl || null,
        bio,
        skills: skillsArray,
        batch: batch.trim() || null
      };

      await api.updateUserProfile(updatePayload);

      onSuccess({
        ...user,
        ...updatePayload
      });
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
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
            onClick={onClose}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none p-4">
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="bg-surface-container rounded-xl border border-white/[0.08] p-6 w-full max-w-lg pointer-events-auto flex flex-col shadow-2xl max-h-[92vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-headline-lg-mobile text-on-surface">Edit Profile</h2>
                <button
                  onClick={onClose}
                  className="text-on-surface-variant hover:text-on-surface p-1 rounded-md transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {errorMsg && (
                <div className="bg-error-container/20 text-error p-3 rounded-md mb-4 text-sm font-body-md border border-error-container/30">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">

                {/* Profile Picture Section */}
                <div className="flex items-center gap-5 p-3 rounded-xl bg-surface-container-low border border-white/[0.06]">
                  <div className="relative w-18 h-18 rounded-full overflow-hidden shrink-0 bg-surface-container-high border-2 border-primary/30 flex items-center justify-center group">
                    {avatar ? (
                      <img src={avatar?.startsWith('/uploads') ? `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}${avatar}` : avatar} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-on-surface-variant text-3xl">person</span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                    <label className="font-mono-sm text-xs text-on-surface-variant uppercase tracking-wider">
                      Profile Picture
                    </label>
                    <div className="flex items-center gap-2 flex-wrap">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleAvatarFile}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-lg bg-surface-variant hover:bg-white/[0.1] text-xs font-button-text text-on-surface border border-white/[0.08] transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">upload</span>
                        Upload Image
                      </button>
                      {avatar && (
                        <button
                          type="button"
                          onClick={() => {
                            setAvatar('');
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-button-text text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Username / Name Input */}
                <div>
                  <label className="font-mono-sm text-on-surface-variant block mb-2 uppercase tracking-wider text-xs">
                    Username / Full Name
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 material-symbols-outlined text-outline-variant text-[20px]">person</span>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-surface-container-low border border-white/[0.08] rounded-lg py-2.5 pl-10 pr-4 focus:outline-none focus:border-primary transition-colors text-on-surface font-body-md text-sm"
                      placeholder="e.g. Alex Chen"
                    />
                  </div>
                </div>

                {/* Bio Input */}
                <div>
                  <label className="font-mono-sm text-on-surface-variant block mb-2 uppercase tracking-wider text-xs">
                    Terminal Log (Bio)
                  </label>
                  <textarea
                    required
                    rows="3"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full bg-surface-container-low border border-white/[0.08] rounded-lg py-2.5 px-3.5 focus:outline-none focus:border-primary transition-colors text-on-surface resize-none font-body-md text-sm custom-scrollbar"
                    placeholder="Tell us about yourself..."
                  />
                </div>

                {/* Skills Input */}
                <div>
                  <label className="font-mono-sm text-on-surface-variant block mb-2 uppercase tracking-wider text-xs">
                    Skills (Comma separated)
                  </label>
                  <input
                    type="text"
                    required
                    value={skillsStr}
                    onChange={(e) => setSkillsStr(e.target.value)}
                    className="w-full bg-surface-container-low border border-white/[0.08] rounded-lg py-2.5 px-3.5 focus:outline-none focus:border-primary transition-colors text-on-surface font-body-md text-sm"
                    placeholder="e.g. Python, AI/ML, Rust, React"
                  />
                </div>

                {/* Optional Batch Input */}
                <div>
                  <label className="font-mono-sm text-on-surface-variant block mb-2 uppercase tracking-wider text-xs">
                    Graduation Batch (Optional)
                  </label>
                  <input
                    type="text"
                    value={batch}
                    onChange={(e) => setBatch(e.target.value)}
                    className="w-full bg-surface-container-low border border-white/[0.08] rounded-lg py-2.5 px-3.5 focus:outline-none focus:border-primary transition-colors text-on-surface font-body-md text-sm"
                    placeholder="e.g. 2026 or Class of '26"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-white/[0.08]">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2 font-button-text text-on-surface-variant hover:text-on-surface hover:bg-surface-variant rounded-lg transition-colors cursor-pointer text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-primary text-on-primary font-button-text px-6 py-2 rounded-lg hover:scale-[1.02] active:scale-[0.98] transition-transform duration-150 flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:scale-100 cursor-pointer text-sm shadow-md"
                  >
                    {isLoading ? <span className="material-symbols-outlined animate-spin text-[18px]">refresh</span> : 'Save Changes'}
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
