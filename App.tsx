import React, { useState } from 'react';
import { ConversationalChat } from './components/ConversationalChat';
import { ComponentGallery } from './components/ComponentGallery';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import { Input } from './components/ui/input';
import { Toaster } from './components/ui/sonner';
import { 
  Building,
  Upload,
  Users,
  Search,
  Database,
  X,
  Target,
  Send as SendIcon,
  Filter,
  TrendingUp,
  FileText,
  RotateCcw,
  DollarSign,
  Palette,
  ArrowLeft,
  Sparkles,
  CreditCard,
  BarChart3,
  FileBarChart,
  Download,
  History,
  Mail,
  Bell,
  Plug,
  Key,
  Settings
} from 'lucide-react';

const toolCategories = [
  {
    id: 'clients',
    title: 'Client Management',
    items: [
      {
        id: 'create-new-client',
        title: 'LeadExec Client Setup',
        description: 'Create new client configurations with guided setup',
        icon: <Building className="w-4 h-4" />
      },
      {
        id: 'bulk-client-upload',
        title: 'Bulk Client Upload',
        description: 'Upload multiple clients at once via Excel',
        icon: <Upload className="w-4 h-4" />
      },
      {
        id: 'client-management',
        title: 'Client Management',
        description: 'View, edit, and manage existing clients',
        icon: <Users className="w-4 h-4" />
      },
      {
        id: 'client-search-filter',
        title: 'Client Search & Filter',
        description: 'Advanced search and filtering for clients',
        icon: <Filter className="w-4 h-4" />
      },
      {
        id: 'delivery-configuration',
        title: 'Delivery Configuration',
        description: 'Configure email, webhook, and FTP delivery',
        icon: <SendIcon className="w-4 h-4" />
      }
    ]
  },
  {
    id: 'leads',
    title: 'Lead Management',
    items: [
      {
        id: 'lead-sources',
        title: 'Lead Sources',
        description: 'Manage and configure lead sources',
        icon: <Target className="w-4 h-4" />
      },
      {
        id: 'lead-distribution',
        title: 'Lead Distribution',
        description: 'Configure lead routing and distribution',
        icon: <RotateCcw className="w-4 h-4" />
      },
      {
        id: 'lead-tracking',
        title: 'Lead Tracking',
        description: 'Track lead delivery and conversion',
        icon: <TrendingUp className="w-4 h-4" />
      }
    ]
  },
  {
    id: 'financial',
    title: 'Financial',
    items: [
      {
        id: 'revenue-reports',
        title: 'Revenue Reports',
        description: 'Generate comprehensive revenue reports',
        icon: <DollarSign className="w-4 h-4" />
      },
      {
        id: 'billing-management',
        title: 'Billing Management',
        description: 'Manage billing and invoicing',
        icon: <FileText className="w-4 h-4" />
      },
      {
        id: 'payment-tracking',
        title: 'Payment Tracking',
        description: 'Track client payments and invoices',
        icon: <CreditCard className="w-4 h-4" />
      }
    ]
  },
  {
    id: 'reports',
    title: 'Reports & Analytics',
    items: [
      {
        id: 'performance-dashboard',
        title: 'Performance Dashboard',
        description: 'Real-time performance metrics and KPIs',
        icon: <BarChart3 className="w-4 h-4" />
      },
      {
        id: 'custom-reports',
        title: 'Custom Reports',
        description: 'Build and schedule custom reports',
        icon: <FileBarChart className="w-4 h-4" />
      },
      {
        id: 'export-data',
        title: 'Export Data',
        description: 'Export data in various formats',
        icon: <Download className="w-4 h-4" />
      },
      {
        id: 'audit-logs',
        title: 'Audit Logs',
        description: 'System activity and audit trails',
        icon: <History className="w-4 h-4" />
      }
    ]
  },
  {
    id: 'comms',
    title: 'Communications',
    items: [
      {
        id: 'email-campaigns',
        title: 'Email Campaigns',
        description: 'Create and manage email campaigns',
        icon: <Mail className="w-4 h-4" />
      },
      {
        id: 'notifications',
        title: 'Notifications',
        description: 'Configure system notifications',
        icon: <Bell className="w-4 h-4" />
      }
    ]
  },
  {
    id: 'system',
    title: 'System Settings',
    items: [
      {
        id: 'user-management',
        title: 'User Management',
        description: 'Manage users and permissions',
        icon: <Users className="w-4 h-4" />
      },
      {
        id: 'integrations',
        title: 'Integrations',
        description: 'Configure third-party integrations',
        icon: <Plug className="w-4 h-4" />
      },
      {
        id: 'api-configuration',
        title: 'API Configuration',
        description: 'Manage API keys and webhooks',
        icon: <Key className="w-4 h-4" />
      },
      {
        id: 'system-settings',
        title: 'System Settings',
        description: 'Global system configuration',
        icon: <Settings className="w-4 h-4" />
      }
    ]
  }
];

