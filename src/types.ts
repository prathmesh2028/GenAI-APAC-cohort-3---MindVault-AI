export type NavTab = 'dashboard' | 'chat' | 'history' | 'reflection' | 'profile';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  summary: string;
  messages: ChatMessage[];
  topics: string[];
  createdAt: string;
  updatedAt: string;
}

export interface WeeklyReflection {
  id: string;
  userId: string;
  weekStartDate: string;
  topics: string[];
  learned: string;
  patterns: string;
  nextSteps: string[];
  motivationalInsight: string;
  conversationCount: number;
  createdAt: string;
  wins?: string[];
  challenges?: string[];
  thingsToRevisit?: string[];
  keyThoughts?: string;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface MindPattern {
  name: string;
  count: number;
  category: 'Learning' | 'Career' | 'Projects' | 'Goals' | 'Decisions' | 'Personal Growth' | 'Challenges' | 'Other';
}
