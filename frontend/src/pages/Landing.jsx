import { Link } from 'react-router';
import { useState, useEffect } from 'react';

const codeSnippets = [
  `function solve(arr) {
    return arr.sort((a,b) => a-b);
  }`,
  `const binarySearch = (arr, target) => {
    let left = 0, right = arr.length - 1;
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      if (arr[mid] === target) return mid;
      if (arr[mid] < target) left = mid + 1;
      else right = mid - 1;
    }
    return -1;
  }`,
  `class ListNode {
    constructor(val) {
      this.val = val;
      this.next = null;
    }
  }`,
  `const quickSort = (arr) => {
    if (arr.length <= 1) return arr;
    const pivot = arr[0];
    const left = arr.filter(x => x < pivot);
    const right = arr.filter(x => x > pivot);
    return [...quickSort(left), pivot, ...quickSort(right)];
  }`,
  `const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  }`
];

function Landing() {
  const [currentSnippet, setCurrentSnippet] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    let timeoutId;
    const snippet = codeSnippets[currentSnippet];
    
    if (isTyping) {
      if (typedText.length < snippet.length) {
        timeoutId = setTimeout(() => {
          setTypedText(snippet.slice(0, typedText.length + 1));
        }, 50);
      } else {
        timeoutId = setTimeout(() => {
          setIsTyping(false);
        }, 2000);
      }
    } else {
      timeoutId = setTimeout(() => {
        setTypedText('');
        setCurrentSnippet((prev) => (prev + 1) % codeSnippets.length);
        setIsTyping(true);
      }, 500);
    }

    return () => clearTimeout(timeoutId);
  }, [typedText, isTyping, currentSnippet]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0f0a] via-[#07110c] to-[#0d1a12] relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-600/5 rounded-full blur-3xl animate-pulse delay-2000" />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(16, 185, 129, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(16, 185, 129, 0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }} />
      </div>

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Navigation */}
        <nav className="flex justify-between items-center p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-emerald-300 via-green-400 to-emerald-500 bg-clip-text text-transparent">
              StudyBuddy
            </span>
          </div>
          <div className="flex gap-4">
            <Link 
              to="/login"
              className="px-6 py-2.5 rounded-lg border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10 hover:border-emerald-500/50 transition-all duration-300 font-medium shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20"
            >
              Login
            </Link>
            <Link 
              to="/signup"
              className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-green-600 text-white font-medium hover:from-emerald-400 hover:to-green-500 transition-all duration-300 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:-translate-y-0.5"
            >
              Sign Up
            </Link>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="max-w-7xl w-full grid md:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="inline-block px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm font-medium">
                  🚀 Master Coding with Practice
                </div>
                <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                  <span className="text-white">Solve Problems.</span>
                  <br />
                  <span className="bg-gradient-to-r from-emerald-300 via-green-400 to-emerald-500 bg-clip-text text-transparent">
                    Build Skills.
                  </span>
                  <br />
                  <span className="text-white">Get Hired.</span>
                </h1>
                <p className="text-gray-400 text-lg max-w-md">
                  Practice coding problems, learn from video editorials, discuss with community, and track your progress on your journey to becoming a better developer.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  to="/signup"
                  className="group relative px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold text-lg hover:from-emerald-400 hover:to-green-500 transition-all duration-300 shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-1"
                >
                  <span className="relative z-10">Start Coding Free</span>
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-400 to-green-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </Link>
                <Link 
                  to="/login"
                  className="px-8 py-4 rounded-xl border border-emerald-500/30 text-emerald-300 font-semibold text-lg hover:bg-emerald-500/10 transition-all duration-300"
                >
                  I Already Have an Account
                </Link>
              </div>

              {/* Stats */}
              <div className="flex gap-8 pt-8">
                <div>
                  <div className="text-3xl font-bold text-emerald-300">500+</div>
                  <div className="text-gray-400 text-sm">Problems</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-emerald-300">10K+</div>
                  <div className="text-gray-400 text-sm">Users</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-emerald-300">50+</div>
                  <div className="text-gray-400 text-sm">Video Solutions</div>
                </div>
              </div>
            </div>

            {/* Right Content - Code Editor Animation */}
            <div className="relative">
              <div className="relative bg-gradient-to-br from-slate-900/90 to-slate-800/90 rounded-2xl border border-emerald-500/20 shadow-2xl shadow-emerald-500/10 backdrop-blur-xl overflow-hidden">
                {/* Window controls */}
                <div className="flex items-center gap-2 px-4 py-3 bg-slate-900/50 border-b border-emerald-500/10">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  <div className="ml-4 text-xs text-gray-500 font-mono">solution.js</div>
                </div>
                
                {/* Code content */}
                <div className="p-6 min-h-[300px] relative">
                  {/* Background code (fades when typing) */}
                  <div className={`font-mono text-sm leading-relaxed transition-opacity duration-300 ${isTyping ? 'opacity-20' : 'opacity-100'}`}>
                    <span className="text-purple-400">function</span>
                    <span className="text-emerald-300"> solve</span>
                    <span className="text-white">(</span>
                    <span className="text-orange-300">arr</span>
                    <span className="text-white">) </span>
                    <span className="text-white">{`{`}</span>
                    <br />
                    <span className="ml-4 text-gray-500">// Your solution here</span>
                    <br />
                    <span className="ml-4 text-purple-400">return</span>
                    <span className="text-white"> arr.</span>
                    <span className="text-blue-400">sort</span>
                    <span className="text-white">((</span>
                    <span className="text-orange-300">a</span>
                    <span className="text-white">,</span>
                    <span className="text-orange-300">b</span>
                    <span className="text-white">) </span>
                    <span className="text-purple-400"> =&gt;</span>
                    <span className="text-white"> a </span>
                    <span className="text-purple-400">-</span>
                    <span className="text-white"> b);</span>
                    <br />
                    <span className="text-white">{`}`}</span>
                  </div>
                  
                  {/* Animated code overlay */}
                  <div className="absolute top-0 left-6 right-6 bottom-0 pointer-events-none">
                    <div className="font-mono text-sm leading-relaxed text-emerald-300 whitespace-pre-wrap">
                      {typedText}
                      <span className="inline-block w-2 h-4 bg-emerald-400 animate-pulse ml-1" />
                    </div>
                  </div>
                </div>

                {/* Glow effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500/5 to-purple-500/5 pointer-events-none" />
              </div>

              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br from-emerald-400 to-green-500 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/30 animate-bounce">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center shadow-xl shadow-purple-500/30 animate-bounce delay-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="px-6 py-16">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900/50 to-slate-800/50 border border-emerald-500/10 hover:border-emerald-500/30 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/20">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">500+ Problems</h3>
                <p className="text-gray-400 text-sm">Practice problems ranging from easy to hard difficulty levels</p>
              </div>

              <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900/50 to-slate-800/50 border border-emerald-500/10 hover:border-emerald-500/30 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center mb-4 shadow-lg shadow-purple-500/20">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Video Solutions</h3>
                <p className="text-gray-400 text-sm">Learn from detailed video editorials by expert developers</p>
              </div>

              <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900/50 to-slate-800/50 border border-emerald-500/10 hover:border-emerald-500/30 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/20">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Community</h3>
                <p className="text-gray-400 text-sm">Discuss problems and solutions with other developers</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="px-6 py-8 border-t border-emerald-500/10">
          <div className="max-w-7xl mx-auto text-center text-gray-500 text-sm">
            <p>© 2024 StudyBuddy. Built with ❤️ for developers.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default Landing;
