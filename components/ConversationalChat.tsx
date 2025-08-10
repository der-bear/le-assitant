import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Form } from './ui-modules/Form';
import { ChoiceList } from './ui-modules/ChoiceList';
import { Steps } from './ui-modules/Steps';
import { Alert } from './ui-modules/Alert';
import { ProcessState } from './ui-modules/ProcessState';
import { SummaryCard } from './ui-modules/SummaryCard';
import { FileDrop } from './ui-modules/FileDrop';
import { HelpSources } from './ui-modules/HelpSources';
import { 
  Send, 
  User, 
  Building, 
  Upload, 
  Wrench,
  ArrowRight,
  Bot,
  ExternalLink
} from 'lucide-react';

interface SuggestedAction {
  id: string;
  label: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  icon?: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
}

interface MessageSource {
  id: string;
  title: string;
  url: string;
  type: 'documentation' | 'api' | 'guide' | 'reference';
}

interface Message {
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

interface ConversationalChatProps {
  selectedTool?: string | null;
  onToolProcessed?: () => void;
  onShowAllTools?: () => void;
  onStartOver?: () => void;
  onWelcomeComplete?: () => void;
  resetTrigger?: number;
}

export function ConversationalChat({ 
  selectedTool, 
  onToolProcessed, 
  onShowAllTools,
  onWelcomeComplete,
  resetTrigger
}: ConversationalChatProps) {
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [messageCounter, setMessageCounter] = useState(1);
  const [currentFlow, setCurrentFlow] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [showWelcome, setShowWelcome] = useState(true);
  const [flowActive, setFlowActive] = useState(false);
  const [derivedValues, setDerivedValues] = useState<Record<string, any>>({});
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Session + timers guard to prevent late async inserts after reset or flow changes
  const sessionIdRef = useRef(0);
  const timersRef = useRef<number[]>([]);

  const resetSession = useCallback(() => {
    sessionIdRef.current += 1; // invalidate pending callbacks
    // clear any pending timers
    for (const id of timersRef.current) {
      clearTimeout(id);
    }
    timersRef.current = [];
  }, []);

  const schedule = useCallback((fn: () => void, delay = 0) => {
    const sid = sessionIdRef.current;
    const id = window.setTimeout(() => {
      if (sessionIdRef.current !== sid) return; // aborted by reset/new flow
      fn();
    }, delay);
    timersRef.current.push(id);
    return id;
  }, []);

  useEffect(() => {
    return () => {
      // cleanup on unmount
      for (const id of timersRef.current) clearTimeout(id);
      timersRef.current = [];
    };
  }, []);

  // Quick tiles for welcome - 3 tools in one row
  const quickTiles = [
    {
      id: 'create-new-client',
      title: 'Create New Client',
      description: 'Set up a new client with guided configuration including delivery methods and credentials',
      icon: <Building className="w-4 h-4" />
    },
    {
      id: 'bulk-client-upload',
      title: 'Bulk Client Upload',
      description: 'Upload multiple clients at once using an Excel file with automatic credential generation',
      icon: <Upload className="w-4 h-4" />
    },
    {
      id: 'all-tools',
      title: 'All Tools',
      description: 'Access all 25+ tools organized by category',
      icon: <Wrench className="w-4 h-4" />
    }
  ];

  const generateMessageId = useCallback(() => {
    const id = `msg_${Date.now()}_${messageCounter}`;
    setMessageCounter(prev => prev + 1);
    return id;
  }, [messageCounter]);

  // Enhanced message creation with proper AI agent slots
  const addMessage = useCallback((
    content: string,
    sender: 'user' | 'assistant',
    options: {
      component?: React.ReactNode;
      suggestedActions?: SuggestedAction[];
      sources?: MessageSource[];
      isWelcome?: boolean;
      stepId?: string;
      priority?: 'low' | 'normal' | 'high';
      category?: string;
    } = {}
  ) => {
    const message: Message = {
      id: generateMessageId(),
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
    setMessages(prev => [...prev, message]);
  }, [generateMessageId]);

  // Convenience helper for simple messages
  const addSimpleMessage = useCallback((content: string, sender: 'user' | 'assistant') => {
    addMessage(content, sender);
  }, [addMessage]);

  // Convenience helper for AI agent responses with modules and actions
  const addAgentResponse = useCallback((
    content: string,
    component?: React.ReactNode,
    suggestedActions?: SuggestedAction[],
    sources?: MessageSource[],
    stepId?: string
  ) => {
    addMessage(content, 'assistant', {
      component,
      suggestedActions,
      sources,
      stepId
    });
  }, [addMessage]);

  // Helper function to add a processing message that auto-removes after delay
  const addProcessingMessage = useCallback((content: string, detail: string, duration = 2500) => {
    const processingMessageId = generateMessageId();
    
    // Add processing message
    const processingMessage: Message = {
      id: processingMessageId,
      content,
      sender: 'assistant',
      timestamp: new Date(),
      component: (
        <ProcessState
          kind="process-state"
          state="processing"
          detail={detail}
        />
      ),
      isWelcome: false,
      isLocked: false
    };
    
    setMessages(prev => [...prev, processingMessage]);
    
    // Remove the processing message after duration
    const sid = sessionIdRef.current;
    const timeoutId = window.setTimeout(() => {
      if (sessionIdRef.current !== sid) return; // Session was reset
      setMessages(prev => prev.filter(msg => msg.id !== processingMessageId));
    }, duration);
    
    timersRef.current.push(timeoutId);
    
    return processingMessageId;
  }, [generateMessageId]);

  // Start Over functionality
  const handleStartOver = useCallback(() => {
    resetSession();
    setCurrentFlow(null);
    setCompletedSteps(new Set());
    setFlowActive(false);
    setDerivedValues({});
    setCurrentStep(null);
    // Update messages to unlock all locked components
    setMessages(prev => prev.map(msg => ({
      ...msg,
      isLocked: false,
      // Reset the component if it has locked/disabled properties
      component: msg.component && !msg.isWelcome ? React.cloneElement(
        msg.component as React.ReactElement,
        { locked: false, disabled: false }
      ) : msg.component
    })).filter(msg => msg.isWelcome));
    setInputValue('');
    setIsTyping(false);
    setIsProcessing(false);
  }, [resetSession]);

  // Watch for external reset trigger
  useEffect(() => {
    if (resetTrigger && resetTrigger > 0) {
      handleStartOver();
    }
  }, [resetTrigger, handleStartOver]);

  // Enhanced Welcome Cards Component - responsive horizontal layout on mobile
  const WelcomeCards = useCallback(() => (
    <div className="space-y-6">
      {/* Quick Tiles Grid - responsive layout with horizontal icons on mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
        {quickTiles.map(tile => (
          <Card
            key={tile.id}
            className={`p-4 cursor-pointer transition-all duration-200 border-border ${
              flowActive 
                ? 'opacity-40 pointer-events-none bg-muted/20' 
                : 'hover:bg-accent/50 group'
            }`}
            onClick={() => !flowActive && handleToolSelection(tile.id)}
          >
            {/* Mobile: horizontal layout, Desktop: vertical layout */}
            <div className="flex sm:flex-col sm:space-y-3 space-x-3 sm:space-x-0 items-start">
              <div className={`rounded-lg bg-muted flex items-center justify-center flex-shrink-0 transition-colors ${
                flowActive 
                  ? 'w-8 h-8' 
                  : 'w-8 h-8 md:w-10 md:h-10 group-hover:bg-accent-foreground/10'
              }`}>
                {tile.icon}
              </div>
              <div className="space-y-1 text-left flex-1 min-w-0">
                <h3 className="font-medium text-sm text-foreground leading-tight">{tile.title}</h3>
                <p className="text-xs text-muted-foreground font-normal leading-relaxed">{tile.description}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  ), [flowActive]);

  // Initialize with welcome message
  const [messages, setMessages] = useState<Message[]>(() => [
    {
      id: 'welcome',
      content: 'Hi! I\'m your LeadExec AI assistant. I can help you create clients, set up delivery methods, and much more.\n\nI use a universal framework of embeddable modules that work seamlessly in our conversation. I can understand natural language - try asking me about specific clients or describing what you need. Here are some popular tools to get started:',
      sender: 'assistant',
      timestamp: new Date(),
      component: null, // Will be rendered dynamically
      isWelcome: true
    }
  ]);

  const scrollToBottom = useCallback(() => {
    // Use double requestAnimationFrame to ensure DOM has fully updated with new content
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // Add a longer delay for complex components to fully render
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 200);
      });
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleUnimplementedTool = useCallback((toolId: string) => {
    // Tool category mapping
    const toolCategories: Record<string, { category: string; alternativeTools: Array<{id: string, name: string, description: string}> }> = {
      // Client tools
      'client-management': { 
        category: 'Clients',
        alternativeTools: [
          { id: 'create-new-client', name: 'LeadExec Client Setup', description: 'Create new client configurations with guided setup' },
          { id: 'bulk-client-upload', name: 'Bulk Client Upload', description: 'Upload multiple clients at once via Excel' },
          { id: 'delivery-configuration', name: 'Delivery Configuration', description: 'Configure email, webhook, and FTP delivery' }
        ]
      },
      'client-search-filter': {
        category: 'Clients', 
        alternativeTools: [
          { id: 'client-management', name: 'Client Management', description: 'View, edit, and manage existing clients' },
          { id: 'create-new-client', name: 'LeadExec Client Setup', description: 'Create new client configurations with guided setup' }
        ]
      },
      'delivery-configuration': {
        category: 'Clients',
        alternativeTools: [
          { id: 'create-new-client', name: 'LeadExec Client Setup', description: 'Create new client configurations with guided setup' },
          { id: 'client-management', name: 'Client Management', description: 'View, edit, and manage existing clients' }
        ]
      },
      // Lead tools
      'lead-sources': {
        category: 'Leads',
        alternativeTools: [
          { id: 'lead-distribution', name: 'Lead Distribution', description: 'Configure lead routing and distribution' },
          { id: 'lead-tracking', name: 'Lead Tracking', description: 'Track lead delivery and conversion' }
        ]
      },
      // Financial tools
      'revenue-reports': {
        category: 'Financial',
        alternativeTools: [
          { id: 'billing-management', name: 'Billing Management', description: 'Manage billing and invoicing' },
          { id: 'payment-tracking', name: 'Payment Tracking', description: 'Track client payments and invoices' }
        ]
      },
      // System tools
      'user-management': {
        category: 'System',
        alternativeTools: [
          { id: 'system-settings', name: 'System Settings', description: 'Global system configuration' },
          { id: 'integrations', name: 'Integrations', description: 'Configure third-party integrations' }
        ]
      }
    };

    const toolInfo = toolCategories[toolId] || { category: 'General', alternativeTools: [] };
    const toolDisplayName = toolId.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

    // Create help sources based on tool category
    const helpSources: Record<string, Array<{id: string, title: string, description: string, url: string, kind: 'howto' | 'article' | 'api', source: 'KnowledgeBase' | 'API Docs'}>> = {
      'Clients': [
        { id: '1', title: 'Client Setup Guide', description: 'Complete walkthrough for setting up new clients in LeadExec', url: '#client-setup', kind: 'howto' as const, source: 'KnowledgeBase' as const },
        { id: '2', title: 'Delivery Methods Explained', description: 'Understanding email, webhook, and FTP delivery options', url: '#delivery-methods', kind: 'article' as const, source: 'KnowledgeBase' as const },
        { id: '3', title: 'Client API Reference', description: 'API endpoints for programmatic client management', url: '#client-api', kind: 'api' as const, source: 'API Docs' as const }
      ],
      'Leads': [
        { id: '1', title: 'Lead Source Configuration', description: 'How to set up and configure lead sources', url: '#lead-sources', kind: 'howto' as const, source: 'KnowledgeBase' as const },
        { id: '2', title: 'Lead Distribution Rules', description: 'Creating routing rules for optimal lead distribution', url: '#lead-distribution', kind: 'article' as const, source: 'KnowledgeBase' as const },
        { id: '3', title: 'Lead Tracking Guide', description: 'Monitor lead performance and conversion rates', url: '#lead-tracking', kind: 'howto' as const, source: 'KnowledgeBase' as const }
      ],
      'Financial': [
        { id: '1', title: 'Revenue Reporting Guide', description: 'Generate and analyze revenue reports', url: '#revenue-reports', kind: 'howto' as const, source: 'KnowledgeBase' as const },
        { id: '2', title: 'Billing Management', description: 'Handle client invoicing and payment tracking', url: '#billing', kind: 'article' as const, source: 'KnowledgeBase' as const },
        { id: '3', title: 'Financial API', description: 'Integrate with financial systems via API', url: '#financial-api', kind: 'api' as const, source: 'API Docs' as const }
      ],
      'System': [
        { id: '1', title: 'User Management Guide', description: 'Add users and configure permissions', url: '#user-management', kind: 'howto' as const, source: 'KnowledgeBase' as const },
        { id: '2', title: 'Integration Setup', description: 'Connect third-party services and APIs', url: '#integrations', kind: 'article' as const, source: 'KnowledgeBase' as const },
        { id: '3', title: 'System Configuration', description: 'Global settings and system preferences', url: '#system-config', kind: 'howto' as const, source: 'KnowledgeBase' as const }
      ],
      'General': [
        { id: '1', title: 'Getting Started with LeadExec', description: 'Overview of key features and workflows', url: '#getting-started', kind: 'article' as const, source: 'KnowledgeBase' as const },
        { id: '2', title: 'API Documentation', description: 'Complete API reference for developers', url: '#api-docs', kind: 'api' as const, source: 'API Docs' as const }
      ]
    };

    // Main response message with suggested actions below
    const suggestionButtons = toolInfo.alternativeTools.length > 0 ? (
      <div className="flex flex-wrap gap-2">
        {toolInfo.alternativeTools.slice(0, 3).map((tool) => (
          <Button
            key={tool.id}
            variant="outline"
            size="sm"
            onClick={() => handleToolSelection(tool.id)}
            className="h-8 px-3 text-xs"
          >
            {tool.name}
          </Button>
        ))}
      </div>
    ) : null;

    addMessage(
      `The "${toolDisplayName}" tool isn't implemented yet, but I can assist you with the configuration. I can still help you configure this manually - just describe what you'd like to set up, and I'll guide you through the process.`,
      'assistant',
      suggestionButtons ? { component: suggestionButtons } : {}
    );

    // Help sources as separate message
    schedule(() => {
      addMessage(
        `Here are some helpful resources that can guide you through ${toolInfo.category.toLowerCase()} configuration and best practices:`,
        'assistant',
        {
          component: (
            <HelpSources
              kind="help-sources"
              results={helpSources[toolInfo.category] || helpSources['General']}
            />
          )
        }
      );
    }, 300);
  }, [addMessage]);

  const startGuidedFlow = useCallback((flowId: string) => {
    if (flowId === 'create-new-client') {
      handleClientSetup();
    } else if (flowId === 'bulk-client-upload') {
      handleBulkUpload();
    } else {
      handleUnimplementedTool(flowId);
    }
  }, []);

  const handleToolSelection = useCallback((toolId: string) => {
    // Special handling for All Tools - just open the panel, no flow
    if (toolId === 'all-tools') {
      onShowAllTools?.();
      return;
    }
    
    resetSession();
    setFlowActive(true);
    onWelcomeComplete?.();

    const toolNames: Record<string, string> = {
      'create-new-client': 'Create New Client',
      'bulk-client-upload': 'Bulk Client Upload'
    };

    const toolName = toolNames[toolId] || toolId;
    addSimpleMessage(`${toolName}`, 'user');

    setCurrentFlow(toolId);
    setCompletedSteps(new Set());
    setCurrentStep(null);

    schedule(() => {
      startGuidedFlow(toolId);
    }, 500);
  }, [addMessage, onShowAllTools, onWelcomeComplete, resetSession, schedule, startGuidedFlow]);

  // Handle tool selection from outside
  const lastProcessedToolRef = useRef<string | null>(null);
  
  useEffect(() => {
    if (selectedTool && selectedTool !== lastProcessedToolRef.current) {
      lastProcessedToolRef.current = selectedTool;
      // Special handling for All Tools - just open the panel
      if (selectedTool === 'all-tools') {
        onShowAllTools?.();
        if (onToolProcessed) {
          onToolProcessed();
        }
        return;
      }
      
      resetSession();
      setFlowActive(true);
      onWelcomeComplete?.();
      const toolNames: Record<string, string> = {
        'create-new-client': 'Create New Client',
        'bulk-client-upload': 'Bulk Client Upload'
      };
      const toolName = toolNames[selectedTool] || selectedTool;
      addSimpleMessage(`${toolName}`, 'user');
      
      schedule(() => {
        startGuidedFlow(selectedTool);
      }, 500);
      
      if (onToolProcessed) {
        onToolProcessed();
      }
    }
    
    // Reset the ref when selectedTool becomes null
    if (!selectedTool) {
      lastProcessedToolRef.current = null;
    }
  }, [selectedTool, onToolProcessed, onWelcomeComplete, onShowAllTools, addMessage, resetSession, schedule, startGuidedFlow]);

  const markStepCompleted = useCallback((stepId: string) => {
    setCompletedSteps(prev => new Set([...prev, stepId]));
  }, []);

  const handleClientSetup = useCallback(() => {
    const steps = [
      { id: 'basic-info', title: 'Basic Information', hint: 'Company details and contact info' },
      { id: 'delivery-method', title: 'Delivery Method', hint: 'Choose how leads will be sent' },  
      { id: 'configuration', title: 'Configuration', hint: 'Set up preferences and settings' },
      { id: 'creation', title: 'Creation', hint: 'Create the client in LeadExec' },
      { id: 'review', title: 'Review', hint: 'Confirm setup and next steps' }
    ];

    addMessage(
      'I\'ll guide you through the LeadExec client setup process. Here\'s what we\'ll accomplish together:',
      'assistant',
      {
        component: (
          <div className="space-y-4">
            <Steps
              kind="steps"
              variant="overview"
              steps={steps}
              title="Client Setup Process"
              showIndex={true}
              locked={false}
            />
            <Button 
              onClick={() => proceedToBasicInfo()} 
              className="gap-2 font-medium"
              disabled={false}
            >
              <ArrowRight className="w-4 h-4" />
              Start Setup
            </Button>
          </div>
        ),
        stepId: 'setup-overview'
      }
    );
  }, [addMessage]);

  const proceedToBasicInfo = useCallback(() => {
    addSimpleMessage('Start Setup', 'user');
    
    // Mark setup overview as completed
    markStepCompleted('setup-overview');
    setCurrentStep('basic-info');
    
    schedule(() => {
      // Reset derived values for new form
      setDerivedValues({});
      
      const formFields = [
        { 
          id: 'companyName', 
          label: 'Company Name', 
          type: 'text' as const, 
          required: true, 
          placeholder: 'Enter company name' 
        },
        { 
          id: 'email', 
          label: 'Email Address', 
          type: 'email' as const, 
          required: true, 
          placeholder: 'Enter email address' 
        }
      ];

      const credentialsSection = {
        id: 'credentials',
        title: 'Client Credentials',
        description: 'Username and password will be auto-generated when you enter a valid email',
        fields: [
          {
            id: 'username',
            label: 'Username',
            type: 'text' as const,
            value: '',
            required: false, // Not required since it's auto-generated
            placeholder: 'Will be generated from email address'
          },
          {
            id: 'tempPassword',
            label: 'Password',
            type: 'text' as const,
            value: '',
            required: false, // Not required since it's auto-generated
            placeholder: 'Will be auto-generated securely'
          }
        ]
        // No reveal rule - show by default
      };

      // Working validation rules with correct email regex
      const validationRules = [
        {
          fieldId: 'companyName',
          rule: 'required' as const,
          message: 'Company name is required'
        },
        {
          fieldId: 'email',
          rule: 'required' as const,
          message: 'Email address is required'
        },
        {
          fieldId: 'email',
          rule: 'regex' as const,
          pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
          message: 'Please enter a valid email address'
        }
      ];

      addAgentResponse(
        'Great! Let\'s start with the basic client information. I\'ll automatically generate secure credentials once you provide the company name and email.',
        <Form
          kind="form"
          title="Client Information"
          description="Enter basic client details. Credentials will be generated automatically."
          sections={[
            {
              id: 'basic',
              fields: formFields
            },
            credentialsSection
          ]}
          validations={validationRules}
          derive={[
            {
              fieldId: 'username',
              from: ['email'],
              strategy: 'usernameFromEmail',
              editable: true
            },
            {
              fieldId: 'tempPassword',
              from: ['email'],
              strategy: 'strongPassword',
              editable: true
            }
          ]}
          submitLabel="Continue"
          onSubmit={handleBasicInfoSubmit}
          onRequestDerive={handleDeriveRequest}
          derivedValues={derivedValues}
          loading={false}
          disabled={completedSteps.has('basic-info') && currentStep !== 'basic-info'}
          locked={completedSteps.has('basic-info') && currentStep !== 'basic-info'}
        />,
        undefined, // suggestedActions
        undefined, // sources  
        'basic-info' // stepId
      );
    }, 500);
  }, [addMessage, completedSteps, currentStep, derivedValues, schedule]);

  const handleDeriveRequest = useCallback((targets: any[], currentValues: Record<string, any>) => {
    console.log('🔄 Derivation triggered for:', targets, 'with values:', currentValues);
    const updates: Record<string, any> = {};
    
    targets.forEach(target => {
      if (target.strategy === 'usernameFromEmail') {
        // Generate username from email
        const emailValue = currentValues.email;
        if (emailValue && typeof emailValue === 'string') {
          // Extract username part before @ symbol and clean it up
          const username = emailValue.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
          updates[target.fieldId] = username || 'client_' + Math.random().toString(36).substr(2, 6);
          console.log('✅ Generated username:', updates[target.fieldId]);
        } else {
          updates[target.fieldId] = 'client_' + Math.random().toString(36).substr(2, 6);
        }
      } else if (target.strategy === 'strongPassword') {
        // Generate a secure password
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
        updates[target.fieldId] = result.split('').sort(() => Math.random() - 0.5).join('');
        console.log('✅ Generated password:', updates[target.fieldId]);
      }
    });
    
    // Set the derived values which will be passed to the form
    if (Object.keys(updates).length > 0) {
      console.log('🚀 Setting derived values:', updates);
      setDerivedValues(updates);
      
      // CRITICAL: Update the message with the form that has the new derived values
      setMessages(prev => prev.map(msg => {
        if (msg.stepId === 'basic-info' && msg.component) {
          console.log('🔄 Updating form message with derived values:', updates);
          return {
            ...msg,
            component: React.cloneElement(msg.component as React.ReactElement, {
              derivedValues: updates
            })
          };
        }
        return msg;
      }));
    }
  }, []);

  const handleBasicInfoSubmit = useCallback((data: Record<string, any>) => {
    addSimpleMessage(`Company: ${data.companyName}, Email: ${data.email}`, 'user');
    
    // Clear derived values after submit
    setDerivedValues({});
    
    // Mark basic info step as completed
    markStepCompleted('basic-info');
    setCurrentStep('delivery-method');
    
    schedule(() => {
      const deliveryOptions = [
        {
          id: 'email',
          label: 'Email Delivery',
          description: 'Send leads directly to client email - simple and reliable',
          icon: 'Mail',
          badge: 'Popular'
        },
        {
          id: 'webhook',
          label: 'HTTP Webhook',
          description: 'Real-time API delivery to client systems',
          icon: 'Webhook'
        },
        {
          id: 'ftp',
          label: 'FTP Delivery',
          description: 'File transfer protocol for batch delivery',
          icon: 'Database'
        },
        {
          id: 'skip',
          label: 'Skip for Now',
          description: 'Set up delivery method later',
          icon: 'Clock'
        }
      ];

      addMessage(
        `Perfect! I've got the client information for ${data.companyName}. Now let's choose how leads will be delivered:`,
        'assistant',
        {
          component: (
            <ChoiceList
              kind="choices"
              title="Choose Delivery Method"
              description="Select how leads will be sent to your client"
              options={deliveryOptions}
              mode="single"
              layout="card"
              onChange={(value) => handleDeliveryMethodSelect(value as string)}
              disabled={completedSteps.has('delivery-method') && currentStep !== 'delivery-method'}
              locked={completedSteps.has('delivery-method') && currentStep !== 'delivery-method'}
            />
          ),
          stepId: 'delivery-method'
        }
      );
    }, 500);
  }, [addMessage, markStepCompleted, completedSteps, currentStep, schedule]);

  const handleDeliveryMethodSelect = useCallback((method: string) => {
    const methodLabels: Record<string, string> = {
      'email': 'Email Delivery',
      'webhook': 'HTTP Webhook',
      'ftp': 'FTP Delivery', 
      'skip': 'Skip for Now'
    };
    
    addSimpleMessage(`Selected: ${methodLabels[method] || method}`, 'user');
    
    // Mark delivery method step as completed
    markStepCompleted('delivery-method');
    setCurrentStep('delivery-config');
    
    schedule(() => {
      // Step 2b: Based on delivery choice, show specific configuration form
      if (method === 'email') {
        addMessage(
          'Configure email delivery settings for your client.',
          'assistant',
          {
            component: (
              <Form
                kind="form"
                title="Email Delivery Configuration"
                description="Set up how leads will be delivered via email"
                fields={[
                  {
                    id: 'emailAddress',
                    label: 'Delivery Email Address',
                    type: 'email' as const,
                    required: true,
                    placeholder: 'Enter client email address'
                  },
                  {
                    id: 'emailFormat',
                    label: 'Email Format',
                    type: 'select' as const,
                    required: true,
                    value: 'html',
                    options: [
                      { value: 'html', label: 'HTML Format' },
                      { value: 'plain', label: 'Plain Text' }
                    ]
                  },
                  {
                    id: 'includeAttachment',
                    label: 'Include Lead Details as Attachment',
                    type: 'checkbox' as const,
                    value: true
                  }
                ]}
                validations={[
                  {
                    fieldId: 'emailAddress',
                    rule: 'required' as const,
                    message: 'Email address is required'
                  },
                  {
                    fieldId: 'emailAddress',
                    rule: 'regex' as const,
                    pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
                    message: 'Please enter a valid email address'
                  },
                  {
                    fieldId: 'emailFormat',
                    rule: 'required' as const,
                    message: 'Email format is required'
                  }
                ]}
                submitLabel="Continue to Configuration"
                onSubmit={handleDeliveryConfigSubmit}
                disabled={completedSteps.has('delivery-config') && currentStep !== 'delivery-config'}
                locked={completedSteps.has('delivery-config') && currentStep !== 'delivery-config'}
              />
            ),
            stepId: 'delivery-config'
          }
        );
      } else if (method === 'webhook') {
        addMessage(
          'Configure webhook delivery settings for real-time lead integration.',
          'assistant',
          {
            component: (
              <Form
                kind="form"
                title="HTTP Webhook Configuration"
                description="Set up real-time API delivery to client systems"
                fields={[
                  {
                    id: 'webhookUrl',
                    label: 'Webhook URL',
                    type: 'url' as const,
                    required: true,
                    placeholder: 'https://client.example.com/webhook/leads'
                  },
                  {
                    id: 'webhookSecret',
                    label: 'Webhook Secret',
                    type: 'password' as const,
                    placeholder: 'Optional authentication secret'
                  },
                  {
                    id: 'webhookMethod',
                    label: 'HTTP Method',
                    type: 'select' as const,
                    required: true,
                    value: 'POST',
                    options: [
                      { value: 'POST', label: 'POST' },
                      { value: 'PUT', label: 'PUT' }
                    ]
                  }
                ]}
                validations={[
                  {
                    fieldId: 'webhookUrl',
                    rule: 'required' as const,
                    message: 'Webhook URL is required'
                  },
                  {
                    fieldId: 'webhookUrl',
                    rule: 'regex' as const,
                    pattern: '^https?://[^\\s]+$',
                    message: 'Please enter a valid URL'
                  },
                  {
                    fieldId: 'webhookMethod',
                    rule: 'required' as const,
                    message: 'HTTP method is required'
                  }
                ]}
                submitLabel="Continue to Configuration"
                onSubmit={handleDeliveryConfigSubmit}
                disabled={completedSteps.has('delivery-config') && currentStep !== 'delivery-config'}
                locked={completedSteps.has('delivery-config') && currentStep !== 'delivery-config'}
              />
            ),
            stepId: 'delivery-config'
          }
        );
      } else if (method === 'ftp') {
        addMessage(
          'Upload an FTP template file or use our default format.',
          'assistant',
          {
            component: (
              <div className="space-y-6">
                <FileDrop
                  kind="filedrop"
                  title="FTP Configuration Template"
                  description="Upload your FTP configuration template"
                  accept=".csv,.xlsx,.xml"
                  multiple={false}
                  maxSizeMb={5}
                />
                <div className="flex gap-3">
                  <Button onClick={() => handleDeliveryConfigSubmit({ useDefault: true })} className="font-medium">
                    Continue
                  </Button>
                </div>
              </div>
            ),
            stepId: 'delivery-config'
          }
        );
      } else {
        // Skip delivery configuration
        handleDeliveryConfigSubmit({ skipped: true });
      }
    }, 500);
  }, [addMessage, markStepCompleted, completedSteps, currentStep, schedule]);

  const handleDeliveryConfigSubmit = useCallback((config: Record<string, any>) => {
    console.log('🔧 handleDeliveryConfigSubmit called with config:', config);
    addSimpleMessage('Delivery configuration saved', 'user');
    
    // Mark delivery configuration as completed
    markStepCompleted('delivery-config');
    setCurrentStep('configuration');
    
    schedule(() => {
      console.log('🔧 Adding Configuration form message');
      // Step 3: Configuration & Creation
      addMessage(
        'Configure additional client settings and preferences.',
        'assistant',
        {
          component: (
            <Form
              kind="form"
              title="Client Configuration"
              description="Set up client preferences and limits"
              sections={[
                {
                  id: 'limits',
                  title: 'Lead Limits & Pricing',
                  fields: [
                    {
                      id: 'dailyLeadLimit',
                      label: 'Daily Lead Limit',
                      type: 'number' as const,
                      value: 50,
                      min: 1,
                      max: 1000,
                      placeholder: 'Maximum leads per day'
                    },
                    {
                      id: 'leadPrice',
                      label: 'Price Per Lead ($)',
                      type: 'number' as const,
                      value: 25,
                      min: 1,
                      placeholder: 'Cost per lead'
                    }
                  ]
                },
                {
                  id: 'filtering',
                  title: 'Lead Filtering',
                  fields: [
                    {
                      id: 'leadTypes',
                      label: 'Accepted Lead Types',
                      type: 'select' as const,
                      required: true,
                      value: 'all',
                      options: [
                        { value: 'all', label: 'All Lead Types' },
                        { value: 'residential', label: 'Residential Only' },
                        { value: 'commercial', label: 'Commercial Only' },
                        { value: 'custom', label: 'Custom Filter' }
                      ]
                    },
                    {
                      id: 'excludeWeekends',
                      label: 'Exclude Weekend Leads',
                      type: 'checkbox' as const,
                      value: false
                    }
                  ]
                }
              ]}
              validations={[
                {
                  fieldId: 'leadTypes',
                  rule: 'required' as const,
                  message: 'Lead type selection is required'
                }
              ]}
              submitLabel="Create Client"
              onSubmit={handleConfigurationSubmit}
              disabled={completedSteps.has('configuration') && currentStep !== 'configuration'}
              locked={completedSteps.has('configuration') && currentStep !== 'configuration'}
            />
          ),
          stepId: 'configuration'
        }
      );
    }, 500);
  }, [addMessage, markStepCompleted, completedSteps, currentStep, schedule]);

  const handleConfigurationSubmit = useCallback((configData: Record<string, any>) => {
    addSimpleMessage('Final configuration saved', 'user');
    markStepCompleted('configuration');
    setCurrentStep('creation');

    schedule(() => {
      // Add processing message that auto-removes after 2.5 seconds
      addProcessingMessage(
        'Creating your client with the specified configuration...',
        'Setting up client account and delivery configuration...'
      );

      // Simulate client creation process - wait for processing to complete
      schedule(() => {
        addAgentResponse(
          'Client creation completed successfully!',
          <SummaryCard
            kind="summary"
            title="Client Creation Summary"
            items={[
              {
                id: 'client-created',
                title: 'TechCorp Solutions',
                subtitle: 'Client ID: CL-2024-001',
                status: 'success' as const,
                message: 'Client account created and activated',
                link: {
                  href: '/clients/CL-2024-001',
                  label: 'View Client Details'
                }
              },
              {
                id: 'delivery-setup',
                title: 'Email Delivery Configured',
                subtitle: 'test@techcorp.com',
                status: 'success' as const,
                message: 'Delivery method configured and tested'
              },
              {
                id: 'limits-configured',
                title: 'Lead Limits Set',
                subtitle: '50 leads/day at $25 each',
                status: 'success' as const,
                message: 'Daily limits and pricing configured'
              }
            ]}
          />,
          [
            {
              id: 'monitor-delivery',
              label: 'Monitor Lead Delivery',
              variant: 'outline' as const,
              onClick: () => console.log('Navigate to analytics dashboard')
            },
            {
              id: 'share-portal',
              label: 'Share Client Portal Access',
              variant: 'outline' as const,
              onClick: () => console.log('Show portal credentials')
            },
            {
              id: 'create-another',
              label: 'Create Another Client',
              variant: 'outline' as const,
              onClick: () => handleToolSelection('create-new-client')
            }
          ],
          [
            {
              id: 'client-docs',
              title: 'Client Management Guide',
              url: 'https://docs.example.com/clients',
              type: 'documentation' as const
            },
            {
              id: 'lead-delivery',
              title: 'Lead Delivery Setup',
              url: 'https://docs.example.com/lead-delivery',
              type: 'guide' as const
            }
          ]
        );

        markStepCompleted('creation');
        
        // Complete the flow
        setCurrentFlow(null);
        setFlowActive(false);
      }, 2500);
    }, 500);
  }, [addMessage, markStepCompleted, handleToolSelection, onShowAllTools, currentStep, schedule]);

  // Also guard the legacy helper to avoid stray inserts
  const oldHandleDeliveryMethodSelect = useCallback((method: string) => {
    addSimpleMessage(`Selected: ${method} delivery`, 'user');
    markStepCompleted('delivery-method');

    schedule(() => {
      // Add processing message that auto-removes after 2.5 seconds
      addProcessingMessage(
        'Great choice! I\'m now creating the client with your specified configuration.',
        'Creating client and configuring delivery...'
      );

      // Simulate client creation process - wait for processing to complete
      schedule(() => {
        addMessage(
          'Client created successfully! Your new client is ready to receive leads.',
          'assistant',
          {
            component: (
              <Alert
                kind="alert"
                type="success"
                message="Client has been created and is now active in your LeadExec system."
                title="Setup Complete!"
              />
            ),
            stepId: 'creation-complete'
          }
        );
        
        // Add the action button as a separate message
        schedule(() => {
          addMessage(
            '',
            'assistant',
            {
              component: <div className="flex justify-start">
                <Button 
                  onClick={() => handleToolSelection('create-new-client')} 
                  className="font-medium"
                >
                  Create Another Client
                </Button>
              </div>
            }
          );
        }, 100);
      }, 1500);
    }, 500);
  }, [addMessage, markStepCompleted, handleToolSelection, schedule, addProcessingMessage]);

  const handleBulkUpload = useCallback(() => {
    const steps = [
      { id: 'prepare', title: 'Prepare File', hint: 'Download template and prepare your data' },
      { id: 'upload', title: 'Upload File', hint: 'Upload your Excel or CSV file' },
      { id: 'validate', title: 'Validation', hint: 'System validates the data' },
      { id: 'processing', title: 'Processing', hint: 'Create clients and generate credentials' },
      { id: 'results', title: 'Results', hint: 'Review upload results and next steps' }
    ];

    addMessage(
      'I\'ll help you upload multiple clients at once using an Excel file. The system will automatically generate usernames and passwords for each client. Here\'s the process:',
      'assistant',
      {
        component: (
          <div className="space-y-4">
            <Steps
              kind="steps"
              variant="overview"
              steps={steps}
              title="Bulk Upload Process"
              showIndex={true}
              locked={false}
            />
            <Button 
              onClick={() => proceedToBulkUploadPrepare()} 
              className="gap-2 font-medium"
              disabled={false}
            >
              <ArrowRight className="w-4 h-4" />
              Start Bulk Upload
            </Button>
          </div>
        ),
        stepId: 'bulk-overview'
      }
    );
  }, [addMessage]);

  const proceedToBulkUploadPrepare = useCallback(() => {
    addSimpleMessage('Start Bulk Upload', 'user');
    
    // Mark overview as completed
    markStepCompleted('bulk-overview');
    setCurrentStep('prepare');
    
    schedule(() => {
      addAgentResponse(
        'First, let\'s prepare your data file. You can download our template or use your own Excel/CSV file with the required columns.',
        undefined, // No component initially
        [
          {
            id: 'download-template',
            label: 'Download Excel Template',
            icon: 'Download'
          },
          {
            id: 'use-own-file',
            label: 'I have my own file ready',
            icon: 'FileCheck'
          }
        ], // suggestedActions
        undefined, // sources
        'prepare' // stepId
      );
      
      // Update message with suggested actions that handle clicks
      setMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage && lastMessage.stepId === 'prepare') {
          return prev.slice(0, -1).concat({
            ...lastMessage,
            suggestedActions: [
              {
                id: 'download-template',
                label: 'Download Excel Template',
                icon: 'Download',
                onClick: () => handleDownloadTemplate()
              },
              {
                id: 'use-own-file',
                label: 'I have my own file ready',
                icon: 'FileCheck',
                onClick: () => proceedToBulkUploadFile()
              }
            ]
          });
        }
        return prev;
      });
    }, 500);
  }, [addMessage, markStepCompleted, schedule, setMessages]);

  const handleDownloadTemplate = useCallback(() => {
    addSimpleMessage('Download Excel Template', 'user');
    
    // In a real app, this would trigger a download
    schedule(() => {
      addMessage(
        'Template downloaded! The file includes all required columns with example data. Once you\'ve filled it out, you can proceed to upload.',
        'assistant',
        {
          component: (
            <Alert
              kind="alert"
              type="info"
              title="Template Downloaded"
              message="Check your downloads folder for 'client_upload_template.xlsx'"
            />
          ),
          suggestedActions: [
            {
              id: 'ready-to-upload',
              label: 'Ready to Upload',
              icon: 'Upload',
              onClick: () => proceedToBulkUploadFile()
            }
          ]
        }
      );
    }, 500);
  }, [addMessage, schedule]);

  const proceedToBulkUploadFile = useCallback(() => {
    addSimpleMessage('Ready to Upload', 'user');
    
    // Mark prepare step as completed
    markStepCompleted('prepare');
    setCurrentStep('upload');
    
    schedule(() => {
      addMessage(
        'Great! Now upload your Excel or CSV file with the client data. I\'ll validate it and generate credentials automatically.',
        'assistant',
        {
          component: (
            <FileDrop
              kind="filedrop"
              title="Upload Client Data"
              description="Upload your Excel (.xlsx, .xls) or CSV file"
              accept=".xlsx,.xls,.csv"
              multiple={false}
              maxSizeMb={10}
              onUploadStart={(files) => {
                handleBulkFileUpload(files[0]);
              }}
            />
          ),
          stepId: 'upload'
        }
      );
    }, 500);
  }, [addMessage, markStepCompleted, completedSteps, currentStep, schedule]);

  const handleBulkFileUpload = useCallback((file: File) => {
    addSimpleMessage(`Uploaded: ${file.name}`, 'user');
    
    // Mark upload as completed
    markStepCompleted('upload');
    setCurrentStep('validate');
    
    // Start validation process
    schedule(() => {
      addMessage(
        'File received! Now validating the data format and checking for any issues...',
        'assistant',
        {
          component: (
            <ProcessState
              kind="process-state"
              title="Validating Data"
              state="processing"
              detail="Checking file format and data integrity..."
            />
          ),
          stepId: 'validate'
        }
      );
      
      // Simulate validation completion
      schedule(() => {
        handleValidationComplete(file);
      }, 2000);
    }, 500);
  }, [addMessage, markStepCompleted, schedule]);

  const handleValidationComplete = useCallback((file: File) => {
    // Update validation message to show success
    setMessages(prev => prev.map(msg => {
      if (msg.stepId === 'validate' && msg.component) {
        return {
          ...msg,
          component: (
            <ProcessState
              kind="process-state"
              title="Validation Complete"
              state="completed"
              detail="All data validated successfully!"
            />
          )
        };
      }
      return msg;
    }));
    
    // Mark validation as completed
    markStepCompleted('validate');
    setCurrentStep('processing');
    
    // Start processing
    schedule(() => {
      addMessage(
        'Validation successful! Now creating client accounts and generating secure credentials...',
        'assistant',
        {
          component: (
            <Steps
              kind="steps"
              variant="progress"
              title="Processing Bulk Upload"
              steps={[
                { id: 'create-accounts', title: 'Creating client accounts' },
                { id: 'generate-credentials', title: 'Generating secure credentials' },
                { id: 'setup-delivery', title: 'Setting up delivery methods' },
                { id: 'send-emails', title: 'Sending welcome emails' }
              ]}
              status={{
                'create-accounts': 'current',
                'generate-credentials': 'todo',
                'setup-delivery': 'todo',
                'send-emails': 'todo'
              }}
              current="create-accounts"
              locked={completedSteps.has('processing') && currentStep !== 'processing'}
              disabled={completedSteps.has('processing') && currentStep !== 'processing'}
            />
          ),
          stepId: 'processing'
        }
      );
      
      // Simulate processing completion
      schedule(() => {
        handleBulkUploadSuccess();
      }, 3000);
    }, 1000);
  }, [addMessage, markStepCompleted, completedSteps, currentStep, schedule, setMessages]);


  const handleBulkUploadSuccess = useCallback(() => {
    // Update processing step to show completion
    setMessages(prev => prev.map(msg => {
      if (msg.stepId === 'processing' && msg.component) {
        return {
          ...msg,
          component: (
            <Steps
              kind="steps"
              variant="progress"
              title="Processing Complete"
              steps={[
                { id: 'create-accounts', title: 'Creating client accounts' },
                { id: 'generate-credentials', title: 'Generating secure credentials' },
                { id: 'setup-delivery', title: 'Setting up delivery methods' },
                { id: 'send-emails', title: 'Sending welcome emails' }
              ]}
              status={{
                'create-accounts': 'done',
                'generate-credentials': 'done',
                'setup-delivery': 'done',
                'send-emails': 'done'
              }}
              current="send-emails"
              locked={true}
              disabled={true}
            />
          )
        };
      }
      return msg;
    }));
    
    markStepCompleted('processing');
    setCurrentStep('results');
    
    schedule(() => {
      addAgentResponse(
        'Excellent! All 25 clients have been successfully created with secure credentials. Welcome emails have been sent to each client with their login information.',
        <div className="space-y-4">
          <Alert
            kind="alert"
            type="success"
            title="Upload Complete!"
            message="All clients have been created and welcome emails sent."
          />
          
          <SummaryCard
            kind="summary"
            title="Upload Results"
            items={[
              {
                id: 'total',
                title: 'Total Clients Processed',
                subtitle: '25',
                status: 'success' as const,
                message: 'All clients successfully created'
              },
              {
                id: 'credentials',
                title: 'Credentials Generated',
                subtitle: '25',
                status: 'success' as const,
                message: 'Unique usernames and secure passwords'
              },
              {
                id: 'emails',
                title: 'Welcome Emails Sent',
                subtitle: '25', 
                status: 'success' as const,
                message: 'Clients notified with login details'
              }
            ]}
            actions={[
              { id: 'download-report', label: 'Download Report' },
              { id: 'view-clients', label: 'View Clients' }
            ]}
            onAction={(actionId: string) => {
              if (actionId === 'download-report') handleDownloadReport();
              if (actionId === 'view-clients') handleViewClients();
            }}
          />
        </div>,
        [
          {
            id: 'new-bulk-upload',
            label: 'Upload More Clients',
            icon: 'Upload',
            onClick: () => handleToolSelection('bulk-client-upload')
          },
          {
            id: 'configure-delivery',
            label: 'Configure Delivery Methods',
            icon: 'Settings',
            onClick: () => handleUnimplementedTool('delivery-configuration')
          },
          {
            id: 'done',
            label: 'Done',
            icon: 'Check',
            onClick: () => handleResetToWelcome()
          }
        ], // suggestedActions
        undefined, // sources
        'results' // stepId
      );
    }, 500);
  }, [addMessage, markStepCompleted, completedSteps, currentStep, schedule, setMessages, handleToolSelection, handleUnimplementedTool]);

  const handleDownloadReport = useCallback(() => {
    addSimpleMessage('Download Report', 'user');
    schedule(() => {
      addMessage(
        'Report downloaded! The Excel file contains all client details including their generated credentials.',
        'assistant',
        {
          component: (
            <Alert
              kind="alert"
              type="info"
              title="Report Downloaded"
              message="Check your downloads folder for 'bulk_upload_report.xlsx'"
            />
          ),
          stepId: 'results'
        }
      );

      // Add suggested actions
      schedule(() => {
        addMessage(
          '',
          'assistant',
          {
            component: (
              <div className="flex justify-start gap-3">
                <Button 
                  onClick={() => handleToolSelection('create-new-client')}
                  className="font-medium"
                >
                  Create Another Client
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => addSimpleMessage('Show client list', 'user')}
                  className="font-medium"
                >
                  View All Clients
                </Button>
              </div>
            )
          }
        );
      }, 1000);
    }, 500);
  }, [addMessage, markStepCompleted, schedule, handleToolSelection]);

  const handleViewClients = useCallback(() => {
    addSimpleMessage('View Clients', 'user');
    schedule(() => {
      addMessage(
        'Opening client management dashboard where you can view and manage all uploaded clients.',
        'assistant',
        {
          component: (
            <Alert
              kind="alert"
              type="info"
              title="Redirecting to Client Management"
              message="You can view, edit, and manage all your clients from the dashboard."
            />
          ),
          stepId: 'results'
        }
      );
    }, 500);
  }, [addMessage, schedule]);

  const handleResetToWelcome = useCallback(() => {
    addSimpleMessage('Done', 'user');
    resetSession();
    setFlowActive(false);
    schedule(() => {
      // Flow is complete, user can start a new flow
      onWelcomeComplete?.();
    }, 500);
  }, [resetSession, schedule, onWelcomeComplete]);

  const handleUserInput = useCallback((input: string) => {
    const lowerInput = input.toLowerCase();
    
    // Activate flow mode when user starts typing
    setFlowActive(true);
    
    if (lowerInput.includes('help') || lowerInput.includes('best practices') || lowerInput.includes('delivery methods') || lowerInput.includes('lead routing')) {
      addMessage(
        'I can provide guidance on LeadExec features and best practices. Here are some key areas I can help with:\n\n• Client setup and configuration\n• Delivery method selection and setup\n• Lead routing and distribution\n• Performance optimization\n• Troubleshooting common issues\n\nWhat specific area would you like to explore?',
        'assistant',
        {
          component: (
            <div className="flex gap-2 mt-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleToolSelection('create-new-client')}
                className="font-medium"
              >
                Start Client Setup
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onShowAllTools?.()}
                className="font-medium"
              >
                Browse All Tools
              </Button>
            </div>
          )
        }
      );
    } else if (lowerInput.includes('client')) {
      if (lowerInput.includes('create') || lowerInput.includes('new')) {
        handleToolSelection('create-new-client');
      } else if (lowerInput.includes('bulk') || lowerInput.includes('upload')) {
        handleToolSelection('bulk-client-upload');
      } else {
        addMessage(
          'I can help you with client-related tasks. Would you like to create a new client or do a bulk upload?',
          'assistant',
          {
            component: (
              <div className="flex gap-2 mt-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleToolSelection('create-new-client')}
                  className="font-medium"
                >
                  Create Client
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleToolSelection('bulk-client-upload')}
                  className="font-medium"
                >
                  Bulk Upload
                </Button>
              </div>
            )
          }
        );
      }
    } else {
      addMessage(
        'I understand you want to work with LeadExec! I can help you with various tasks like creating clients, bulk uploads, and setting up delivery methods. What would you like to accomplish?',
        'assistant',
        {
          component: (
            <div className="flex gap-2 mt-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onShowAllTools?.()}
                className="gap-2 font-medium"
              >
                <Wrench className="w-3 h-3" />
                View All Tools
              </Button>
            </div>
          )
        }
      );
    }
  }, [addMessage, handleToolSelection, onShowAllTools]);

  const handleSendMessage = useCallback(() => {
    if (!inputValue.trim() || isProcessing) return;
    onWelcomeComplete?.();
    const userMessage = inputValue;
    addSimpleMessage(userMessage, 'user');
    setInputValue('');
    setIsTyping(true);

    schedule(() => {
      setIsTyping(false);
      handleUserInput(userMessage);
    }, 1000);
  }, [inputValue, isProcessing, addMessage, handleUserInput, onWelcomeComplete, schedule]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto min-h-0 relative">
        <div className="max-w-4xl mx-auto px-8 py-12 space-y-8">
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`transition-all duration-300 ${
                message.stepId && completedSteps.has(message.stepId) && currentStep !== message.stepId
                  ? 'opacity-40 pointer-events-none' 
                  : 'opacity-100'
              }`}
            >
              {message.isWelcome ? (
                // Special welcome message layout - left-aligned with flow blocking
                <div className="flex items-start gap-4">
                  <Avatar className="w-8 h-8 bg-foreground flex-shrink-0">
                    <AvatarFallback className="bg-foreground text-background">
                      <Bot className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-6 text-left">
                    <div className="whitespace-pre-line text-sm font-normal leading-relaxed text-foreground">
                      {message.content}
                    </div>
                    <WelcomeCards />
                  </div>
                </div>
              ) : (
                // Regular message layout
                <div className={`flex gap-4 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {message.sender === 'assistant' && (
                    <Avatar className="w-8 h-8 bg-foreground flex-shrink-0 mt-1">
                      <AvatarFallback className="bg-foreground text-background">
                        <Bot className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div className={`max-w-[75%] min-w-0 ${message.sender === 'user' ? 'order-2' : ''}`}>
                    <Card className={`p-4 ${
                      message.sender === 'user' 
                        ? 'bg-muted/50 text-foreground ml-auto border-0' 
                        : 'bg-card border-border'
                    }`}>
                      <div className="whitespace-pre-line text-sm font-normal leading-relaxed">
                        {message.content}
                      </div>
                    </Card>
                    
                    {message.component && (
                      (() => {
                        // Determine if component needs container wrapper
                        const componentType = (message.component as any)?.props?.kind;
                        const isButtonGroup = React.isValidElement(message.component) && 
                          message.component.type === 'div' && 
                          message.component.props?.className?.includes('flex flex-wrap gap-2');
                        const isSourcesList = React.isValidElement(message.component) && 
                          message.component.type === 'div' && 
                          (message.component.props?.className?.includes('space-y-2') ||
                           message.component.props?.className?.includes('grid grid-cols-1'));
                        
                        // Components that don't need container wrapper (they handle their own root-level styling)
                        const noWrapperTypes = ['process-state', 'alert', 'help-sources'];
                        const needsWrapper = !noWrapperTypes.includes(componentType) && !isButtonGroup && !isSourcesList;
                        
                        return (
                          <div className="mt-4 sm:mt-6">
                            {needsWrapper ? (
                              <div className="border rounded-lg p-4 sm:p-6 bg-card shadow-sm">
                                {message.component}
                              </div>
                            ) : (
                              message.component
                            )}
                          </div>
                        );
                      })()
                    )}
                    
                    {/* Suggested Actions - only for assistant messages */}
                    {message.sender === 'assistant' && message.suggestedActions && message.suggestedActions.length > 0 && (
                      <div className={`mt-4 ${flowActive && !message.isWelcome ? 'opacity-40 pointer-events-none' : ''}`}>
                        <div className="flex flex-wrap gap-2">
                          {message.suggestedActions.map((action) => (
                            <Button
                              key={action.id}
                              variant={action.variant || 'outline'}
                              size="sm"
                              className={`h-8 text-xs gap-2 ${
                                flowActive && !message.isWelcome 
                                  ? 'opacity-40 pointer-events-none bg-muted/20' 
                                  : ''
                              }`}
                              disabled={action.disabled || (flowActive && !message.isWelcome)}
                              onClick={action.onClick}
                            >
                              {action.icon && action.icon}
                              {action.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Sources are now handled as proper components within messages */}
                  </div>

                  {message.sender === 'user' && (
                    <Avatar className="w-8 h-8 bg-secondary order-3 flex-shrink-0 mt-1">
                      <AvatarFallback className="bg-secondary text-secondary-foreground">
                        <User className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              )}
            </div>
          ))}
          
          {isTyping && (
            <div className="flex gap-4 justify-start">
              <Avatar className="w-8 h-8 bg-foreground flex-shrink-0 mt-1">
                <AvatarFallback className="bg-foreground text-background">
                  <Bot className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
              <Card className="p-4 bg-card border-border">
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
      </div>

      {/* Input Area */}
      <div className="border-t bg-background flex-shrink-0">
        <div className="max-w-4xl mx-auto px-8 py-6">
          <div className="flex gap-3">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isProcessing ? 'Please wait...' : 'Ask me about clients, or try: "Show me Acme Corp clients"...'}
              disabled={isProcessing}
              className="flex-1 font-normal text-base"
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={!inputValue.trim() || isProcessing}
              className="font-medium"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}