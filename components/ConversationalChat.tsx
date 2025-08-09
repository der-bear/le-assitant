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
import { 
  Send, 
  User, 
  Building, 
  Upload, 
  Wrench,
  ArrowRight,
  Bot,
  RotateCcw
} from 'lucide-react';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  component?: React.ReactNode;
  isWelcome?: boolean;
  isLocked?: boolean;
  stepId?: string;
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

  const addMessage = useCallback((content: string, sender: 'user' | 'assistant', component?: React.ReactNode, isWelcome = false, stepId?: string) => {
    const message: Message = {
      id: generateMessageId(),
      content,
      sender,
      timestamp: new Date(),
      component,
      isWelcome,
      isLocked: false,
      stepId
    };
    setMessages(prev => [...prev, message]);
  }, [generateMessageId]);

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <div className="flex md:flex-col md:space-y-3 space-x-3 md:space-x-0 items-start">
              <div className={`rounded-lg bg-muted flex items-center justify-center flex-shrink-0 transition-colors ${
                flowActive 
                  ? 'w-8 h-8' 
                  : 'w-8 h-8 md:w-10 md:h-10 group-hover:bg-accent-foreground/10'
              }`}>
                {tile.icon}
              </div>
              <div className="space-y-1 md:space-y-2 text-left flex-1 min-w-0">
                <h3 className="font-medium text-sm md:text-base text-foreground leading-tight">{tile.title}</h3>
                <p className="text-xs md:text-sm text-muted-foreground font-normal leading-relaxed">{tile.description}</p>
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

  const startGuidedFlow = useCallback((flowId: string) => {
    if (flowId === 'create-new-client') {
      handleClientSetup();
    } else if (flowId === 'bulk-client-upload') {
      handleBulkUpload();
    } else {
      addMessage(
        `${flowId} tool is being prepared. This guided workflow will be available soon.`,
        'assistant'
      );
    }
  }, [addMessage]);

  const handleToolSelection = useCallback((toolId: string) => {
    resetSession();
    setFlowActive(true);
    onWelcomeComplete?.();

    const toolNames: Record<string, string> = {
      'create-new-client': 'Create New Client',
      'bulk-client-upload': 'Bulk Client Upload',
      'all-tools': 'All Tools'
    };

    const toolName = toolNames[toolId] || toolId;
    addMessage(`${toolName}`, 'user');

    if (toolId === 'all-tools') {
      onShowAllTools?.();
      schedule(() => {
        addMessage(
          'The Quick Tools panel is now open. You can search and browse all available tools by category.',
          'assistant'
        );
      }, 500);
      return;
    }

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
      resetSession();
      setFlowActive(true);
      onWelcomeComplete?.();
      const toolNames: Record<string, string> = {
        'create-new-client': 'Create New Client',
        'bulk-client-upload': 'Bulk Client Upload',
        'all-tools': 'All Tools'
      };
      const toolName = toolNames[selectedTool] || selectedTool;
      addMessage(`${toolName}`, 'user');
      if (selectedTool === 'all-tools') {
        onShowAllTools?.();
      } else {
        schedule(() => {
          startGuidedFlow(selectedTool);
        }, 500);
      }
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
      </div>,
      false,
      'setup-overview'
    );
  }, [addMessage]);

  const proceedToBasicInfo = useCallback(() => {
    addMessage('Start Setup', 'user');
    
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

      addMessage(
        'Great! Let\'s start with the basic client information. I\'ll automatically generate secure credentials once you provide the company name and email.',
        'assistant',
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
        false,
        'basic-info'
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
    addMessage(`Company: ${data.companyName}, Email: ${data.email}`, 'user');
    
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
        />,
        false,
        'delivery-method'
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
    
    addMessage(`Selected: ${methodLabels[method] || method}`, 'user');
    
    // Mark delivery method step as completed
    markStepCompleted('delivery-method');
    setCurrentStep('delivery-config');
    
    schedule(() => {
      // Step 2b: Based on delivery choice, show specific configuration form
      if (method === 'email') {
        addMessage(
          'Configure email delivery settings for your client.',
          'assistant',
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
            submitLabel="Continue to Configuration"
            onSubmit={handleDeliveryConfigSubmit}
            disabled={completedSteps.has('delivery-config') && currentStep !== 'delivery-config'}
            locked={completedSteps.has('delivery-config') && currentStep !== 'delivery-config'}
          />,
          false,
          'delivery-config'
        );
      } else if (method === 'webhook') {
        addMessage(
          'Configure webhook delivery settings for real-time lead integration.',
          'assistant',
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
            submitLabel="Continue to Configuration"
            onSubmit={handleDeliveryConfigSubmit}
            disabled={completedSteps.has('delivery-config') && currentStep !== 'delivery-config'}
            locked={completedSteps.has('delivery-config') && currentStep !== 'delivery-config'}
          />,
          false,
          'delivery-config'
        );
      } else if (method === 'ftp') {
        addMessage(
          'Upload an FTP template file or use our default format.',
          'assistant',
          <div className="space-y-6">
            <FileDrop
              kind="filedrop"
              title="FTP Configuration Template"
              description="Upload your FTP configuration template"
              accept=".csv,.xlsx,.xml"
              multiple={false}
              maxSizeMb={5}
              note="Upload template file or we'll use the default format"
            />
            <div className="flex gap-3">
              <Button onClick={() => handleDeliveryConfigSubmit({ useDefault: true })} className="font-medium">
                Use Default Template
              </Button>
            </div>
          </div>,
          false,
          'delivery-config'
        );
      } else {
        // Skip delivery configuration
        handleDeliveryConfigSubmit({ skipped: true });
      }
    }, 500);
  }, [addMessage, markStepCompleted, completedSteps, currentStep, schedule]);

  const handleDeliveryConfigSubmit = useCallback((config: Record<string, any>) => {
    console.log('🔧 handleDeliveryConfigSubmit called with config:', config);
    addMessage('Delivery configuration saved', 'user');
    
    // Mark delivery configuration as completed
    markStepCompleted('delivery-config');
    setCurrentStep('configuration');
    
    schedule(() => {
      console.log('🔧 Adding Configuration form message');
      // Step 3: Configuration & Creation
      addMessage(
        'Configure additional client settings and preferences.',
        'assistant',
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
          submitLabel="Create Client"
          onSubmit={handleConfigurationSubmit}
          disabled={completedSteps.has('configuration') && currentStep !== 'configuration'}
          locked={completedSteps.has('configuration') && currentStep !== 'configuration'}
        />,
        false,
        'configuration'
      );
    }, 500);
  }, [addMessage, markStepCompleted, completedSteps, currentStep, schedule]);

  const handleConfigurationSubmit = useCallback((configData: Record<string, any>) => {
    addMessage('Final configuration saved', 'user');
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
        addMessage(
          'Client creation completed successfully!',
          'assistant',
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
            actions={[
              {
                id: 'view-client',
                label: 'View Client Dashboard',
                variant: 'default' as const
              },
              {
                id: 'send-test-lead',
                label: 'Send Test Lead',
                variant: 'secondary' as const
              }
            ]}
            onAction={(actionId) => {
              if (actionId === 'view-client') {
                console.log('Navigate to client dashboard');
              } else if (actionId === 'send-test-lead') {
                console.log('Send test lead');
              }
            }}
          />
          // No stepId to keep it active
        );

        markStepCompleted('creation');

        // Step 4: Review & Next Steps
        schedule(() => {
          addMessage(
            'Your client setup is complete! Here are some next steps you can take:',
            'assistant',
            <SummaryCard
              kind="summary"
              title="Next Steps"
              items={[
                {
                  id: 'monitor-leads',
                  title: 'Monitor Lead Delivery',
                  subtitle: 'Track performance and delivery status',
                  status: 'info' as const,
                  message: 'Keep an eye on daily delivery metrics',
                  link: {
                    href: '/analytics/CL-2024-001',
                    label: 'View Analytics'
                  }
                },
                {
                  id: 'client-portal',
                  title: 'Share Client Portal Access',
                  subtitle: 'Give your client login credentials',
                  status: 'info' as const,
                  message: 'Username: techcorp | Password: Auto-generated',
                  link: {
                    href: '/portal/credentials/CL-2024-001',
                    label: 'Get Login Details'
                  }
                }
              ]}
              actions={[
                {
                  id: 'create-another',
                  label: 'Create Another Client',
                  variant: 'default' as const
                }
              ]}
              onAction={(actionId) => {
                if (actionId === 'create-another') {
                  handleToolSelection('create-new-client');
                }
              }}
            />,
            false  // isWelcome = false
            // No stepId parameter - keeps it active
          );

          // Don't mark review as completed or give it a stepId since it's the final step
          // This keeps it active and interactive
          setCurrentFlow(null);
          setFlowActive(false);
          markStepCompleted('creation'); // Mark creation as fully done
        }, 1500);
      }, 2500);
    }, 500);
  }, [addMessage, markStepCompleted, handleToolSelection, onShowAllTools, currentStep, schedule]);

  // Also guard the legacy helper to avoid stray inserts
  const oldHandleDeliveryMethodSelect = useCallback((method: string) => {
    addMessage(`Selected: ${method} delivery`, 'user');
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
          <Alert
            kind="alert"
            type="success"
            message="Client has been created and is now active in your LeadExec system."
            title="Setup Complete!"
          />,
          false,
          'creation-complete'
        );
        
        // Add the action button as a separate message
        schedule(() => {
          addMessage(
            '',
            'assistant',
            <div className="flex justify-start">
              <Button 
                onClick={() => handleToolSelection('create-new-client')} 
                className="font-medium"
              >
                Create Another Client
              </Button>
            </div>
          );
        }, 100);
      }, 1500);
    }, 500);
  }, [addMessage, markStepCompleted, handleToolSelection, schedule, addProcessingMessage]);

  const handleBulkUpload = useCallback(() => {
    addMessage(
      'I\'ll help you upload multiple clients at once using an Excel file. The system will automatically generate usernames and passwords.',
      'assistant'
    );
  }, [addMessage]);

  const handleUserInput = useCallback((input: string) => {
    const lowerInput = input.toLowerCase();
    
    // Activate flow mode when user starts typing
    setFlowActive(true);
    
    if (lowerInput.includes('help') || lowerInput.includes('best practices') || lowerInput.includes('delivery methods') || lowerInput.includes('lead routing')) {
      addMessage(
        'I can provide guidance on LeadExec features and best practices. Here are some key areas I can help with:\n\n• Client setup and configuration\n• Delivery method selection and setup\n• Lead routing and distribution\n• Performance optimization\n• Troubleshooting common issues\n\nWhat specific area would you like to explore?',
        'assistant',
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
        );
      }
    } else {
      addMessage(
        'I understand you want to work with LeadExec! I can help you with various tasks like creating clients, bulk uploads, and setting up delivery methods. What would you like to accomplish?',
        'assistant',
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
      );
    }
  }, [addMessage, handleToolSelection, onShowAllTools]);

  const handleSendMessage = useCallback(() => {
    if (!inputValue.trim() || isProcessing) return;
    onWelcomeComplete?.();
    const userMessage = inputValue;
    addMessage(userMessage, 'user');
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
                        // Check if component is ProcessState or Alert (no wrapper needed)
                        const componentType = (message.component as any)?.props?.kind;
                        const needsWrapper = componentType !== 'process-state' && componentType !== 'alert';
                        
                        if (needsWrapper) {
                          return (
                            <div className="mt-4 sm:mt-6">
                              <div className="border rounded-lg p-4 sm:p-6 bg-card shadow-sm">
                                {message.component}
                              </div>
                            </div>
                          );
                        } else {
                          // Render ProcessState and Alert without wrapper
                          return (
                            <div className="mt-4 sm:mt-6">
                              {message.component}
                            </div>
                          );
                        }
                      })()
                    )}
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