export const FALLBACK_SCENARIOS: Record<string, any> = {
  meeting: {
    subTopic: "Project Deadline Discussion",
    openingLine: "Hi there! Thanks for joining the meeting. We need to discuss the upcoming project deadline. How is your team progressing with the current tasks?"
  },
  interview: {
    subTopic: "Marketing Manager Role",
    openingLine: "Welcome to the interview. To start, could you please tell me about a time you had to manage a difficult project and what the outcome was?"
  },
  social: {
    subTopic: "Tech Conference Networking",
    openingLine: "Hi! I noticed you were at the keynote speech earlier. What did you think about the speaker's points on AI in education?"
  },
  travel: {
    subTopic: "Boutique Hotel Check-in",
    openingLine: "Good evening! Welcome to The Grandview. Do you have a reservation with us tonight, or are you looking for a room?"
  }
};

export const FALLBACK_TOPICS = [
  { topic: "The impact of social media on modern communication", tips: ["Structure: Intro, 2 points, Conclusion", "Use transition words like 'Furthermore'", "Give a personal example"] },
  { topic: "Your favorite childhood memory", tips: ["Use descriptive adjectives", "Focus on sensory details (sight, sound)", "Explain why it's important to you"] },
  { topic: "The benefits of learning a second language", tips: ["Mention cognitive benefits", "Talk about career opportunities", "Keep a steady pace"] },
  { topic: "How technology has changed the way we travel", tips: ["Compare past vs present", "Mention specific apps or tools", "Summarize your main point"] },
  { topic: "A skill you wish you had learned earlier in life", tips: ["Be specific about the skill", "Explain the impact it would have had", "End with what you plan to do now"] },
  { topic: "The pros and cons of working from home", tips: ["Balance both sides equally", "Use real examples", "Give your personal opinion at the end"] },
  { topic: "What makes a great leader?", tips: ["Name 2–3 clear qualities", "Use a famous example if you can", "Connect it to your own experience"] },
  { topic: "How cities can become more environmentally friendly", tips: ["Think transport, energy, and green space", "Use 'In addition' and 'However'", "Propose one concrete solution"] },
  { topic: "The role of failure in personal growth", tips: ["Start with a short story", "Explain the lesson learned", "Keep your tone positive"] },
  { topic: "Is social media doing more harm than good?", tips: ["Take a clear position", "Support with 2 examples", "Acknowledge the opposing view"] },
  { topic: "Describe your ideal day off", tips: ["Use vivid descriptive language", "Include people, places, activities", "Explain why it matters to you"] },
  { topic: "Should university education be free?", tips: ["Consider economic and social angles", "Use 'On the one hand / On the other hand'", "State your conclusion clearly"] },
  { topic: "A person who has influenced your life the most", tips: ["Describe them briefly first", "Give a specific moment or lesson", "Explain the lasting impact"] },
  { topic: "How has streaming changed the entertainment industry?", tips: ["Compare before and after", "Mention both creators and consumers", "Use data or examples if possible"] },
  { topic: "The importance of mental health in the workplace", tips: ["Define what mental health means at work", "Give a real-world consequence of ignoring it", "Suggest one practical solution"] },
  { topic: "Would you rather live in a big city or a small town?", tips: ["Commit to one side", "Use contrast: 'While cities offer X, small towns provide Y'", "End with a personal reason"] },
  { topic: "The future of artificial intelligence", tips: ["Focus on one specific area (jobs, health, education)", "Be balanced — benefits and risks", "End with a prediction"] },
  { topic: "A tradition from your culture you are proud of", tips: ["Describe it clearly for someone unfamiliar", "Explain its meaning or history", "Say how you personally feel about it"] },
  { topic: "How can people maintain healthy habits in a busy life?", tips: ["Give 2–3 actionable tips", "Keep it practical and relatable", "Speak from personal experience if possible"] },
  { topic: "The value of travel for personal development", tips: ["Mention specific skills travel builds", "Use a personal travel story", "Connect travel to empathy or understanding"] },
];

export const FALLBACK_VOCAB = [
  {
    vocab: [
      { word: "Resilient", meaning: "Able to withstand or recover quickly from difficult conditions", example: "The local economy proved to be remarkably resilient." },
      { word: "Ambiguous", meaning: "Open to more than one interpretation; not having one obvious meaning", example: "The ending of the movie was deliberately ambiguous." },
      { word: "Collaborate", meaning: "Work jointly on an activity or project", example: "He collaborated with a colleague on the research paper." }
    ],
    challenge: "Describe a time you had to collaborate on a difficult project using these words."
  },
  {
    vocab: [
      { word: "Eloquent", meaning: "Fluent or persuasive in speaking or writing", example: "She made an eloquent appeal for support." },
      { word: "Pragmatic", meaning: "Dealing with things sensibly and realistically", example: "We need a pragmatic approach to management." },
      { word: "Innovative", meaning: "Featuring new methods; advanced and original", example: "The company is known for its innovative designs." }
    ],
    challenge: "Talk about a leader you admire and why they are effective using these words."
  }
];
