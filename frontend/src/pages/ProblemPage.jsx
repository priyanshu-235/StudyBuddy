import { useState, useEffect, useRef } from 'react';
// import { useForm } from 'react-hook-form';
import Editor from '@monaco-editor/react';
import { useParams } from 'react-router';
import axiosClient from "../utils/axiosClient"
import SubmissionHistory from "../components/SubmissionHistory"
import ChatAi from '../components/ChatAi';
import Editorial from '../components/Editorial';

const langMap = {
        cpp: 'c++',
        java: 'java',
        javascript: 'javascript'
};

const LEFT_TABS = [
  { id: 'description', label: 'Description' },
  { id: 'editorial', label: 'Editorial' },
  { id: 'solutions', label: 'Solutions' },
  { id: 'submissions', label: 'Submissions' },
  { id: 'chatAI', label: 'ChatAI' },
];

const RIGHT_TABS = [
  { id: 'code', label: 'Code' },
  { id: 'testcase', label: 'Testcase' },
  { id: 'result', label: 'Result' },
];

const ProblemPage = () => {
  const [problem, setProblem] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('cpp');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);
  const [activeLeftTab, setActiveLeftTab] = useState('description');
  const [activeRightTab, setActiveRightTab] = useState('code');
  const editorRef = useRef(null);
  let {problemId}  = useParams();

  

  // const { handleSubmit } = useForm();

 useEffect(() => {
    const fetchProblem = async () => {
      setLoading(true);
      try {
        
        const response = await axiosClient.get(`/problem/problemById/${problemId}`);
       console.log(response.data.startCode)
        
        const initialCode = response.data.startCode.find(sc => sc.language === langMap[selectedLanguage]).initialCode;

        setProblem(response.data);
        
        setCode(initialCode);
        setLoading(false);
        
      } catch (error) {
        console.error('Error fetching problem:', error);
        setLoading(false);
      }
    };

    fetchProblem();
  }, [problemId]);

  // Update code when language changes
  useEffect(() => {
    if (problem) {
      const initialCode = problem.startCode.find(sc => sc.language === langMap[selectedLanguage]).initialCode;
      setCode(initialCode);
    }
  }, [selectedLanguage, problem]);

  const handleEditorChange = (value) => {
    setCode(value || '');
  };

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
  };

  const handleLanguageChange = (language) => {
    setSelectedLanguage(language);
  };

  const handleRun = async () => {
    setLoading(true);
    setRunResult(null);
    
    try {
      const response = await axiosClient.post(`/submission/run/${problemId}`, {
        code,
        language: selectedLanguage
      });

      setRunResult(response.data);
      setLoading(false);
      setActiveRightTab('testcase');
      
    } catch (error) {
      console.error('Error running code:', error);
      setRunResult({
        success: false,
        error: 'Internal server error'
      });
      setLoading(false);
      setActiveRightTab('testcase');
    }
  };

  const handleSubmitCode = async () => {
    setLoading(true);
    setSubmitResult(null);
    
    try {
        const response = await axiosClient.post(`/submission/submit/${problemId}`, {
        code:code,
        language: selectedLanguage
      });

       setSubmitResult(response.data);
       setLoading(false);
       setActiveRightTab('result');
      
    } catch (error) {
      console.error('Error submitting code:', error);
      setSubmitResult(null);
      setLoading(false);
      setActiveRightTab('result');
    }
  };

  const getLanguageForMonaco = (lang) => {
    switch (lang) {
      case 'javascript': return 'javascript';
      case 'java': return 'java';
      case 'cpp': return 'cpp';
      default: return 'javascript';
    }
  };

  const getDifficultyStyles = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'border-emerald-400/50 text-emerald-300 bg-emerald-500/10 shadow-[0_0_12px_rgba(52,211,153,0.15)]';
      case 'medium': return 'border-amber-400/50 text-amber-300 bg-amber-500/10 shadow-[0_0_12px_rgba(251,191,36,0.12)]';
      case 'hard': return 'border-rose-400/50 text-rose-300 bg-rose-500/10 shadow-[0_0_12px_rgba(251,113,133,0.12)]';
      default: return 'border-slate-500/50 text-slate-300 bg-slate-500/10';
    }
  };

  const tabClass = (isActive) =>
    `relative px-4 py-3 text-sm font-medium transition-all duration-200 rounded-t-lg border-b-2 ${
      isActive
        ? 'text-emerald-300 border-emerald-400 bg-gradient-to-b from-emerald-500/15 to-transparent shadow-[0_-2px_12px_rgba(52,211,153,0.12)]'
        : 'text-slate-400 border-transparent hover:text-emerald-200/80 hover:bg-emerald-500/5'
    }`;

  const panelCardClass =
    'rounded-xl border border-emerald-500/20 bg-gradient-to-br from-slate-800/80 to-slate-900/90 shadow-[inset_0_1px_0_rgba(52,211,153,0.08),0_4px_20px_rgba(0,0,0,0.35)]';

  if (loading && !problem) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/40">
        <div className="flex flex-col items-center gap-4">
          <span className="loading loading-spinner loading-lg text-emerald-400"></span>
          <p className="text-emerald-400/70 text-sm tracking-wide">Loading problem...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/30 text-slate-200">
      {/* Left Panel */}
      <div className="w-1/2 flex flex-col border-r border-emerald-500/20 shadow-[inset_-1px_0_0_rgba(52,211,153,0.06)]">
        {/* Left Tabs */}
        <div className="flex gap-1 px-3 pt-2 bg-gradient-to-b from-slate-900/95 to-slate-900/60 backdrop-blur-sm border-b border-emerald-500/15 overflow-x-auto">
          {LEFT_TABS.map(({ id, label }) => (
            <button
              key={id}
              className={tabClass(activeLeftTab === id)}
              onClick={() => setActiveLeftTab(id)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Left Content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          {problem && (
            <>
              {activeLeftTab === 'description' && (
                <div>
                  <div className="flex flex-wrap items-center gap-3 mb-6">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-200 via-teal-200 to-slate-100 bg-clip-text text-transparent">
                      {problem.title}
                    </h1>
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${getDifficultyStyles(problem.difficulty)}`}>
                      {problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1)}
                    </div>
                    <div className="px-3 py-1 rounded-full text-xs font-medium border border-teal-500/30 text-teal-300 bg-teal-500/10 shadow-[0_0_10px_rgba(20,184,166,0.1)]">
                      {problem.tags}
                    </div>
                  </div>

                  <div className={`${panelCardClass} p-5 mb-6`}>
                    <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
                      {problem.description}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-emerald-300/90 flex items-center gap-2">
                      <span className="w-1 h-5 rounded-full bg-gradient-to-b from-emerald-400 to-teal-600"></span>
                      Examples
                    </h3>
                    <div className="space-y-4">
                      {problem.visibleTestCases.map((example, index) => (
                        <div key={index} className={`${panelCardClass} p-4`}>
                          <h4 className="font-semibold mb-3 text-emerald-200/90">Example {index + 1}</h4>
                          <div className="space-y-2 text-sm font-mono text-slate-300">
                            <div className="p-2 rounded-lg bg-slate-950/50 border border-emerald-500/10">
                              <strong className="text-emerald-400/80">Input:</strong> {example.input}
                            </div>
                            <div className="p-2 rounded-lg bg-slate-950/50 border border-emerald-500/10">
                              <strong className="text-emerald-400/80">Output:</strong> {example.output}
                            </div>
                            <div className="p-2 rounded-lg bg-slate-950/50 border border-emerald-500/10">
                              <strong className="text-emerald-400/80">Explanation:</strong> {example.explanation}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeLeftTab === 'editorial' && (
                <div>
                  <h2 className="text-xl font-bold mb-4 text-emerald-300/90 flex items-center gap-2">
                    <span className="w-1 h-6 rounded-full bg-gradient-to-b from-emerald-400 to-teal-600"></span>
                    Editorial
                  </h2>
                  <div className={`${panelCardClass} p-5`}>
                    <Editorial secureUrl={problem.secureUrl} thumbnailUrl={problem.thumbnailUrl} duration={problem.duration}/>
                  </div>
                </div>
              )}

              {activeLeftTab === 'solutions' && (
                <div>
                  <h2 className="text-xl font-bold mb-4 text-emerald-300/90 flex items-center gap-2">
                    <span className="w-1 h-6 rounded-full bg-gradient-to-b from-emerald-400 to-teal-600"></span>
                    Solutions
                  </h2>
                  <div className="space-y-6">
                    {problem.referenceSolution?.map((solution, index) => (
                      <div key={index} className={panelCardClass}>
                        <div className="px-4 py-3 rounded-t-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/5 border-b border-emerald-500/15">
                          <h3 className="font-semibold text-emerald-200/90">{problem?.title} — {solution?.language}</h3>
                        </div>
                        <div className="p-4">
                          <pre className="bg-slate-950/70 p-4 rounded-lg text-sm overflow-x-auto border border-emerald-500/10 text-slate-300">
                            <code>{solution?.completeCode}</code>
                          </pre>
                        </div>
                      </div>
                    )) || <p className="text-slate-500 italic">Solutions will be available after you solve the problem.</p>}
                  </div>
                </div>
              )}

              {activeLeftTab === 'submissions' && (
                <div>
                  <h2 className="text-xl font-bold mb-4 text-emerald-300/90 flex items-center gap-2">
                    <span className="w-1 h-6 rounded-full bg-gradient-to-b from-emerald-400 to-teal-600"></span>
                    My Submissions
                  </h2>
                  <div className={`${panelCardClass} p-5 text-slate-400`}>
                    <SubmissionHistory problemId={problemId} />
                  </div>
                </div>
              )}

              {activeLeftTab === 'chatAI' && (
                <div>
                  <h2 className="text-xl font-bold mb-4 text-emerald-300/90 flex items-center gap-2">
                    <span className="w-1 h-6 rounded-full bg-gradient-to-b from-emerald-400 to-teal-600"></span>
                    Chat with AI
                  </h2>
                  <div className={`${panelCardClass} p-5`}>
                    <ChatAi problem={problem}></ChatAi>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-1/2 flex flex-col">
        {/* Right Tabs */}
        <div className="flex gap-1 px-3 pt-2 bg-gradient-to-b from-slate-900/95 to-slate-900/60 backdrop-blur-sm border-b border-emerald-500/15">
          {RIGHT_TABS.map(({ id, label }) => (
            <button
              key={id}
              className={tabClass(activeRightTab === id)}
              onClick={() => setActiveRightTab(id)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Right Content */}
        <div className="flex-1 flex flex-col min-h-0">
          {activeRightTab === 'code' && (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Language Selector */}
              <div className="flex justify-between items-center px-4 py-3 border-b border-emerald-500/15 bg-slate-900/50">
                <div className="flex gap-2">
                  {['javascript', 'java', 'cpp'].map((lang) => (
                    <button
                      key={lang}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-200 ${
                        selectedLanguage === lang
                          ? 'border-emerald-400/60 text-emerald-300 bg-gradient-to-b from-emerald-500/20 to-emerald-500/5 shadow-[0_0_14px_rgba(52,211,153,0.15),inset_0_1px_0_rgba(52,211,153,0.2)]'
                          : 'border-slate-600/50 text-slate-400 hover:border-emerald-500/30 hover:text-emerald-200/70 bg-slate-800/40'
                      }`}
                      onClick={() => handleLanguageChange(lang)}
                    >
                      {lang === 'cpp' ? 'C++' : lang === 'javascript' ? 'JavaScript' : 'Java'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Monaco Editor */}
              <div className="flex-1 min-h-0 border-y border-emerald-500/10 shadow-[inset_0_0_30px_rgba(16,185,129,0.03)]">
                <Editor
                  height="100%"
                  language={getLanguageForMonaco(selectedLanguage)}
                  value={code}
                  onChange={handleEditorChange}
                  onMount={handleEditorDidMount}
                  theme="vs-dark"
                  options={{
                    fontSize: 14,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 2,
                    insertSpaces: true,
                    wordWrap: 'on',
                    lineNumbers: 'on',
                    glyphMargin: false,
                    folding: true,
                    lineDecorationsWidth: 10,
                    lineNumbersMinChars: 3,
                    renderLineHighlight: 'line',
                    selectOnLineNumbers: true,
                    roundedSelection: false,
                    readOnly: false,
                    cursorStyle: 'line',
                    mouseWheelZoom: true,
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div className="p-4 border-t border-emerald-500/15 bg-gradient-to-t from-slate-900/80 to-slate-900/40 flex justify-between">
                <div className="flex gap-2">
                  <button 
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-600/50 text-slate-400 hover:border-emerald-500/30 hover:text-emerald-200/70 transition-all"
                    onClick={() => setActiveRightTab('testcase')}
                  >
                    Console
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    className={`px-4 py-1.5 text-xs font-semibold rounded-lg border border-emerald-500/40 text-emerald-300 bg-emerald-500/5 hover:bg-emerald-500/15 hover:border-emerald-400/60 hover:shadow-[0_0_16px_rgba(52,211,153,0.2)] transition-all ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
                    onClick={handleRun}
                    disabled={loading}
                  >
                    {loading ? 'Running...' : 'Run'}
                  </button>
                  <button
                    className={`px-4 py-1.5 text-xs font-semibold rounded-lg border border-emerald-400/50 text-slate-900 bg-gradient-to-b from-emerald-400 to-teal-500 shadow-[0_4px_14px_rgba(52,211,153,0.35),inset_0_1px_0_rgba(255,255,255,0.25)] hover:from-emerald-300 hover:to-teal-400 transition-all ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
                    onClick={handleSubmitCode}
                    disabled={loading}
                  >
                    {loading ? 'Submitting...' : 'Submit'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeRightTab === 'testcase' && (
            <div className="flex-1 p-5 overflow-y-auto">
              <h3 className="font-semibold mb-4 text-emerald-300/90 flex items-center gap-2">
                <span className="w-1 h-5 rounded-full bg-gradient-to-b from-emerald-400 to-teal-600"></span>
                Test Results
              </h3>
              {runResult ? (
                <div className={`${panelCardClass} p-4 mb-4 ${runResult.success ? 'border-emerald-500/30' : 'border-rose-500/30'}`}>
                  <div>
                    {runResult.success ? (
                      <div>
                        <h4 className="font-bold text-emerald-300">All test cases passed</h4>
                        <p className="text-sm mt-2 text-slate-400">Runtime: {runResult.runtime+" sec"}</p>
                        <p className="text-sm text-slate-400">Memory: {runResult.memory+" KB"}</p>
                        
                        <div className="mt-4 space-y-2">
                          {runResult.testCases.map((tc, i) => (
                            <div key={i} className="bg-slate-950/50 p-3 rounded-lg border border-emerald-500/15 text-xs">
                              <div className="font-mono text-slate-300">
                                <div><strong className="text-emerald-400/70">Input:</strong> {tc.stdin}</div>
                                <div><strong className="text-emerald-400/70">Expected:</strong> {tc.expected_output}</div>
                                <div><strong className="text-emerald-400/70">Output:</strong> {tc.stdout}</div>
                                <div className="text-emerald-400 mt-1">
                                  Passed
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <h4 className="font-bold text-rose-300">Error</h4>
                        <div className="mt-4 space-y-2">
                          {runResult.testCases.map((tc, i) => (
                            <div key={i} className="bg-slate-950/50 p-3 rounded-lg border border-emerald-500/15 text-xs">
                              <div className="font-mono text-slate-300">
                                <div><strong className="text-emerald-400/70">Input:</strong> {tc.stdin}</div>
                                <div><strong className="text-emerald-400/70">Expected:</strong> {tc.expected_output}</div>
                                <div><strong className="text-emerald-400/70">Output:</strong> {tc.stdout}</div>
                                <div className={tc.status_id==3 ? 'text-emerald-400 mt-1' : 'text-rose-400 mt-1'}>
                                  {tc.status_id==3 ? 'Passed' : 'Failed'}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className={`${panelCardClass} p-6 text-center text-slate-500 italic`}>
                  Click &quot;Run&quot; to test your code with the example test cases.
                </div>
              )}
            </div>
          )}

          {activeRightTab === 'result' && (
            <div className="flex-1 p-5 overflow-y-auto">
              <h3 className="font-semibold mb-4 text-emerald-300/90 flex items-center gap-2">
                <span className="w-1 h-5 rounded-full bg-gradient-to-b from-emerald-400 to-teal-600"></span>
                Submission Result
              </h3>
              {submitResult ? (
                <div className={`${panelCardClass} p-5 ${submitResult.accepted ? 'border-emerald-500/30' : 'border-rose-500/30'}`}>
                  <div>
                    {submitResult.accepted ? (
                      <div>
                        <h4 className="font-bold text-lg text-emerald-300">Accepted</h4>
                        <div className="mt-4 space-y-2 text-slate-300">
                          <p>Test Cases Passed: {submitResult.passedTestCases}/{submitResult.totalTestCases}</p>
                          <p>Runtime: {submitResult.runtime + " sec"}</p>
                          <p>Memory: {submitResult.memory + "KB"} </p>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <h4 className="font-bold text-lg text-rose-300">{submitResult.error}</h4>
                        <div className="mt-4 space-y-2 text-slate-300">
                          <p>Test Cases Passed: {submitResult.passedTestCases}/{submitResult.totalTestCases}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className={`${panelCardClass} p-6 text-center text-slate-500 italic`}>
                  Click &quot;Submit&quot; to submit your solution for evaluation.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProblemPage;
