
import React from 'react';

export interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: number;
  agent?: string; // For multi-agent identification
  feedback?: 'up' | 'down';
  image?: string; // Base64 Data URL for generated or attached images (Now acts as generic attachment)
  groundingMetadata?: {
    webSearchQueries?: string[];
    groundingChunks?: {
        web?: {
            uri?: string;
            title?: string;
        }
    }[];
  };
}

export interface ChatSession {
  id: string;
  title: string;
  preview: string;
  updatedAt: number;
  messages: Message[];
  participants?: string[]; // For group chats
}

export interface ScheduledTask {
    id: string;
    prompt: string;
    scheduledFor: number; // Timestamp
    executed: boolean;
    type: 'message' | 'action';
}

export interface Agent {
    id: string;
    name: string;
    role: string;
    status: 'active' | 'muted' | 'disabled';
    systemInstruction?: string;
    color?: string;
}

export interface LibraryItem {
  id: string;
  type: 'image' | 'chat' | 'doc';
  content: string; // Base64 for images, preview text for others
  title: string;
  date: number;
}

export interface GPT {
  id: string;
  name: string;
  description: string;
  author: string;
  systemInstruction: string;
  initialMessage?: string;
  icon?: string;
  category?: string;
  createdAt?: number;
}

export enum ViewMode {
  Chat = 'CHAT',
  Settings = 'SETTINGS',
  Projects = 'PROJECTS',
  WriteForMe = 'WRITE_FOR_ME',
  GroupChat = 'GROUP_CHAT',
  Auth = 'AUTH',
  JoinPreview = 'JOIN_PREVIEW',
  // Specific Modules
  Search = 'SEARCH',
  Library = 'LIBRARY',
  Marketplace = 'MARKETPLACE'
}

export interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
  active?: boolean;
  isSubItem?: boolean;
  badge?: string;
}

export interface CommandOption {
  command: string;
  description: string;
  icon: React.ElementType;
}

export type Theme = 'System' | 'Dark' | 'Light';
export type LayoutMode = 'Compact' | 'Spacious';
export type ModelMode = 'Flash' | 'Pro' | 'Reasoning';

export interface GeneralSettings {
  theme: Theme;
  accentColor: 'Blue' | 'Green' | 'Purple' | 'Orange';
  language: 'Auto-detect' | 'English' | 'Hindi' | 'Spanish';
  spokenLanguage: 'Auto-detect' | 'English' | 'Hindi';
  voice: 'Kore' | 'Puck' | 'Fenrir' | 'Charon' | 'Aoede';
  fontSize?: number;
  autoSave?: boolean;
}

export interface NotificationSettings {
  responses: boolean;
  tasks: 'Push' | 'Email' | 'Push, Email' | 'None';
  groupChats: boolean;
  projects: boolean;
  recommendations: 'Push' | 'Email' | 'Push, Email' | 'None';
  push_enabled?: boolean;
}

export interface Memory {
    id: string;
    content: string;
    date: number;
}

export interface PersonalizationSettings {
  baseStyle: 'Professional' | 'Casual' | 'Concise' | 'Friendly' | 'Candid' | 'Quirky' | 'Efficient' | 'Nerdy' | 'Cynical';
  custom_instructions: string;
  roast_mode: boolean; // NEW: Roast Mode
  aboutUser: {
      nickname: string;
      occupation: string;
  };
  memory: {
      enabled: boolean;
      history: boolean;
  };
  memories: Memory[]; // Specific facts the AI remembers
}

export interface DataSettings {
  improve_model?: boolean;
  shared_links?: boolean;
  save_history?: boolean;
  auto_delete_days?: number;
}

export interface SecuritySettings {
  mfa: {
      authenticator: boolean;
      push: boolean;
      sms: boolean;
  };
  active_sessions: string[];
  mfa_enabled?: boolean;
  safe_mode?: boolean;
  suspicious_login_alert?: boolean;
  app_lock?: boolean; // New: Local App Lock
}

export interface AccountSettings {
  name: string;
  email: string;
  country: string;
  plan: string; 
  gptBuilderProfile: {
      domainVerified: boolean;
      linkedinConnected: boolean;
      githubConnected: boolean;
      receiveFeedback: boolean;
  }
}

