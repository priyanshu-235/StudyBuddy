import { useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import axiosClient from '../utils/axiosClient';
import { logoutUser } from '../authSlice';

const panelCardClass =
  'rounded-xl border border-emerald-500/20 bg-gradient-to-br from-slate-800/80 to-slate-900/90 shadow-[inset_0_1px_0_rgba(52,211,153,0.08),0_4px_20px_rgba(0,0,0,0.35)]';

const selectClass =
  'px-4 py-2.5 text-sm rounded-lg border border-emerald-500/25 bg-slate-800/60 text-slate-200 outline-none transition-all focus:border-emerald-400/50 focus:shadow-[0_0_14px_rgba(52,211,153,0.12)] hover:border-emerald-500/40 cursor-pointer';

const getDifficultyStyles = (difficulty) => {
  switch (difficulty?.toLowerCase()) {
    case 'easy': return 'border-emerald-400/50 text-emerald-300 bg-emerald-500/10 shadow-[0_0_12px_rgba(52,211,153,0.15)]';
    case 'medium': return 'border-amber-400/50 text-amber-300 bg-amber-500/10 shadow-[0_0_12px_rgba(251,191,36,0.12)]';
    case 'hard': return 'border-rose-400/50 text-rose-300 bg-rose-500/10 shadow-[0_0_12px_rgba(251,113,133,0.12)]';
    default: return 'border-slate-500/50 text-slate-300 bg-slate-500/10';
  }
};

const getInitials = (firstName, emailId) => {
  if (firstName) return firstName.charAt(0).toUpperCase();
  if (emailId) return emailId.charAt(0).toUpperCase();
  return '?';
};

function Homepage() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [problems, setProblems] = useState([]);
  const [solvedProblems, setSolvedProblems] = useState([]);
  const [filters, setFilters] = useState({
    difficulty: 'all',
    tag: 'all',
    status: 'all'
  });
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };

    if (profileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileMenuOpen]);

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const { data } = await axiosClient.get('/problem/getAllProblem');
        setProblems(data);
      } catch (error) {
        console.error('Error fetching problems:', error);
      }
    };

    const fetchSolvedProblems = async () => {
      try {
        const { data } = await axiosClient.get('/problem/problemSolvedByUser');
        setSolvedProblems(data);
      } catch (error) {
        console.error('Error fetching solved problems:', error);
      }
    };

    fetchProblems();
    if (user) fetchSolvedProblems();
  }, [user]);

  const handleLogout = () => {
    dispatch(logoutUser());
    setSolvedProblems([]);
  };

  const filteredProblems = problems.filter(problem => {
    const difficultyMatch = filters.difficulty === 'all' || problem.difficulty === filters.difficulty;
    const tagMatch = filters.tag === 'all' || problem.tags === filters.tag;
    const statusMatch = filters.status === 'all' ||
                      solvedProblems.some(sp => sp._id === problem._id);
    return difficultyMatch && tagMatch && statusMatch;
  });

  const isSolved = (problemId) => solvedProblems.some(sp => sp._id === problemId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/30 text-slate-200">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-emerald-500/20 bg-slate-950/80 backdrop-blur-md shadow-[0_4px_24px_rgba(0,0,0,0.35),inset_0_-1px_0_rgba(52,211,153,0.06)] overflow-visible">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-[0_0_18px_rgba(52,211,153,0.35),inset_0_1px_0_rgba(255,255,255,0.25)]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-900" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
              </svg>
            </div>
            <div>
              <NavLink to="/" className="text-xl font-bold bg-gradient-to-r from-emerald-200 via-teal-200 to-slate-100 bg-clip-text text-transparent hover:opacity-90 transition-opacity">
                StydyBuDDy
              </NavLink>
              <p className="text-xs text-slate-500 hidden sm:block">Practice · Solve · Grow</p>
            </div>
          </div>

          {/* Stats + Profile */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-xs">
              <span className="text-emerald-400 font-semibold">{solvedProblems.length}</span>
              <span className="text-slate-400">/ {problems.length} solved</span>
            </div>

            <div className="flex items-center rounded-xl border border-emerald-500/20 bg-slate-800/50 shadow-[inset_0_1px_0_rgba(52,211,153,0.06)]">
              <NavLink
                to="/profile"
                className="flex items-center gap-3 px-2 py-1.5 sm:px-3 sm:py-2 hover:bg-emerald-500/5 transition-all"
                onClick={() => setProfileMenuOpen(false)}
              >
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 via-teal-500 to-emerald-600 flex items-center justify-center text-slate-900 font-bold text-sm ring-2 ring-emerald-400/40 shadow-[0_0_16px_rgba(52,211,153,0.25),inset_0_1px_0_rgba(255,255,255,0.3)]">
                    {getInitials(user?.firstName, user?.emailId)}
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-900 shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
                </div>
                <div className="hidden sm:block text-left min-w-0">
                  <p className="text-sm font-medium text-emerald-100 truncate">{user?.firstName}</p>
                  <p className="text-xs text-slate-500 truncate max-w-[140px]">{user?.emailId}</p>
                </div>
              </NavLink>

              <div
                ref={profileMenuRef}
                className={`relative border-l border-emerald-500/15 ${profileMenuOpen ? 'dropdown-open' : ''}`}
              >
                <button
                  type="button"
                  aria-expanded={profileMenuOpen}
                  aria-haspopup="true"
                  onClick={() => setProfileMenuOpen((open) => !open)}
                  className="flex items-center px-2 sm:px-3 py-2 sm:py-3 hover:bg-emerald-500/5 transition-all cursor-pointer h-full"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>

                {profileMenuOpen && (
                  <ul className="absolute right-0 top-full mt-2 p-2 rounded-xl border border-emerald-500/20 bg-slate-900/95 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(52,211,153,0.08)] w-72 min-w-[17rem] max-w-[20rem] overflow-hidden z-[100]">
                    <li className="w-full border-b border-emerald-500/10 mb-1 list-none">
                      <NavLink
                        to="/profile"
                        className="flex items-center gap-3 w-full px-3 py-2 hover:bg-emerald-500/10 rounded-lg transition-colors"
                        onClick={() => setProfileMenuOpen(false)}
                      >
                        <div className="w-9 h-9 shrink-0 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-slate-900 font-bold text-xs ring-2 ring-emerald-400/30">
                          {getInitials(user?.firstName, user?.emailId)}
                        </div>
                        <div className="min-w-0 flex-1 overflow-hidden">
                          <p className="text-sm font-medium text-emerald-100 truncate">{user?.firstName}</p>
                          <p className="text-xs text-slate-500 truncate" title={user?.emailId}>{user?.emailId}</p>
                        </div>
                      </NavLink>
                    </li>
                    <li className="w-full list-none">
                      <NavLink
                        to="/profile"
                        className="block w-full px-3 py-2 text-left text-slate-300 hover:text-emerald-200 hover:bg-emerald-500/10 rounded-lg"
                        onClick={() => setProfileMenuOpen(false)}
                      >
                        View Profile
                      </NavLink>
                    </li>
                    <li className="w-full list-none">
                      <button
                        type="button"
                        onClick={() => {
                          setProfileMenuOpen(false);
                          handleLogout();
                        }}
                        className="block w-full px-3 py-2 text-left text-slate-300 hover:text-emerald-200 hover:bg-emerald-500/10 rounded-lg"
                      >
                        Logout
                      </button>
                    </li>
                    {user?.role === 'admin' && (
                      <li className="w-full list-none">
                        <NavLink
                          to="/admin"
                          className="block w-full px-3 py-2 text-slate-300 hover:text-emerald-200 hover:bg-emerald-500/10 rounded-lg"
                          onClick={() => setProfileMenuOpen(false)}
                        >
                          Admin
                        </NavLink>
                      </li>
                    )}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto p-4 sm:p-6">
        {/* Page heading */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-emerald-200 via-teal-200 to-slate-100 bg-clip-text text-transparent">
            Problems
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {filteredProblems.length} problem{filteredProblems.length !== 1 ? 's' : ''} available
          </p>
        </div>

        {/* Filters */}
        <div className={`${panelCardClass} p-4 mb-6`}>
          <div className="flex flex-wrap gap-3 sm:gap-4">
            <select
              className={selectClass}
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="all">All Problems</option>
              <option value="solved">Solved Problems</option>
            </select>

            <select
              className={selectClass}
              value={filters.difficulty}
              onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>

            <select
              className={selectClass}
              value={filters.tag}
              onChange={(e) => setFilters({ ...filters, tag: e.target.value })}
            >
              <option value="all">All Tags</option>
              <option value="array">Array</option>
              <option value="linkedList">Linked List</option>
              <option value="graph">Graph</option>
              <option value="dp">DP</option>
            </select>
          </div>
        </div>

        {/* Problems List */}
        <div className="grid gap-4">
          {filteredProblems.length === 0 ? (
            <div className={`${panelCardClass} p-10 text-center`}>
              <p className="text-slate-500 italic">No problems match your filters.</p>
            </div>
          ) : (
            filteredProblems.map(problem => (
              <div
                key={problem._id}
                className={`${panelCardClass} p-5 transition-all duration-200 hover:border-emerald-400/35 hover:shadow-[inset_0_1px_0_rgba(52,211,153,0.12),0_6px_28px_rgba(52,211,153,0.08)] group`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-semibold mb-3">
                      <NavLink
                        to={`/problem/${problem._id}`}
                        className="text-slate-100 group-hover:text-emerald-200 transition-colors"
                      >
                        {problem.title}
                      </NavLink>
                    </h2>

                    <div className="flex flex-wrap gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${getDifficultyStyles(problem.difficulty)}`}>
                        {problem.difficulty}
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-medium border border-teal-500/30 text-teal-300 bg-teal-500/10 shadow-[0_0_10px_rgba(20,184,166,0.1)]">
                        {problem.tags}
                      </span>
                    </div>
                  </div>

                  {isSolved(problem._id) && (
                    <div className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-emerald-400/40 text-emerald-300 bg-emerald-500/10 text-xs font-medium shadow-[0_0_12px_rgba(52,211,153,0.15)]">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Solved
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Homepage;
