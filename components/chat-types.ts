// Type definitions for ConversationalChat component

export interface SuggestedAction {
  id: string;
  label: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  icon?: React.ReactNode;
  disabled?: boolean;
  selected?: boolean;
  onClick: () => void;
}

export interface MessageSource {
  id: string;
  title: string;
  url: string;
  type: 'documentation' | 'api' | 'guide' | 'reference';
}

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  
  // AI Agent Message Slots
  component?: React.ReactNode;           // UI Module slot
  suggestedActions?: SuggestedAction[];  // Actions slot
  sources?: MessageSource[];             // Sources slot
  
  // Message properties
  isWelcome?: boolean;
  isLocked?: boolean;
  stepId?: string;
  priority?: 'low' | 'normal' | 'high';
  category?: string;
}

export interface ConversationalChatProps {
  selectedTool?: string | null;
  onToolProcessed?: () => void;
  onShowAllTools?: () => void;
  onStartOver?: () => void;
  onWelcomeComplete?: () => void;
  resetTrigger?: number;
}

export interface AddMessageOptions {
  component?: React.ReactNode;
  suggestedActions?: SuggestedAction[];
  sources?: MessageSource[];
  isWelcome?: boolean;
  stepId?: string;
  priority?: 'low' | 'normal' | 'high';
  category?: string;
}

export interface FormField {
  id: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'checkbox' | 'url';
  required?: boolean;
  placeholder?: string;
  value?: any;
  min?: number;
  max?: number;
  options?: Array<{ value: string; label: string }>;
}

export interface FormSection {
  id: string;
  title?: string;
  description?: string;
  fields: FormField[];
}

export interface ValidationRule {
  fieldId: string;
  rule: 'required' | 'regex';
  message: string;
  pattern?: string;
}

export interface DerivationRule {
  fieldId: string;
  from: string[];
  strategy: 'usernameFromEmail' | 'strongPassword';
  editable: boolean;
}