import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
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
  ArrowRight,
  Bot,
  ExternalLink,
  Download,
  Plus,
  Home
} from 'lucide-react';

// Import types, constants, and utilities
import type { 
  Message, 
  ConversationalChatProps, 
  SuggestedAction,
  MessageSource,
  AddMessageOptions,
  FormField,
  FormSection,
  ValidationRule,
  DerivationRule
} from './chat-types';
import { 
  QUICK_TILES, 
  CLIENT_SETUP_STEPS, 
  BULK_UPLOAD_STEPS,
  DELIVERY_OPTIONS,
  TOOL_CATEGORIES,
  HELP_SOURCES_BY_CATEGORY,
  TOOL_NAMES,
  DELIVERY_METHOD_LABELS
} from './chat-constants';
import { createMessage, generateMessageId as generateId } from './chat-utils';
import { useFormDerivation } from './hooks/useFormDerivation';

export function ConversationalChat({ 
  selectedTool, 
  onToolProcessed, 
  onShowAllTools,
  onStartOver,
  onWelcomeComplete,
  resetTrigger
}: ConversationalChatProps) {
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [messageCounter, setMessageCounter] = useState(1);
  const [currentFlow, setCurrentFlow] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Map<string, Set<string>>>(new Map());
  const [showWelcome, setShowWelcome] = useState(true);
  const [flowActive, setFlowActive] = useState(false);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [selectedActions, setSelectedActions] = useState<Set<string>>(new Set());
  const [clientEmail, setClientEmail] = useState<string>('');
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

  // Use form derivation hook
  const { derivedValues, handleDeriveRequest: handleDerive, clearDerivedValues } = useFormDerivation();

  const generateMessageId = useCallback(() => {
    const id = generateId(messageCounter);
    setMessageCounter(prev => prev + 1);
    return id;
  }, [messageCounter]);

  // Enhanced message creation with proper AI agent slots
  const addMessage = useCallback((
    content: string,
    sender: 'user' | 'assistant',
    options: AddMessageOptions = {}
  ) => {
    const message = createMessage(generateMessageId(), content, sender, options);
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
    setCompletedSteps(new Map());
    setFlowActive(false);
    clearDerivedValues();
    setCurrentStep(null);
    setSelectedActions(new Set());
    setClientEmail('');
    // Update messages to unlock all locked components
    setMessages(prev => prev.map(msg => ({
      ...msg,
      isLocked: false,
      // Reset the component if it has locked/disabled properties
      component: msg.component && !msg.isWelcome ? React.cloneElement(
        msg.component as React.ReactElement,
        { locked: false, disabled: false }
      ) : msg.component,
      // Reset suggested actions selection state
      suggestedActions: msg.suggestedActions?.map(action => ({
        ...action,
        selected: false
      }))
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
      {/* Quick Tiles Grid - responsive grid layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {QUICK_TILES.map(tile => (
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
                <tile.icon className="w-4 h-4" />
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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Only scroll when messages actually change (not on re-renders)
  useEffect(() => {
    // Small delay to let content render
    const timeoutId = setTimeout(() => {
      scrollToBottom();
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [messages.length, scrollToBottom]);

  const handleUnimplementedTool = useCallback((toolId: string) => {
    const toolInfo = TOOL_CATEGORIES[toolId] || { category: 'General', alternativeTools: [] };
    const toolDisplayName = toolId.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

    // Get help sources based on tool category

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
              results={HELP_SOURCES_BY_CATEGORY[toolInfo.category] || HELP_SOURCES_BY_CATEGORY['General']}
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

    const toolName = TOOL_NAMES[toolId] || toolId;
    addSimpleMessage(`${toolName}`, 'user');

    setCurrentFlow(toolId);
    // Don't reset all completed steps - only initialize current flow if needed
    setCompletedSteps(prev => {
      const newMap = new Map(prev);
      if (!newMap.has(toolId)) {
        newMap.set(toolId, new Set());
      }
      return newMap;
    });
    setCurrentStep(null);

    schedule(() => {
      startGuidedFlow(toolId);
    }, 500);
  }, [addMessage, onShowAllTools, onWelcomeComplete, resetSession, schedule, startGuidedFlow]);

  // Start a new flow while preserving completed steps from previous flows
  const startNewFlow = useCallback((toolId: string) => {
    resetSession();
    setFlowActive(true);
    
    const toolName = TOOL_NAMES[toolId] || toolId;
    addSimpleMessage(`${toolName}`, 'user');
    
    // Start new flow but keep completed steps locked
    setCurrentFlow(toolId);
    setCurrentStep(null);
    
    schedule(() => {
      startGuidedFlow(toolId);
    }, 500);
  }, [addSimpleMessage, resetSession, schedule, startGuidedFlow]);

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
      const toolName = TOOL_NAMES[selectedTool] || selectedTool;
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
    if (!currentFlow) return;
    
    setCompletedSteps(prev => {
      const newMap = new Map(prev);
      const flowSteps = newMap.get(currentFlow) || new Set();
      flowSteps.add(stepId);
      newMap.set(currentFlow, flowSteps);
      return newMap;
    });
  }, [currentFlow]);

  // Helper to determine if a step should be locked (only locks flow-breaking elements)
  const shouldLockStep = useCallback((stepId: string) => {
    if (!stepId) return false;
    
    // Check if this step is completed in ANY flow
    for (const [flowId, flowSteps] of completedSteps.entries()) {
      if (flowSteps.has(stepId)) {
        // Step is completed, lock it unless it's the current active step
        return currentStep !== stepId;
      }
    }
    
    return false;
  }, [completedSteps, currentStep]);

  // Helper to handle suggested action clicks with locking and selection logic
  const handleSuggestedActionClick = useCallback((actionId: string, originalOnClick: () => void) => {
    // Mark this action as selected
    setSelectedActions(prev => new Set([...prev, actionId]));
    
    // Update the message to show the action as selected
    setMessages(prev => prev.map(msg => ({
      ...msg,
      suggestedActions: msg.suggestedActions?.map(action => 
        action.id === actionId ? { ...action, selected: true } : action
      )
    })));
    
    // Execute the original click handler
    originalOnClick();
  }, [flowActive]);


  // ===== CLIENT SETUP FLOW =====
  const handleClientSetup = useCallback(() => {
    addMessage(
      'I\'ll guide you through the LeadExec client setup process. Here\'s what we\'ll accomplish together:',
      'assistant',
      {
        component: (
          <div className="space-y-4">
            <Steps
              kind="steps"
              variant="overview"
              steps={CLIENT_SETUP_STEPS}
              title="Client Setup Process (Draft)"
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
  }, [addMessage, shouldLockStep]);

  const proceedToBasicInfo = useCallback(() => {
    addSimpleMessage('Start Setup', 'user');
    
    // Mark setup overview as completed
    markStepCompleted('setup-overview');
    setCurrentStep('basic-info');
    
    schedule(() => {
      // Reset derived values for new form
      clearDerivedValues();
      
      const formFields: FormField[] = [
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

      const credentialsSection: FormSection = {
        id: 'credentials',
        title: 'Client Credentials',
        description: 'Username and password will be auto-generated when you enter a valid email',
        fields: [
          {
            id: 'username',
            label: 'Username',
            type: 'text' as const,
            value: '',
            required: false,
            placeholder: 'Will be generated from email address'
          },
          {
            id: 'tempPassword',
            label: 'Password',
            type: 'text' as const,
            value: '',
            required: false,
            placeholder: 'Will be auto-generated securely'
          }
        ]
      };

      const validationRules: ValidationRule[] = [
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
        "Let's start with the basic information. Enter the company details and we'll auto-generate secure login credentials:",
        <Form
          kind="form"
          title="Client Information"
          description="Basic client details and auto-generated credentials"
          sections={[
            { id: 'basic', fields: formFields },
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
          onRequestDerive={handleDerive}
          derivedValues={derivedValues}
          disabled={shouldLockStep('basic-info')}
          locked={shouldLockStep('basic-info')}
        />,
        undefined,
        undefined,
        'basic-info'
      );
    }, 500);
  }, [addSimpleMessage, markStepCompleted, addAgentResponse, completedSteps, currentStep, schedule, handleDerive, derivedValues, clearDerivedValues]);

  const handleBasicInfoSubmit = useCallback((data: Record<string, any>) => {
    const { companyName, email, username, tempPassword } = data;
    addSimpleMessage(`${companyName} (${email})`, 'user');
    
    // Store client email for later use
    console.log('📧 Setting clientEmail to:', email);
    setClientEmail(email);
    
    clearDerivedValues();
    markStepCompleted('basic-info');
    setCurrentStep('delivery-method');
    
    schedule(() => {
      addAgentResponse(
        "Great! Now let's configure how leads will be delivered to this client:",
        <ChoiceList
          kind="choices"
          title="Choose Delivery Method"
          description="Select how you want leads sent to this client"
          options={DELIVERY_OPTIONS}
          mode="single"
          layout="card"
          onChange={(value) => handleDeliveryMethodSelect(value as string)}
          disabled={shouldLockStep('delivery-method')}
          locked={shouldLockStep('delivery-method')}
        />,
        undefined,
        undefined,
        'delivery-method'
      );
    }, 500);
  }, [addSimpleMessage, markStepCompleted, addAgentResponse, completedSteps, currentStep, schedule, clearDerivedValues]);

  const handleDeliveryMethodSelect = useCallback((method: string) => {
    addSimpleMessage(`Selected: ${DELIVERY_METHOD_LABELS[method] || method}`, 'user');
    
    // Mark delivery method step as completed
    markStepCompleted('delivery-method');
    setCurrentStep('delivery-config');
    
    schedule(() => {
      // Step 2b: Email delivery - use client email by default, then ask questions
      if (method === 'email') {
        // First question: Field mappings
        addAgentResponse(
          'I\'ll use the client email by default for delivery. Should I use all the lead type mappings, or exclude some fields?',
          <ChoiceList
            kind="choices"
            title="Lead Field Mappings"
            description="Choose how to handle lead data fields"
            options={[
              {
                id: 'all',
                label: 'Use All Lead Fields',
                description: 'Include all available lead data in delivery'
              },
              {
                id: 'exclude',
                label: 'Exclude Some Fields',
                description: 'Specify which fields to exclude from delivery'
              }
            ]}
            mode="single"
            layout="card"
            onChange={(value) => handleFieldMappingChoice(value as string)}
            disabled={shouldLockStep('field-mapping')}
            locked={shouldLockStep('field-mapping')}
          />,
          undefined,
          undefined,
          'field-mapping'
        );
      } else if (method === 'webhook') {
        // First ask for basic webhook details
        addMessage(
          'Configure your webhook endpoint details.',
          'assistant',
          {
            component: (
              <Form
                kind="form"
                title="Webhook Basic Configuration"
                description="Set up your webhook endpoint"
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
                    label: 'Webhook Secret (optional)',
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
                  }
                ]}
                submitLabel="Continue"
                onSubmit={handleWebhookBasicConfigSubmit}
                disabled={shouldLockStep('webhook-basic')}
                locked={shouldLockStep('webhook-basic')}
              />
            ),
            stepId: 'webhook-basic'
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
      } else if (method === 'pingpost') {
        addMessage(
          'Configure ping post settings for real-time lead validation.',
          'assistant',
          {
            component: (
              <Form
                kind="form"
                title="Ping Post Configuration"
                description="Set up real-time lead validation and delivery"
                fields={[
                  {
                    id: 'pingUrl',
                    label: 'Ping URL',
                    type: 'url' as const,
                    required: true,
                    placeholder: 'https://client.example.com/ping'
                  },
                  {
                    id: 'postUrl',
                    label: 'Post URL',
                    type: 'url' as const,
                    required: true,
                    placeholder: 'https://client.example.com/post'
                  },
                  {
                    id: 'timeout',
                    label: 'Timeout (seconds)',
                    type: 'number' as const,
                    value: 30,
                    min: 5,
                    max: 300
                  }
                ]}
                validations={[
                  {
                    fieldId: 'pingUrl',
                    rule: 'required' as const,
                    message: 'Ping URL is required'
                  },
                  {
                    fieldId: 'postUrl',
                    rule: 'required' as const,
                    message: 'Post URL is required'
                  }
                ]}
                submitLabel="Continue to Configuration"
                onSubmit={handleDeliveryConfigSubmit}
                disabled={shouldLockStep('delivery-config')}
                locked={shouldLockStep('delivery-config')}
              />
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

  const handleFieldMappingChoice = useCallback((choice: string) => {
    addSimpleMessage(choice === 'all' ? 'Use All Lead Fields' : 'Exclude Some Fields', 'user');
    markStepCompleted('field-mapping');
    setCurrentStep('template-choice');
    
    schedule(() => {
      // If they want to exclude fields, ask for exclusions first
      if (choice === 'exclude') {
        addMessage(
          'Please specify which fields to exclude from delivery.',
          'assistant',
          {
            component: (
              <Form
                kind="form"
                title="Field Exclusions"
                description="Enter fields to exclude from lead delivery"
                fields={[
                  {
                    id: 'excludedFields',
                    label: 'Fields to Exclude (comma-separated)',
                    type: 'text' as const,
                    placeholder: 'e.g., ssn, phone, internal_notes',
                    required: true
                  }
                ]}
                submitLabel="Continue"
                onSubmit={() => handleFieldExclusionSubmit()}
              />
            ),
            stepId: 'field-exclusions'
          }
        );
      } else {
        // Skip to template question
        handleTemplateQuestion();
      }
    }, 500);
  }, [addSimpleMessage, markStepCompleted, addMessage, schedule, shouldLockStep]);

  const handleFieldExclusionSubmit = useCallback(() => {
    addSimpleMessage('Field exclusions saved', 'user');
    handleTemplateQuestion();
  }, [addSimpleMessage]);

  const handleTemplateQuestion = useCallback(() => {
    schedule(() => {
      addAgentResponse(
        'Would you like to use a generic email template or upload a custom one?',
        <ChoiceList
          kind="choices"
          title="Email Template"
          description="Choose template type for lead delivery emails"
          options={[
            {
              id: 'generic',
              label: 'Generic Template',
              description: 'Use our standard email template'
            },
            {
              id: 'custom',
              label: 'Custom Template',
              description: 'Upload your own email template'
            }
          ]}
          mode="single"
          layout="card"
          onChange={(value) => handleTemplateChoice(value as string)}
          disabled={shouldLockStep('template-choice')}
          locked={shouldLockStep('template-choice')}
        />,
        undefined,
        undefined,
        'template-choice'
      );
    }, 500);
  }, [addAgentResponse, completedSteps, currentStep, schedule]);

  const handleTemplateChoice = useCallback((choice: string) => {
    addSimpleMessage(choice === 'generic' ? 'Generic Template' : 'Custom Template', 'user');
    markStepCompleted('template-choice');
    setCurrentStep('schedule-question');
    
    schedule(() => {
      if (choice === 'custom') {
        // Show file upload then continue
        addMessage(
          'Please upload your custom email template.',
          'assistant',
          {
            component: (
              <FileDrop
                kind="filedrop"
                title="Upload Email Template"
                description="Upload your custom template file"
                accept=".html,.htm,.txt"
                multiple={false}
                maxSizeMb={5}
              />
            ),
            stepId: 'template-upload'
          }
        );
        
        // Auto-continue after upload simulation
        schedule(() => {
          addSimpleMessage('Template uploaded', 'user');
          handleScheduleQuestion();
        }, 2000);
      } else {
        handleScheduleQuestion();
      }
    }, 500);
  }, [addSimpleMessage, markStepCompleted, addMessage, schedule, shouldLockStep]);

  const handleScheduleQuestion = useCallback(() => {
    schedule(() => {
      addAgentResponse(
        'Should this delivery method follow a delivery schedule?',
        <ChoiceList
          kind="choices"
          title="Delivery Schedule"
          description="Set up when leads should be delivered"
          options={[
            {
              id: 'yes',
              label: 'Yes, Set Schedule',
              description: 'Configure specific delivery times'
            },
            {
              id: 'no',
              label: 'No, Deliver Immediately',
              description: 'Send leads as they arrive'
            }
          ]}
          mode="single"
          layout="card"
          onChange={(value) => handleScheduleChoice(value as string)}
          disabled={shouldLockStep('schedule-question')}
          locked={shouldLockStep('schedule-question')}
        />,
        undefined,
        undefined,
        'schedule-question'
      );
    }, 500);
  }, [addAgentResponse, completedSteps, currentStep, schedule]);

  const handleScheduleChoice = useCallback((choice: string) => {
    addSimpleMessage(choice === 'yes' ? 'Yes, Set Schedule' : 'No, Deliver Immediately', 'user');
    markStepCompleted('schedule-question');
    setCurrentStep(choice === 'yes' ? 'schedule-details' : 'retry-question');
    
    schedule(() => {
      if (choice === 'yes') {
        // Ask for schedule details
        addMessage(
          'Please provide the delivery schedule details.',
          'assistant',
          {
            component: (
              <Form
                kind="form"
                title="Schedule Details"
                description="When should leads be delivered?"
                fields={[
                  {
                    id: 'scheduleDetails',
                    label: 'Schedule Details',
                    type: 'text' as const,
                    placeholder: 'e.g., Mon-Fri 9AM-5PM EST',
                    required: true
                  }
                ]}
                submitLabel="Continue"
                onSubmit={() => handleScheduleDetailsSubmit()}
                disabled={false}
                locked={false}
              />
            ),
            stepId: 'schedule-details'
          }
        );
      } else {
        handleRetryQuestion();
      }
    }, 500);
  }, [addSimpleMessage, markStepCompleted, addMessage, schedule, shouldLockStep]);

  const handleScheduleDetailsSubmit = useCallback(() => {
    addSimpleMessage('Schedule details saved', 'user');
    markStepCompleted('schedule-details');
    setCurrentStep('retry-question');
    handleRetryQuestion();
  }, [addSimpleMessage, markStepCompleted, setCurrentStep]);

  const handleRetryQuestion = useCallback(() => {
    schedule(() => {
      addAgentResponse(
        'Should there be retry logic if delivery fails?',
        <ChoiceList
          kind="choices"
          title="Retry Logic"
          description="Handle delivery failures automatically"
          options={[
            {
              id: 'yes',
              label: 'Yes, Enable Retry',
              description: 'Automatically retry failed deliveries'
            },
            {
              id: 'no',
              label: 'No, Single Attempt',
              description: 'Only attempt delivery once'
            }
          ]}
          mode="single"
          layout="card"
          onChange={(value) => handleRetryChoice(value as string)}
          disabled={shouldLockStep('retry-question')}
          locked={shouldLockStep('retry-question')}
        />,
        undefined,
        undefined,
        'retry-question'
      );
    }, 500);
  }, [addAgentResponse, completedSteps, currentStep, schedule]);

  const handleRetryChoice = useCallback((choice: string) => {
    addSimpleMessage(choice === 'yes' ? 'Yes, Enable Retry' : 'No, Single Attempt', 'user');
    markStepCompleted('retry-question');
    setCurrentStep(choice === 'yes' ? 'retry-details' : 'notification-question');
    
    schedule(() => {
      if (choice === 'yes') {
        // Ask for retry details
        addMessage(
          'Configure retry settings for failed deliveries.',
          'assistant',
          {
            component: (
              <Form
                kind="form"
                title="Retry Configuration"
                description="How should failed deliveries be retried?"
                fields={[
                  {
                    id: 'retryAttempts',
                    label: 'Max Retry Attempts',
                    type: 'number' as const,
                    value: 3,
                    min: 1,
                    max: 10,
                    required: true
                  },
                  {
                    id: 'retryInterval',
                    label: 'Retry Interval (minutes)',
                    type: 'number' as const,
                    value: 15,
                    min: 1,
                    max: 1440,
                    required: true
                  }
                ]}
                submitLabel="Continue"
                onSubmit={() => handleRetryDetailsSubmit()}
                disabled={false}
                locked={false}
              />
            ),
            stepId: 'retry-details'
          }
        );
      } else {
        handleNotificationQuestion();
      }
    }, 500);
  }, [addSimpleMessage, markStepCompleted, addMessage, schedule, shouldLockStep]);

  const handleRetryDetailsSubmit = useCallback(() => {
    addSimpleMessage('Retry settings saved', 'user');
    markStepCompleted('retry-details');
    setCurrentStep('notification-question');
    handleNotificationQuestion();
  }, [addSimpleMessage, markStepCompleted, setCurrentStep]);

  const handleNotificationQuestion = useCallback(() => {
    schedule(() => {
      addAgentResponse(
        'Should we notify the account owner on delivery failures?',
        <ChoiceList
          kind="choices"
          title="Failure Notifications"
          description="Get notified when deliveries fail"
          options={[
            {
              id: 'yes',
              label: 'Yes, Send Notifications',
              description: 'Email alerts for delivery failures'
            },
            {
              id: 'no',
              label: 'No Notifications',
              description: 'Handle failures silently'
            }
          ]}
          mode="single"
          layout="card"
          onChange={(value) => handleNotificationChoice(value as string)}
          disabled={shouldLockStep('notification-question')}
          locked={shouldLockStep('notification-question')}
        />,
        undefined,
        undefined,
        'notification-question'
      );
    }, 500);
  }, [addAgentResponse, completedSteps, currentStep, schedule]);

  const handleNotificationChoice = useCallback((choice: string) => {
    addSimpleMessage(choice === 'yes' ? 'Yes, Send Notifications' : 'No Notifications', 'user');
    markStepCompleted('notification-question');
    setCurrentStep(choice === 'yes' ? 'notification-details' : 'delivery-summary');
    
    if (choice === 'yes') {
      // Capture the current clientEmail value before scheduling
      const emailForForm = clientEmail;
      console.log('🔍 Captured clientEmail for notification form:', emailForForm);
      
      // Ask for notification recipient
      schedule(() => {
        console.log('📧 Creating notification form with captured email:', emailForForm);
        addMessage(
          'Who should receive the failure notifications?',
          'assistant',
          {
            component: (
              <Form
                key={`notification-form-${emailForForm || 'empty'}`}
                kind="form"
                title="Notification Recipient"
                description="Email address for delivery failure alerts"
                fields={[
                  {
                    id: 'notificationEmail',
                    label: 'Notification Email',
                    type: 'email' as const,
                    placeholder: emailForForm || 'admin@company.com',
                    value: emailForForm || '',
                    required: true
                  }
                ]}
                validations={[
                  {
                    fieldId: 'notificationEmail',
                    rule: 'required' as const,
                    message: 'Email address is required'
                  }
                ]}
                submitLabel="Continue"
                onSubmit={(data) => {
                  console.log('📧 Notification form submitted with:', data);
                  handleNotificationDetailsSubmit();
                }}
                disabled={false}
                locked={false}
              />
            ),
            stepId: 'notification-details'
          }
        );
      }, 500);
    } else {
      // Skip pointless summary, go directly to delivery account question
      markStepCompleted('delivery-config');
      setCurrentStep('delivery-account-choice');
      
      schedule(() => {
        addAgentResponse(
            'Would you like to create a delivery account for this client?',
            <ChoiceList
              kind="choices"
              title="Delivery Account Setup"
              description="Choose whether to set up delivery account now or later"
              options={[
                {
                  id: 'yes',
                  label: 'Yes, Create Delivery Account',
                  description: 'Set up account limits, revenue requirements, and filtering'
                },
                {
                  id: 'no',
                  label: 'No, Skip for Now',
                  description: 'Create the client without delivery account (can be added later)'
                }
              ]}
              mode="single"
              layout="card"
              onChange={(value) => {
                if (value === 'yes') {
                  handleDeliveryAccountSetup();
                } else {
                  handleSkipDeliveryAccount();
                }
              }}
              disabled={false}
              locked={false}
            />,
            undefined,
            undefined,
            'delivery-account-choice'
          );
      }, 500);
    }
  }, [addSimpleMessage, markStepCompleted, addMessage, schedule, clientEmail]);

  const handleWebhookBasicConfigSubmit = useCallback((config: Record<string, any>) => {
    addSimpleMessage('Webhook details saved', 'user');
    markStepCompleted('webhook-basic');
    setCurrentStep('webhook-field-mapping');
    
    schedule(() => {
      addAgentResponse(
        'Do you need custom field mapping for this webhook? Third-party platforms often have different field names.',
        <ChoiceList
          kind="choices"
          title="Field Mapping"
          description="Configure how lead fields are mapped to your webhook"
          options={[
            {
              id: 'yes',
              label: 'Yes, Need Mapping',
              description: 'Upload CSV with field mappings or set up custom mapping'
            },
            {
              id: 'no',
              label: 'No, Use Default',
              description: 'Use standard LeadExec field names'
            }
          ]}
          mode="single"
          layout="card"
          onChange={(value) => handleWebhookFieldMappingChoice(value as string)}
          disabled={shouldLockStep('webhook-field-mapping')}
          locked={shouldLockStep('webhook-field-mapping')}
        />,
        undefined,
        undefined,
        'webhook-field-mapping'
      );
    }, 500);
  }, [addSimpleMessage, markStepCompleted, addAgentResponse, completedSteps, currentStep, schedule]);

  const handleWebhookFieldMappingChoice = useCallback((choice: string) => {
    addSimpleMessage(choice === 'yes' ? 'Yes, Need Mapping' : 'No, Use Default', 'user');
    markStepCompleted('webhook-field-mapping');
    setCurrentStep('webhook-mapping-details');
    
    schedule(() => {
      if (choice === 'yes') {
        addMessage(
          'Upload a CSV file with field mappings or let our AI process auto-mapping.',
          'assistant',
          {
            component: (
              <div className="space-y-4">
                <FileDrop
                  kind="filedrop"
                  title="Upload Field Mapping File"
                  description="Upload CSV with field mappings (LeadExec_Field, Your_Field)"
                  accept=".csv,.xlsx"
                  multiple={false}
                  maxSizeMb={5}
                />
                <div className="flex gap-3">
                  <Button onClick={() => handleWebhookMappingSubmit()} className="font-medium">
                    Auto-Map
                  </Button>
                  <Button variant="outline" onClick={() => handleWebhookMappingSubmit()} className="font-medium">
                    Skip For Now
                  </Button>
                </div>
              </div>
            ),
            stepId: 'webhook-mapping-details'
          }
        );
      } else {
        handleWebhookMappingSubmit();
      }
    }, 500);
  }, [addSimpleMessage, markStepCompleted, addMessage, schedule, shouldLockStep]);

  const handleWebhookMappingSubmit = useCallback(() => {
    addSimpleMessage('Field mapping configured', 'user');
    markStepCompleted('webhook-mapping-details');
    setCurrentStep('schedule-question');
    
    // Continue to schedule question (same as email flow)
    handleScheduleQuestion();
  }, [addSimpleMessage, markStepCompleted, setCurrentStep]);

  const handleNotificationDetailsSubmit = useCallback(() => {
    addSimpleMessage('Notification settings saved', 'user');
    markStepCompleted('notification-details');
    // Skip pointless summary, go directly to delivery account question
    markStepCompleted('delivery-config');
    setCurrentStep('delivery-account-choice');
    
    schedule(() => {
      addAgentResponse(
        'Would you like to create a delivery account for this client?',
        <ChoiceList
          kind="choices"
          title="Delivery Account Setup"
          description="Choose whether to set up delivery account now or later"
          options={[
            {
              id: 'yes',
              label: 'Yes, Create Delivery Account',
              description: 'Set up account limits, revenue requirements, and filtering'
            },
            {
              id: 'no',
              label: 'No, Skip for Now',
              description: 'Create the client without delivery account (can be added later)'
            }
          ]}
          mode="single"
          layout="card"
          onChange={(value) => {
            if (value === 'yes') {
              handleDeliveryAccountSetup();
            } else {
              handleSkipDeliveryAccount();
            }
          }}
          disabled={shouldLockStep('delivery-account-choice')}
          locked={shouldLockStep('delivery-account-choice')}
        />,
        undefined,
        undefined,
        'delivery-account-choice'
      );
    }, 500);
  }, [addSimpleMessage, markStepCompleted, addAgentResponse, completedSteps, currentStep, schedule]);

  const handleDeliveryConfigSubmit = useCallback((config: Record<string, any>) => {
    console.log('🔧 handleDeliveryConfigSubmitDraft called with config:', config);
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
                  fieldId: 'notificationEmail',
                  rule: 'regex' as const,
                  pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
                  message: 'Please enter a valid email address'
                }
              ]}
              submitLabel="Continue to Delivery Account"
              onSubmit={handleConfigurationSubmit}
              disabled={shouldLockStep('configuration')}
              locked={shouldLockStep('configuration')}
            />
          ),
          stepId: 'configuration'
        }
      );
    }, 500);
  }, [addMessage, markStepCompleted, completedSteps, currentStep, schedule]);

  const handleConfigurationSubmit = useCallback((configData: Record<string, any>) => {
    addSimpleMessage('Delivery settings saved', 'user');
    markStepCompleted('configuration');
    setCurrentStep('delivery-account-choice');
    
    schedule(() => {
      // Step 4: Delivery Account Setup  
      addAgentResponse(
        'Would you like to create a delivery account for this client? This will define how leads are allocated and delivered.',
        <ChoiceList
          kind="choices"
          title="Delivery Account Setup"
          description="Choose whether to set up delivery account now or later"
          options={[
            {
              id: 'yes',
              label: 'Yes, Create Delivery Account',
              description: 'Set up account limits, revenue requirements, and filtering'
            },
            {
              id: 'no',
              label: 'No, Skip for Now',
              description: 'Create the client without delivery account (can be added later)'
            }
          ]}
          mode="single"
          layout="card"
          onChange={(value) => {
            if (value === 'yes') {
              handleDeliveryAccountSetup();
            } else {
              handleSkipDeliveryAccount();
            }
          }}
          disabled={shouldLockStep('delivery-account-choice')}
          locked={shouldLockStep('delivery-account-choice')}
        />,
        undefined,
        undefined,
        'delivery-account-choice'
      );
    }, 500);
  }, [addSimpleMessage, markStepCompleted, addAgentResponse, currentStep, schedule]);

  const handleDeliveryAccountSetup = useCallback(() => {
    addSimpleMessage('Yes, Create Delivery Account', 'user');
    markStepCompleted('delivery-account-choice');
    setCurrentStep('quantity-limits-question');
    
    schedule(() => {
      // Auto-generate account name, then ask about quantity limits
      addAgentResponse(
        'I\'ll auto-generate the account name as "TechCorp_Email". Are there any quantity limits for this account?',
        <ChoiceList
          kind="choices"
          title="Quantity Limits"
          description="Set limits on lead delivery volume"
          options={[
            {
              id: 'yes',
              label: 'Yes, Set Limits',
              description: 'Configure hourly, daily, weekly, or monthly limits'
            },
            {
              id: 'no',
              label: 'No Limits',
              description: 'Allow unlimited lead delivery'
            }
          ]}
          mode="single"
          layout="card"
          onChange={(value) => handleQuantityLimitsChoice(value as string)}
          disabled={shouldLockStep('quantity-limits-question')}
          locked={shouldLockStep('quantity-limits-question')}
        />,
        undefined,
        undefined,
        'quantity-limits-question'
      );
    }, 500);
  }, [addAgentResponse, markStepCompleted, completedSteps, currentStep, schedule]);

  const handleQuantityLimitsChoice = useCallback((choice: string) => {
    addSimpleMessage(choice === 'yes' ? 'Yes, Set Limits' : 'No Limits', 'user');
    markStepCompleted('quantity-limits-question');
    setCurrentStep(choice === 'yes' ? 'quantity-limits-details' : 'exclusive-delivery-question');
    
    schedule(() => {
      if (choice === 'yes') {
        // Show limits form then continue
        addMessage(
          'Configure the quantity limits for this account.',
          'assistant',
          {
            component: (
              <Form
                kind="form"
                title="Quantity Limits"
                description="Set delivery volume limits (leave empty for no limit)"
                fields={[
                  {
                    id: 'dailyLimit',
                    label: 'Daily Limit',
                    type: 'number' as const,
                    value: 50,
                    min: 0,
                    required: true
                  },
                  {
                    id: 'hourlyLimit',
                    label: 'Hourly Limit (optional)',
                    type: 'number' as const,
                    min: 0,
                    placeholder: 'Leave empty for no limit'
                  },
                  {
                    id: 'weeklyLimit',
                    label: 'Weekly Limit (optional)',
                    type: 'number' as const,
                    min: 0,
                    placeholder: 'Leave empty for no limit'
                  },
                  {
                    id: 'monthlyLimit',
                    label: 'Monthly Limit (optional)',
                    type: 'number' as const,
                    min: 0,
                    placeholder: 'Leave empty for no limit'
                  }
                ]}
                submitLabel="Continue"
                onSubmit={() => handleQuantityLimitsSubmit()}
                disabled={false}
                locked={false}
              />
            ),
            stepId: 'quantity-limits-details'
          }
        );
      } else {
        handleExclusiveDeliveryQuestion();
      }
    }, 500);
  }, [addSimpleMessage, markStepCompleted, addMessage, schedule, shouldLockStep]);

  const handleQuantityLimitsSubmit = useCallback(() => {
    addSimpleMessage('Quantity limits saved', 'user');
    markStepCompleted('quantity-limits-details');
    setCurrentStep('exclusive-delivery-question');
    handleExclusiveDeliveryQuestion();
  }, [addSimpleMessage, markStepCompleted, setCurrentStep]);

  const handleExclusiveDeliveryQuestion = useCallback(() => {
    schedule(() => {
      addAgentResponse(
        'Should this be an exclusive delivery?',
        <ChoiceList
          kind="choices"
          title="Exclusive Delivery"
          description="Control lead distribution exclusivity"
          options={[
            {
              id: 'yes',
              label: 'Yes, Exclusive',
              description: 'No other client receives leads from this batch'
            },
            {
              id: 'no',
              label: 'No, Shared',
              description: 'Other clients can receive leads from the same batch'
            }
          ]}
          mode="single"
          layout="card"
          onChange={(value) => handleExclusiveDeliveryChoice(value as string)}
          disabled={shouldLockStep('exclusive-delivery-question')}
          locked={shouldLockStep('exclusive-delivery-question')}
        />,
        undefined,
        undefined,
        'exclusive-delivery-question'
      );
    }, 500);
  }, [addAgentResponse, completedSteps, currentStep, schedule]);

  const handleExclusiveDeliveryChoice = useCallback((choice: string) => {
    addSimpleMessage(choice === 'yes' ? 'Yes, Exclusive' : 'No, Shared', 'user');
    markStepCompleted('exclusive-delivery-question');
    setCurrentStep('order-system-question');
    
    schedule(() => {
      addAgentResponse(
        'Should this account use the order system?',
        <ChoiceList
          kind="choices"
          title="Order System"
          description="Control how leads are allocated to this account"
          options={[
            {
              id: 'yes',
              label: 'Yes, Use Orders',
              description: 'Must create orders for client to receive leads'
            },
            {
              id: 'no',
              label: 'No, Automatic',
              description: 'Automatically allocate leads without orders'
            }
          ]}
          mode="single"
          layout="card"
          onChange={(value) => handleOrderSystemChoice(value as string)}
          disabled={shouldLockStep('order-system-question')}
          locked={shouldLockStep('order-system-question')}
        />,
        undefined,
        undefined,
        'order-system-question'
      );
    }, 500);
  }, [addSimpleMessage, markStepCompleted, addAgentResponse, completedSteps, currentStep, schedule]);

  const handleOrderSystemChoice = useCallback((choice: string) => {
    addSimpleMessage(choice === 'yes' ? 'Yes, Use Orders' : 'No, Automatic', 'user');
    markStepCompleted('order-system-question');
    setCurrentStep('revenue-requirements-question');
    
    schedule(() => {
      if (choice === 'yes') {
        addSimpleMessage('Great! Remember: You must create an order for this client to receive leads.', 'assistant');
        
        schedule(() => {
          handleRevenueRequirementsQuestion();
        }, 800);
      } else {
        handleRevenueRequirementsQuestion();
      }
    }, 500);
  }, [addSimpleMessage, markStepCompleted, addAgentResponse, schedule]);

  const handleRevenueRequirementsQuestion = useCallback(() => {
    schedule(() => {
      addAgentResponse(
        'Are there any revenue requirements?',
        <ChoiceList
          kind="choices"
          title="Revenue Requirements"
          description="Set minimum revenue and profit thresholds"
          options={[
            {
              id: 'yes',
              label: 'Yes, Set Requirements',
              description: 'Configure minimum revenue and profit requirements'
            },
            {
              id: 'no',
              label: 'No Requirements',
              description: 'Accept leads regardless of revenue potential'
            }
          ]}
          mode="single"
          layout="card"
          onChange={(value) => handleRevenueRequirementsChoice(value as string)}
          disabled={shouldLockStep('revenue-requirements-question')}
          locked={shouldLockStep('revenue-requirements-question')}
        />,
        undefined,
        undefined,
        'revenue-requirements-question'
      );
    }, 500);
  }, [addAgentResponse, completedSteps, currentStep, schedule]);

  const handleRevenueRequirementsChoice = useCallback((choice: string) => {
    addSimpleMessage(choice === 'yes' ? 'Yes, Set Requirements' : 'No Requirements', 'user');
    markStepCompleted('revenue-requirements-question');
    setCurrentStep(choice === 'yes' ? 'revenue-requirements-details' : 'criteria-question');
    
    schedule(() => {
      if (choice === 'yes') {
        addMessage(
          'Configure revenue requirements for this account.',
          'assistant',
          {
            component: (
              <Form
                kind="form"
                title="Revenue Requirements"
                description="Set minimum revenue and profit thresholds"
                fields={[
                  {
                    id: 'minRevenue',
                    label: 'Minimum Revenue ($)',
                    type: 'number' as const,
                    min: 0,
                    placeholder: 'e.g., 25'
                  },
                  {
                    id: 'minProfitAmount',
                    label: 'Minimum Profit Amount ($)',
                    type: 'number' as const,
                    min: 0,
                    placeholder: 'e.g., 10'
                  },
                  {
                    id: 'minProfitPercent',
                    label: 'Minimum Profit Percentage (%)',
                    type: 'number' as const,
                    min: 0,
                    max: 100,
                    placeholder: 'e.g., 40'
                  }
                ]}
                submitLabel="Continue"
                onSubmit={() => handleRevenueRequirementsSubmit()}
                disabled={false}
                locked={false}
              />
            ),
            stepId: 'revenue-requirements-details'
          }
        );
      } else {
        handleCriteriaQuestion();
      }
    }, 500);
  }, [addSimpleMessage, markStepCompleted, addMessage, schedule, shouldLockStep]);

  const handleRevenueRequirementsSubmit = useCallback(() => {
    addSimpleMessage('Revenue requirements saved', 'user');
    markStepCompleted('revenue-requirements-details');
    setCurrentStep('criteria-question');
    handleCriteriaQuestion();
  }, [addSimpleMessage, markStepCompleted, setCurrentStep]);

  const handleCriteriaQuestion = useCallback(() => {
    schedule(() => {
      addAgentResponse(
        'Would you like to apply any criteria (e.g., state, zip, or lead field filters)?',
        <ChoiceList
          kind="choices"
          title="Lead Criteria & Filtering"
          description="Apply filters to control which leads this account receives"
          options={[
            {
              id: 'yes',
              label: 'Yes, Add Filters',
              description: 'Configure geographic or field-based filtering'
            },
            {
              id: 'no',
              label: 'No Filters',
              description: 'Accept all leads that meet other requirements'
            }
          ]}
          mode="single"
          layout="card"
          onChange={(value) => handleCriteriaChoice(value as string)}
          disabled={shouldLockStep('criteria-question')}
          locked={shouldLockStep('criteria-question')}
        />,
        undefined,
        undefined,
        'criteria-question'
      );
    }, 500);
  }, [addAgentResponse, completedSteps, currentStep, schedule]);

  const handleCriteriaChoice = useCallback((choice: string) => {
    addSimpleMessage(choice === 'yes' ? 'Yes, Add Filters' : 'No Filters', 'user');
    markStepCompleted('criteria-question');
    setCurrentStep(choice === 'yes' ? 'criteria-details' : 'delivery-account-creation');
    
    schedule(() => {
      if (choice === 'yes') {
        addMessage(
          'Configure lead criteria and filtering for this account.',
          'assistant',
          {
            component: (
              <Form
                kind="form"
                title="Lead Criteria & Filtering"
                description="Set up geographic and field-based filters"
                fields={[
                  {
                    id: 'stateFilter',
                    label: 'State Filters (optional)',
                    type: 'text' as const,
                    placeholder: 'e.g., CA, NY, TX (comma-separated)'
                  },
                  {
                    id: 'zipFilter',
                    label: 'ZIP Code Filters (optional)',
                    type: 'text' as const,
                    placeholder: 'e.g., 90210, 10001, 78701'
                  },
                  {
                    id: 'leadFieldFilters',
                    label: 'Additional Field Filters (optional)',
                    type: 'text' as const,
                    placeholder: 'e.g., property_type=residential, age>=25'
                  }
                ]}
                submitLabel="Create Delivery Account"
                onSubmit={() => handleDeliveryAccountSubmit()}
                disabled={false}
                locked={false}
              />
            ),
            stepId: 'criteria-details'
          }
        );
      } else {
        handleDeliveryAccountSubmit();
      }
    }, 500);
  }, [addSimpleMessage, markStepCompleted, addMessage, schedule, shouldLockStep]);

  const handleDeliveryAccountSubmit = useCallback((accountData?: Record<string, any>) => {
    addSimpleMessage('Delivery account created', 'user');
    // Mark criteria-details as completed if we're coming from that step
    if (currentStep === 'criteria-details') {
      markStepCompleted('criteria-details');
    }
    markStepCompleted('delivery-account');
    setCurrentStep('creation');
    
    schedule(() => {
      // Add processing message
      addProcessingMessage(
        'Creating client and delivery account...',
        'Setting up complete lead delivery system...'
      );
      
      schedule(() => {
        addAgentResponse(
          'Client and delivery account created successfully! Your complete lead delivery system is now active.',
          <SummaryCard
            kind="summary"
            title="Client Created Successfully"
            items={[
              {
                id: 'client-created',
                title: 'TechCorp Solutions',
                subtitle: 'CL-001',
                status: 'success' as const,
                link: {
                  href: '/clients/CL-001',
                  label: 'Open'
                }
              }
            ]}
          />,
          [
            {
              id: 'create-another',
              label: 'Create Another Client',
              variant: 'outline' as const,
              onClick: () => startNewFlow('create-new-client-draft')
            },
            {
              id: 'back-home',
              label: 'Back to Tools',
              variant: 'outline' as const,
              onClick: () => {
                if (onStartOver) {
                  onStartOver();
                } else {
                  // Fallback: Reset flow state locally
                  resetSession();
                  setCompletedSteps(new Map());
                  setCurrentStep(null);
                  setCurrentFlow(null);
                  setFlowActive(false);
                  setShowWelcome(true);
                  setSelectedActions(new Set());
                  clearDerivedValues();
                }
              }
            }
          ],
          undefined, // sources
          'creation' // stepId
        );
        
        markStepCompleted('creation');
        setFlowActive(false);
      }, 2500);
    }, 500);
  }, [addSimpleMessage, markStepCompleted, addAgentResponse, addProcessingMessage, schedule, handleToolSelection, handleStartOver, currentStep]);

  const handleSkipDeliveryAccount = useCallback(() => {
    addSimpleMessage('No, Skip for Now', 'user');
    markStepCompleted('delivery-account-choice');
    setCurrentStep('creation');
    
    schedule(() => {
      addAgentResponse(
        'No problem! The client has been created without a delivery account. You can set up delivery accounts later from the client management screen.',
        <Alert
          kind="alert"
          type="info"
          title="Client Created"
          message="TechCorp Solutions has been added to your system. To receive leads, you'll need to create a delivery account later."
        />,
        [
          {
            id: 'create-another',
            label: 'Create Another Client',
            variant: 'outline' as const,
            onClick: () => handleToolSelection('create-new-client-draft')
          },
          {
            id: 'back-home',
            label: 'Back to Tools',
            variant: 'outline' as const,
            onClick: () => handleStartOver()
          }
        ]
      );
      
      setFlowActive(false);
    }, 500);
  }, [addSimpleMessage, addAgentResponse, schedule, handleToolSelection, handleStartOver]);

  const handleClientCreation = useCallback(() => {
    addSimpleMessage('Create Client', 'user');
    markStepCompleted('configuration');
    setCurrentStep('creation');
    
    addProcessingMessage('Creating client in LeadExec...');
    
    schedule(() => {
      markStepCompleted('creation');
      setCurrentStep('review');
      
      schedule(() => {
        addAgentResponse(
          '✅ Client created successfully! Your client is now active in LeadExec.',
          <SummaryCard
            kind="summary"
            title="Client Creation Summary"
            status="success"
            items={[
              { label: 'Company', value: 'Acme Corp' },
              { label: 'Status', value: 'Active' },
              { label: 'Client ID', value: 'CL-2024-001' },
              { label: 'Delivery Method', value: 'Email' },
              { label: 'Portal Access', value: 'Enabled' }
            ]}
          />,
          [
            {
              id: 'create-another',
              label: 'Create Another Client',
              variant: 'outline' as const,
              onClick: () => startNewFlow('create-new-client-draft')
            },
            {
              id: 'back-home',
              label: 'Back to Tools',
              variant: 'ghost' as const,
              onClick: () => handleStartOver()
            }
          ]
        );
        
        markStepCompleted('review');
        setFlowActive(false);
      }, 300);
    }, 1500);
  }, [addSimpleMessage, markStepCompleted, addAgentResponse, addProcessingMessage, schedule, handleToolSelection, handleStartOver]);

  const handleBulkUpload = useCallback(() => {

    addMessage(
      'I\'ll help you upload multiple clients at once using an Excel file. The system will parse your data, validate it, and automatically generate secure credentials for each client.',
      'assistant',
      {
        component: (
          <div className="space-y-4">
            <Steps
              kind="steps"
              variant="overview"
              steps={BULK_UPLOAD_STEPS}
              title="Bulk Client Upload Process"
              showIndex={true}
              locked={shouldLockStep('overview')}
            />
            <Button 
              onClick={() => proceedToTemplate()} 
              className="gap-2 font-medium"
              disabled={shouldLockStep('overview')}
            >
              <ArrowRight className="w-4 h-4" />
              Start Upload
            </Button>
          </div>
        ),
        stepId: 'overview'
      }
    );
  }, [addMessage, shouldLockStep]);

  const proceedToTemplate = useCallback(() => {
    addSimpleMessage('Start Upload', 'user');
    
    // Mark overview as completed  
    markStepCompleted('overview');
    setCurrentStep('template');
    
    schedule(() => {
      addAgentResponse(
        'First, you\'ll need the Excel template to format your client data correctly. The template includes all required fields and formatting guidelines.',
        <div className="space-y-6">
          <Alert
            kind="alert"
            type="info"
            title="Template Requirements"
            message="The Excel template contains required columns for company name, contact information, and delivery preferences. Each row represents one client."
          />
          <div className="flex gap-3">
            <Button 
              onClick={() => handleTemplateDownload()}
              className="gap-2 font-medium"
            >
              <Download className="w-4 h-4" />
              Download Template
            </Button>
            <Button 
              variant="outline"
              onClick={() => proceedToUpload()}
              className="font-medium"
            >
              I Have Template
            </Button>
          </div>
        </div>,
        undefined, // suggestedActions
        undefined, // sources
        'template' // stepId
      );
    }, 500);
  }, [addSimpleMessage, markStepCompleted, addAgentResponse, schedule]);

  const handleTemplateDownload = useCallback(() => {
    addSimpleMessage('Download Template', 'user');
    
    // Simulate template download
    schedule(() => {
      addAgentResponse(
        'Template downloaded successfully! Fill in your client data and return here when ready to upload.',
        <div className="flex gap-3">
          <Button 
            onClick={() => proceedToUpload()}
            className="gap-2 font-medium"
          >
            <ArrowRight className="w-4 h-4" />
            Ready to Upload
          </Button>
        </div>,
        undefined, // suggestedActions  
        undefined, // sources
        'template' // stepId
      );
    }, 1000);
  }, [addSimpleMessage, addAgentResponse, schedule]);

  const proceedToUpload = useCallback(() => {
    addSimpleMessage('Ready to Upload', 'user');
    
    // Mark template as completed
    markStepCompleted('template');
    setCurrentStep('upload');
    
    schedule(() => {
      addAgentResponse(
        'Perfect! Now upload your completed Excel file. The system will validate the format and data before processing.',
        <FileDrop
          kind="filedrop"
          title="Upload Client Data"
          description="Select your completed Excel file with client information"
          accept=".xlsx,.xls,.csv"
          multiple={false}
          maxSizeMb={10}
          onUploadStart={(files) => handleFileUploadStart(files[0])}
          disabled={shouldLockStep('upload')}
          locked={shouldLockStep('upload')}
        />,
        undefined, // suggestedActions
        undefined, // sources  
        'upload' // stepId
      );
    }, 500);
  }, [addSimpleMessage, markStepCompleted, addAgentResponse, completedSteps, currentStep, schedule]);

  const handleFileUploadStart = useCallback((file: File) => {
    addSimpleMessage(`Uploaded: ${file.name}`, 'user');
    
    // Mark upload as completed
    markStepCompleted('upload');
    setCurrentStep('validation');
    
    schedule(() => {
      addAgentResponse(
        'File uploaded successfully! Now validating the data format and checking for any issues...',
        <ProcessState
          kind="process-state"
          title="Validating Data"
          state="processing"
          detail="Checking file format and required fields..."
          disabled={shouldLockStep('validation')}
          locked={shouldLockStep('validation')}
        />,
        undefined, // suggestedActions
        undefined, // sources
        'validation' // stepId  
      );
      
      // Simulate validation process
      schedule(() => {
        handleValidationComplete();
      }, 3000);
    }, 500);
  }, [addSimpleMessage, markStepCompleted, addAgentResponse, completedSteps, currentStep, schedule]);

  const handleValidationComplete = useCallback(() => {
    // Mark validation as completed
    markStepCompleted('validation');
    setCurrentStep('processing');
    
    schedule(() => {
      addAgentResponse(
        'Validation successful! Found 25 clients ready for processing. Now creating accounts and generating credentials...',
        <div className="space-y-4">
          <Alert
            kind="alert" 
            type="success"
            title="Validation Complete"
            message="All client data validated successfully. No errors found."
          />
          <Steps
            kind="steps"
            variant="progress" 
            title="Processing Clients"
            steps={[
              { id: 'validate', title: 'Validating file format' },
              { id: 'parse', title: 'Parsing client data' },
              { id: 'create', title: 'Creating client accounts' },
              { id: 'generate', title: 'Generating credentials' },
              { id: 'notify', title: 'Sending welcome emails' }
            ]}
            status={{
              'validate': 'done',
              'parse': 'current', 
              'create': 'todo',
              'generate': 'todo',
              'notify': 'todo'
            }}
            current="parse"
            disabled={shouldLockStep('processing')}
            locked={shouldLockStep('processing')}
          />
        </div>,
        undefined, // suggestedActions
        undefined, // sources
        'processing' // stepId
      );
      
      // Simulate processing steps
      let stepIndex = 1;
      const steps = ['parse', 'create', 'generate', 'notify'];
      const processInterval = setInterval(() => {
        if (stepIndex < steps.length) {
          stepIndex++;
          if (stepIndex === steps.length) {
            clearInterval(processInterval);
            handleProcessingComplete();
          }
        }
      }, 1500);
    }, 500);
  }, [markStepCompleted, addAgentResponse, completedSteps, currentStep, schedule]);

  const handleProcessingComplete = useCallback(() => {
    // Mark processing as completed
    markStepCompleted('processing');
    setCurrentStep('completion');
    
    schedule(() => {
      addAgentResponse(
        'Bulk client upload completed successfully! All clients have been created with secure credentials and welcome emails sent.',
        <div className="space-y-4">
          <Alert
            kind="alert"
            type="success"
            title="Upload Complete!"
            message="All 25 clients have been successfully created and configured."
          />
          
          <SummaryCard
            kind="summary"
            title="Upload Results"
            items={[
              {
                id: 'total',
                title: 'Total Clients Processed',
                subtitle: '25 clients',
                status: 'success' as const,
                message: 'All clients successfully created'
              },
              {
                id: 'credentials',
                title: 'Credentials Generated',
                subtitle: '25 unique sets',
                status: 'success' as const,
                message: 'Secure usernames and passwords generated'
              },
              {
                id: 'emails',
                title: 'Welcome Emails Sent',
                subtitle: '25 emails delivered',
                status: 'success' as const,
                message: 'Clients notified with login details'
              }
            ]}
            actions={[
              { id: 'download-report', label: 'Download Report', variant: 'outline' },
              { id: 'view-clients', label: 'View All Clients', variant: 'outline' }
            ]}
            onAction={(actionId) => {
              if (actionId === 'download-report') {
                addSimpleMessage('Download Report', 'user');
              } else if (actionId === 'view-clients') {
                addSimpleMessage('View All Clients', 'user');
              }
            }}
          />
        </div>,
        [
          {
            id: 'create-another', 
            label: 'Create Another Client',
            variant: 'outline' as const,
            onClick: () => handleToolSelection('create-new-client')
          },
          {
            id: 'bulk-upload-more',
            label: 'Upload More Clients', 
            variant: 'outline' as const,
            onClick: () => handleToolSelection('bulk-client-upload')
          }
        ],
        undefined, // sources
        'completion' // stepId
      );
      
      // Mark completion and finish flow
      schedule(() => {
        markStepCompleted('completion');
        setCurrentFlow(null);
        setFlowActive(false);
      }, 1000);
    }, 500);
  }, [markStepCompleted, addAgentResponse, addSimpleMessage, handleToolSelection, schedule]);


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
              className="transition-all duration-300"
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
                    
                    {message.component && message.stepId === 'setup-overview' ? (
                      // Render the setup overview dynamically with current locking state
                      <div className={`mt-4 sm:mt-6 ${shouldLockStep('setup-overview') ? 'opacity-60 pointer-events-none' : ''}`}>
                        <div className="border rounded-lg p-4 sm:p-6 bg-card shadow-sm">
                          <div className="space-y-4">
                            <Steps
                              kind="steps"
                              variant="overview"
                              steps={CLIENT_SETUP_STEPS}
                              title="Client Setup Process (Draft)"
                              showIndex={true}
                              locked={shouldLockStep('setup-overview')}
                            />
                            <Button 
                              onClick={() => proceedToBasicInfo()} 
                              className="gap-2 font-medium"
                              disabled={shouldLockStep('setup-overview')}
                            >
                              <ArrowRight className="w-4 h-4" />
                              Start Setup
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : message.component && message.stepId === 'basic-info' ? (
                      // Render the basic info form dynamically with current derived values
                      <div className={`mt-4 sm:mt-6 ${shouldLockStep('basic-info') ? 'opacity-60 pointer-events-none' : ''}`}>
                        <div className="border rounded-lg p-4 sm:p-6 bg-card shadow-sm">
                          <Form
                            kind="form"
                            title="Client Information"
                            description="Basic client details and auto-generated credentials"
                            sections={[
                              { 
                                id: 'basic', 
                                fields: [
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
                                    placeholder: 'client@example.com' 
                                  }
                                ]
                              },
                              {
                                id: 'credentials',
                                title: 'Client Credentials', 
                                description: 'Username and password will be auto-generated when you enter a valid email',
                                fields: [
                                  {
                                    id: 'username',
                                    label: 'Username',
                                    type: 'text' as const,
                                    placeholder: 'Will be generated from email address',
                                    value: ''
                                  },
                                  {
                                    id: 'tempPassword',
                                    label: 'Password',
                                    type: 'text' as const,
                                    placeholder: 'Will be auto-generated securely',
                                    value: ''
                                  }
                                ]
                              }
                            ]}
                            validations={[
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
                            ]}
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
                            onRequestDerive={handleDerive}
                            derivedValues={derivedValues}
                            disabled={shouldLockStep('basic-info')}
                            locked={shouldLockStep('basic-info')}
                          />
                        </div>
                      </div>
                    ) : message.component && message.stepId === 'overview' ? (
                      // Render the bulk upload overview dynamically with current locking state  
                      <div className={`mt-4 sm:mt-6 ${shouldLockStep('overview') ? 'opacity-60 pointer-events-none' : ''}`}>
                        <div className="border rounded-lg p-4 sm:p-6 bg-card shadow-sm">
                          <div className="space-y-4">
                            <Steps
                              kind="steps"
                              variant="overview"
                              steps={BULK_UPLOAD_STEPS}
                              title="Bulk Client Upload Process"
                              showIndex={true}
                              locked={shouldLockStep('overview')}
                            />
                            <Button 
                              onClick={() => proceedToTemplate()} 
                              className="gap-2 font-medium"
                              disabled={shouldLockStep('overview')}
                            >
                              <ArrowRight className="w-4 h-4" />
                              Start Upload
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : message.component && (
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
                        
                        // Determine if this module should be locked
                        // Never lock help-sources or completion summaries
                        const neverLockTypes = ['help-sources', 'summary'];
                        const shouldLock = message.stepId && shouldLockStep(message.stepId) && !neverLockTypes.includes(componentType);
                        
                        // Clone component with updated locking props if needed
                        let componentToRender = message.component;
                        if (shouldLock && React.isValidElement(message.component)) {
                          // If it's a wrapper div with children, we need to update the children
                          if (message.component.type === 'div' && message.component.props?.children) {
                            const children = React.Children.map(message.component.props.children, (child) => {
                              if (React.isValidElement(child)) {
                                // Update Steps components
                                if (child.type === Steps || (child.type as any)?.name === 'Steps') {
                                  return React.cloneElement(child as any, { locked: true, disabled: true });
                                }
                                // Update Button components
                                if (child.type === Button || (child.type as any)?.name === 'Button' || child.props?.className?.includes('gap-2')) {
                                  return React.cloneElement(child as any, { disabled: true });
                                }
                              }
                              return child;
                            });
                            componentToRender = React.cloneElement(message.component as any, {}, children);
                          } else {
                            // Direct component, just add locking props
                            componentToRender = React.cloneElement(message.component as any, { 
                              locked: true, 
                              disabled: true 
                            });
                          }
                        }
                        
                        return (
                          <div className={`mt-4 sm:mt-6 ${shouldLock ? 'opacity-60 pointer-events-none' : ''}`}>
                            {needsWrapper ? (
                              <div className="border rounded-lg p-4 sm:p-6 bg-card shadow-sm">
                                {componentToRender}
                              </div>
                            ) : (
                              componentToRender
                            )}
                          </div>
                        );
                      })()
                    )}
                    
                    {/* Suggested Actions - only for assistant messages */}
                    {message.sender === 'assistant' && message.suggestedActions && message.suggestedActions.length > 0 && (
                      (() => {
                        const componentType = (message.component as any)?.props?.kind;
                        const neverLockTypes = ['help-sources', 'summary'];
                        
                        // Check if any suggested action in this message has been selected
                        const hasSelectedAction = message.suggestedActions?.some(action => 
                          action.selected || selectedActions.has(action.id)
                        );
                        
                        // Universal locking: if ANY action has been selected anywhere, lock all other action groups
                        const hasAnyActionSelected = selectedActions.size > 0;
                        
                        // Lock suggested actions if:
                        // 1. Step is completed, OR
                        // 2. Any action in this message has been triggered, OR  
                        // 3. Any action anywhere has been selected (universal locking)
                        const shouldLockActions = (
                          (message.stepId && shouldLockStep(message.stepId)) || 
                          hasSelectedAction ||
                          (hasAnyActionSelected && !hasSelectedAction)
                        ) && !neverLockTypes.includes(componentType);
                        
                        return (
                          <div className={`mt-4 ${shouldLockActions ? 'opacity-60 pointer-events-none' : ''}`}>
                            <div className="flex flex-wrap gap-2">
                              {message.suggestedActions.map((action) => {
                                const isSelected = action.selected || selectedActions.has(action.id);
                                
                                return (
                                  <Button
                                    key={action.id}
                                    variant={action.variant || 'outline'}
                                    size="sm"
                                    className={`h-8 text-xs gap-2 transition-all duration-300 ${
                                      isSelected 
                                        ? shouldLockActions 
                                          ? 'border-primary bg-primary/20 text-primary font-medium scale-95 ring-2 ring-primary/20'
                                          : 'border-primary bg-primary/10 text-primary hover:bg-primary/15 opacity-70 scale-95'
                                        : shouldLockActions 
                                          ? 'opacity-50' 
                                          : 'hover:bg-accent'
                                    }`}
                                    disabled={action.disabled || shouldLockActions}
                                    onClick={() => handleSuggestedActionClick(action.id, action.onClick)}
                                  >
                                    {action.icon && action.icon}
                                    {action.label}
                                  </Button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()
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
              placeholder={isProcessing ? 'Please wait...' : 'Ask me...'}
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