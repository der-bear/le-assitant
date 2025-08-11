// Utility functions for chat message handling
import { Message, AddMessageOptions } from './chat-types';

/**
 * Generate unique message ID
 */
export function generateMessageId(counter: number): string {
  return `msg_${Date.now()}_${counter}`;
}

/**
 * Create a message object with all required properties
 */
export function createMessage(
  id: string,
  content: string,
  sender: 'user' | 'assistant',
  options: AddMessageOptions = {}
): Message {
  return {
    id,
    content,
    sender,
    timestamp: new Date(),
    component: options.component,
    suggestedActions: options.suggestedActions,
    sources: options.sources,
    isWelcome: options.isWelcome || false,
    isLocked: false,
    stepId: options.stepId,
    priority: options.priority || 'normal',
    category: options.category
  };
}

/**
 * Password generation utility
 */
export function generateSecurePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
  let result = '';
  
  // Include at least one of each type
  result += 'ABCDEFGHJKLMNPQRSTUVWXYZ'[Math.floor(Math.random() * 24)]; // uppercase
  result += 'abcdefghijkmnpqrstuvwxyz'[Math.floor(Math.random() * 26)]; // lowercase  
  result += '23456789'[Math.floor(Math.random() * 8)]; // number
  result += '!@#$%'[Math.floor(Math.random() * 5)]; // special
  
  // Fill the rest randomly
  for (let i = 4; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  // Shuffle the password
  return result.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Username generation from email
 */
export function generateUsernameFromEmail(email: string): string {
  if (!email || typeof email !== 'string') {
    return 'client_' + Math.random().toString(36).substr(2, 6);
  }
  
  // Extract username part before @ symbol and clean it up
  const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
  return username || 'client_' + Math.random().toString(36).substr(2, 6);
}

/**
 * Derive form field values based on strategy
 */
export function deriveFieldValue(
  strategy: 'usernameFromEmail' | 'strongPassword',
  currentValues: Record<string, any>
): string {
  switch (strategy) {
    case 'usernameFromEmail':
      return generateUsernameFromEmail(currentValues.email);
    case 'strongPassword':
      return generateSecurePassword();
    default:
      return '';
  }
}