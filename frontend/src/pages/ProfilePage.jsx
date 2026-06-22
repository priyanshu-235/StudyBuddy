import { useEffect, useState } from 'react';
import { NavLink } from 'react-router';
import axiosClient from '../utils/axiosClient';

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

const getStatusStyles = (status) => {
  switch (status) {
    case 'accepted': return 'text-emerald-300 bg-emerald-500/15 border-emerald-400/40';
    case 'wrong': return 'text-rose-300 bg-rose-500/15 border-rose-400/40';
    case 'error': return 'text-amber-300 bg-amber-500/15 border-amber-400/40';
    default: return 'text-slate-300 bg-slate-500/15 border-slate-400/40';
  }
};

const getInitials = (firstName, emailId) => {
  if (firstName) return firstName.charAt(0).toUpperCase();
  if (emailId) return emailId.charAt(0).toUpperCase();
  return '?';
};

const formatDate = (dateString) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatDateTime = (dateString) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const { data } = await axiosClient.get('/user/profile');
        setProfile(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const tabClass = (isActive) =>
    `px-4 py-2.5 text-sm font-medium transition-all duration-200 rounded-lg border ${
      isActive
        ? 'text-emerald-300 border-emerald-400/50 bg-emerald-500/10 shadow-[0_0_12px_rgba(52,211,153,0.12)]'
        : 'text-slate-400 border-transparent hover:text-emerald-200/80 hover:bg-emerald-500/5'
    }`;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/30">
        <span className="loading loading-spinner loading-lg text-emerald-400"></span>
        <p className="text-emerald-400/70 text-sm mt-4">Loading profile...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/30 text-slate-200">
        <p className="text-rose-300 mb-4">{error || 'Profile not found'}</p>
        <NavLink to="/" className="px-4 py-2 rounded-lg border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 transition-all">
          Back to Problems
        </NavLink>
      </div>
    );
  }

  const { user, stats, solvedProblems, recentSubmissions } = profile;
  const displayName = user.lastName ? `${user.firstName} ${user.lastName}` : user.firstName;
  const username = user.emailId?.split('@')[0] || user.firstName?.toLowerCase();

  const difficultyTotal = {
    easy: stats.difficultyStats.easy,
    medium: stats.difficultyStats.medium,
    hard: stats.difficultyStats.hard,
  };

  const solvedPercent = stats.totalProblems
    ? Math.round((stats.totalSolved / stats.totalProblems) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/30 text-slate-200">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-emerald-500/20 bg-slate-950/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <NavLink to="/" className="flex items-center gap-2 text-slate-400 hover:text-emerald-200 transition-colors text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Problems
          </NavLink>
          <span className="text-sm text-slate-500">Profile</span>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Profile hero — LeetCode-style banner */}
        <div className={`${panelCardClass} overflow-hidden mb-6`}>
          <div className="h-24 sm:h-32 bg-gradient-to-r from-emerald-600/30 via-teal-600/20 to-slate-800/40 border-b border-emerald-500/15" />
          <div className="px-6 pb-6 -mt-12 sm:-mt-14">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-emerald-400 via-teal-500 to-emerald-600 flex items-center justify-center text-slate-900 font-bold text-3xl sm:text-4xl ring-4 ring-slate-900 shadow-[0_0_24px_rgba(52,211,153,0.35),inset_0_2px_0_rgba(255,255,255,0.3)] shrink-0">
                {getInitials(user.firstName, user.emailId)}
              </div>
              <div className="flex-1 min-w-0 pt-2 sm:pt-0 sm:pb-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 truncate">{displayName}</h1>
                <p className="text-emerald-400/80 font-medium mt-0.5">@{username}</p>
                <p className="text-slate-500 text-sm mt-1 truncate">{user.emailId}</p>
              </div>
              <div className="flex flex-wrap gap-2 sm:pb-1">
                {user.role === 'admin' && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold border border-teal-400/40 text-teal-300 bg-teal-500/10">
                    Admin
                  </span>
                )}
                <span className="px-3 py-1 rounded-full text-xs font-medium border border-emerald-500/25 text-slate-400 bg-slate-800/50">
                  Member since {formatDate(user.memberSince)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left sidebar — stats */}
          <div className="lg:col-span-1 space-y-4">
            {/* Total solved */}
            <div className={panelCardClass + ' p-5'}>
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Progress</h2>
              <div className="text-center mb-4">
                <p className="text-4xl font-bold text-emerald-300">{stats.totalSolved}</p>
                <p className="text-slate-500 text-sm mt-1">/{stats.totalProblems} problems solved</p>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-700/80 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_10px_rgba(52,211,153,0.4)] transition-all"
                  style={{ width: `${solvedPercent}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 text-center mt-2">{solvedPercent}% complete</p>
            </div>

            {/* Difficulty breakdown — LeetCode style */}
            <div className={panelCardClass + ' p-5'}>
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Solved by Difficulty</h2>
              <div className="space-y-4">
                {[
                  { key: 'easy', label: 'Easy', color: 'bg-emerald-400', count: difficultyTotal.easy },
                  { key: 'medium', label: 'Medium', color: 'bg-amber-400', count: difficultyTotal.medium },
                  { key: 'hard', label: 'Hard', color: 'bg-rose-400', count: difficultyTotal.hard },
                ].map(({ key, label, color, count }) => (
                  <div key={key}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-slate-300">{label}</span>
                      <span className="text-slate-400">{count}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-700/80 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${color} opacity-80`}
                        style={{ width: stats.totalSolved ? `${(count / stats.totalSolved) * 100}%` : '0%' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Submission stats */}
            <div className={panelCardClass + ' p-5'}>
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Submission Stats</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-slate-950/40 border border-emerald-500/10 text-center">
                  <p className="text-xl font-bold text-emerald-300">{stats.totalSubmissions}</p>
                  <p className="text-xs text-slate-500 mt-1">Total Submissions</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-950/40 border border-emerald-500/10 text-center">
                  <p className="text-xl font-bold text-emerald-300">{stats.acceptanceRate}%</p>
                  <p className="text-xs text-slate-500 mt-1">Acceptance Rate</p>
                </div>
              </div>
              {user.age && (
                <p className="text-sm text-slate-500 mt-4 pt-4 border-t border-emerald-500/10">
                  Age: <span className="text-slate-300">{user.age}</span>
                </p>
              )}
            </div>
          </div>

          {/* Right content — tabs */}
          <div className="lg:col-span-2">
            <div className="flex flex-wrap gap-2 mb-4">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'solved', label: 'Solved' },
                { id: 'submissions', label: 'Recent Submissions' },
              ].map(({ id, label }) => (
                <button key={id} className={tabClass(activeTab === id)} onClick={() => setActiveTab(id)}>
                  {label}
                </button>
              ))}
            </div>

            {activeTab === 'overview' && (
              <div className="space-y-4">
                <div className={panelCardClass + ' p-5'}>
                  <h3 className="text-lg font-semibold text-emerald-300/90 mb-4 flex items-center gap-2">
                    <span className="w-1 h-5 rounded-full bg-gradient-to-b from-emerald-400 to-teal-600" />
                    Recent Activity
                  </h3>
                  {recentSubmissions.length === 0 ? (
                    <p className="text-slate-500 italic text-sm">No submissions yet. Start solving problems!</p>
                  ) : (
                    <div className="space-y-2">
                      {recentSubmissions.slice(0, 5).map((sub) => (
                        <div key={sub._id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-slate-950/40 border border-emerald-500/10">
                          <div className="min-w-0 flex-1">
                            {sub.problem ? (
                              <NavLink to={`/problem/${sub.problem._id}`} className="text-sm font-medium text-slate-200 hover:text-emerald-200 truncate block">
                                {sub.problem.title}
                              </NavLink>
                            ) : (
                              <span className="text-sm text-slate-400">Unknown Problem</span>
                            )}
                            <p className="text-xs text-slate-500 mt-0.5">{formatDateTime(sub.createdAt)}</p>
                          </div>
                          <span className={`shrink-0 px-2 py-0.5 rounded text-xs font-medium border capitalize ${getStatusStyles(sub.status)}`}>
                            {sub.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className={panelCardClass + ' p-5'}>
                  <h3 className="text-lg font-semibold text-emerald-300/90 mb-4 flex items-center gap-2">
                    <span className="w-1 h-5 rounded-full bg-gradient-to-b from-emerald-400 to-teal-600" />
                    Recently Solved
                  </h3>
                  {solvedProblems.length === 0 ? (
                    <p className="text-slate-500 italic text-sm">No problems solved yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {solvedProblems.slice(0, 5).map((problem) => (
                        <NavLink
                          key={problem._id}
                          to={`/problem/${problem._id}`}
                          className="flex items-center justify-between gap-3 p-3 rounded-lg bg-slate-950/40 border border-emerald-500/10 hover:border-emerald-400/30 transition-colors group"
                        >
                          <span className="text-sm font-medium text-slate-200 group-hover:text-emerald-200 truncate">{problem.title}</span>
                          <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold uppercase border ${getDifficultyStyles(problem.difficulty)}`}>
                            {problem.difficulty}
                          </span>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'solved' && (
              <div className={panelCardClass + ' p-5'}>
                <h3 className="text-lg font-semibold text-emerald-300/90 mb-4">
                  All Solved Problems ({solvedProblems.length})
                </h3>
                {solvedProblems.length === 0 ? (
                  <p className="text-slate-500 italic text-sm">No problems solved yet. Head to the problem list and start coding!</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-slate-500 border-b border-emerald-500/15">
                          <th className="pb-3 pr-4 font-medium">#</th>
                          <th className="pb-3 pr-4 font-medium">Title</th>
                          <th className="pb-3 pr-4 font-medium">Difficulty</th>
                          <th className="pb-3 font-medium">Tag</th>
                        </tr>
                      </thead>
                      <tbody>
                        {solvedProblems.map((problem, index) => (
                          <tr key={problem._id} className="border-b border-emerald-500/10 hover:bg-emerald-500/5 transition-colors">
                            <td className="py-3 pr-4 text-slate-500">{index + 1}</td>
                            <td className="py-3 pr-4">
                              <NavLink to={`/problem/${problem._id}`} className="text-slate-200 hover:text-emerald-200 font-medium">
                                {problem.title}
                              </NavLink>
                            </td>
                            <td className="py-3 pr-4">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold uppercase border ${getDifficultyStyles(problem.difficulty)}`}>
                                {problem.difficulty}
                              </span>
                            </td>
                            <td className="py-3">
                              <span className="px-2 py-0.5 rounded-full text-xs border border-teal-500/30 text-teal-300 bg-teal-500/10">
                                {problem.tags}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'submissions' && (
              <div className={panelCardClass + ' p-5'}>
                <h3 className="text-lg font-semibold text-emerald-300/90 mb-4">
                  Recent Submissions ({recentSubmissions.length})
                </h3>
                {recentSubmissions.length === 0 ? (
                  <p className="text-slate-500 italic text-sm">No submissions yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-slate-500 border-b border-emerald-500/15">
                          <th className="pb-3 pr-4 font-medium">Problem</th>
                          <th className="pb-3 pr-4 font-medium">Status</th>
                          <th className="pb-3 pr-4 font-medium">Language</th>
                          <th className="pb-3 pr-4 font-medium">Runtime</th>
                          <th className="pb-3 font-medium">Submitted</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentSubmissions.map((sub) => (
                          <tr key={sub._id} className="border-b border-emerald-500/10 hover:bg-emerald-500/5 transition-colors">
                            <td className="py-3 pr-4">
                              {sub.problem ? (
                                <NavLink to={`/problem/${sub.problem._id}`} className="text-slate-200 hover:text-emerald-200 font-medium">
                                  {sub.problem.title}
                                </NavLink>
                              ) : (
                                <span className="text-slate-500">—</span>
                              )}
                            </td>
                            <td className="py-3 pr-4">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium border capitalize ${getStatusStyles(sub.status)}`}>
                                {sub.status}
                              </span>
                            </td>
                            <td className="py-3 pr-4 font-mono text-slate-400">{sub.language}</td>
                            <td className="py-3 pr-4 font-mono text-slate-400">{sub.runtime}s</td>
                            <td className="py-3 text-slate-500">{formatDateTime(sub.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
