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
  Volume2
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

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
  const [userProfile, setUserProfile] = useState<UserProfile>({
    level: null,
    sessionsCompleted: 0,
    averageLatency: 0,
    fillerWordFrequency: 0
  });

  // Check if user has already onboarded (mock for now)
  useEffect(() => {
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      setUserProfile(JSON.parse(savedProfile));
      setAppState('scenarios');
    }
  }, []);

  const handleOnboardingComplete = (level: ProficiencyLevel) => {
    const newProfile = { ...userProfile, level };
    setUserProfile(newProfile);
    localStorage.setItem('userProfile', JSON.stringify(newProfile));
    setAppState('scenarios');
  };

  const handleSessionComplete = () => {
    setUserProfile(prev => {
      const newProfile = { 
        ...prev, 
        sessionsCompleted: prev.sessionsCompleted + 1,
        // Mocking some improvements for the MVP
        averageLatency: Math.max(1.5, prev.averageLatency > 0 ? prev.averageLatency * 0.95 : 2.8),
        fillerWordFrequency: Math.max(1.2, prev.fillerWordFrequency > 0 ? prev.fillerWordFrequency * 0.9 : 5.4)
      };
      localStorage.setItem('userProfile', JSON.stringify(newProfile));
      return newProfile;
    });
  };

  const handleResetProfile = () => {
    localStorage.removeItem('userProfile');
    setUserProfile({
      level: null,
      sessionsCompleted: 0,
      averageLatency: 0,
      fillerWordFrequency: 0
    });
    setAppState('onboarding');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100">
      {/* Navigation Bar */}
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

      {/* Main Content Area */}
      <main className="pb-24 md:pb-0 md:pl-20 min-h-screen">
        <AnimatePresence mode="wait">
          {appState === 'onboarding' && (
            <Onboarding key="onboarding" onComplete={handleOnboardingComplete} />
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

function Onboarding({ onComplete }: { onComplete: (level: ProficiencyLevel) => void, key?: string }) {
  const [step, setStep] = useState<'welcome' | 'testing' | 'result'>('welcome');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<string[]>([]);
  const [userInput, setUserInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [detectedLevel, setDetectedLevel] = useState<ProficiencyLevel>(null);
  const recognitionRef = useRef<any>(null);

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

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

        const response = await ai.models.generateContent({
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
      className="max-w-2xl mx-auto pt-20 px-6 text-center"
    >
      <AnimatePresence mode="wait">
        {step === 'welcome' && (
          <motion.div key="welcome" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-8">
              <Mic size={32} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight mb-4">IELTS Speaking Assessment</h1>
            <p className="text-slate-600 text-lg mb-12">Test your level with a quick 3-question speaking check using IELTS criteria.</p>
            <button 
              onClick={() => setStep('testing')}
              className="bg-indigo-600 text-white px-8 py-4 rounded-xl font-semibold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center gap-2 mx-auto"
            >
              Start Speaking Test <ChevronRight size={20} />
            </button>
          </motion.div>
        )}

        {step === 'testing' && (
          <motion.div key="testing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
            <div className="flex justify-center gap-2 mb-4">
              {questions.map((_, i) => (
                <div key={i} className={`h-1.5 w-12 rounded-full transition-colors ${i <= currentQuestionIndex ? 'bg-indigo-600' : 'bg-slate-200'}`} />
              ))}
            </div>
            <h2 className="text-2xl font-bold text-slate-800">{questions[currentQuestionIndex]}</h2>
            
            <div className="relative group">
              <div className={`w-full p-8 bg-white border-2 rounded-3xl min-h-[200px] flex flex-col items-center justify-center transition-all ${isListening ? 'border-red-500 shadow-lg shadow-red-50' : 'border-slate-200'}`}>
                {userInput ? (
                  <p className="text-lg text-slate-700 text-left w-full leading-relaxed">{userInput}</p>
                ) : (
                  <p className="text-slate-400 italic">Click the mic and start speaking...</p>
                )}
                
                {isListening && (
                  <div className="absolute bottom-4 flex gap-1">
                    {[1, 2, 3].map(i => (
                      <motion.div
                        key={i}
                        animate={{ height: [8, 20, 8] }}
                        transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }}
                        className="w-1 bg-red-500 rounded-full"
                      />
                    ))}
                  </div>
                )}
              </div>
              
              <button 
                onClick={toggleListening}
                className={`absolute -bottom-6 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full flex items-center justify-center shadow-xl transition-all ${isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}
              >
                {isListening ? <MicOff className="text-white" /> : <Mic className="text-white" />}
              </button>
            </div>

            <div className="pt-8">
              <button 
                onClick={handleNext}
                disabled={isProcessing || !userInput.trim()}
                className="bg-indigo-600 text-white px-8 py-4 rounded-xl font-semibold shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:bg-slate-300 transition-all flex items-center gap-2 mx-auto"
              >
                {isProcessing ? "Analyzing..." : currentQuestionIndex === questions.length - 1 ? "Finish Check" : "Next Question"} <ChevronRight size={20} />
              </button>
            </div>
          </motion.div>
        )}

        {step === 'result' && (
          <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8">
              <Award size={40} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight mb-4">Test Complete!</h1>
            <p className="text-slate-600 text-lg mb-2">Your IELTS-based Level:</p>
            <div className="text-5xl font-black text-indigo-600 mb-8">{detectedLevel}</div>
            <p className="text-slate-500 mb-12 max-w-md mx-auto">
              Based on IELTS Speaking Assessment Criteria, you are currently at the {detectedLevel} tier.
            </p>
            <button 
              onClick={() => onComplete(detectedLevel)}
              className="bg-indigo-600 text-white px-12 py-4 rounded-xl font-semibold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all mx-auto"
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
      className="max-w-5xl mx-auto pt-12 px-6"
    >
      <header className="mb-12">
        <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm uppercase tracking-widest mb-2">
          <TrendingUp size={16} /> Level {userLevel}
        </div>
        <h1 className="text-4xl font-bold tracking-tight">Choose a Scenario</h1>
        <p className="text-slate-500 mt-2">Practice real-life situations designed for your level.</p>
      </header>

      {/* Daily Practice Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onDailyPractice}
          className="p-8 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[2rem] text-white text-left relative overflow-hidden group shadow-xl shadow-indigo-100"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-indigo-200 font-bold text-[10px] uppercase tracking-widest mb-4">
              <Mic size={14} /> Warm-up
            </div>
            <h2 className="text-2xl font-bold mb-2">Impromptu Speech</h2>
            <p className="text-indigo-100/70 text-sm">Master thinking on your feet with 1-minute random topics.</p>
            <div className="mt-6 flex items-center gap-2 font-bold text-xs group-hover:gap-4 transition-all">
              Start <ChevronRight size={14} />
            </div>
          </div>
          <div className="absolute right-[-10px] bottom-[-10px] opacity-10 group-hover:opacity-20 transition-opacity">
            <Mic size={120} />
          </div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onDailyVocab}
          className="p-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[2rem] text-white text-left relative overflow-hidden group shadow-xl shadow-emerald-100"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-emerald-100 font-bold text-[10px] uppercase tracking-widest mb-4">
              <BookOpen size={14} /> Vocabulary
            </div>
            <h2 className="text-2xl font-bold mb-2">Word Builder</h2>
            <p className="text-emerald-50/70 text-sm">Learn 5 new words daily tailored to your level.</p>
            <div className="mt-6 flex items-center gap-2 font-bold text-xs group-hover:gap-4 transition-all">
              Start <ChevronRight size={14} />
            </div>
          </div>
          <div className="absolute right-[-10px] bottom-[-10px] opacity-10 group-hover:opacity-20 transition-opacity">
            <BookOpen size={120} />
          </div>
        </motion.button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {scenarios.map((s) => (
          <button 
            key={s.id}
            onClick={() => onSelect(s.id)}
            className="group p-6 bg-white border border-slate-200 rounded-3xl text-left hover:border-indigo-600 hover:shadow-xl hover:shadow-indigo-50 transition-all"
          >
            <div className="w-12 h-12 bg-slate-50 text-slate-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
              {s.icon}
            </div>
            <h3 className="text-xl font-bold mb-2">{s.title}</h3>
            <p className="text-slate-500 text-sm leading-relaxed">{s.description}</p>
            <div className="mt-6 flex items-center text-indigo-600 font-bold text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
              Start Practice <ChevronRight size={14} />
            </div>
          </button>
        ))}
      </div>

      <div className="flex justify-center pb-12">
        <button 
          onClick={onSettings}
          className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold text-xs uppercase tracking-widest transition-colors"
        >
          <Settings size={16} /> Account Settings
        </button>
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
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

  // Timer logic
  useEffect(() => {
    if (timeLeft > 0 && !isFinished) {
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
  }, [timeLeft, isFinished]);

  // Dynamic Topic Generation
  useEffect(() => {
    const initConversation = async () => {
      setIsProcessing(true);
      try {
        const model = "gemini-3-flash-preview";
        const prompt = `Generate a random, specific sub-topic and a creative opening line for an English speaking practice session.
        Scenario: ${scenarioId}
        Learner Level: ${userLevel}
        
        The opening line should be natural and put the user in the situation immediately.
        
        Return ONLY a JSON object:
        {
          "subTopic": "A specific focus (e.g. 'Discussing a bug in the login flow')",
          "openingLine": "The first thing the AI says to the user."
        }`;

        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: { responseMimeType: "application/json" }
        });

        const result = JSON.parse(response.text || "{}");
        setSubTopic(result.subTopic || "General Practice");
        setMessages([{ role: 'ai', text: result.openingLine || "Hello! Let's start our practice." }]);
      } catch (error) {
        console.error("Topic Gen Error:", error);
        setMessages([{ role: 'ai', text: "Hi! Let's start our practice session." }]);
      } finally {
        setIsProcessing(false);
      }
    };
    initConversation();
  }, [scenarioId, userLevel]);

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

  const getFeedbackAndResponse = async (text: string) => {
    if (isFinished) return;
    setIsProcessing(true);
    try {
      const model = "gemini-3-flash-preview";
      
      const history = messages.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n');
      
      const prompt = `
        You are an English tutor for an intermediate (Level ${userLevel}) learner.
        Scenario: ${scenarioId} (${subTopic})
        
        Conversation History:
        ${history}
        
        The user just spoke: "${text}"
        Time remaining in session: ${Math.floor(timeLeft / 60)}m ${timeLeft % 60}s
        
        Task 1: Provide "IELTS Speaking Feedback" based on:
        ${IELTS_CRITERIA}
        
        - improved: A natural, fluent version of what they said.
        - explanation: Why the change was made, focusing on IELTS criteria (max 2 sentences).
        - score_estimate: A rough IELTS score for this turn (e.g. 5.5).
        
        Task 2: Continue the conversation.
        - next_turn: A natural follow-up question or response. If time is low (under 1 min), start wrapping up.
        
        Return the response in JSON format:
        {
          "improved": "...",
          "explanation": "...",
          "score_estimate": "...",
          "next_turn": "..."
        }
      `;

      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      const result = JSON.parse(response.text || "{}");
      
      const feedback = {
        original: text,
        improved: result.improved,
        explanation: result.explanation,
        score: result.score_estimate
      };

      setMessages(prev => [
        ...prev, 
        { role: 'user', text, feedback },
        { role: 'ai', text: result.next_turn }
      ]);
      setUserInput("");
    } catch (error) {
      console.error("AI Error:", error);
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
    <div className="h-screen flex flex-col bg-white">
      <header className="p-4 border-b border-slate-100 flex items-center justify-between">
        <button onClick={onBack} className="text-slate-400 hover:text-slate-600">
          <ChevronRight size={24} className="rotate-180" />
        </button>
        <div className="text-center">
          <h2 className="font-bold text-sm">{subTopic || "Loading scenario..."}</h2>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest">Level {userLevel} • {formatTime(timeLeft)} left</p>
        </div>
        <div className={`w-10 h-10 rounded-full border-4 flex items-center justify-center text-[10px] font-bold ${timeLeft < 60 ? 'border-red-500 text-red-500 animate-pulse' : 'border-indigo-100 text-indigo-600'}`}>
          {Math.ceil(timeLeft / 60)}m
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {messages.map((m, i) => (
          <div key={i} className="space-y-4">
            <div className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-4 rounded-2xl ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-100 text-slate-800 rounded-tl-none'}`}>
                {m.text}
              </div>
            </div>
            
            {m.feedback && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-6 bg-amber-50 border border-amber-100 rounded-3xl max-w-[90%] ml-auto"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-amber-700 font-bold text-xs uppercase tracking-widest">
                    <Award size={14} /> IELTS Feedback
                  </div>
                  <div className="bg-amber-200 text-amber-900 px-2 py-1 rounded text-[10px] font-black">
                    SCORE: {m.feedback.score}
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] text-emerald-600 uppercase font-bold mb-1">Fluent Version</p>
                    <p className="text-slate-900 font-medium">"{m.feedback.improved}"</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-indigo-600 uppercase font-bold mb-1">Why it's different</p>
                    <p className="text-slate-600 text-sm">{m.feedback.explanation}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        ))}
        
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-slate-100 p-4 rounded-2xl rounded-tl-none animate-pulse text-slate-400">
              {messages.length === 0 ? "Preparing your scenario..." : "Analyzing speech..."}
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

      <footer className="p-6 border-t border-slate-100 bg-slate-50/50">
        <div className="flex gap-4 items-center">
          <div className="flex-1 relative">
            <input 
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={isFinished ? "Session ended" : isListening ? "Listening..." : "Tap mic to speak..."}
              className={`w-full p-4 bg-white border rounded-2xl focus:outline-none transition-all ${isListening ? 'border-red-500 ring-2 ring-red-50' : 'border-slate-200 focus:border-indigo-600'}`}
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
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-lg ${isListening ? 'bg-red-500 shadow-red-100' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100'} ${isFinished ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isListening ? <MicOff className="text-white" /> : <Mic className="text-white" />}
          </button>
          
          <button 
            onClick={handleSend}
            disabled={isProcessing || !userInput.trim() || isFinished}
            className="w-14 h-14 bg-slate-800 text-white rounded-2xl flex items-center justify-center hover:bg-slate-900 disabled:bg-slate-300 transition-all shadow-lg shadow-slate-100"
          >
            <ChevronRight size={24} />
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
  
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

  const generatePractice = async () => {
    setIsProcessing(true);
    try {
      const prompt = `Generate a random impromptu speech topic and 3 extremely short, clean, actionable tips (max 10 words each).
      
      Return ONLY a JSON object:
      {
        "topic": "A specific, interesting topic",
        "tips": ["Short tip 1", "Short tip 2", "Short tip 3"]
      }`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      const result = JSON.parse(response.text || "{}");
      setTopic(result.topic);
      setTips(result.tips);
      setStep('practice');
    } catch (error) {
      console.error("Daily Practice Gen Error:", error);
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

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      setFeedback(JSON.parse(response.text || "{}"));
    } catch (error) {
      console.error("Feedback Error:", error);
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
            <div className="text-center space-y-2">
              <div className={`text-4xl font-black ${timeLeft < 20 ? 'text-red-500 animate-pulse' : 'text-indigo-600'}`}>
                {formatTime(timeLeft)}
              </div>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Time Remaining</p>
            </div>

            <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100">
              <p className="text-[10px] text-indigo-600 uppercase font-bold mb-2">Your Topic</p>
              <h3 className="text-2xl font-bold text-slate-900 leading-tight">{topic}</h3>
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
function SettingsView({ profile, onBack, onReset }: { profile: UserProfile, onBack: () => void, onReset: () => void, key?: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-2xl mx-auto pt-12 px-6"
    >
      <header className="mb-12 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Settings</h1>
          <p className="text-slate-500 mt-2">Manage your account and preferences.</p>
        </div>
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ChevronRight size={24} className="rotate-180" />
        </button>
      </header>

      <div className="space-y-6">
        <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm">
          <h3 className="text-lg font-bold mb-4">Profile Information</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-slate-50">
              <span className="text-slate-500 text-sm">Current Level</span>
              <span className="font-bold text-indigo-600">{profile.level || 'Not Set'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-50">
              <span className="text-slate-500 text-sm">Sessions Completed</span>
              <span className="font-bold">{profile.sessionsCompleted}</span>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm">
          <h3 className="text-lg font-bold mb-4 text-red-600">Danger Zone</h3>
          <p className="text-slate-500 text-sm mb-6">Resetting your profile will delete all your progress and stats. This cannot be undone.</p>
          <button 
            onClick={() => {
              if (confirm("Are you sure you want to reset your profile? This will delete all your progress.")) {
                onReset();
              }
            }}
            className="w-full py-4 bg-red-50 text-red-600 rounded-2xl font-bold hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
          >
            <History size={18} /> Reset Profile & Retake Test
          </button>
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
  
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

  const generateVocab = async () => {
    setIsProcessing(true);
    try {
      const prompt = `Generate 3 level-appropriate (Level ${userLevel}) vocabulary words and a short "Practice Challenge" prompt that encourages the user to use these words in a few sentences.
      
      Return ONLY a JSON object:
      {
        "vocab": [
          {"word": "word1", "meaning": "meaning1", "example": "example sentence 1"},
          {"word": "word2", "meaning": "meaning2", "example": "example sentence 2"},
          {"word": "word3", "meaning": "meaning3", "example": "example sentence 3"}
        ],
        "challenge": "A short prompt like 'Describe your favorite travel memory using these words.'"
      }`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      const result = JSON.parse(response.text || "{}");
      setVocab(result.vocab);
      setChallenge(result.challenge);
      setStep('practice');
    } catch (error) {
      console.error("Vocab Gen Error:", error);
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

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      setFeedback(JSON.parse(response.text || "{}"));
    } catch (error) {
      console.error("Vocab Feedback Error:", error);
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
            <div className="text-center space-y-2">
              <div className={`text-4xl font-black ${timeLeft < 20 ? 'text-red-500 animate-pulse' : 'text-emerald-600'}`}>
                {formatTime(timeLeft)}
              </div>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Time Remaining</p>
            </div>

            <div className="p-8 bg-emerald-900 text-white rounded-[2.5rem] relative overflow-hidden shadow-xl shadow-emerald-100">
              <div className="relative z-10">
                <p className="text-[10px] text-emerald-300 uppercase font-bold mb-2 tracking-widest">The Challenge</p>
                <h4 className="text-xl font-bold leading-tight">{challenge}</h4>
              </div>
              <div className="absolute right-[-20px] bottom-[-20px] opacity-10">
                <BookOpen size={160} />
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-[10px] text-slate-400 uppercase font-bold text-center">Target Words</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {vocab.map((v, i) => (
                  <div key={i} className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                    <p className="font-bold text-emerald-600 text-sm">{v.word}</p>
                    <p className="text-[10px] text-slate-500 mt-1">{v.meaning}</p>
                  </div>
                ))}
              </div>
            </div>

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
    { label: 'Avg Latency', value: `${profile.averageLatency.toFixed(1)}s`, trend: 'Live', icon: <TrendingUp className="text-emerald-500" /> },
    { label: 'Filler Words', value: profile.fillerWordFrequency.toFixed(1), trend: 'Live', icon: <MessageSquare className="text-indigo-500" /> },
    { label: 'Sessions', value: profile.sessionsCompleted.toString(), trend: 'Total', icon: <BookOpen className="text-amber-500" /> },
    { label: 'Level', value: profile.level || 'N/A', trend: 'Current', icon: <Award className="text-purple-500" /> },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-5xl mx-auto pt-12 px-6"
    >
      <header className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight">Your Fluency</h1>
        <p className="text-slate-500 mt-2">Concrete evidence of your improvement over time.</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
        {stats.map((s, i) => (
          <div key={i} className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-slate-50 rounded-xl">{s.icon}</div>
              <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${s.trend.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : s.trend.startsWith('-') ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                {s.trend}
              </span>
            </div>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-sm mb-12">
        <h3 className="text-xl font-bold mb-6">Fluency Trend</h3>
        <div className="h-64 flex items-end gap-2">
          {[40, 45, 38, 52, 60, 58, 72].map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <motion.div 
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                className="w-full bg-indigo-500 rounded-t-lg opacity-80 hover:opacity-100 transition-opacity"
              />
              <span className="text-[10px] text-slate-400 font-bold">S{i+1}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center pb-12">
        <button 
          onClick={onReset}
          className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold text-xs uppercase tracking-widest transition-colors"
        >
          <Settings size={16} /> Account Settings
        </button>
      </div>
    </motion.div>
  );
}
