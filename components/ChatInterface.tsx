import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Avatar } from './ui/avatar';
import { Badge } from './ui/badge';
import { Send, Bot, User } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  suggestedTools?: string[];
  suggestedActions?: Array<{
    label: string;
    action: string;
    description?: string;
  }>;
}

interface ChatInterfaceProps {
  onToolSelect: (toolId: string) => void;
  availableTools: { id: string; name: string; description: string }[];
}

export function ChatInterface({ onToolSelect, availableTools }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Welcome! I'm your LeadExec assistant. I can help you set up clients, manage lead sources, configure delivery methods, and much more. What would you like to work on today?",
      sender: 'assistant',
      timestamp: new Date(),
      suggestedActions: [
        {
          label: 'Create Client',
          action: 'leadexec-client-setup',
          description: 'Set up a new client with guided flow'
        },
        {
          label: 'Manage Leads',
          action: 'create-lead-source',
          description: 'Create and manage lead sources'
        },
        {
          label: 'View Analytics',
          action: 'client-analytics',
          description: 'Check performance metrics'
        }
      ]
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getContextualResponse = (userMessage: string): { content: string; actions?: Array<{label: string; action: string; description?: string}> } => {
    const message = userMessage.toLowerCase();
    
    if (message.includes('client') || message.includes('customer')) {
      return {
        content: "I can help you create and manage clients! The LeadExec client setup process is streamlined - you can create individual clients or upload multiple clients via Excel. Would you like me to guide you through the client creation process?",
        actions: [
          {
            label: 'Start Client Setup',
            action: 'leadexec-client-setup',
            description: 'Guided client creation with delivery setup'
          },
          {
            label: 'Bulk Upload',
            action: 'bulk-client-upload',
            description: 'Upload multiple clients via Excel'
          }
        ]
      };
    }
    
    if (message.includes('lead') || message.includes('source')) {
      return {
        content: "Great! Lead management is crucial for your business. I can help you set up lead sources, configure delivery methods, and manage your lead pipeline. What would you like to do?",
        actions: [
          {
            label: 'Create Lead Source',
            action: 'create-lead-source',
            description: 'Set up a new lead generation source'
          },
          {
            label: 'Manage Leads',
            action: 'manage-leads',
            description: 'View and manage existing leads'
          }
        ]
      };
    }
    
    if (message.includes('delivery') || message.includes('method')) {
      return {
        content: "I can help you configure delivery methods for your clients. This includes email delivery, webhooks, FTP, ping post, and more. Would you like to set up delivery for an existing client or create a new client with delivery?",
        actions: [
          {
            label: 'Setup Client with Delivery',
            action: 'leadexec-client-setup',
            description: 'Create client and configure delivery'
          },
          {
            label: 'Configure Delivery Only',
            action: 'delivery-setup',
            description: 'Set up delivery for existing client'
          }
        ]
      };
    }
    
    if (message.includes('help') || message.includes('what can you do')) {
      return {
        content: "I can help you with various LeadExec tasks:\n\n• **Client Management**: Create individual clients or bulk upload via Excel\n• **Delivery Setup**: Configure email, webhook, FTP, or ping post delivery\n• **Lead Sources**: Set up and manage lead generation sources\n• **Analytics**: View client performance and lead metrics\n• **Account Configuration**: Set up delivery accounts with limits and criteria\n\nWhat would you like to start with?",
        actions: [
          {
            label: 'Create Client',
            action: 'leadexec-client-setup',
            description: 'Full client setup with delivery'
          },
          {
            label: 'Lead Management',
            action: 'create-lead-source',
            description: 'Manage lead sources'
          },
          {
            label: 'View Analytics',
            action: 'client-analytics',
            description: 'Check performance metrics'
          }
        ]
      };
    }
    
    return {
      content: "I understand you want to work on your LeadExec system. I can help you with client setup, lead management, delivery configuration, and analytics. What specific area would you like to focus on?",
      actions: [
        {
          label: 'Create Client',
          action: 'leadexec-client-setup',
          description: 'Set up new client with guided flow'
        },
        {
          label: 'Manage Leads',
          action: 'create-lead-source',
          description: 'Configure lead sources'
        }
      ]
    };
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(() => {
      const response = getContextualResponse(inputValue);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.content,
        sender: 'assistant',
        timestamp: new Date(),
        suggestedActions: response.actions
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleActionClick = (action: string) => {
    onToolSelect(action);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.sender === 'assistant' && (
              <Avatar className="w-8 h-8 bg-primary">
                <Bot className="w-4 h-4 text-primary-foreground" />
              </Avatar>
            )}
            
            <div className={`max-w-[85%] ${message.sender === 'user' ? 'order-2' : ''}`}>
              <Card className={`p-4 ${
                message.sender === 'user' 
                  ? 'bg-primary text-primary-foreground ml-auto' 
                  : 'bg-card'
              }`}>
                <div className="text-sm whitespace-pre-line">{message.content}</div>
              </Card>
              
              {/* Suggested Actions */}
              {message.suggestedActions && message.suggestedActions.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-muted-foreground mb-2">Quick actions:</p>
                  <div className="grid gap-2">
                    {message.suggestedActions.map((action, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="h-auto p-3 justify-start text-left"
                        onClick={() => handleActionClick(action.action)}
                      >
                        <div>
                          <div className="font-medium text-sm">{action.label}</div>
                          {action.description && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {action.description}
                            </div>
                          )}
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Legacy suggested tools support */}
              {message.suggestedTools && message.suggestedTools.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  <p className="text-xs text-muted-foreground mb-1">Suggested tools:</p>
                  {message.suggestedTools.map((toolId) => {
                    const tool = availableTools.find(t => t.id === toolId);
                    return tool ? (
                      <Badge
                        key={toolId}
                        variant="outline"
                        className="cursor-pointer hover:bg-accent text-xs"
                        onClick={() => onToolSelect(toolId)}
                      >
                        {tool.name}
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}
            </div>

            {message.sender === 'user' && (
              <Avatar className="w-8 h-8 bg-secondary order-3">
                <User className="w-4 h-4 text-secondary-foreground" />
              </Avatar>
            )}
          </div>
        ))}
        
        {isTyping && (
          <div className="flex gap-3 justify-start">
            <Avatar className="w-8 h-8 bg-primary">
              <Bot className="w-4 h-4 text-primary-foreground" />
            </Avatar>
            <Card className="p-3 bg-card">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </Card>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t bg-background p-4">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me..."
            className="flex-1"
          />
          <Button onClick={handleSendMessage} disabled={!inputValue.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}