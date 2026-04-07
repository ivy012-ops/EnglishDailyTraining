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
  {
    topic: "The impact of social media on modern communication",
    tips: ["Structure: Intro, 2 points, Conclusion", "Use transition words like 'Furthermore'", "Give a personal example"]
  },
  {
    topic: "Your favorite childhood memory",
    tips: ["Use descriptive adjectives", "Focus on sensory details (sight, sound)", "Explain why it's important to you"]
  },
  {
    topic: "The benefits of learning a second language",
    tips: ["Mention cognitive benefits", "Talk about career opportunities", "Keep a steady pace"]
  },
  {
    topic: "How technology has changed the way we travel",
    tips: ["Compare past vs present", "Mention specific apps or tools", "Summarize your main point"]
  }
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
