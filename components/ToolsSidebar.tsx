import React, { useState } from 'react';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { 
  Search, 
  Users, 
  Target, 
  Mail, 
  FileText, 
  FolderOpen, 
  Settings,
  Upload,
  BarChart3,
  CreditCard,
  Calendar,
  Building,
  Globe,
  Zap,
  X
} from 'lucide-react';

interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ComponentType<any>;
  featured?: boolean;
}

interface ToolsSidebarProps {
  onToolSelect: (toolId: string) => void;
  selectedTool?: string | null;
  onClose?: () => void;
}

export function ToolsSidebar({ onToolSelect, selectedTool, onClose }: ToolsSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const tools: Tool[] = [
    // LeadExec Featured Tools
    { id: 'leadexec-client-setup', name: 'LeadExec Client Setup', description: 'Guided client creation with delivery configuration', category: 'LeadExec', icon: Building, featured: true },
    { id: 'bulk-client-upload', name: 'Bulk Client Upload', description: 'Upload multiple clients via Excel file', category: 'LeadExec', icon: Upload, featured: true },
    { id: 'delivery-setup', name: 'Delivery Setup', description: 'Configure delivery methods for existing clients', category: 'LeadExec', icon: Settings },
    
    // Client Management
    { id: 'create-client', name: 'Create Client (Legacy)', description: 'Basic client creation form', category: 'Clients', icon: Users },
    { id: 'manage-clients', name: 'Manage Clients', description: 'View and edit existing clients', category: 'Clients', icon: Users },
    { id: 'client-analytics', name: 'Client Analytics', description: 'View client performance metrics', category: 'Clients', icon: BarChart3 },
    
    // Lead Management
    { id: 'create-lead-source', name: 'Create Lead Source', description: 'Set up a new lead generation source', category: 'Leads', icon: Target },
    { id: 'manage-leads', name: 'Manage Leads', description: 'Track and nurture your leads', category: 'Leads', icon: Target },
    { id: 'lead-scoring', name: 'Lead Scoring', description: 'Configure lead scoring rules', category: 'Leads', icon: BarChart3 },
    
    // Campaign Management
    { id: 'create-campaign', name: 'Create Campaign', description: 'Launch a new marketing campaign', category: 'Campaigns', icon: Mail },
    { id: 'manage-campaigns', name: 'Manage Campaigns', description: 'Monitor campaign performance', category: 'Campaigns', icon: Mail },
    { id: 'email-templates', name: 'Email Templates', description: 'Create and manage email templates', category: 'Campaigns', icon: FileText },
    
    // Billing & Invoicing
    { id: 'create-invoice', name: 'Create Invoice', description: 'Generate invoices for clients', category: 'Billing', icon: FileText },
    { id: 'manage-billing', name: 'Manage Billing', description: 'Handle subscription and billing', category: 'Billing', icon: CreditCard },
    { id: 'payment-tracking', name: 'Payment Tracking', description: 'Track payment status and history', category: 'Billing', icon: CreditCard },
    
    // Project Management
    { id: 'create-project', name: 'Create Project', description: 'Start a new project for clients', category: 'Projects', icon: FolderOpen },
    { id: 'manage-projects', name: 'Manage Projects', description: 'Track project progress and tasks', category: 'Projects', icon: FolderOpen },
    { id: 'project-calendar', name: 'Project Calendar', description: 'Schedule and manage project timelines', category: 'Projects', icon: Calendar },
    
    // Analytics & Reports
    { id: 'sales-analytics', name: 'Sales Analytics', description: 'Analyze sales performance and trends', category: 'Analytics', icon: BarChart3 },
    { id: 'revenue-reports', name: 'Revenue Reports', description: 'Generate revenue and financial reports', category: 'Analytics', icon: BarChart3 },
    { id: 'custom-reports', name: 'Custom Reports', description: 'Create custom business reports', category: 'Analytics', icon: FileText },
    
    // System Tools
    { id: 'system-settings', name: 'System Settings', description: 'Configure global system settings', category: 'System', icon: Settings },
    { id: 'user-management', name: 'User Management', description: 'Manage team members and permissions', category: 'System', icon: Users },
    { id: 'integrations', name: 'Integrations', description: 'Connect third-party services', category: 'System', icon: Globe },
    { id: 'audit-logs', name: 'Audit Logs', description: 'View system activity and audit logs', category: 'System', icon: FileText }
  ];

  const categories = ['all', ...Array.from(new Set(tools.map(tool => tool.category)))];

  const filteredTools = tools.filter(tool => {
    const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedTools = filteredTools.reduce((groups, tool) => {
    const category = tool.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(tool);
    return groups;
  }, {} as Record<string, Tool[]>);

  // Get featured tools for quick access
  const featuredTools = tools.filter(tool => tool.featured);

  const handleToolSelect = (toolId: string) => {
    onToolSelect(toolId);
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="w-full h-full flex flex-col" style={{ fontSize: '14px' }}>
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-medium flex items-center gap-2">
            <Zap className="w-4 h-4" />
            All SaaS Tools
          </h2>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>

        {/* Quick Access - Featured Tools */}
        <div className="mb-4">
          <h3 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Quick Access</h3>
          <div className="space-y-1">
            {featuredTools.map(tool => (
              <Button
                key={tool.id}
                variant={selectedTool === tool.id ? "default" : "ghost"}
                className="w-full justify-start h-8 text-xs font-normal px-2"
                onClick={() => handleToolSelect(tool.id)}
              >
                <tool.icon className="w-3 h-3 mr-2" />
                {tool.name}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-sm font-normal"
            />
          </div>
          
          <div className="flex flex-wrap gap-1">
            {categories.map(category => {
              const count = category === 'all' 
                ? tools.length 
                : tools.filter(tool => tool.category === category).length;
              
              return (
                <Badge
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  className="cursor-pointer text-xs font-normal"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category === 'all' ? `All (${count})` : `${category} (${count})`}
                </Badge>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {selectedCategory === 'all' ? (
          Object.entries(groupedTools).map(([category, categoryTools]) => (
            <div key={category} className="mb-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">{category}</h3>
              <div className="space-y-2">
                {categoryTools.map(tool => (
                  <ToolCard
                    key={tool.id}
                    tool={tool}
                    isSelected={selectedTool === tool.id}
                    onClick={() => handleToolSelect(tool.id)}
                  />
                ))}
              </div>
              {category !== Object.keys(groupedTools)[Object.keys(groupedTools).length - 1] && (
                <Separator className="mt-4" />
              )}
            </div>
          ))
        ) : (
          <div className="space-y-2">
            {filteredTools.map(tool => (
              <ToolCard
                key={tool.id}
                tool={tool}
                isSelected={selectedTool === tool.id}
                onClick={() => handleToolSelect(tool.id)}
              />
            ))}
          </div>
        )}
        
        {filteredTools.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-normal">No tools found</p>
            <p className="text-xs font-normal">Try adjusting your search or category filter</p>
          </div>
        )}
      </div>
    </div>
  );
}

interface ToolCardProps {
  tool: Tool;
  isSelected: boolean;
  onClick: () => void;
}

function ToolCard({ tool, isSelected, onClick }: ToolCardProps) {
  const Icon = tool.icon;
  
  return (
    <Card 
      className={`p-3 cursor-pointer transition-colors hover:bg-accent ${
        isSelected ? 'bg-accent border-primary' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-md ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium">{tool.name}</h4>
            {tool.featured && (
              <Badge variant="secondary" className="text-xs font-normal px-1 py-0">
                Popular
              </Badge>
            )}
          </div>
          <p className="text-xs font-normal text-muted-foreground mt-1 line-clamp-2">{tool.description}</p>
        </div>
      </div>
    </Card>
  );
}