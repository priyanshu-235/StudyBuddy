import { useEffect, useState } from 'react';
import { NavLink } from 'react-router';
import { useSelector } from 'react-redux';
import axiosClient from '../utils/axiosClient';
import AlertBanner from '../components/AlertBanner';
import { getErrorMessage } from '../utils/getErrorMessage';

const panelCardClass =
  'rounded-xl border border-emerald-500/20 bg-gradient-to-br from-slate-800/80 to-slate-900/90 shadow-[inset_0_1px_0_rgba(52,211,153,0.08),0_4px_20px_rgba(0,0,0,0.35)]';

const getDifficultyStyles = (difficulty) => {
  switch (difficulty?.toLowerCase()) {
    case 'easy': return 'border-emerald-400/50 text-emerald-300 bg-emerald-500/10';
    case 'medium': return 'border-amber-400/50 text-amber-300 bg-amber-500/10';
    case 'hard': return 'border-rose-400/50 text-rose-300 bg-rose-500/10';
    default: return 'border-slate-500/50 text-slate-300 bg-slate-500/10';
  }
};

function RoadmapPage() {
  const { user } = useSelector((state) => state.auth);
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [expandedTopics, setExpandedTopics] = useState({});

  const fetchRoadmap = async () => {
    try {
      setLoading(true);
      const { data } = await axiosClient.get('/roadmap');
      setRoadmap(data);
      setError(null);

      if (!selectedTopic && data.topics.length > 0) {
        setSelectedTopic(data.topics[0].topic);
      }

      setExpandedTopics((prev) => {
        const next = { ...prev };
        data.topics.forEach((topic) => {
          if (next[topic.topic] === undefined) {
            next[topic.topic] = topic.topic === data.topics[0]?.topic;
          }
        });
        return next;
      });
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err, 'Failed to load roadmap'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoadmap();
  }, []);

  const toggleTopic = (topicKey) => {
    setExpandedTopics((prev) => ({
      ...prev,
      [topicKey]: !prev[topicKey],
    }));
    setSelectedTopic(topicKey);
  };

  const activeTopic = roadmap?.topics.find((t) => t.topic === selectedTopic);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/30">
        <span className="loading loading-spinner loading-lg text-emerald-400"></span>
      </div>
    );
  }

  if (error || !roadmap) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/30 text-slate-200">
        <AlertBanner type="error" message={error || 'Roadmap unavailable'} className="mb-4" />
        <NavLink to="/" className="px-4 py-2 rounded-lg border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10">
          Back to Problems
        </NavLink>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/30 text-slate-200">
      <header className="sticky top-0 z-50 border-b border-emerald-500/20 bg-slate-950/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <NavLink to="/" className="flex items-center gap-2 text-slate-400 hover:text-emerald-200 transition-colors text-sm">
            ← Back to Problems
          </NavLink>
          <h1 className="text-lg font-bold bg-gradient-to-r from-emerald-200 via-teal-200 to-slate-100 bg-clip-text text-transparent">
            Learning Roadmap
          </h1>
          {user?.role === 'admin' && (
            <NavLink to="/admin/roadmap" className="text-sm text-emerald-400 hover:text-emerald-200">
              Manage Roadmap
            </NavLink>
          )}
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 py-6">
        {/* Overall progress */}
        <div className={`${panelCardClass} p-5 mb-6`}>
          <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
            <div>
              <h2 className="text-xl font-semibold text-emerald-300/90">Overall Progress</h2>
              <p className="text-sm text-slate-500 mt-1">
                {roadmap.overall.solvedCount} of {roadmap.overall.totalCount} roadmap problems solved
              </p>
            </div>
            <span className="text-2xl font-bold text-emerald-300">{roadmap.overall.progressPercent}%</span>
          </div>
          <div className="w-full h-3 rounded-full bg-slate-700/80 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_10px_rgba(52,211,153,0.4)] transition-all duration-500"
              style={{ width: `${roadmap.overall.progressPercent}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left — topic dropdowns */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Topics</h3>
            {roadmap.topics.map((topic) => {
              const isExpanded = expandedTopics[topic.topic];
              const isSelected = selectedTopic === topic.topic;

              return (
                <div key={topic.topic} className={`${panelCardClass} overflow-hidden transition-all ${isSelected ? 'border-emerald-400/35' : ''}`}>
                  <button
                    type="button"
                    onClick={() => toggleTopic(topic.topic)}
                    className="w-full p-4 text-left hover:bg-emerald-500/5 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-slate-100">{topic.title}</h4>
                        <p className="text-xs text-slate-500 mt-1">
                          {topic.solvedCount}/{topic.totalCount} solved · {topic.progressPercent}%
                        </p>
                      </div>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`h-4 w-4 text-slate-500 shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-700/80 overflow-hidden mt-3">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                        style={{ width: `${topic.progressPercent}%` }}
                      />
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-emerald-500/10 px-4 pb-4">
                      {topic.problems.length === 0 ? (
                        <p className="text-sm text-slate-500 italic py-3">No problems added yet.</p>
                      ) : (
                        <ul className="space-y-1 pt-2">
                          {topic.problems.map((problem, index) => (
                            <li key={problem._id}>
                              <NavLink
                                to={`/problem/${problem._id}`}
                                className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-emerald-500/10 transition-colors text-sm"
                              >
                                <span className="text-slate-600 w-5 text-xs">{index + 1}.</span>
                                <span className={`flex-1 truncate ${problem.isSolved ? 'text-emerald-300' : 'text-slate-300'}`}>
                                  {problem.title}
                                </span>
                                {problem.isSolved && (
                                  <span className="text-emerald-400 text-xs">✓</span>
                                )}
                              </NavLink>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right — selected topic detail */}
          <div className="lg:col-span-3">
            {activeTopic ? (
              <div className={`${panelCardClass} p-6 sticky top-24`}>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-slate-100">{activeTopic.title}</h2>
                  <p className="text-sm text-slate-400 mt-2">{activeTopic.description}</p>
                </div>

                <div className="mb-6 p-4 rounded-xl bg-slate-950/40 border border-emerald-500/15">
                  <div className="flex items-end justify-between gap-4 mb-3">
                    <div>
                      <p className="text-3xl font-bold text-emerald-300">
                        {activeTopic.solvedCount}
                        <span className="text-lg text-slate-500 font-normal"> / {activeTopic.totalCount}</span>
                      </p>
                      <p className="text-sm text-slate-500 mt-1">Problems solved in this topic</p>
                    </div>
                    <span className="text-xl font-semibold text-emerald-400">{activeTopic.progressPercent}%</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-700/80 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_12px_rgba(52,211,153,0.35)] transition-all duration-500"
                      style={{ width: `${activeTopic.progressPercent}%` }}
                    />
                  </div>
                </div>

                <h3 className="text-sm font-semibold text-emerald-300/90 mb-3 uppercase tracking-wider">
                  Problems in {activeTopic.title}
                </h3>

                {activeTopic.problems.length === 0 ? (
                  <p className="text-slate-500 italic text-sm">No problems in this topic yet.</p>
                ) : (
                  <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                    {activeTopic.problems.map((problem, index) => (
                      <NavLink
                        key={problem._id}
                        to={`/problem/${problem._id}`}
                        className="flex items-center justify-between gap-3 p-3 rounded-lg bg-slate-950/40 border border-emerald-500/10 hover:border-emerald-400/30 transition-all group"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span className="text-xs text-slate-600 w-6">{index + 1}</span>
                          <span className={`text-sm font-medium truncate group-hover:text-emerald-200 ${problem.isSolved ? 'text-emerald-300' : 'text-slate-200'}`}>
                            {problem.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`px-2 py-0.5 rounded-full text-xs border uppercase ${getDifficultyStyles(problem.difficulty)}`}>
                            {problem.difficulty}
                          </span>
                          {problem.isSolved ? (
                            <span className="px-2 py-0.5 rounded-full text-xs border border-emerald-400/40 text-emerald-300 bg-emerald-500/10">
                              Solved
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-xs border border-slate-600/50 text-slate-500">
                              Unsolved
                            </span>
                          )}
                        </div>
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className={`${panelCardClass} p-10 text-center text-slate-500 italic`}>
                Select a topic to view progress
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default RoadmapPage;
