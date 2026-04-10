/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mic, 
  MicOff,
  LayoutDashboard, 
  BookOpen, 
  Settings, 
  ChevronRight, 
  History, 
  TrendingUp, 
  MessageSquare,
  Award,
  Volume2,
  RefreshCw,
  Activity,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { FALLBACK_SCENARIOS, FALLBACK_TOPICS, FALLBACK_VOCAB } from './data/fallbacks';
import { auth, signInWithGoogle, logout, saveUserProfile, getUserProfile, saveSession } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

// AI Proxy Helper
async function callAI(params: { model?: string, contents: any, config?: any }) {
  const response = await fetch('/api/ai/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'AI request failed');
  }
  return response.json();
}

// Types
type AppState = 'onboarding' | 'scenarios' | 'conversation' | 'dashboard' | 'daily-practice' | 'daily-vocab' | 'settings';
type ProficiencyLevel = 'B1' | 'B2' | 'C1' | null;

interface UserProfile {
  level: ProficiencyLevel;
  sessionsCompleted: number;
  averageLatency: number;
  fillerWordFrequency: number;
}

export default function App() {
  const [appState, setAppState] = useState<AppState>('onboarding');
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    level: null,
    sessionsCompleted: 0,
    averageLatency: 0,
    fillerWordFrequency: 0
  });

  // Firebase Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const profile = await getUserProfile(currentUser.uid);
        if (profile) {
          setUserProfile({
            level: profile.level,
            sessionsCompleted: profile.sessionsCompleted || 0,
            averageLatency: profile.averageLatency || 0,
            fillerWordFrequency: profile.fillerWordFrequency || 0
          });
          setAppState('scenarios');
        } else {
          setAppState('onboarding');
        }
      } else {
        // Fallback to local storage if not logged in
        const savedProfile = localStorage.getItem('userProfile');
        if (savedProfile) {
          setUserProfile(JSON.parse(savedProfile));
          setAppState('scenarios');
        } else {
          setAppState('onboarding');
        }
      }
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleOnboardingComplete = async (level: ProficiencyLevel) => {
    const newProfile = { ...userProfile, level };
    setUserProfile(newProfile);
    
    if (user) {
      await saveUserProfile(user.uid, newProfile);
    } else {
      localStorage.setItem('userProfile', JSON.stringify(newProfile));
    }
    setAppState('scenarios');
  };

  const handleSessionComplete = async (sessionData?: any) => {
    setUserProfile(prev => {
      const newProfile = { 
        ...prev, 
        sessionsCompleted: prev.sessionsCompleted + 1,
        averageLatency: Math.max(1.5, prev.averageLatency > 0 ? prev.averageLatency * 0.95 : 2.8),
        fillerWordFrequency: Math.max(1.2, prev.fillerWordFrequency > 0 ? prev.fillerWordFrequency * 0.9 : 5.4)
      };
      
      if (user) {
        saveUserProfile(user.uid, newProfile);
        if (sessionData) {
          saveSession(user.uid, sessionData);
        }
      } else {
        localStorage.setItem('userProfile', JSON.stringify(newProfile));
      }
      
      return newProfile;
    });
  };

  const handleResetProfile = async () => {
    if (user) {
      // For logged in users, we just reset the profile fields in Firestore
      const resetProfile = {
        level: null,
        sessionsCompleted: 0,
        averageLatency: 0,
        fillerWordFrequency: 0
      };
      await saveUserProfile(user.uid, resetProfile);
      setUserProfile(resetProfile);
    } else {
      localStorage.removeItem('userProfile');
      setUserProfile({
        level: null,
        sessionsCompleted: 0,
        averageLatency: 0,
        fillerWordFrequency: 0
      });
    }
    setAppState('onboarding');
  };

  const handleLogin = async () => {
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      console.error("Login failed", error);
      if (error.code === 'auth/popup-blocked') {
        setAuthError("The login popup was blocked. Please allow popups or open the app in a new tab.");
      } else if (error.code === 'auth/unauthorized-domain') {
        setAuthError("This domain is not authorized in Firebase. Please add it to the Authorized Domains list.");
      } else {
        setAuthError(error.message || "An unknown error occurred during login.");
      }
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setAppState('onboarding');
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <RefreshCw className="animate-spin text-indigo-600" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100">
      {/* Navigation Bar */}
      {userProfile.level && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 flex justify-around items-center z-50 md:top-0 md:bottom-auto md:flex-col md:w-20 md:h-screen md:border-r md:border-t-0">
          <NavIcon 
            active={appState === 'scenarios'} 
            onClick={() => setAppState('scenarios')} 
            icon={<BookOpen size={24} />} 
            label="Practice" 
          />
          <NavIcon 
            active={appState === 'dashboard'} 
            onClick={() => setAppState('dashboard')} 
            icon={<LayoutDashboard size={24} />} 
            label="Stats" 
          />
          <div className="hidden md:flex flex-col gap-6 mt-auto pb-6">
            <NavIcon 
              active={appState === 'settings'} 
              onClick={() => setAppState('settings')} 
              icon={<Settings size={24} />} 
              label="Settings" 
            />
          </div>
        </nav>
      )}

      {/* Main Content Area */}
      <main className={`pb-24 md:pb-0 min-h-screen ${userProfile.level ? 'md:pl-20' : ''}`}>
        <AnimatePresence mode="wait">
          {appState === 'onboarding' && (
            <Onboarding 
              key="onboarding" 
              onComplete={handleOnboardingComplete} 
              onLogin={handleLogin} 
              user={user} 
              error={authError}
            />
          )}
          {appState === 'scenarios' && (
            <ScenarioSelection 
              key="scenarios" 
              userLevel={userProfile.level} 
              onSelect={(id) => {
                setSelectedScenario(id);
                setAppState('conversation');
              }} 
              onDailyPractice={() => setAppState('daily-practice')}
              onDailyVocab={() => setAppState('daily-vocab')}
              onReset={handleResetProfile}
              onSettings={() => setAppState('settings')}
            />
          )}
          {appState === 'conversation' && (
            <Conversation 
              key="conversation" 
              userLevel={userProfile.level} 
              scenarioId={selectedScenario}
              onBack={() => setAppState('scenarios')} 
              onComplete={handleSessionComplete}
            />
          )}
          {appState === 'daily-practice' && (
            <DailyPractice 
              key="daily-practice"
              userLevel={userProfile.level}
              onBack={() => setAppState('scenarios')}
              onComplete={handleSessionComplete}
            />
          )}
          {appState === 'daily-vocab' && (
            <DailyVocab 
              key="daily-vocab"
              userLevel={userProfile.level}
              onBack={() => setAppState('scenarios')}
              onComplete={handleSessionComplete}
            />
          )}
          {appState === 'dashboard' && (
            <Dashboard 
              key="dashboard" 
              profile={userProfile} 
              onReset={() => setAppState('settings')}
            />
          )}
          {appState === 'settings' && (
            <SettingsView 
              key="settings"
              profile={userProfile}
              onBack={() => setAppState('scenarios')}
              onReset={handleResetProfile}
              onLogout={handleLogout}
              user={user}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function NavIcon({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 transition-colors ${active ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
    >
      {icon}
      <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
      {active && (
        <motion.div 
          layoutId="nav-indicator" 
          className="absolute -bottom-3 w-1 h-1 bg-indigo-600 rounded-full md:hidden" 
        />
      )}
    </button>
  );
}

// --- Components for User Stories ---

const IELTS_CRITERIA = `
IELTS Speaking Assessment Criteria:
1. Fluency and Coherence: Ability to speak at length, use cohesive devices, and avoid excessive hesitation.
2. Lexical Resource: Range and precision of vocabulary used.
3. Grammatical Range and Accuracy: Variety and correct use of grammatical structures.
4. Pronunciation: Clarity of speech and use of phonological features.
`;

function Onboarding({ onComplete, onLogin, user, error }: { onComplete: (level: ProficiencyLevel) => void, onLogin: () => void, user: User | null, error?: string | null, key?: string }) {
  const [step, setStep] = useState<'welcome' | 'testing' | 'result'>('welcome');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<string[]>([]);
  const [userInput, setUserInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [detectedLevel, setDetectedLevel] = useState<ProficiencyLevel>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setUserInput(transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech Recognition Error:", event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          alert("Microphone access was denied. Please check your browser settings and allow microphone access for this site.");
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    } else {
      console.warn("Speech Recognition not supported in this browser.");
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in your browser. Please try using Chrome, Edge, or Safari.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        setUserInput("");
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error("Failed to start speech recognition:", err);
        setIsListening(false);
      }
    }
  };

  const questions = [
    "Tell me about your typical workday. What are your main responsibilities?",
    "What was a challenging situation you faced recently at work or in your studies, and how did you handle it?",
    "Why do you want to improve your English speaking skills right now? What is your main goal?"
  ];

  const handleNext = async () => {
    if (!userInput.trim()) return;
    if (isListening) toggleListening();

    const newResponses = [...responses, userInput];
    setResponses(newResponses);
    setUserInput("");

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setIsProcessing(true);
      try {
        const model = "gemini-3-flash-preview";
        const prompt = `
          Analyze the following English learner's spoken responses (transcribed) to determine their level based on ${IELTS_CRITERIA}.
          
          Responses:
          ${newResponses.map((r, i) => `Q${i+1}: ${r}`).join('\n')}
          
          Map the IELTS performance to CEFR levels:
          - B1: Roughly IELTS 4.0 - 5.0
          - B2: Roughly IELTS 5.5 - 6.5
          
          Return ONLY a JSON object:
          {
            "level": "B1" | "B2",
            "reason": "Short explanation based on IELTS criteria."
          }
        `;

        const response = await callAI({
          model,
          contents: prompt,
          config: { responseMimeType: "application/json" }
        });

        const result = JSON.parse(response.text || "{}");
        setDetectedLevel(result.level);
        setStep('result');
      } catch (error) {
        console.error("Placement Error:", error);
        setDetectedLevel('B1');
        setStep('result');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-2xl mx-auto pt-16 md:pt-24 px-6 text-center"
    >
      <AnimatePresence mode="wait">
        {step === 'welcome' && (
          <motion.div key="welcome" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
            <div className="w-20 h-20 bg-brand-50 text-brand-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-sm">
              <Mic size={36} />
            </div>
            <h1 className="text-4xl font-display font-black tracking-tight mb-4 text-slate-900">IELTS Speaking Check</h1>
            <p className="text-slate-500 text-lg mb-12 leading-relaxed">Let's find your starting point. Answer 3 quick questions to get your IELTS-based level.</p>
            
            <div className="flex flex-col gap-4 max-w-xs mx-auto">
              <button 
                onClick={() => setStep('testing')}
                className="w-full bg-brand-600 text-white px-10 py-4 rounded-2xl font-bold shadow-xl shadow-brand-100 hover:bg-brand-700 hover:scale-105 transition-all flex items-center justify-center gap-2"
              >
                Start Assessment <ChevronRight size={20} />
              </button>

              {!user && (
                <button 
                  onClick={onLogin}
                  className="w-full bg-white text-slate-900 border-2 border-slate-100 px-10 py-4 rounded-2xl font-bold hover:border-brand-100 hover:bg-brand-50/30 transition-all flex items-center justify-center gap-2"
                >
                  Sign in with Google
                </button>
              )}

              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-left">
                  <AlertCircle size={16} className="text-red-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-red-800 font-medium leading-relaxed">{error}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {step === 'testing' && (
          <motion.div key="testing" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
            <div className="space-y-2">
              <div className="flex justify-center gap-2">
                {questions.map((_, i) => (
                  <div key={i} className={`h-1.5 rounded-full transition-all ${i === currentQuestionIndex ? 'w-8 bg-brand-600' : 'w-2 bg-slate-200'}`} />
                ))}
              </div>
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Question {currentQuestionIndex + 1} of 3</p>
            </div>

            <div className="p-10 bg-white border border-slate-100 rounded-[3rem] shadow-sm relative">
              <h2 className="text-2xl font-display font-bold text-slate-900 leading-tight mb-8">"{questions[currentQuestionIndex]}"</h2>
              
              <div className="relative h-32 flex items-center justify-center">
                {isListening ? (
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <motion.div
                        key={i}
                        animate={{ height: [10, 40, 10] }}
                        transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
                        className="w-1 bg-brand-500 rounded-full"
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 text-sm italic">Tap the mic and start speaking...</p>
                )}
              </div>
              
              <button 
                onClick={toggleListening}
                className={`absolute -bottom-8 left-1/2 -translate-x-1/2 w-20 h-20 rounded-[2rem] flex items-center justify-center shadow-2xl transition-all ${isListening ? 'bg-red-500 hover:bg-red-600 scale-110' : 'bg-brand-600 hover:bg-brand-700 hover:scale-105'}`}
              >
                {isListening ? <MicOff size={32} className="text-white" /> : <Mic size={32} className="text-white" />}
              </button>
            </div>

            <div className="pt-12">
              <button 
                onClick={handleNext}
                disabled={isProcessing || !userInput.trim()}
                className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-bold shadow-xl shadow-slate-100 hover:bg-slate-800 disabled:bg-slate-200 transition-all flex items-center gap-2 mx-auto"
              >
                {isProcessing ? "Analyzing..." : currentQuestionIndex === questions.length - 1 ? "Finish Assessment" : "Next Question"} <ChevronRight size={20} />
              </button>
            </div>
          </motion.div>
        )}

        {step === 'result' && (
          <motion.div key="result" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-sm">
              <Award size={48} />
            </div>
            <h1 className="text-4xl font-display font-black tracking-tight mb-4 text-slate-900">Assessment Complete!</h1>
            <p className="text-slate-500 text-lg mb-2">Your current IELTS-based level is:</p>
            <div className="text-7xl font-display font-black text-brand-600 mb-8">{detectedLevel}</div>
            <p className="text-slate-500 mb-12 max-w-md mx-auto leading-relaxed">
              Great job! We've tailored your practice sessions to match your <strong>{detectedLevel}</strong> proficiency level.
            </p>
            <button 
              onClick={() => onComplete(detectedLevel)}
              className="bg-brand-600 text-white px-14 py-4 rounded-2xl font-bold shadow-xl shadow-brand-100 hover:bg-brand-700 hover:scale-105 transition-all mx-auto"
            >
              Start Practicing
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ScenarioSelection({ userLevel, onSelect, onDailyPractice, onDailyVocab, onReset, onSettings }: { userLevel: ProficiencyLevel, onSelect: (id: string) => void, onDailyPractice: () => void, onDailyVocab: () => void, onReset: () => void, onSettings: () => void, key?: string }) {
  const scenarios = [
    { id: 'meeting', title: 'Work Meeting', icon: <MessageSquare />, description: 'Discuss project updates with your team.', level: 'B2' },
    { id: 'interview', title: 'Job Interview', icon: <Award />, description: 'Practice answering common interview questions.', level: 'B2' },
    { id: 'social', title: 'Casual Social', icon: <TrendingUp />, description: 'Small talk at a networking event.', level: 'B1' },
    { id: 'travel', title: 'Travel/Service', icon: <BookOpen />, description: 'Ordering at a restaurant or checking in.', level: 'B1' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-5xl mx-auto pt-12 pb-24 px-6"
    >
      <header className="mb-12 flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2 text-brand-600 font-black text-[10px] uppercase tracking-[0.2em] mb-3">
            <TrendingUp size={14} /> Level {userLevel}
          </div>
          <h1 className="text-5xl font-display font-black tracking-tighter text-slate-900">Practice Hub</h1>
          <p className="text-slate-500 mt-2 text-lg">Master real-life English situations.</p>
        </div>
      </header>

      {/* Daily Practice Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <motion.button
          whileHover={{ y: -5, scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={onDailyPractice}
          className="p-8 bg-brand-600 rounded-[2.5rem] text-white text-left relative overflow-hidden group shadow-2xl shadow-brand-100"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-brand-200 font-black text-[10px] uppercase tracking-widest mb-4">
              <Mic size={14} /> Warm-up
            </div>
            <h2 className="text-3xl font-display font-bold mb-2">Impromptu Speech</h2>
            <p className="text-brand-100/80 text-sm leading-relaxed max-w-[80%]">Master thinking on your feet with 90-second random topics.</p>
            <div className="mt-8 flex items-center gap-2 font-black text-xs uppercase tracking-widest group-hover:gap-4 transition-all">
              Start Session <ChevronRight size={14} />
            </div>
          </div>
          <div className="absolute right-[-20px] bottom-[-20px] opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-500">
            <Mic size={160} />
          </div>
        </motion.button>

        <motion.button
          whileHover={{ y: -5, scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={onDailyVocab}
          className="p-8 bg-emerald-600 rounded-[2.5rem] text-white text-left relative overflow-hidden group shadow-2xl shadow-emerald-100"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-emerald-100 font-black text-[10px] uppercase tracking-widest mb-4">
              <BookOpen size={14} /> Vocabulary
            </div>
            <h2 className="text-3xl font-display font-bold mb-2">Word Builder</h2>
            <p className="text-emerald-50/80 text-sm leading-relaxed max-w-[80%]">Learn 3 high-impact words daily tailored to your level.</p>
            <div className="mt-8 flex items-center gap-2 font-black text-xs uppercase tracking-widest group-hover:gap-4 transition-all">
              Start Session <ChevronRight size={14} />
            </div>
          </div>
          <div className="absolute right-[-20px] bottom-[-20px] opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-500">
            <BookOpen size={160} />
          </div>
        </motion.button>
      </div>

      <div className="space-y-6">
        <h3 className="text-[10px] text-slate-400 uppercase font-black tracking-[0.3em] pl-2">Real-life Scenarios</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {scenarios.map((s) => (
            <motion.button 
              key={s.id}
              whileHover={{ x: 5 }}
              onClick={() => onSelect(s.id)}
              className="group p-6 bg-white border border-slate-100 rounded-[2rem] text-left hover:border-brand-500 hover:shadow-xl hover:shadow-brand-50 transition-all flex items-center gap-6"
            >
              <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center group-hover:bg-brand-50 group-hover:text-brand-600 transition-all shrink-0">
                {React.cloneElement(s.icon as React.ReactElement, { size: 28 })}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-display font-bold text-slate-900 group-hover:text-brand-600 transition-colors">{s.title}</h4>
                  <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase tracking-tighter">{s.level}</span>
                </div>
                <p className="text-slate-500 text-xs line-clamp-1">{s.description}</p>
              </div>
              <ChevronRight size={20} className="text-slate-300 group-hover:text-brand-500 group-hover:translate-x-1 transition-all" />
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function Conversation({ userLevel, scenarioId, onBack, onComplete }: { userLevel: ProficiencyLevel, scenarioId: string | null, onBack: () => void, onComplete: () => void, key?: string }) {
  const [messages, setMessages] = useState<{ role: 'ai' | 'user', text: string, feedback?: any }[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [isFinished, setIsFinished] = useState(false);
  const [subTopic, setSubTopic] = useState("");
  const [context, setContext] = useState("");
  const [openingLine, setOpeningLine] = useState("");
  const [hasStarted, setHasStarted] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer logic
  useEffect(() => {
    if (hasStarted && timeLeft > 0 && !isFinished) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && !isFinished) {
      setIsFinished(true);
      onComplete();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timeLeft, isFinished, hasStarted]);

  // Dynamic Topic Generation
  useEffect(() => {
    const initConversation = async () => {
      setIsProcessing(true);
      try {
        const prompt = `Generate a specific sub-topic for English practice.
        Scenario: ${scenarioId}
        Level: ${userLevel}
        
        Rules:
        1. subTopic: Specific situation (e.g. 'Asking for a refund').
        2. openingLine: Natural first sentence from AI.
        3. context: 1-sentence setting (e.g. 'You are at a store counter.').
        
        JSON Format: {"subTopic": "", "openingLine": "", "context": ""}`;

        const response = await callAI({
          model: "gemini-3-flash-preview",
          contents: prompt,
          config: { 
            responseMimeType: "application/json",
            maxOutputTokens: 150,
            temperature: 0.7
          }
        });

        const data = JSON.parse(response.text || "{}");
        setSubTopic(data.subTopic || "General Practice");
        setContext(data.context || "Practice your English in this real-life scenario.");
        setOpeningLine(data.openingLine || "Hello! Let's start our practice.");
        setMessages([]); // Clear messages for new topic
        setHasStarted(false); // Reset start state
      } catch (error) {
        console.error("Topic Gen Error:", error);
        const fallback = scenarioId ? FALLBACK_SCENARIOS[scenarioId] : null;
        setSubTopic(fallback?.subTopic || "General Practice");
        setContext("Practice your English in this real-life scenario.");
        setOpeningLine(fallback?.openingLine || "Hi! Let's start our practice session.");
        setMessages([]);
        setHasStarted(false);
      } finally {
        setIsProcessing(false);
      }
    };
    initConversation();
  }, [scenarioId, userLevel, refreshKey]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setUserInput(transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech Recognition Error:", event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    } else {
      console.warn("Speech Recognition not supported in this browser.");
    }
  }, []);

  const toggleListening = () => {
    if (isFinished) return;
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in your browser. Please try using Chrome, Edge, or Safari.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        setUserInput("");
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error("Failed to start speech recognition:", err);
        setIsListening(false);
      }
    }
  };

  const handleStart = () => {
    setHasStarted(true);
    setMessages([{ role: 'ai', text: openingLine }]);
  };

  const getFeedbackAndResponse = async (text: string) => {
    if (isFinished) return;
    setIsProcessing(true);
    try {
      const history = messages.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n');
      
      const prompt = `
        Role: English tutor for a ${userLevel} learner.
        Current Situation: ${context}
        Current Topic: ${subTopic}
        
        Conversation History:
        ${history}
        
        User Input: "${text}"
        Time Left: ${Math.floor(timeLeft / 60)}m ${timeLeft % 60}s
        
        Task:
        1. Provide IELTS feedback (improved version, 1-2 sentence explanation, score estimate).
        2. Continue the conversation naturally based on the "Current Situation". Stay in character.
        
        JSON Format:
        {
          "improved": "...",
          "explanation": "...",
          "score_estimate": "...",
          "next_turn": "..."
        }
      `;

      const response = await callAI({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { 
          responseMimeType: "application/json",
          temperature: 0.8
        }
      });

      const data = JSON.parse(response.text || "{}");
      
      const feedback = {
        original: text,
        improved: data.improved,
        explanation: data.explanation,
        score: data.score_estimate
      };

      setMessages(prev => [
        ...prev, 
        { role: 'user', text, feedback },
        { role: 'ai', text: data.next_turn }
      ]);
      setUserInput("");
    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [
        ...prev, 
        { role: 'user', text },
        { role: 'ai', text: "That's interesting! Could you tell me more about that?" }
      ]);
      setUserInput("");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSend = () => {
    if (userInput.trim() && !isFinished) {
      if (isListening) toggleListening();
      getFeedbackAndResponse(userInput);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      <header className="p-4 bg-white border-b border-slate-200 flex items-center justify-between sticky top-0 z-10">
        <button onClick={onBack} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
          <ChevronRight size={24} className="rotate-180" />
        </button>
        <div className="text-center flex-1 px-4">
          <AnimatePresence mode="wait">
            {isProcessing && messages.length <= 1 ? (
              <motion.div
                key="loading-topic"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center gap-2"
              >
                <RefreshCw size={12} className="animate-spin text-brand-500" />
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold animate-pulse">Generating...</span>
              </motion.div>
            ) : (
              <motion.div
                key={subTopic}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
              >
                <h2 className="font-bold text-xs text-slate-400 uppercase tracking-widest mb-0.5">Scenario Practice</h2>
                <p className="text-[10px] text-slate-400 font-medium">Level {userLevel} • {formatTime(timeLeft)} left</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setRefreshKey(prev => prev + 1)}
            disabled={isProcessing || messages.length > 1}
            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all disabled:opacity-0"
            title="Regenerate Topic"
          >
            <RefreshCw size={20} className={isProcessing ? 'animate-spin' : ''} />
          </button>
          <div className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center text-xs font-bold transition-colors ${timeLeft < 60 ? 'border-red-500 text-red-500 animate-pulse' : 'border-indigo-100 text-indigo-600 bg-indigo-50'}`}>
            {Math.ceil(timeLeft / 60)}m
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        <AnimatePresence mode="wait">
          {isProcessing && messages.length === 0 ? (
            <motion.div 
              key="loading-briefing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-2xl mx-auto mb-8"
            >
              <div className="bg-white border border-slate-100 rounded-[2.5rem] p-12 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center">
                  <RefreshCw size={32} className="animate-spin text-brand-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Curating your scenario...</h3>
                  <p className="text-slate-400 text-sm">Preparing a custom mission for your level.</p>
                </div>
              </div>
            </motion.div>
          ) : subTopic && !hasStarted ? (
            <motion.div 
              key={subTopic}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-2xl mx-auto mb-8"
            >
              <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm overflow-hidden relative">
                <div className="absolute top-0 right-0 p-12 opacity-[0.03] -rotate-12">
                  <MessageSquare size={160} />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2 text-brand-600 font-bold text-[10px] uppercase tracking-[0.2em]">
                      <BookOpen size={14} /> Mission Briefing
                    </div>
                    <button 
                      onClick={() => setRefreshKey(prev => prev + 1)}
                      disabled={isProcessing}
                      className="flex items-center gap-2 text-[10px] font-bold text-slate-400 hover:text-brand-600 transition-colors uppercase tracking-widest disabled:opacity-50"
                    >
                      <RefreshCw size={12} className={isProcessing ? 'animate-spin' : ''} /> New Topic
                    </button>
                  </div>
                  
                  <h3 className="text-3xl font-display font-black text-slate-900 mb-4 leading-tight">{subTopic}</h3>
                  <p className="text-slate-500 text-lg leading-relaxed max-w-xl mb-8">{context}</p>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-4 mb-8">
                    <button 
                      onClick={handleStart}
                      className="w-full sm:w-auto bg-brand-600 text-white px-10 py-4 rounded-2xl font-bold shadow-lg shadow-brand-100 hover:bg-brand-700 transition-all flex items-center justify-center gap-2 group"
                    >
                      Start Practice
                      <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">AI Tutor Active</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">IELTS {userLevel} Focus</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-100">
                    <p className="text-[10px] text-slate-400 font-medium italic">
                      Tip: Take a moment to think about what you want to say before starting.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : subTopic && hasStarted ? (
            <motion.div 
              key="active-briefing"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl mx-auto mb-8"
            >
              <div className="bg-white/50 border border-slate-100 rounded-3xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center text-brand-600">
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{subTopic}</h4>
                    <p className="text-[10px] text-slate-400 font-medium truncate max-w-[200px]">{context}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                    Level {userLevel}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {messages.map((m, i) => (
          <div key={i} className="space-y-3">
            <div className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${m.role === 'user' ? 'bg-brand-600 text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'}`}>
                <p className="leading-relaxed">{m.text}</p>
              </div>
            </div>
            
            {m.feedback && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 bg-amber-50/50 border border-amber-100 rounded-2xl max-w-[90%] ml-auto shadow-sm"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-amber-700 font-bold text-[10px] uppercase tracking-wider">
                    <Award size={14} /> IELTS Feedback
                  </div>
                  <div className="bg-amber-200 text-amber-900 px-2 py-0.5 rounded text-[10px] font-black">
                    {m.feedback.score}
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-[9px] text-emerald-600 uppercase font-black mb-1 tracking-tighter">Fluent Version</p>
                    <p className="text-slate-900 font-medium text-sm italic">"{m.feedback.improved}"</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-indigo-600 uppercase font-black mb-1 tracking-tighter">Analysis</p>
                    <p className="text-slate-600 text-xs leading-relaxed">{m.feedback.explanation}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        ))}
        
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-3">
              <div className="flex gap-1">
                <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
                <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
                <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
              </div>
              <span className="text-xs text-slate-400 font-medium">
                {messages.length === 0 ? "Preparing scenario..." : "Analyzing speech..."}
              </span>
            </div>
          </div>
        )}

        {isFinished && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 bg-indigo-900 text-white rounded-[2rem] text-center space-y-6"
          >
            <div className="w-16 h-16 bg-indigo-800 rounded-2xl flex items-center justify-center mx-auto">
              <Award size={32} />
            </div>
            <h3 className="text-2xl font-bold">Session Complete!</h3>
            <p className="text-indigo-200">You've reached the 5-minute limit. Great job practicing today!</p>
            <button 
              onClick={onBack}
              className="bg-white text-indigo-900 px-8 py-3 rounded-xl font-bold hover:bg-indigo-50 transition-colors"
            >
              Back to Scenarios
            </button>
          </motion.div>
        )}
      </div>

      <footer className={`p-4 md:p-6 border-t border-slate-200 bg-white sticky bottom-0 transition-all duration-500 ${hasStarted ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'}`}>
        <div className="flex gap-3 items-center max-w-4xl mx-auto">
          <div className="flex-1 relative">
            <input 
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={isFinished ? "Session ended" : isListening ? "Listening..." : "Type or use mic..."}
              className={`w-full p-4 bg-slate-50 border rounded-2xl focus:outline-none transition-all text-sm ${isListening ? 'border-red-500 ring-4 ring-red-50' : 'border-slate-200 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-50'}`}
              disabled={isProcessing || isFinished}
            />
            {isListening && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-1">
                {[1, 2, 3].map(i => (
                  <motion.div
                    key={i}
                    animate={{ height: [4, 12, 4] }}
                    transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }}
                    className="w-0.5 bg-red-500 rounded-full"
                  />
                ))}
              </div>
            )}
          </div>
          
          <button 
            onClick={toggleListening}
            disabled={isProcessing || isFinished}
            className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center transition-all shadow-lg ${isListening ? 'bg-red-500 shadow-red-100 scale-110' : 'bg-brand-600 hover:bg-brand-700 shadow-brand-100'} ${isFinished ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isListening ? <MicOff size={20} className="text-white" /> : <Mic size={20} className="text-white" />}
          </button>
          
          <button 
            onClick={handleSend}
            disabled={isProcessing || !userInput.trim() || isFinished}
            className="w-12 h-12 md:w-14 md:h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center hover:bg-slate-800 disabled:bg-slate-200 transition-all shadow-lg shadow-slate-100"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </footer>
    </div>
  );
}

function DailyPractice({ userLevel, onBack, onComplete }: { userLevel: ProficiencyLevel, onBack: () => void, onComplete: () => void, key?: string }) {
  const [step, setStep] = useState<'setup' | 'practice' | 'feedback'>('setup');
  const [topic, setTopic] = useState("");
  const [tips, setTips] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [timeLeft, setTimeLeft] = useState(90); // 1.5 minutes
  const [timerActive, setTimerActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [feedback, setFeedback] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const generatePractice = async () => {
    setIsProcessing(true);
    setRefreshKey(prev => prev + 1);
    try {
      const prompt = `Generate a random impromptu speech topic and 3 extremely short, clean, actionable tips (max 10 words each).
      
      Return ONLY a JSON object:
      {
        "topic": "A specific, interesting topic",
        "tips": ["Short tip 1", "Short tip 2", "Short tip 3"]
      }`;

      const response = await callAI({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      const data = JSON.parse(response.text || "{}");
      setTopic(data.topic || "General Topic");
      setTips(data.tips || ["Focus on clarity", "Structure your points", "Keep a steady pace"]);
      setStep('practice');
    } catch (error) {
      console.error("Daily Practice Gen Error:", error);
      const fallback = FALLBACK_TOPICS[Math.floor(Math.random() * FALLBACK_TOPICS.length)];
      setTopic(fallback.topic);
      setTips(fallback.tips);
      setStep('practice');
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (step === 'practice' && timeLeft > 0 && timerActive) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && step === 'practice') {
      handleFinish();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [step, timeLeft, timerActive]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setUserInput(transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech Recognition Error:", event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    } else {
      console.warn("Speech Recognition not supported in this browser.");
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in your browser. Please try using Chrome, Edge, or Safari.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        setUserInput("");
        recognitionRef.current.start();
        setIsListening(true);
        setTimerActive(true);
      } catch (err) {
        console.error("Failed to start speech recognition:", err);
        setIsListening(false);
      }
    }
  };

  const handleFinish = async () => {
    if (isListening) recognitionRef.current?.stop();
    setTimerActive(false);
    setIsProcessing(true);
    setStep('feedback');
    onComplete();
    
    try {
      const prompt = `Analyze this impromptu speech on the topic "${topic}".
      User speech: "${userInput}"
      
      Provide IELTS-style feedback:
      - overall_score: estimate (e.g. 6.5)
      - fluency_tips: 2 tips for better flow
      - improved_version: a more polished version of their speech
      
      Return JSON:
      {
        "overall_score": "...",
        "fluency_tips": ["...", "..."],
        "improved_version": "..."
      }`;

      const response = await callAI({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      setFeedback(JSON.parse(response.text || "{}"));
    } catch (error) {
      console.error("Feedback Error:", error);
      setFeedback({
        overall_score: "6.0",
        fluency_tips: ["Try to use more transition words", "Focus on maintaining a steady pace"],
        improved_version: "Great effort! Keep practicing to improve your fluency and vocabulary."
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="p-4 border-b border-slate-100 flex items-center justify-between">
        <button onClick={onBack} className="text-slate-400 hover:text-slate-600">
          <ChevronRight size={24} className="rotate-180" />
        </button>
        <div className="text-center">
          <h2 className="font-bold text-sm">Daily Warm-up</h2>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest">Impromptu Speech</p>
        </div>
        <div className="w-6" />
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        {step === 'setup' && (
          <div className="max-w-md mx-auto pt-12 text-center space-y-8">
            <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto">
              <Volume2 size={40} />
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-2">Ready for your warm-up?</h3>
              <p className="text-slate-500">I'll give you a random topic and some new words to practice. You'll have 90 seconds to speak.</p>
            </div>
            <button 
              onClick={generatePractice}
              disabled={isProcessing}
              className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
            >
              {isProcessing ? "Generating..." : "Generate Topic"}
            </button>
          </div>
        )}

        {step === 'practice' && (
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
              <div className="w-10" />
              <div className="text-center space-y-1">
                <div className={`text-4xl font-display font-black ${timeLeft < 20 ? 'text-red-500 animate-pulse' : 'text-brand-600'}`}>
                  {formatTime(timeLeft)}
                </div>
                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Time Remaining</p>
              </div>
              <button 
                onClick={generatePractice}
                disabled={isProcessing || timerActive}
                className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all disabled:opacity-0"
                title="Regenerate Topic"
              >
                <RefreshCw size={20} className={isProcessing ? 'animate-spin' : ''} />
              </button>
            </div>

            <AnimatePresence mode="wait">
              {isProcessing ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-20 space-y-4"
                >
                  <RefreshCw size={40} className="text-brand-500 animate-spin" />
                  <p className="text-slate-400 font-display font-bold animate-pulse">Generating new topic...</p>
                </motion.div>
              ) : (
                <motion.div
                  key={refreshKey}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  <div className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-2 h-full bg-brand-500" />
                    <p className="text-[10px] text-brand-600 uppercase font-black mb-2 tracking-wider">Your Topic</p>
                    <h3 className="text-2xl font-display font-bold text-slate-900 leading-tight">{topic}</h3>
                  </div>

                  <div className="space-y-4">
                    <p className="text-[10px] text-slate-400 uppercase font-bold text-center">Speech Tips</p>
                    <div className="flex flex-wrap justify-center gap-3">
                      {tips.map((tip, i) => (
                        <div key={i} className="px-4 py-2 bg-white border border-slate-100 rounded-full shadow-sm text-xs font-medium text-slate-600">
                          {tip}
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="pt-8 text-center">
              {!timerActive && timeLeft === 90 ? (
                <button 
                  onClick={() => setTimerActive(true)}
                  className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
                >
                  Start Timer & Speak
                </button>
              ) : (
                <>
                  <button 
                    onClick={toggleListening}
                    className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto transition-all shadow-xl ${isListening ? 'bg-red-500 shadow-red-100 scale-110' : 'bg-indigo-600 shadow-indigo-100 hover:scale-105'}`}
                  >
                    {isListening ? <MicOff size={32} className="text-white" /> : <Mic size={32} className="text-white" />}
                  </button>
                  <p className="mt-4 text-sm font-medium text-slate-500">
                    {isListening ? "Listening... Speak now!" : "Tap to start speaking"}
                  </p>
                </>
              )}
            </div>

            {userInput && (
              <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <p className="text-[10px] text-slate-400 uppercase font-bold mb-2">Live Transcript</p>
                <p className="text-slate-600 italic">"{userInput}"</p>
              </div>
            )}

            <button 
              onClick={handleFinish}
              disabled={isProcessing}
              className="w-full py-4 text-slate-400 hover:text-indigo-600 font-bold text-xs uppercase tracking-widest transition-colors disabled:opacity-50"
            >
              Finish Early & Get Feedback
            </button>
          </div>
        )}

        {step === 'feedback' && (
          <div className="max-w-2xl mx-auto space-y-8 pb-12">
            {isProcessing ? (
              <div className="text-center py-20 space-y-4">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-slate-500 font-medium">Analyzing your speech...</p>
              </div>
            ) : feedback && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div className="p-8 bg-indigo-900 text-white rounded-[2.5rem] text-center relative overflow-hidden">
                  <div className="relative z-10">
                    <div className="w-16 h-16 bg-indigo-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Award size={32} />
                    </div>
                    <h3 className="text-3xl font-bold mb-1">Warm-up Complete!</h3>
                    <p className="text-indigo-200 text-sm">Estimated IELTS Speaking Score</p>
                    <div className="text-6xl font-black mt-4 text-white">
                      {feedback.overall_score}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100">
                    <p className="text-[10px] text-amber-600 uppercase font-bold mb-4">Fluency Tips</p>
                    <ul className="space-y-3">
                      {feedback.fluency_tips.map((tip: string, i: number) => (
                        <li key={i} className="text-sm text-slate-700 flex gap-2">
                          <span className="text-amber-500 font-bold">•</span> {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="p-8 bg-white border border-slate-100 rounded-[2rem] shadow-sm">
                  <p className="text-[10px] text-indigo-600 uppercase font-bold mb-4">Polished Version</p>
                  <p className="text-slate-700 leading-relaxed italic">"{feedback.improved_version}"</p>
                </div>

                <button 
                  onClick={onBack}
                  className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all"
                >
                  Back to Scenarios
                </button>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
function SettingsView({ profile, onBack, onReset, onLogout, user }: { profile: UserProfile, onBack: () => void, onReset: () => void, onLogout: () => void, user: User | null, key?: string }) {
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [diagStatus, setDiagStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [diagMessage, setDiagMessage] = useState("");
  const [diagDetails, setDiagDetails] = useState<any>(null);

  const runDiagnostics = async () => {
    setDiagStatus('testing');
    setDiagMessage("Initializing test...");
    setDiagDetails(null);

    try {
      const response = await fetch('/api/diagnostics');
      const data = await response.json();

      if (data.status === 'success') {
        setDiagStatus('success');
        setDiagMessage(data.message);
      } else {
        setDiagStatus('error');
        setDiagMessage(data.message);
        setDiagDetails(data.details);
      }
    } catch (error: any) {
      console.error("Diagnostic Error:", error);
      setDiagStatus('error');
      setDiagMessage("Connection Failed");
      setDiagDetails(error.message || "An unknown error occurred while connecting to the proxy server.");
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-2xl mx-auto pt-12 pb-24 px-6"
    >
      <header className="mb-12 flex items-center justify-between">
        <div>
          <h1 className="text-5xl font-display font-black tracking-tighter text-slate-900">Settings</h1>
          <p className="text-slate-500 mt-2 text-lg">Manage your account and preferences.</p>
        </div>
        <button onClick={onBack} className="p-3 hover:bg-slate-100 rounded-2xl transition-all">
          <ChevronRight size={24} className="rotate-180 text-slate-400" />
        </button>
      </header>

      <div className="space-y-6">
        <div className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm">
          <h3 className="text-lg font-display font-bold mb-6 text-slate-900">Account</h3>
          {user ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4 mb-6">
                {user.photoURL && (
                  <img src={user.photoURL} alt={user.displayName || ""} className="w-12 h-12 rounded-full border-2 border-indigo-100" />
                )}
                <div>
                  <p className="font-bold text-slate-900">{user.displayName}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </div>
              </div>
              <button 
                onClick={onLogout}
                className="w-full py-4 bg-white text-slate-900 border-2 border-slate-100 rounded-2xl font-bold hover:bg-slate-50 transition-all"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <p className="text-slate-500 text-sm italic">Not signed in. Your data is stored locally.</p>
          )}
        </div>

        <div className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm">
          <h3 className="text-lg font-display font-bold mb-6 text-slate-900">Profile Information</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-slate-50">
              <span className="text-slate-500 text-sm font-medium">Current Level</span>
              <span className="font-black text-brand-600 uppercase tracking-widest text-xs bg-brand-50 px-3 py-1 rounded-full">{profile.level || 'Not Set'}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-slate-50">
              <span className="text-slate-500 text-sm font-medium">Sessions Completed</span>
              <span className="font-display font-bold text-slate-900">{profile.sessionsCompleted}</span>
            </div>
          </div>
        </div>

        <div className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-display font-bold text-slate-900">API Diagnostics</h3>
            <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
              diagStatus === 'success' ? 'bg-emerald-50 text-emerald-600' :
              diagStatus === 'error' ? 'bg-red-50 text-red-600' :
              diagStatus === 'testing' ? 'bg-indigo-50 text-indigo-600 animate-pulse' :
              'bg-slate-50 text-slate-400'
            }`}>
              {diagStatus === 'idle' ? 'Ready' : diagStatus}
            </div>
          </div>
          
          <p className="text-slate-500 text-sm mb-6 leading-relaxed">
            Use this tool to verify if your Gemini API connection is working correctly in your current environment.
          </p>

          {diagStatus !== 'idle' && (
            <div className={`mb-6 p-4 rounded-2xl border ${
              diagStatus === 'success' ? 'bg-emerald-50/50 border-emerald-100' :
              diagStatus === 'error' ? 'bg-red-50/50 border-red-100' :
              'bg-slate-50 border-slate-100'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 ${
                  diagStatus === 'success' ? 'text-emerald-600' :
                  diagStatus === 'error' ? 'text-red-600' :
                  'text-indigo-600'
                }`}>
                  {diagStatus === 'testing' ? <RefreshCw size={16} className="animate-spin" /> : 
                   diagStatus === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                </div>
                <div>
                  <p className={`text-sm font-bold ${
                    diagStatus === 'success' ? 'text-emerald-900' :
                    diagStatus === 'error' ? 'text-red-900' :
                    'text-slate-900'
                  }`}>{diagMessage}</p>
                  {diagDetails && (
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{diagDetails}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          <button 
            onClick={runDiagnostics}
            disabled={diagStatus === 'testing'}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Activity size={18} /> Run Connection Test
          </button>
        </div>

        <div className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm">
          <h3 className="text-lg font-display font-bold mb-4 text-red-600">Danger Zone</h3>
          <p className="text-slate-500 text-sm mb-8 leading-relaxed">Resetting your profile will delete all your progress and stats. This cannot be undone.</p>
          
          {showConfirmReset ? (
            <div className="space-y-4">
              <p className="text-sm font-bold text-slate-900 text-center">Are you absolutely sure?</p>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setShowConfirmReset(false)}
                  className="py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={onReset}
                  className="py-4 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-100"
                >
                  Yes, Reset
                </button>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => setShowConfirmReset(true)}
              className="w-full py-4 bg-red-50 text-red-600 rounded-2xl font-bold hover:bg-red-100 transition-all flex items-center justify-center gap-2"
            >
              <History size={18} /> Reset Profile & Retake Test
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function DailyVocab({ userLevel, onBack, onComplete }: { userLevel: ProficiencyLevel, onBack: () => void, onComplete: () => void, key?: string }) {
  const [step, setStep] = useState<'setup' | 'practice' | 'feedback'>('setup');
  const [vocab, setVocab] = useState<{ word: string, meaning: string, example: string }[]>([]);
  const [challenge, setChallenge] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [timeLeft, setTimeLeft] = useState(90); // 1.5 minutes
  const [timerActive, setTimerActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [feedback, setFeedback] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const generateVocab = async () => {
    setIsProcessing(true);
    setRefreshKey(prev => prev + 1);
    try {
      const prompt = `Generate 3 NEW and DIFFERENT level-appropriate (Level ${userLevel}) vocabulary words and a short "Practice Challenge" prompt that encourages the user to use these words in a few sentences.
      
      Return ONLY a JSON object:
      {
        "vocab": [
          {"word": "word1", "meaning": "meaning1", "example": "example sentence 1"},
          {"word": "word2", "meaning": "meaning2", "example": "example sentence 2"},
          {"word": "word3", "meaning": "meaning3", "example": "example sentence 3"}
        ],
        "challenge": "A short prompt like 'Describe your favorite travel memory using these words.'"
      }`;

      const response = await callAI({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      const data = JSON.parse(response.text || "{}");
      setVocab(data.vocab || []);
      setChallenge(data.challenge || "Practice using these words in a few sentences.");
      setStep('practice');
    } catch (error) {
      console.error("Vocab Gen Error:", error);
      const fallback = FALLBACK_VOCAB[Math.floor(Math.random() * FALLBACK_VOCAB.length)];
      setVocab(fallback.vocab);
      setChallenge(fallback.challenge);
      setStep('practice');
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (step === 'practice' && timeLeft > 0 && timerActive) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && step === 'practice') {
      handleFinish();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [step, timeLeft, timerActive]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setUserInput(transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech Recognition Error:", event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    } else {
      console.warn("Speech Recognition not supported in this browser.");
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in your browser. Please try using Chrome, Edge, or Safari.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        setUserInput("");
        recognitionRef.current.start();
        setIsListening(true);
        setTimerActive(true);
      } catch (err) {
        console.error("Failed to start speech recognition:", err);
        setIsListening(false);
      }
    }
  };

  const handleFinish = async () => {
    if (isListening) recognitionRef.current?.stop();
    setTimerActive(false);
    setIsProcessing(true);
    setStep('feedback');
    onComplete();
    
    try {
      const prompt = `Analyze these sentences using the target vocabulary.
      Words: ${vocab.map(v => v.word).join(", ")}
      User Input: "${userInput}"
      
      Provide feedback:
      - usage_score: 1-10 on how correctly they used the words
      - corrections: any grammar or usage fixes
      - natural_alternative: a more natural way to say it
      
      Return JSON:
      {
        "usage_score": 8,
        "corrections": "...",
        "natural_alternative": "..."
      }`;

      const response = await callAI({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      setFeedback(JSON.parse(response.text || "{}"));
    } catch (error) {
      console.error("Vocab Feedback Error:", error);
      setFeedback({
        usage_score: 7,
        corrections: "Good attempt at using the new vocabulary!",
        natural_alternative: "Keep practicing to integrate these words more naturally into your speech."
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="p-4 border-b border-slate-100 flex items-center justify-between">
        <button onClick={onBack} className="text-slate-400 hover:text-slate-600">
          <ChevronRight size={24} className="rotate-180" />
        </button>
        <div className="text-center">
          <h2 className="font-bold text-sm">Word Builder</h2>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest">Daily Vocabulary</p>
        </div>
        <div className="w-6" />
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        {step === 'setup' && (
          <div className="max-w-md mx-auto pt-12 text-center space-y-8">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto">
              <BookOpen size={40} />
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-2">Build your vocabulary</h3>
              <p className="text-slate-500">I'll give you 3 new words and a challenge. Use them in sentences to master them.</p>
            </div>
            <button 
              onClick={generateVocab}
              disabled={isProcessing}
              className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
            >
              {isProcessing ? "Generating..." : "Start Practice"}
            </button>
          </div>
        )}

        {step === 'practice' && (
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
              <div className="w-10" />
              <div className="text-center space-y-1">
                <div className={`text-4xl font-display font-black ${timeLeft < 20 ? 'text-red-500 animate-pulse' : 'text-emerald-600'}`}>
                  {formatTime(timeLeft)}
                </div>
                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Time Remaining</p>
              </div>
              <button 
                onClick={generateVocab}
                disabled={isProcessing || timerActive}
                className="p-3 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-2xl transition-all disabled:opacity-0"
                title="Regenerate Words"
              >
                <RefreshCw size={20} className={isProcessing ? 'animate-spin' : ''} />
              </button>
            </div>

            <AnimatePresence mode="wait">
              {isProcessing ? (
                <motion.div
                  key="loading-vocab"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-20 space-y-4"
                >
                  <RefreshCw size={40} className="text-emerald-500 animate-spin" />
                  <p className="text-slate-400 font-display font-bold animate-pulse">Curating new words...</p>
                </motion.div>
              ) : (
                <motion.div
                  key={refreshKey}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  className="space-y-8"
                >
                  <div className="p-8 bg-emerald-900 text-white rounded-[2.5rem] relative overflow-hidden shadow-xl shadow-emerald-100">
                    <div className="relative z-10">
                      <p className="text-[10px] text-emerald-300 uppercase font-bold mb-2 tracking-widest">The Challenge</p>
                      <h4 className="text-xl font-display font-bold leading-tight">{challenge}</h4>
                    </div>
                    <div className="absolute right-[-20px] bottom-[-20px] opacity-10">
                      <BookOpen size={160} />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-[10px] text-slate-400 uppercase font-black text-center tracking-widest">Target Words</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {vocab.map((v, i) => (
                        <motion.div 
                          key={v.word}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="p-5 bg-white border border-slate-100 rounded-3xl shadow-sm"
                        >
                          <p className="font-display font-bold text-emerald-600 text-sm mb-1">{v.word}</p>
                          <p className="text-[10px] text-slate-500 leading-relaxed">{v.meaning}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="pt-8 text-center">
              {!timerActive && timeLeft === 90 ? (
                <button 
                  onClick={() => setTimerActive(true)}
                  className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all"
                >
                  Start Timer & Speak
                </button>
              ) : (
                <>
                  <button 
                    onClick={toggleListening}
                    className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto transition-all shadow-xl ${isListening ? 'bg-red-500 shadow-red-100 scale-110' : 'bg-emerald-600 shadow-emerald-100 hover:scale-105'}`}
                  >
                    {isListening ? <MicOff size={32} className="text-white" /> : <Mic size={32} className="text-white" />}
                  </button>
                  <p className="mt-4 text-sm font-medium text-slate-500">
                    {isListening ? "Listening... Speak now!" : "Tap to start speaking"}
                  </p>
                </>
              )}
            </div>

            {userInput && (
              <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <p className="text-[10px] text-slate-400 uppercase font-bold mb-2">Live Transcript</p>
                <p className="text-slate-600 italic">"{userInput}"</p>
              </div>
            )}

            <button 
              onClick={handleFinish}
              disabled={isProcessing}
              className="w-full py-4 text-slate-400 hover:text-emerald-600 font-bold text-xs uppercase tracking-widest transition-colors disabled:opacity-50"
            >
              Finish Early & Get Feedback
            </button>
          </div>
        )}

        {step === 'feedback' && (
          <div className="max-w-2xl mx-auto space-y-8 pb-12">
            {isProcessing ? (
              <div className="text-center py-20 space-y-4">
                <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-slate-500 font-medium">Analyzing your usage...</p>
              </div>
            ) : feedback && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div className="p-8 bg-emerald-900 text-white rounded-[2.5rem] text-center relative overflow-hidden">
                  <div className="relative z-10">
                    <div className="w-16 h-16 bg-emerald-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Award size={32} />
                    </div>
                    <h3 className="text-3xl font-bold mb-1">Practice Complete!</h3>
                    <p className="text-emerald-200 text-sm">Usage & Accuracy Score</p>
                    <div className="text-6xl font-black mt-4 text-white">
                      {feedback.usage_score}/10
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100">
                    <p className="text-[10px] text-emerald-600 uppercase font-bold mb-4">Corrections</p>
                    <p className="text-slate-700 text-sm leading-relaxed">{feedback.corrections}</p>
                  </div>
                </div>

                <div className="p-8 bg-white border border-slate-100 rounded-[2rem] shadow-sm">
                  <p className="text-[10px] text-indigo-600 uppercase font-bold mb-4">Natural Alternative</p>
                  <p className="text-slate-700 leading-relaxed italic">"{feedback.natural_alternative}"</p>
                </div>

                <button 
                  onClick={onBack}
                  className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all"
                >
                  Back to Scenarios
                </button>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Dashboard({ profile, onReset }: { profile: UserProfile, onReset: () => void, key?: string }) {
  const stats = [
    { label: 'Sessions', value: profile.sessionsCompleted, icon: <History className="text-brand-500" />, sub: 'Total completed' },
    { label: 'Latency', value: `${profile.averageLatency.toFixed(1)}s`, icon: <TrendingUp className="text-emerald-500" />, sub: 'Avg. response time' },
    { label: 'Fillers', value: `${profile.fillerWordFrequency.toFixed(1)}%`, icon: <MessageSquare className="text-amber-500" />, sub: 'Filler word rate' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="max-w-5xl mx-auto pt-12 pb-24 px-6"
    >
      <header className="mb-12">
        <h1 className="text-5xl font-display font-black tracking-tighter text-slate-900">Your Progress</h1>
        <p className="text-slate-500 mt-2 text-lg">Track your journey to English mastery.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {stats.map((s, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-6">
              {s.icon}
            </div>
            <div className="text-4xl font-display font-black text-slate-900 mb-1">{s.value}</div>
            <div className="text-sm font-bold text-slate-800">{s.label}</div>
            <p className="text-xs text-slate-400 mt-1">{s.sub}</p>
          </motion.div>
        ))}
      </div>

      <div className="p-10 bg-slate-900 rounded-[3rem] text-white relative overflow-hidden mb-12">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-center md:text-left">
            <h3 className="text-3xl font-display font-bold mb-2">Ready for more?</h3>
            <p className="text-slate-400 max-w-sm">Consistency is the key to fluency. Complete one more session today to keep your streak alive.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-4xl font-display font-black text-brand-400">7</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Day Streak</div>
            </div>
            <div className="w-px h-12 bg-slate-800" />
            <div className="text-center">
              <div className="text-4xl font-display font-black text-emerald-400">12</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Hours Practiced</div>
            </div>
          </div>
        </div>
        <div className="absolute right-[-40px] top-[-40px] w-64 h-64 bg-brand-500/10 rounded-full blur-3xl" />
      </div>

      <div className="flex justify-center pb-12">
        <button 
          onClick={onReset}
          className="flex items-center gap-2 text-slate-400 hover:text-brand-600 font-black text-[10px] uppercase tracking-widest transition-colors"
        >
          <Settings size={16} /> Account Settings
        </button>
      </div>
    </motion.div>
  );
}
