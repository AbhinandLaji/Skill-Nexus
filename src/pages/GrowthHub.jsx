import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import OpportunityCard from '../components/OpportunityCard';
import MentorCard from '../components/MentorCard';
import PostOpportunityModal from '../components/PostOpportunityModal';
import RequestMentorshipModal from '../components/RequestMentorshipModal';
import QuestionCard from '../components/QuestionCard';
import AskQuestionModal from '../components/AskQuestionModal';

const OPPORTUNITY_CATEGORIES = [
  { id: 'all', label: 'All Opportunities' },
  { id: 'internship', label: 'Internships', icon: 'work' },
  { id: 'hackathon', label: 'Hackathons', icon: 'terminal' },
  { id: 'workshop', label: 'Workshops', icon: 'code' },
  { id: 'open_source', label: 'Open Source', icon: 'diversity_3' }
];

const MENTOR_TRACKS = [
  'All Tracks',
  'System Design',
  'AI/ML',
  'React',
  'Frontend Architecture',
  'Distributed Systems',
  'Backend',
  'Mobile Dev'
];

export default function GrowthHub() {
  const { skills: contextSkills = [] } = useOutletContext() || {};
  const [activeTab, setActiveTab] = useState('opportunities'); // 'opportunities' | 'mentors' | 'discussions'

  // Data state
  const [opportunities, setOpportunities] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [skillsList, setSkillsList] = useState(Array.isArray(contextSkills) ? contextSkills : []);
  const [isLoading, setIsLoading] = useState(true);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [questionsError, setQuestionsError] = useState(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTrack, setSelectedTrack] = useState('All Tracks');
  const [selectedSkillFilter, setSelectedSkillFilter] = useState('All');

  // Modals state
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isAskModalOpen, setIsAskModalOpen] = useState(false);
  const [selectedMentorForRequest, setSelectedMentorForRequest] = useState(null);
  const [requestedMentorIds, setRequestedMentorIds] = useState(new Set());
  const [toastMessage, setToastMessage] = useState(null);

  // Bookmarks state (persisted in localStorage)
  const [bookmarkedIds, setBookmarkedIds] = useState(() => {
    try {
      const saved = localStorage.getItem('growth_hub_bookmarks');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const fetchQuestions = async () => {
    try {
      setQuestionsLoading(true);
      setQuestionsError(null);
      const data = await api.getQuestions();
      setQuestions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch questions:', err);
      setQuestionsError(err.message || 'Failed to load discussions.');
    } finally {
      setQuestionsLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [oppsData, mentorsData, questionsData, skillsData] = await Promise.all([
        api.getOpportunities().catch(() => []),
        api.getMentors().catch(() => []),
        api.getQuestions().catch(() => []),
        api.getSkills().catch(() => [])
      ]);
      setOpportunities(Array.isArray(oppsData) ? oppsData : []);
      setMentors(Array.isArray(mentorsData) ? mentorsData : []);
      setQuestions(Array.isArray(questionsData) ? questionsData : []);
      if (Array.isArray(skillsData) && skillsData.length > 0) {
        setSkillsList(skillsData);
      }
    } catch (err) {
      console.error('Failed to fetch Growth Hub data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleBookmarkToggle = (id, isBookmarked) => {
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (isBookmarked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      try {
        localStorage.setItem('growth_hub_bookmarks', JSON.stringify([...next]));
      } catch (e) {
        // ignore
      }
      return next;
    });
  };

  const handleCreateOpportunity = async (formData) => {
    const newOpp = await api.createOpportunity(formData);
    setOpportunities((prev) => [newOpp, ...prev]);
    showToast('🎉 Opportunity posted successfully!');
  };

  const handleRequestMentorship = async (mentorId, requestData) => {
    await api.requestMentorship(mentorId, requestData);
    setRequestedMentorIds((prev) => new Set(prev).add(mentorId));
    showToast('🚀 Mentorship request sent! The mentor has been notified.');
  };

  const handleAnswerAdded = (questionId, newAnswer) => {
    setQuestions((prevQuestions) =>
      prevQuestions.map((q) => {
        if ((q.id || q._id) === questionId) {
          const existing = Array.isArray(q.answers) ? q.answers : [];
          return {
            ...q,
            answers: [...existing, newAnswer],
            answerCount: existing.length + 1
          };
        }
        return q;
      })
    );
  };

  // Live server-side query processing for opportunities (Module II 2.4 & IV 4.2)
  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(async () => {
      try {
        const oppsData = await api.getOpportunities({
          category: selectedCategory,
          search: searchQuery
        });
        if (isMounted) {
          setOpportunities(Array.isArray(oppsData) ? oppsData : []);
        }
      } catch (err) {
        console.error('Failed to query opportunities from server:', err);
      }
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [selectedCategory, searchQuery]);

  // Opportunities are now queried directly from MongoDB
  const filteredOpportunities = opportunities;

  // Filtered Mentors
  const filteredMentors = useMemo(() => {
    return mentors.filter((mentor) => {
      // Track filter
      if (selectedTrack !== 'All Tracks') {
        const hasTrack = Array.isArray(mentor.expertise) &&
          mentor.expertise.some((e) => e.toLowerCase().includes(selectedTrack.toLowerCase()));
        const inRole = (mentor.role || '').toLowerCase().includes(selectedTrack.toLowerCase());
        const inBio = (mentor.bio || '').toLowerCase().includes(selectedTrack.toLowerCase());
        if (!hasTrack && !inRole && !inBio) {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim() && activeTab === 'mentors') {
        const q = searchQuery.toLowerCase();
        const nameMatch = (mentor.name || '').toLowerCase().includes(q);
        const roleMatch = (mentor.role || '').toLowerCase().includes(q);
        const bioMatch = (mentor.bio || '').toLowerCase().includes(q);
        const expMatch = Array.isArray(mentor.expertise) &&
          mentor.expertise.some((e) => e.toLowerCase().includes(q));
        if (!nameMatch && !roleMatch && !bioMatch && !expMatch) {
          return false;
        }
      }

      return true;
    });
  }, [mentors, selectedTrack, searchQuery, activeTab]);

  // Filtered Questions (Newest first, skill filter, search filter)
  const filteredQuestions = useMemo(() => {
    let list = Array.isArray(questions) ? [...questions] : [];

    // Sort newest first
    list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    if (selectedSkillFilter !== 'All') {
      list = list.filter((q) =>
        Array.isArray(q.skillTags) &&
        q.skillTags.some((tag) => tag.toLowerCase() === selectedSkillFilter.toLowerCase())
      );
    }

    if (searchQuery.trim() && activeTab === 'discussions') {
      const q = searchQuery.toLowerCase();
      list = list.filter((item) =>
        (item.title || '').toLowerCase().includes(q) ||
        (item.question || '').toLowerCase().includes(q) ||
        (item.details || '').toLowerCase().includes(q) ||
        (item.askedByName || '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [questions, selectedSkillFilter, searchQuery, activeTab]);

  return (
    <div className="flex flex-col w-full px-4 lg:px-8 pb-16 pt-8 max-w-7xl mx-auto">
      {/* Toast Alert */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-20 right-6 z-50 px-4 py-3 rounded-xl bg-surface-container-high border border-primary/30 shadow-2xl flex items-center gap-2.5 text-on-surface text-sm font-button-text backdrop-blur-xl"
          >
            <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative">
        <div className="flex flex-col gap-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono-sm w-fit">
            <span className="material-symbols-outlined text-[15px]">rocket_launch</span>
            <span>Career Acceleration & Guidance</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl text-on-surface font-semibold tracking-tight">
            Growth Hub
          </h1>
          <p className="font-body-md text-sm text-on-surface-variant max-w-2xl leading-relaxed">
            Discover verified internships, hackathons, and workshops — or book 1-on-1 mentorship sessions and join technical discussions with verified alumni and peers.
          </p>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-3 shrink-0">
          {activeTab === 'opportunities' && (
            <button
              onClick={() => setIsPostModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-button-text text-sm hover:opacity-90 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer shadow-md"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              <span>Post Opportunity</span>
            </button>
          )}
          {activeTab === 'discussions' && (
            <button
              onClick={() => setIsAskModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-button-text text-sm hover:opacity-90 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer shadow-md"
            >
              <span className="material-symbols-outlined text-[18px]">add_comment</span>
              <span>Ask a Question</span>
            </button>
          )}
        </div>
      </div>

      {/* Primary Tabs (Opportunities vs Mentors vs Discussions) */}
      <div className="flex items-center gap-8 mb-6 border-b border-white/[0.08] relative">
        <button
          onClick={() => setActiveTab('opportunities')}
          className={`pb-3 text-sm font-button-text relative transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'opportunities' ? 'text-primary font-semibold' : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">work</span>
          <span>Opportunities ({opportunities.length})</span>
          {activeTab === 'opportunities' && (
            <motion.div
              layoutId="growthTab"
              className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-t-full"
            />
          )}
        </button>

        <button
          onClick={() => setActiveTab('mentors')}
          className={`pb-3 text-sm font-button-text relative transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'mentors' ? 'text-primary font-semibold' : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">school</span>
          <span>Mentors ({mentors.length})</span>
          {activeTab === 'mentors' && (
            <motion.div
              layoutId="growthTab"
              className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-t-full"
            />
          )}
        </button>

        <button
          onClick={() => setActiveTab('discussions')}
          className={`pb-3 text-sm font-button-text relative transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'discussions' ? 'text-primary font-semibold' : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">forum</span>
          <span>Discussions ({questions.length})</span>
          {activeTab === 'discussions' && (
            <motion.div
              layoutId="growthTab"
              className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-t-full"
            />
          )}
        </button>
      </div>

      {/* Controls Bar: Search & Quick Filters for Opportunities & Mentors */}
      {activeTab !== 'discussions' && (
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
                search
              </span>
              <input
                type="text"
                placeholder={
                  activeTab === 'opportunities'
                    ? 'Search by title, organization, or tech stack...'
                    : 'Search mentors by name, company, or skills...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface-container border border-white/[0.08] rounded-xl py-2.5 pl-10 pr-10 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface p-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Filter Pills */}
          {activeTab === 'opportunities' ? (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
              {OPPORTUNITY_CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-mono-sm transition-all flex items-center gap-1.5 shrink-0 cursor-pointer border ${
                      isSelected
                        ? 'bg-primary text-on-primary border-primary shadow-sm'
                        : 'bg-surface-container border-white/[0.08] text-on-surface-variant hover:text-on-surface hover:bg-white/[0.05]'
                    }`}
                  >
                    {cat.icon && <span className="material-symbols-outlined text-[15px]">{cat.icon}</span>}
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
              {MENTOR_TRACKS.map((track) => {
                const isSelected = selectedTrack === track;
                return (
                  <button
                    key={track}
                    onClick={() => setSelectedTrack(track)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-mono-sm transition-all shrink-0 cursor-pointer border ${
                      isSelected
                        ? 'bg-primary text-on-primary border-primary shadow-sm'
                        : 'bg-surface-container border-white/[0.08] text-on-surface-variant hover:text-on-surface hover:bg-white/[0.05]'
                    }`}
                  >
                    {track}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Main Content Area */}
      <div className="min-h-[400px]">
        {activeTab === 'discussions' ? (
          <div className="flex flex-col gap-6">
            {/* Discussions Header Row: Skill Filter + Ask a Question Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar flex-1">
                <button
                  type="button"
                  onClick={() => setSelectedSkillFilter('All')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-mono-sm transition-all shrink-0 cursor-pointer border ${
                    selectedSkillFilter === 'All'
                      ? 'bg-primary text-on-primary border-primary shadow-sm font-semibold'
                      : 'bg-surface-container border-white/[0.08] text-on-surface-variant hover:text-on-surface hover:bg-white/[0.05]'
                  }`}
                >
                  All
                </button>
                {skillsList.map((skill) => {
                  const skillName = skill.name || skill;
                  const isSelected = selectedSkillFilter === skillName;
                  return (
                    <button
                      key={skill.id || skill._id || skillName}
                      type="button"
                      onClick={() => setSelectedSkillFilter(skillName)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-mono-sm transition-all shrink-0 cursor-pointer border ${
                        isSelected
                          ? 'bg-primary text-on-primary border-primary shadow-sm font-semibold'
                          : 'bg-surface-container border-white/[0.08] text-on-surface-variant hover:text-on-surface hover:bg-white/[0.05]'
                      }`}
                    >
                      {skillName}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setIsAskModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-primary text-on-primary font-button-text text-xs hover:opacity-90 hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-md self-start sm:self-auto"
              >
                <span className="material-symbols-outlined text-[16px]">add_comment</span>
                <span>Ask a Question</span>
              </button>
            </div>

            {/* Discussions List / Loading / Error / Empty States */}
            {questionsLoading || isLoading ? (
              <div className="flex flex-col gap-5">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-44 bg-surface-container/60 border border-white/[0.06] rounded-2xl animate-pulse"
                  />
                ))}
              </div>
            ) : questionsError ? (
              <div className="p-6 rounded-2xl bg-error/10 border border-error/20 text-center flex flex-col items-center gap-3">
                <p className="text-sm text-error">{questionsError}</p>
                <button
                  type="button"
                  onClick={fetchQuestions}
                  className="px-4 py-2 rounded-xl bg-surface-variant border border-white/[0.1] text-xs font-button-text hover:text-on-surface cursor-pointer"
                >
                  Retry
                </button>
              </div>
            ) : filteredQuestions.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[320px] text-on-surface-variant border border-white/[0.08] border-dashed rounded-2xl p-10 text-center bg-surface-container/30">
                <div className="w-14 h-14 rounded-2xl bg-white/[0.04] flex items-center justify-center text-on-surface-variant mb-4">
                  <span className="material-symbols-outlined text-3xl opacity-60">forum</span>
                </div>
                <h3 className="font-button-text text-on-surface text-base mb-1">
                  No questions yet. Be the first to ask.
                </h3>
                <p className="font-body-md text-xs max-w-md text-on-surface-variant mb-5">
                  {selectedSkillFilter !== 'All'
                    ? `No discussions found under "${selectedSkillFilter}". Try selecting "All" or ask a question.`
                    : 'Got a technical blocker, architecture query, or career question? Ask the community!'}
                </p>
                <button
                  type="button"
                  onClick={() => setIsAskModalOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-button-text cursor-pointer hover:opacity-90 flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">add_comment</span>
                  <span>Ask a Question</span>
                </button>
              </div>
            ) : (
              <motion.div layout className="flex flex-col gap-5">
                {filteredQuestions.map((q) => (
                  <QuestionCard
                    key={q.id || q._id}
                    question={q}
                    onAnswerAdded={handleAnswerAdded}
                  />
                ))}
              </motion.div>
            )}
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-64 bg-surface-container/60 border border-white/[0.06] rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : activeTab === 'opportunities' ? (
          filteredOpportunities.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[320px] text-on-surface-variant border border-white/[0.08] border-dashed rounded-2xl p-10 text-center bg-surface-container/30">
              <div className="w-14 h-14 rounded-2xl bg-white/[0.04] flex items-center justify-center text-on-surface-variant mb-4">
                <span className="material-symbols-outlined text-3xl opacity-60">work_outline</span>
              </div>
              <h3 className="font-button-text text-on-surface text-base mb-1">No matching opportunities found</h3>
              <p className="font-body-md text-xs max-w-md text-on-surface-variant mb-5">
                {searchQuery || selectedCategory !== 'all'
                  ? 'Try broadening your search filters or clear the query.'
                  : 'Be the first to share an internship, hackathon, or open-source program with the community!'}
              </p>
              {searchQuery || selectedCategory !== 'all' ? (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                  className="px-4 py-2 rounded-xl bg-surface-variant border border-white/[0.1] text-xs font-button-text hover:text-on-surface cursor-pointer transition-colors"
                >
                  Clear All Filters
                </button>
              ) : (
                <button
                  onClick={() => setIsPostModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-button-text cursor-pointer hover:opacity-90"
                >
                  Post Opportunity
                </button>
              )}
            </div>
          ) : (
            <motion.div
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredOpportunities.map((opp) => (
                <OpportunityCard
                  key={opp.id}
                  opportunity={opp}
                  isBookmarked={bookmarkedIds.has(opp.id)}
                  onBookmarkToggle={handleBookmarkToggle}
                />
              ))}
            </motion.div>
          )
        ) : (
          filteredMentors.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[320px] text-on-surface-variant border border-white/[0.08] border-dashed rounded-2xl p-10 text-center bg-surface-container/30">
              <div className="w-14 h-14 rounded-2xl bg-white/[0.04] flex items-center justify-center text-on-surface-variant mb-4">
                <span className="material-symbols-outlined text-3xl opacity-60">school</span>
              </div>
              <h3 className="font-button-text text-on-surface text-base mb-1">No mentors match this filter</h3>
              <p className="font-body-md text-xs max-w-md text-on-surface-variant mb-5">
                Try selecting "All Tracks" or clearing your search keywords.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedTrack('All Tracks');
                }}
                className="px-4 py-2 rounded-xl bg-surface-variant border border-white/[0.1] text-xs font-button-text hover:text-on-surface cursor-pointer transition-colors"
              >
                Reset Track Filter
              </button>
            </div>
          ) : (
            <motion.div layout className="flex flex-col gap-5">
              {filteredMentors.map((mentor) => (
                <MentorCard
                  key={mentor.id}
                  mentor={mentor}
                  hasRequested={requestedMentorIds.has(mentor.id)}
                  onRequestSession={(selected) => setSelectedMentorForRequest(selected)}
                />
              ))}
            </motion.div>
          )
        )}
      </div>

      {/* Post Opportunity Modal */}
      <PostOpportunityModal
        isOpen={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
        onCreated={handleCreateOpportunity}
      />

      {/* Request Mentorship Modal */}
      <RequestMentorshipModal
        isOpen={Boolean(selectedMentorForRequest)}
        mentor={selectedMentorForRequest}
        onClose={() => setSelectedMentorForRequest(null)}
        onSubmit={handleRequestMentorship}
      />

      {/* Ask Question Modal */}
      <AskQuestionModal
        isOpen={isAskModalOpen}
        onClose={() => setIsAskModalOpen(false)}
        onSuccess={async () => {
          await fetchQuestions();
          showToast('🎉 Question posted successfully!');
        }}
        skills={skillsList}
      />
    </div>
  );
}