export interface ParentalSettings {
    restricted_mode: boolean;
    blocked_words: string;
    chat_time_limit: string;
}

// --- NEW ADVANCED SETTINGS (GOD MODE) ---

export interface BrainSettings {
    creativity_level: number; // 0.0 to 1.0 (Temperature)
    thinking_power: 'Fast' | 'Balanced' | 'Deep' | 'O1-Preview'; // Context & Model Selection
    memory_depth: number; // How many messages to remember (5 - 50)
    fact_check: boolean; // Grounding with Google Search always on/off
}

export interface VoiceConfigSettings {
    speed: number; // 0.5x to 2.0x
    silence_detection: number; // ms to wait before auto-send (500ms - 3000ms)
    emotion_level: 'Robotic' | 'Neutral' | 'Expressive' | 'Hyper-Real';
    interrupt_sensitivity: 'Low' | 'Medium' | 'High';
    voice_persona_prompt?: string; // NEW: Voice Cloning/Persona
}

export interface DeveloperSettings {
    debug_mode: boolean;
    show_tokens: boolean;
    raw_json_view: boolean;
    api_endpoint: 'Production' | 'Staging' | 'Localhost';
    primary_provider: 'Gemini' | 'OpenRouter'; // Dynamic Switching
    openrouter_key?: string; // Custom User Key
}

export interface AppSettings {
  // Root level
  theme: Theme;
  layoutMode: LayoutMode;
  multitasking: boolean;
  
  // Structured Settings
  general?: GeneralSettings;
  notifications?: NotificationSettings;
  personalization?: PersonalizationSettings;
  data?: DataSettings;
  security?: SecuritySettings;
  account?: AccountSettings;
  parental?: ParentalSettings;
  apps?: Record<string, any>;
  
  // Advanced Categories
  brain?: BrainSettings;
  voice_config?: VoiceConfigSettings;
  developer?: DeveloperSettings;
}

export interface CanvasState {
    isOpen: boolean;
    content: string;
    language: string; // 'javascript', 'python', 'html', etc.
    title?: string;
}

// --- COLOR SYSTEM HELPER ---
export const getColorVariants = (color: string = 'Blue') => {
    switch (color) {
        case 'Green':
            return {
                bg: 'bg-green-600',
                bgHover: 'hover:bg-green-500',
                text: 'text-green-600',
                border: 'border-green-600',
                ring: 'focus:ring-green-500',
                bgLight: 'bg-green-500/10'
            };
        case 'Purple':
            return {
                bg: 'bg-purple-600',
                bgHover: 'hover:bg-purple-500',
                text: 'text-purple-600',
                border: 'border-purple-600',
                ring: 'focus:ring-purple-500',
                bgLight: 'bg-purple-500/10'
            };
        case 'Orange':
            return {
                bg: 'bg-orange-500',
                bgHover: 'hover:bg-orange-400',
                text: 'text-orange-500',
                border: 'border-orange-500',
                ring: 'focus:ring-orange-500',
                bgLight: 'bg-orange-500/10'
            };
        case 'Blue':
        default:
            return {
                bg: 'bg-blue-600',
                bgHover: 'hover:bg-blue-500',
                text: 'text-blue-600',
                border: 'border-blue-600',
                ring: 'focus:ring-blue-500',
                bgLight: 'bg-blue-500/10'
            };
    }
};

// --- APPS & CONNECTORS SYSTEM ---

export interface AppActionParam {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

export interface AppAction {
  name: string; 
  description: string; 
  method: 'GET' | 'POST';
  endpoint: string;
  params: AppActionParam[];
}

export interface AppOAuth {
  client_id: string;
  auth_url: string;
  token_url: string;
  scopes: string[];
}

export interface AppDefinition {
  app_id: string;
  display_name: string;
  logo_icon: string; 
  description: string;
  color: string;
  auth_type: 'oauth2' | 'apiKey';
  oauth: AppOAuth;
  actions: AppAction[];
}

export interface AppConnection {
  user_id: string;
  app_id: string;
  access_token: string;
  refresh_token: string;
  expires_at: number;
  scope: string[];
  updated_at: number;
  connected_email?: string; 
}