// Category filters - updated format "All - 21"
const categoryFilters = [
  { id: 'all', label: 'All', count: 21 },
  { id: 'clients', label: 'Clients', count: 5 },
  { id: 'leads', label: 'Leads', count: 3 },
  { id: 'financial', label: 'Financial', count: 3 },
  { id: 'reports', label: 'Reports', count: 4 },
  { id: 'comms', label: 'Comms', count: 2 },
  { id: 'system', label: 'System', count: 4 }
];

export default function App() {
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [showQuickTools, setShowQuickTools] = useState(false);
  const [showComponentGallery, setShowComponentGallery] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [hasWelcomeCompleted, setHasWelcomeCompleted] = useState(false);
  const [resetTrigger, setResetTrigger] = useState(0);

  const handleToolSelect = (toolId: string) => {
    setSelectedTool(toolId);
    setHasWelcomeCompleted(true);
    // Auto-collapse panel when a flow starts
    setShowQuickTools(false);
  };

  const handleStartOver = () => {
    setSelectedTool(null);
    setHasWelcomeCompleted(false);
    setShowQuickTools(false);
    // Trigger reset in ConversationalChat
    setResetTrigger(prev => prev + 1);
  };

  const handleToolProcessed = () => {
    setSelectedTool(null);
  };

  const handleToggleGallery = () => {
    setShowComponentGallery(!showComponentGallery);
    // Auto-dismiss tools panel when entering gallery
    if (!showComponentGallery) {
      setShowQuickTools(false);
    }
  };

  const handleWelcomeComplete = () => {
    setHasWelcomeCompleted(true);
  };

  const filteredCategories = toolCategories
    .map(category => ({
      ...category,
      items: category.items.filter(tool => {
        const matchesSearch = tool.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            tool.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || 
                              selectedCategory === category.id;
        return matchesSearch && matchesCategory;
      })
    }))
    .filter(category => category.items.length > 0);

  const totalFilteredTools = filteredCategories.reduce((total, category) => total + category.items.length, 0);

  // Quick Tools Panel Content
  const QuickToolsContent = () => (
    <div className="h-full flex flex-col">
      {/* Panel Header */}
      <div className="p-4 border-b space-y-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="font-medium text-base">Quick Tools</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowQuickTools(false)}
            className="h-6 w-6 p-0 hover:bg-accent"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-8 text-sm bg-input-background border-border font-normal"
          />
        </div>

        {/* Category Filters - using "All - 21" format */}
        <div className="flex flex-wrap gap-1">
          {categoryFilters.map((filter) => (
            <Button
              key={filter.id}
              variant={selectedCategory === filter.id ? 'default' : 'secondary'}
              size="sm"
              onClick={() => setSelectedCategory(filter.id)}
              className="h-6 px-2 text-xs gap-1 font-normal"
            >
              {filter.label}
              <span className="text-xs opacity-60 font-normal">- {filter.count}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Tools List - with proper flex layout for scrollable content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {filteredCategories.length === 0 ? (
          <div className="p-4 text-center h-full flex items-center justify-center">
            <p className="text-muted-foreground text-sm font-normal">
              {searchTerm ? `No tools found matching "${searchTerm}"` : 'No tools in this category'}
            </p>
          </div>
        ) : (
          <div className="space-y-6 pb-4">
            {filteredCategories.map((category) => (
              <div key={category.id} className="space-y-3">
                <h3 className="px-4 pt-4 pb-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {category.title}
                </h3>
                <div className="space-y-1 px-2">
                  {category.items.map((tool) => (
                    <button
                      key={tool.id}
                      className="w-full text-left p-3 rounded-lg hover:bg-accent transition-colors group"
                      onClick={() => handleToolSelect(tool.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex-shrink-0 text-muted-foreground group-hover:text-foreground transition-colors">
                          {tool.icon}
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="font-medium text-sm text-foreground">{tool.title}</div>
                          <div className="text-xs text-muted-foreground leading-relaxed font-normal">
                            {tool.description}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer - Always visible and properly positioned */}
      <div className="border-t px-4 py-3 flex-shrink-0 bg-background">
        <p className="text-xs text-muted-foreground text-center font-normal">
          10 of 21 tools
        </p>
      </div>
    </div>
  );

  return (
    <div className="h-screen w-screen bg-background text-foreground overflow-hidden">
      {/* Shell layout - with responsive sidebar/overlay */}
      <div className="h-full flex flex-col overflow-hidden">
        
        {/* Header - minimalist */}
        <header className="border-b bg-background px-6 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-foreground rounded flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-background" />
            </div>
            <h1 className="font-medium text-base">LeadExec Copilot</h1>
            <Badge variant="secondary" className="text-xs px-2 py-0.5 font-normal">Beta</Badge>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Components/Back to Chat button - no label when not in gallery */}
            <Button
              variant={showComponentGallery ? 'default' : 'outline'}
              size="sm"
              onClick={handleToggleGallery}
              className="gap-2 h-8 px-3 text-sm font-medium"
            >
              {showComponentGallery ? (
                <>
                  <ArrowLeft className="w-3 h-3" />
                  Back to Chat
                </>
              ) : (
                <Palette className="w-3 h-3" />
              )}
            </Button>
            
            {/* Start Over button - only show when there's something to start over */}
            {!showComponentGallery && (hasWelcomeCompleted || selectedTool) && (
              <Button
                variant="default"
                size="sm"
                onClick={handleStartOver}
                className="gap-2 h-8 px-3 text-sm font-medium"
              >
                <RotateCcw className="w-3 h-3" />
                Start Over
              </Button>
            )}
          </div>
        </header>

        {/* Main content area with responsive layout */}
        <div className="flex-1 flex overflow-hidden relative min-h-0">
          
          {/* Primary content */}
          <div className="flex-1 relative overflow-hidden">
            {/* Component Gallery or Chat */}
            {showComponentGallery ? (
              <ComponentGallery />
            ) : (
              <div className="h-full min-h-0 flex flex-col">
                <ConversationalChat 
                  selectedTool={selectedTool}
                  onToolProcessed={handleToolProcessed}
                  onShowAllTools={() => setShowQuickTools(true)}
                  onWelcomeComplete={handleWelcomeComplete}
                  onStartOver={handleStartOver}
                  resetTrigger={resetTrigger}
                />
              </div>
            )}
          </div>

          {/* Desktop: Embedded Quick Tools Panel - slides in from right */}
          {!showComponentGallery && (
            <div className={`hidden lg:flex border-l bg-background transition-all duration-300 ease-in-out ${
              showQuickTools ? 'w-96' : 'w-0'
            }`}>
              {showQuickTools && <QuickToolsContent />}
            </div>
          )}
        </div>

        {/* Mobile/Tablet: Full overlay for Quick Tools */}
        {showQuickTools && !showComponentGallery && (
          <>
            {/* Backdrop */}
            <div 
              className="lg:hidden fixed inset-0 bg-black/50 z-40"
              onClick={() => setShowQuickTools(false)}
            />
            
            {/* Full screen overlay */}
            <div className="lg:hidden fixed inset-0 bg-background z-50">
              <QuickToolsContent />
            </div>
          </>
        )}
      </div>
      
      <Toaster />
    </div>
  );
}