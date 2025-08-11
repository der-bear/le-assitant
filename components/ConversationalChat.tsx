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
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
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
    setCompletedSteps(new Set());
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
      {/* Quick Tiles Grid - responsive 2x2 grid layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 md:gap-4">
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
    } else if (flowId === 'create-new-client-draft') {
      handleClientSetupDraft();
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
    setCompletedSteps(prev => new Set([...prev, stepId]));
  }, []);

  // Helper to handle suggested action clicks with locking and selection logic
  const handleSuggestedActionClick = useCallback((actionId: string, originalOnClick: () => void) => {
    // Prevent click if flow is active and this isn't a welcome message action
    if (flowActive) return;
    
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
          onRequestDerive={handleDerive}
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

  // Update messages when derived values change
  useEffect(() => {
    if (Object.keys(derivedValues).length > 0) {
      setMessages(prev => prev.map(msg => {
        if (msg.stepId === 'basic-info' && msg.component) {
          console.log('🔄 Updating form message with derived values:', derivedValues);
          return {
            ...msg,
            component: React.cloneElement(msg.component as React.ReactElement, {
              derivedValues
            })
          };
        }
        return msg;
      }));
    }
  }, [derivedValues]);

  const handleBasicInfoSubmit = useCallback((data: Record<string, any>) => {
    addSimpleMessage(`Company: ${data.companyName}, Email: ${data.email}`, 'user');
    
    // Clear derived values after submit
    clearDerivedValues();
    
    // Mark basic info step as completed
    markStepCompleted('basic-info');
    setCurrentStep('delivery-method');
    
    schedule(() => {

      addMessage(
        `Perfect! I've got the client information for ${data.companyName}. Now let's choose how leads will be delivered:`,
        'assistant',
        {
          component: (
            <ChoiceList
              kind="choices"
              title="Choose Delivery Method"
              description="Select how leads will be sent to your client"
              options={DELIVERY_OPTIONS}
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
    addSimpleMessage(`Selected: ${DELIVERY_METHOD_LABELS[method] || method}`, 'user');
    
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

  const handleAdvancedClientSetup = useCallback(() => {
    addMessage(
      "Welcome! Let's create a new client. Here's what we'll accomplish together:",
      'assistant',
      {
        component: (
          <div className="space-y-4">
            <Steps
              kind="steps"
              variant="overview"
              steps={[]}
              title="Client Setup Process"
              showIndex={true}
              locked={false}
            />
            <div className="text-sm text-muted-foreground space-y-1">
              <div>• Gather basic client information</div>
              <div>• Configure delivery settings</div>
              <div>• Generate secure credentials</div>
              <div>• Review and activate the client</div>
            </div>
            <Button 
              onClick={() => proceedToAdvancedBasicInfo()} 
              className="gap-2 font-medium"
              disabled={false}
            >
              <ArrowRight className="w-4 h-4" />
              Begin Setup
            </Button>
          </div>
        ),
        stepId: 'advanced-overview'
      }
    );
  }, [addMessage]);

  const proceedToAdvancedBasicInfo = useCallback(() => {
    addSimpleMessage('Begin Setup', 'user');
    markStepCompleted('advanced-overview');
    setCurrentStep('adv-basic-info');
    
    schedule(() => {
      const basicFields: FormField[] = [
        {
          id: 'companyName',
          label: 'Company Name',
          type: 'text',
          required: true,
          placeholder: 'e.g., CPS'
        },
        {
          id: 'contactEmail',
          label: 'Contact Email',
          type: 'email',
          required: true,
          placeholder: 'e.g., client@example.com'
        }
      ];

      const credentialsSection: FormSection = {
        id: 'credentials',
        title: 'Auto-Generated Credentials',
        description: 'Secure login details will be auto-generated from your email',
        fields: [
          {
            id: 'username',
            label: 'Username',
            type: 'text',
            value: '',
            required: false,
            placeholder: 'Will be generated from email address'
          },
          {
            id: 'tempPassword',
            label: 'Temporary Password',
            type: 'text',
            value: '',
            required: false,
            placeholder: 'Will be auto-generated securely'
          }
        ]
      };

      addAgentResponse(
        "Let's start with the client's basic details. I'll auto-generate secure credentials once you provide:",
        <Form
          kind="form"
          title="Client Information"
          description="Company Name and Contact Email (used for portal access)"
          sections={[
            {
              id: 'basic',
              fields: basicFields
            },
            credentialsSection
          ]}
          validations={[
            { fieldId: 'companyName', rule: 'required', message: 'Company name is required' },
            { fieldId: 'contactEmail', rule: 'required', message: 'Email is required' },
            { fieldId: 'contactEmail', rule: 'regex', pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$', message: 'Please enter a valid email' }
          ]}
          derive={[
            {
              fieldId: 'username',
              from: ['contactEmail'],
              strategy: 'usernameFromEmail',
              editable: true
            },
            {
              fieldId: 'tempPassword',
              from: ['contactEmail'],
              strategy: 'strongPassword',
              editable: true
            }
          ]}
          submitLabel="Continue to Delivery Method"
          onSubmit={handleAdvancedBasicInfoSubmit}
          onRequestDerive={handleDerive}
          derivedValues={derivedValues}
          disabled={completedSteps.has('adv-basic-info') && currentStep !== 'adv-basic-info'}
          locked={completedSteps.has('adv-basic-info') && currentStep !== 'adv-basic-info'}
        />,
        undefined,
        undefined,
        'adv-basic-info'
      );
    }, 500);
  }, [addSimpleMessage, markStepCompleted, addAgentResponse, completedSteps, currentStep, schedule, handleDerive, derivedValues]);

  const handleAdvancedBasicInfoSubmit = useCallback((data: Record<string, any>) => {
    const { companyName, contactEmail } = data;
    addSimpleMessage(`Company: ${companyName}, Email: ${contactEmail}`, 'user');
    
    // Store client email for later use
    console.log('📧 Setting clientEmail to:', contactEmail);
    setClientEmail(contactEmail);
    
    clearDerivedValues();
    markStepCompleted('adv-basic-info');
    setCurrentStep('adv-delivery-method');
    
    schedule(() => {
      addAgentResponse(
        "Now, select how leads will be delivered to this client. You can skip this step and configure later if needed.",
        <ChoiceList
          kind="choices"
          title="Choose Delivery Method"
          options={DELIVERY_OPTIONS}
          mode="single"
          layout="card"
          onChange={(value) => handleAdvancedDeliveryMethodSelect(value as string)}
          disabled={completedSteps.has('adv-delivery-method') && currentStep !== 'adv-delivery-method'}
          locked={completedSteps.has('adv-delivery-method') && currentStep !== 'adv-delivery-method'}
        />,
        undefined,
        undefined,
        'adv-delivery-method'
      );
    }, 500);
  }, [addSimpleMessage, markStepCompleted, addAgentResponse, completedSteps, currentStep, schedule, clearDerivedValues]);

  const handleAdvancedStatusSelect = useCallback((status: string) => {
    addSimpleMessage(`Selected status: ${status}`, 'user');
    markStepCompleted('adv-status-group');
    setCurrentStep('adv-portal-access');
    
    schedule(() => {
      // Generate credentials
      const username = `client_${Date.now().toString(36)}`;
      const tempPassword = `Temp${Math.random().toString(36).substr(2, 8)}!`;
      
      addAgentResponse(
        `Portal access will be created automatically. Login details will be:\n\nUsername: ${username}\nTemporary Password: ${tempPassword}\n\n*Note: The client will need to change the password on first login.*`,
        <Alert
          kind="alert"
          type="info"
          title="Portal Credentials Generated"
          message={`Username: ${username}\nPassword: ${tempPassword}\n\nThese credentials will be sent to the contact email.`}
          disabled={completedSteps.has('adv-portal-access') && currentStep !== 'adv-portal-access'}
          locked={completedSteps.has('adv-portal-access') && currentStep !== 'adv-portal-access'}
        />,
        [
          {
            id: 'continue-delivery',
            label: 'Continue',
            variant: 'default' as const,
            icon: <ArrowRight className="w-4 h-4" />,
            onClick: () => proceedToDeliveryDecision()
          }
        ],
        undefined,
        undefined,
        'adv-portal-access'
      );
    }, 500);
  }, [addSimpleMessage, markStepCompleted, addAgentResponse, schedule]);

  const proceedToDeliveryDecision = useCallback(() => {
    addSimpleMessage('Continue', 'user');
    markStepCompleted('adv-portal-access');
    setCurrentStep('adv-delivery-decision');
    
    schedule(() => {
      const deliveryDecisionOptions = [
        {
          id: 'yes',
          label: 'Yes - Complete full setup',
          description: 'Configure delivery methods and lead settings now',
          icon: 'Settings'
        },
        {
          id: 'no',
          label: 'No - Save client and configure later',
          description: 'Create the client and set up delivery later',
          icon: 'Save'
        }
      ];

      addAgentResponse(
        "Would you like to configure delivery settings now?",
        <ChoiceList
          kind="choices"
          title="Configure Delivery Settings"
          options={deliveryDecisionOptions}
          mode="single"
          layout="simple"
          onChange={(value) => handleDeliveryDecision(value as string)}
          disabled={completedSteps.has('adv-delivery-decision') && currentStep !== 'adv-delivery-decision'}
          locked={completedSteps.has('adv-delivery-decision') && currentStep !== 'adv-delivery-decision'}
        />,
        undefined,
        undefined,
        'adv-delivery-decision'
      );
    }, 500);
  }, [addSimpleMessage, markStepCompleted, addAgentResponse, completedSteps, currentStep, schedule]);

  const handleDeliveryDecision = useCallback((decision: string) => {
    addSimpleMessage(`${decision === 'yes' ? 'Yes - Complete full setup' : 'No - Save and configure later'}`, 'user');
    markStepCompleted('adv-delivery-decision');
    
    if (decision === 'yes') {
      // Continue with delivery configuration
      setCurrentStep('adv-delivery-method');
      
      schedule(() => {
        const deliveryMethods = [
          { id: 'email', label: 'Email', description: 'Simple email delivery', icon: 'Mail' },
          { id: 'webhook', label: 'HTTP Webhook/API', description: 'Real-time API integration', icon: 'Webhook' },
          { id: 'ftp', label: 'FTP', description: 'File transfer protocol', icon: 'Database' },
          { id: 'pingpost', label: 'Ping/Post', description: 'Two-step lead verification', icon: 'Zap' },
          { id: 'portal', label: 'Portal Delivery', description: 'Client portal only', icon: 'Globe' }
        ];

        addAgentResponse(
          "First, let's set up HOW leads will be delivered. What delivery method would you like to use?",
          <ChoiceList
            kind="choices"
            title="Choose Delivery Method"
            options={deliveryMethods}
            mode="single"
            layout="card"
            onChange={(value) => handleAdvancedDeliveryMethodSelect(value as string)}
            disabled={completedSteps.has('adv-delivery-method') && currentStep !== 'adv-delivery-method'}
            locked={completedSteps.has('adv-delivery-method') && currentStep !== 'adv-delivery-method'}
          />,
          undefined,
          undefined,
          'adv-delivery-method'
        );
      }, 500);
    } else {
      // Skip to summary
      proceedToAdvancedSummary(false);
    }
  }, [addSimpleMessage, markStepCompleted, addAgentResponse, completedSteps, currentStep, schedule]);

  const handleAdvancedDeliveryMethodSelect = useCallback((method: string) => {
    const methodLabel = DELIVERY_METHOD_LABELS[method] || method;
    addSimpleMessage(`Selected: ${methodLabel}`, 'user');
    markStepCompleted('delivery-method');
    
    if (method === 'skip') {
      // Skip to review if they chose skip
      proceedToAdvancedReview();
      return;
    }
    
    setCurrentStep('delivery-config');
    
    schedule(() => {
      // Show different form based on delivery method
      let configFields: FormField[] = [];
      let configTitle = '';
      let configDescription = '';
      let suggestedActions: SuggestedAction[] | undefined = undefined;
      
      if (method === 'email') {
        configTitle = 'Email Delivery Configuration';
        configDescription = 'Set up email delivery details';
        configFields = [
          { id: 'recipientEmail', label: 'Recipient Email Address', type: 'email', required: true, placeholder: 'client@example.com' },
          { id: 'format', label: 'Email Format', type: 'select', required: true, value: 'html', options: [
            { value: 'html', label: 'HTML Format' },
            { value: 'text', label: 'Plain Text' }
          ]},
          { id: 'frequency', label: 'Send Frequency', type: 'select', required: true, value: 'realtime', options: [
            { value: 'realtime', label: 'Real-time' },
            { value: 'batch', label: 'Batch (hourly)' }
          ]}
        ];
      } else if (method === 'webhook') {
        configTitle = 'Webhook Configuration';
        configDescription = 'Set up real-time API delivery with testing';
        configFields = [
          { id: 'endpointUrl', label: 'Endpoint URL', type: 'url', required: true, placeholder: 'https://api.example.com/leads' },
          { id: 'authMethod', label: 'Authentication Method', type: 'select', required: true, value: 'apikey', options: [
            { value: 'apikey', label: 'API Key' },
            { value: 'basic', label: 'Basic Auth' },
            { value: 'none', label: 'No Authentication' }
          ]},
          { id: 'apiKey', label: 'API Key', type: 'text', placeholder: 'Enter your API key (if applicable)' }
        ];
        suggestedActions = [
          {
            id: 'test-connection',
            label: 'Test Connection',
            variant: 'outline' as const,
            icon: <ExternalLink className="w-4 h-4" />,
            onClick: () => handleTestConnection()
          }
        ];
      } else if (method === 'ftp') {
        configTitle = 'FTP Configuration';
        configDescription = 'Set up file transfer protocol delivery';
        configFields = [
          { id: 'ftpHost', label: 'FTP Host', type: 'text', required: true, placeholder: 'ftp.example.com' },
          { id: 'ftpUsername', label: 'FTP Username', type: 'text', required: true },
          { id: 'ftpPassword', label: 'FTP Password', type: 'password', required: true },
          { id: 'ftpPath', label: 'Upload Directory', type: 'text', placeholder: '/leads/' }
        ];
      }
      
      addAgentResponse(
        method === 'webhook' 
          ? `Great! Let's configure the webhook. You'll be able to test the connection before we proceed.`
          : `Let's configure ${methodLabel.toLowerCase()} for this client:`,
        <Form
          kind="form"
          title={configTitle}
          description={configDescription}
          fields={configFields}
          submitLabel="Save Configuration"
          onSubmit={(data) => handleAdvancedDeliveryConfigSubmit(method, data)}
          disabled={completedSteps.has('delivery-config') && currentStep !== 'delivery-config'}
          locked={completedSteps.has('delivery-config') && currentStep !== 'delivery-config'}
        />,
        suggestedActions,
        undefined,
        'delivery-config'
      );
    }, 500);
  }, [addSimpleMessage, markStepCompleted, addAgentResponse, completedSteps, currentStep, schedule]);

  const handleTestConnection = useCallback(() => {
    addSimpleMessage('Test connection', 'user');
    
    // Simulate test connection
    addProcessingMessage('Testing webhook connection...');
    
    schedule(() => {
      addAgentResponse(
        '✅ Connection test successful! The webhook endpoint responded correctly. You can now save this configuration.',
        <Alert
          kind="alert"
          type="success"
          title="Connection Test Passed"
          message="The webhook endpoint is reachable and responded with a 200 OK status. The connection is ready for lead delivery."
        />
      );
    }, 1500);
  }, [addSimpleMessage, addProcessingMessage, addAgentResponse, schedule]);

  const handleAdvancedDeliveryConfigSubmit = useCallback((method: string, config: Record<string, any>) => {
    addSimpleMessage('Save Configuration', 'user');
    markStepCompleted('delivery-config');
    
    // Proceed to review
    proceedToAdvancedReview();
  }, [addSimpleMessage, markStepCompleted]);

  const proceedToAdvancedReview = useCallback(() => {
    setCurrentStep('review');
    
    schedule(() => {
      // Review summary with all configured settings
      const reviewSections: FormSection[] = [
        {
          id: 'client-info',
          title: 'Client Information',
          fields: [
            { id: 'companyName', label: 'Company Name', type: 'text', value: 'CPS', disabled: true },
            { id: 'contactEmail', label: 'Contact Email', type: 'email', value: 'client@cps.com', disabled: true }
          ]
        },
        {
          id: 'credentials',
          title: 'Portal Credentials',
          fields: [
            { id: 'username', label: 'Username', type: 'text', value: 'cps_client', disabled: true },
            { id: 'password', label: 'Temporary Password', type: 'text', value: 'Temp123!@#', disabled: true }
          ]
        },
        {
          id: 'delivery',
          title: 'Delivery Configuration',
          fields: [
            { id: 'method', label: 'Delivery Method', type: 'text', value: 'Webhook', disabled: true },
            { id: 'status', label: 'Status', type: 'text', value: 'Configured', disabled: true }
          ]
        }
      ];
      
      const activationOptions = [
        {
          id: 'activate',
          label: 'Activate Now',
          description: 'Client will be active and can receive leads immediately',
          icon: 'CheckCircle'
        },
        {
          id: 'pending',
          label: 'Keep as Pending',
          description: 'Client will be created but inactive until manually activated',
          icon: 'Clock'
        },
        {
          id: 'edit',
          label: 'Edit Configuration',
          description: 'Go back and modify settings before saving',
          icon: 'Edit'
        }
      ];
      
      addAgentResponse(
        "Perfect! Here's a summary of the client configuration. Choose how you'd like to proceed:",
        <div className="space-y-6">
          <Form
            kind="form"
            title="Review Client Configuration"
            description="Verify all settings before creating the client"
            sections={reviewSections}
            submitLabel=""
            disabled={true}
            locked={completedSteps.has('review') && currentStep !== 'review'}
          />
          <ChoiceList
            kind="choices"
            title="Activation Options"
            options={activationOptions}
            mode="single"
            layout="simple"
            onChange={(value) => handleAdvancedActivationChoice(value as string)}
            disabled={completedSteps.has('review') && currentStep !== 'review'}
            locked={completedSteps.has('review') && currentStep !== 'review'}
          />
        </div>,
        undefined,
        undefined,
        'review'
      );
    }, 500);
  }, [addAgentResponse, completedSteps, currentStep, schedule]);

  const handleAdvancedActivationChoice = useCallback((choice: string) => {
    if (choice === 'edit') {
      addSimpleMessage('Edit Configuration', 'user');
      // Reset to basic info step
      setCurrentStep('basic-info');
      setCompletedSteps(new Set());
      proceedToAdvancedBasicInfo();
      return;
    }
    
    const choiceLabel = choice === 'activate' ? 'Activate Now' : 'Keep as Pending';
    addSimpleMessage(choiceLabel, 'user');
    markStepCompleted('review');
    
    // Create success message
    addProcessingMessage('Creating client in LeadExec...');
    
    schedule(() => {
      const status = choice === 'activate' ? 'Active' : 'Pending';
      
      addAgentResponse(
        `✅ Client successfully created! The client is now ${status.toLowerCase()} in LeadExec.`,
        <SummaryCard
          kind="summary"
          title="Client Created Successfully"
          status={choice === 'activate' ? 'success' : 'info'}
          items={[
            { label: 'Company', value: 'CPS' },
            { label: 'Status', value: status },
            { label: 'Portal Access', value: 'Enabled' },
            { label: 'Delivery Method', value: 'Configured' },
            { label: 'Client ID', value: 'CL-2024-0042' }
          ]}
        />,
        [
          {
            id: 'view-client',
            label: 'View Client Details',
            variant: 'default' as const,
            icon: <ExternalLink className="w-4 h-4" />,
            onClick: () => addSimpleMessage('View client details', 'user')
          },
          {
            id: 'create-another',
            label: 'Create Another Client',
            variant: 'outline' as const,
            icon: <Plus className="w-4 h-4" />,
            onClick: () => handleToolSelection('create-new-client')
          },
          {
            id: 'back-to-tools',
            label: 'Back to Tools',
            variant: 'ghost' as const,
            icon: <Home className="w-4 h-4" />,
            onClick: () => handleStartOver()
          }
        ]
      );
      
      // Mark flow as complete
      setFlowActive(false);
    }, 1500);
  }, [addSimpleMessage, markStepCompleted, addProcessingMessage, addAgentResponse, schedule, handleToolSelection, handleStartOver]);

  // ===== DRAFT CLIENT SETUP FLOW =====
  const handleClientSetupDraft = useCallback(() => {
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
              onClick={() => proceedToBasicInfoDraft()} 
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

  const proceedToBasicInfoDraft = useCallback(() => {
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
          onSubmit={handleBasicInfoSubmitDraft}
          onRequestDerive={handleDerive}
          derivedValues={derivedValues}
          disabled={completedSteps.has('basic-info') && currentStep !== 'basic-info'}
          locked={completedSteps.has('basic-info') && currentStep !== 'basic-info'}
        />,
        undefined,
        undefined,
        'basic-info'
      );
    }, 500);
  }, [addSimpleMessage, markStepCompleted, addAgentResponse, completedSteps, currentStep, schedule, handleDerive, derivedValues, clearDerivedValues]);

  const handleBasicInfoSubmitDraft = useCallback((data: Record<string, any>) => {
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
          onChange={(value) => handleDeliveryMethodSelectDraft(value as string)}
          disabled={completedSteps.has('delivery-method') && currentStep !== 'delivery-method'}
          locked={completedSteps.has('delivery-method') && currentStep !== 'delivery-method'}
        />,
        undefined,
        undefined,
        'delivery-method'
      );
    }, 500);
  }, [addSimpleMessage, markStepCompleted, addAgentResponse, completedSteps, currentStep, schedule, clearDerivedValues]);

  const handleDeliveryMethodSelectDraft = useCallback((method: string) => {
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
            onChange={(value) => handleFieldMappingChoiceDraft(value as string)}
            disabled={completedSteps.has('field-mapping') && currentStep !== 'field-mapping'}
            locked={completedSteps.has('field-mapping') && currentStep !== 'field-mapping'}
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
                onSubmit={handleWebhookBasicConfigSubmitDraft}
                disabled={completedSteps.has('webhook-basic') && currentStep !== 'webhook-basic'}
                locked={completedSteps.has('webhook-basic') && currentStep !== 'webhook-basic'}
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
                  <Button onClick={() => handleDeliveryConfigSubmitDraft({ useDefault: true })} className="font-medium">
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
                onSubmit={handleDeliveryConfigSubmitDraft}
                disabled={completedSteps.has('delivery-config') && currentStep !== 'delivery-config'}
                locked={completedSteps.has('delivery-config') && currentStep !== 'delivery-config'}
              />
            ),
            stepId: 'delivery-config'
          }
        );
      } else {
        // Skip delivery configuration
        handleDeliveryConfigSubmitDraft({ skipped: true });
      }
    }, 500);
  }, [addMessage, markStepCompleted, completedSteps, currentStep, schedule]);

  const handleFieldMappingChoiceDraft = useCallback((choice: string) => {
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
                onSubmit={() => handleFieldExclusionSubmitDraft()}
              />
            ),
            stepId: 'field-exclusions'
          }
        );
      } else {
        // Skip to template question
        handleTemplateQuestionDraft();
      }
    }, 500);
  }, [addSimpleMessage, markStepCompleted, addMessage, schedule]);

  const handleFieldExclusionSubmitDraft = useCallback(() => {
    addSimpleMessage('Field exclusions saved', 'user');
    handleTemplateQuestionDraft();
  }, [addSimpleMessage]);

  const handleTemplateQuestionDraft = useCallback(() => {
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
          onChange={(value) => handleTemplateChoiceDraft(value as string)}
          disabled={completedSteps.has('template-choice') && currentStep !== 'template-choice'}
          locked={completedSteps.has('template-choice') && currentStep !== 'template-choice'}
        />,
        undefined,
        undefined,
        'template-choice'
      );
    }, 500);
  }, [addAgentResponse, completedSteps, currentStep, schedule]);

  const handleTemplateChoiceDraft = useCallback((choice: string) => {
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
          handleScheduleQuestionDraft();
        }, 2000);
      } else {
        handleScheduleQuestionDraft();
      }
    }, 500);
  }, [addSimpleMessage, markStepCompleted, addMessage, schedule]);

  const handleScheduleQuestionDraft = useCallback(() => {
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
          onChange={(value) => handleScheduleChoiceDraft(value as string)}
          disabled={completedSteps.has('schedule-question') && currentStep !== 'schedule-question'}
          locked={completedSteps.has('schedule-question') && currentStep !== 'schedule-question'}
        />,
        undefined,
        undefined,
        'schedule-question'
      );
    }, 500);
  }, [addAgentResponse, completedSteps, currentStep, schedule]);

  const handleScheduleChoiceDraft = useCallback((choice: string) => {
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
                onSubmit={() => handleScheduleDetailsSubmitDraft()}
              />
            ),
            stepId: 'schedule-details'
          }
        );
      } else {
        handleRetryQuestionDraft();
      }
    }, 500);
  }, [addSimpleMessage, markStepCompleted, addMessage, schedule]);

  const handleScheduleDetailsSubmitDraft = useCallback(() => {
    addSimpleMessage('Schedule details saved', 'user');
    markStepCompleted('schedule-details');
    handleRetryQuestionDraft();
  }, [addSimpleMessage, markStepCompleted]);

  const handleRetryQuestionDraft = useCallback(() => {
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
          onChange={(value) => handleRetryChoiceDraft(value as string)}
          disabled={completedSteps.has('retry-question') && currentStep !== 'retry-question'}
          locked={completedSteps.has('retry-question') && currentStep !== 'retry-question'}
        />,
        undefined,
        undefined,
        'retry-question'
      );
    }, 500);
  }, [addAgentResponse, completedSteps, currentStep, schedule]);

  const handleRetryChoiceDraft = useCallback((choice: string) => {
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
                onSubmit={() => handleRetryDetailsSubmitDraft()}
              />
            ),
            stepId: 'retry-details'
          }
        );
      } else {
        handleNotificationQuestionDraft();
      }
    }, 500);
  }, [addSimpleMessage, markStepCompleted, addMessage, schedule]);

  const handleRetryDetailsSubmitDraft = useCallback(() => {
    addSimpleMessage('Retry settings saved', 'user');
    markStepCompleted('retry-details');
    handleNotificationQuestionDraft();
  }, [addSimpleMessage, markStepCompleted]);

  const handleNotificationQuestionDraft = useCallback(() => {
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
          onChange={(value) => handleNotificationChoiceDraft(value as string)}
          disabled={completedSteps.has('notification-question') && currentStep !== 'notification-question'}
          locked={completedSteps.has('notification-question') && currentStep !== 'notification-question'}
        />,
        undefined,
        undefined,
        'notification-question'
      );
    }, 500);
  }, [addAgentResponse, completedSteps, currentStep, schedule]);

  const handleNotificationChoiceDraft = useCallback((choice: string) => {
    addSimpleMessage(choice === 'yes' ? 'Yes, Send Notifications' : 'No Notifications', 'user');
    markStepCompleted('notification-question');
    setCurrentStep(choice === 'yes' ? 'notification-details' : 'delivery-summary');
    
    if (choice === 'yes') {
      // Ask for notification recipient - use current clientEmail state
      schedule(() => {
        console.log('🔍 Creating notification form with clientEmail:', clientEmail);
        addMessage(
          'Who should receive the failure notifications?',
          'assistant',
          {
            component: (
              <Form
                key={`notification-form-${clientEmail || 'empty'}`}
                kind="form"
                title="Notification Recipient"
                description="Email address for delivery failure alerts"
                fields={[
                  {
                    id: 'notificationEmail',
                    label: 'Notification Email',
                    type: 'email' as const,
                    placeholder: clientEmail || 'admin@company.com',
                    value: clientEmail || '',
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
                  handleNotificationDetailsSubmitDraft();
                }}
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
                  handleDeliveryAccountSetupDraft();
                } else {
                  handleSkipDeliveryAccountDraft();
                }
              }}
              disabled={completedSteps.has('delivery-account-choice') && currentStep !== 'delivery-account-choice'}
              locked={completedSteps.has('delivery-account-choice') && currentStep !== 'delivery-account-choice'}
            />,
            undefined,
            undefined,
            'delivery-account-choice'
          );
      }, 500);
    }
  }, [addSimpleMessage, markStepCompleted, addMessage, schedule, clientEmail]);

  const handleWebhookBasicConfigSubmitDraft = useCallback((config: Record<string, any>) => {
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
          onChange={(value) => handleWebhookFieldMappingChoiceDraft(value as string)}
          disabled={completedSteps.has('webhook-field-mapping') && currentStep !== 'webhook-field-mapping'}
          locked={completedSteps.has('webhook-field-mapping') && currentStep !== 'webhook-field-mapping'}
        />,
        undefined,
        undefined,
        'webhook-field-mapping'
      );
    }, 500);
  }, [addSimpleMessage, markStepCompleted, addAgentResponse, completedSteps, currentStep, schedule]);

  const handleWebhookFieldMappingChoiceDraft = useCallback((choice: string) => {
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
                  <Button onClick={() => handleWebhookMappingSubmitDraft()} className="font-medium">
                    Auto-Map
                  </Button>
                  <Button variant="outline" onClick={() => handleWebhookMappingSubmitDraft()} className="font-medium">
                    Skip For Now
                  </Button>
                </div>
              </div>
            ),
            stepId: 'webhook-mapping-details'
          }
        );
      } else {
        handleWebhookMappingSubmitDraft();
      }
    }, 500);
  }, [addSimpleMessage, markStepCompleted, addMessage, schedule]);

  const handleWebhookMappingSubmitDraft = useCallback(() => {
    addSimpleMessage('Field mapping configured', 'user');
    markStepCompleted('webhook-mapping-details');
    
    // Continue to schedule question (same as email flow)
    handleScheduleQuestionDraft();
  }, [addSimpleMessage, markStepCompleted]);

  const handleNotificationDetailsSubmitDraft = useCallback(() => {
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
              handleDeliveryAccountSetupDraft();
            } else {
              handleSkipDeliveryAccountDraft();
            }
          }}
          disabled={completedSteps.has('delivery-account-choice') && currentStep !== 'delivery-account-choice'}
          locked={completedSteps.has('delivery-account-choice') && currentStep !== 'delivery-account-choice'}
        />,
        undefined,
        undefined,
        'delivery-account-choice'
      );
    }, 500);
  }, [addSimpleMessage, markStepCompleted, addAgentResponse, completedSteps, currentStep, schedule]);

  const handleDeliveryConfigSubmitDraft = useCallback((config: Record<string, any>) => {
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
                  rule: 'email' as const,
                  message: 'Please enter a valid email address'
                }
              ]}
              submitLabel="Continue to Delivery Account"
              onSubmit={handleConfigurationSubmitDraft}
              disabled={completedSteps.has('configuration') && currentStep !== 'configuration'}
              locked={completedSteps.has('configuration') && currentStep !== 'configuration'}
            />
          ),
          stepId: 'configuration'
        }
      );
    }, 500);
  }, [addMessage, markStepCompleted, completedSteps, currentStep, schedule]);

  const handleConfigurationSubmitDraft = useCallback((configData: Record<string, any>) => {
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
              handleDeliveryAccountSetupDraft();
            } else {
              handleSkipDeliveryAccountDraft();
            }
          }}
          disabled={completedSteps.has('delivery-account-choice') && currentStep !== 'delivery-account-choice'}
          locked={completedSteps.has('delivery-account-choice') && currentStep !== 'delivery-account-choice'}
        />,
        undefined,
        undefined,
        'delivery-account-choice'
      );
    }, 500);
  }, [addSimpleMessage, markStepCompleted, addAgentResponse, currentStep, schedule]);

  const handleDeliveryAccountSetupDraft = useCallback(() => {
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
          onChange={(value) => handleQuantityLimitsChoiceDraft(value as string)}
          disabled={completedSteps.has('quantity-limits-question') && currentStep !== 'quantity-limits-question'}
          locked={completedSteps.has('quantity-limits-question') && currentStep !== 'quantity-limits-question'}
        />,
        undefined,
        undefined,
        'quantity-limits-question'
      );
    }, 500);
  }, [addAgentResponse, markStepCompleted, completedSteps, currentStep, schedule]);

  const handleQuantityLimitsChoiceDraft = useCallback((choice: string) => {
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
                onSubmit={() => handleQuantityLimitsSubmitDraft()}
              />
            ),
            stepId: 'quantity-limits-details'
          }
        );
      } else {
        handleExclusiveDeliveryQuestionDraft();
      }
    }, 500);
  }, [addSimpleMessage, markStepCompleted, addMessage, schedule]);

  const handleQuantityLimitsSubmitDraft = useCallback(() => {
    addSimpleMessage('Quantity limits saved', 'user');
    markStepCompleted('quantity-limits-details');
    handleExclusiveDeliveryQuestionDraft();
  }, [addSimpleMessage, markStepCompleted]);

  const handleExclusiveDeliveryQuestionDraft = useCallback(() => {
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
          onChange={(value) => handleExclusiveDeliveryChoiceDraft(value as string)}
          disabled={completedSteps.has('exclusive-delivery-question') && currentStep !== 'exclusive-delivery-question'}
          locked={completedSteps.has('exclusive-delivery-question') && currentStep !== 'exclusive-delivery-question'}
        />,
        undefined,
        undefined,
        'exclusive-delivery-question'
      );
    }, 500);
  }, [addAgentResponse, completedSteps, currentStep, schedule]);

  const handleExclusiveDeliveryChoiceDraft = useCallback((choice: string) => {
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
          onChange={(value) => handleOrderSystemChoiceDraft(value as string)}
          disabled={completedSteps.has('order-system-question') && currentStep !== 'order-system-question'}
          locked={completedSteps.has('order-system-question') && currentStep !== 'order-system-question'}
        />,
        undefined,
        undefined,
        'order-system-question'
      );
    }, 500);
  }, [addSimpleMessage, markStepCompleted, addAgentResponse, completedSteps, currentStep, schedule]);

  const handleOrderSystemChoiceDraft = useCallback((choice: string) => {
    addSimpleMessage(choice === 'yes' ? 'Yes, Use Orders' : 'No, Automatic', 'user');
    markStepCompleted('order-system-question');
    setCurrentStep('revenue-requirements-question');
    
    schedule(() => {
      if (choice === 'yes') {
        addSimpleMessage('Great! Remember: You must create an order for this client to receive leads.', 'assistant');
        
        schedule(() => {
          handleRevenueRequirementsQuestionDraft();
        }, 800);
      } else {
        handleRevenueRequirementsQuestionDraft();
      }
    }, 500);
  }, [addSimpleMessage, markStepCompleted, addAgentResponse, schedule]);

  const handleRevenueRequirementsQuestionDraft = useCallback(() => {
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
          onChange={(value) => handleRevenueRequirementsChoiceDraft(value as string)}
          disabled={completedSteps.has('revenue-requirements-question') && currentStep !== 'revenue-requirements-question'}
          locked={completedSteps.has('revenue-requirements-question') && currentStep !== 'revenue-requirements-question'}
        />,
        undefined,
        undefined,
        'revenue-requirements-question'
      );
    }, 500);
  }, [addAgentResponse, completedSteps, currentStep, schedule]);

  const handleRevenueRequirementsChoiceDraft = useCallback((choice: string) => {
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
                onSubmit={() => handleRevenueRequirementsSubmitDraft()}
              />
            ),
            stepId: 'revenue-requirements-details'
          }
        );
      } else {
        handleCriteriaQuestionDraft();
      }
    }, 500);
  }, [addSimpleMessage, markStepCompleted, addMessage, schedule]);

  const handleRevenueRequirementsSubmitDraft = useCallback(() => {
    addSimpleMessage('Revenue requirements saved', 'user');
    markStepCompleted('revenue-requirements-details');
    handleCriteriaQuestionDraft();
  }, [addSimpleMessage, markStepCompleted]);

  const handleCriteriaQuestionDraft = useCallback(() => {
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
          onChange={(value) => handleCriteriaChoiceDraft(value as string)}
          disabled={completedSteps.has('criteria-question') && currentStep !== 'criteria-question'}
          locked={completedSteps.has('criteria-question') && currentStep !== 'criteria-question'}
        />,
        undefined,
        undefined,
        'criteria-question'
      );
    }, 500);
  }, [addAgentResponse, completedSteps, currentStep, schedule]);

  const handleCriteriaChoiceDraft = useCallback((choice: string) => {
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
                onSubmit={() => handleDeliveryAccountSubmitDraft()}
              />
            ),
            stepId: 'criteria-details'
          }
        );
      } else {
        handleDeliveryAccountSubmitDraft();
      }
    }, 500);
  }, [addSimpleMessage, markStepCompleted, addMessage, schedule]);

  const handleDeliveryAccountSubmitDraft = useCallback((accountData?: Record<string, any>) => {
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
              onClick: () => handleToolSelection('create-new-client-draft')
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
                  setCompletedSteps(new Set());
                  setCurrentStep(null);
                  setCurrentFlow(null);
                  setFlowActive(false);
                  setShowWelcome(true);
                  setSelectedActions(new Set());
                  clearDerivedValues();
                }
              }
            }
          ]
        );
        
        markStepCompleted('creation');
        setFlowActive(false);
      }, 2500);
    }, 500);
  }, [addSimpleMessage, markStepCompleted, addAgentResponse, addProcessingMessage, schedule, handleToolSelection, handleStartOver, currentStep]);

  const handleSkipDeliveryAccountDraft = useCallback(() => {
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

  const handleClientCreationDraft = useCallback(() => {
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
              onClick: () => handleToolSelection('create-new-client-draft')
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
              locked={false}
            />
            <Button 
              onClick={() => proceedToTemplate()} 
              className="gap-2 font-medium"
              disabled={false}
            >
              <ArrowRight className="w-4 h-4" />
              Start Upload
            </Button>
          </div>
        ),
        stepId: 'overview'
      }
    );
  }, [addMessage]);

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
          disabled={completedSteps.has('upload') && currentStep !== 'upload'}
          locked={completedSteps.has('upload') && currentStep !== 'upload'}
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
          disabled={completedSteps.has('validation') && currentStep !== 'validation'}
          locked={completedSteps.has('validation') && currentStep !== 'validation'}
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
            disabled={completedSteps.has('processing') && currentStep !== 'processing'}
            locked={completedSteps.has('processing') && currentStep !== 'processing'}
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
                      <div className="mt-4">
                        <div className="flex flex-wrap gap-2">
                          {message.suggestedActions.map((action) => {
                            const isLocked = flowActive && !message.isWelcome;
                            const isSelected = action.selected || selectedActions.has(action.id);
                            
                            return (
                              <Button
                                key={action.id}
                                variant={action.variant || 'outline'}
                                size="sm"
                                className={`h-8 text-xs gap-2 transition-colors ${
                                  isLocked 
                                    ? 'opacity-40 pointer-events-none bg-muted/20' 
                                    : isSelected 
                                      ? 'border-primary bg-primary/5 text-primary hover:bg-primary/10' 
                                      : ''
                                }`}
                                disabled={action.disabled || isLocked}
                                onClick={() => handleSuggestedActionClick(action.id, action.onClick)}
                              >
                                {action.icon && action.icon}
                                {action.label}
                              </Button>
                            );
                          })}
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