// Chat constants and configurations
import { Building, Upload, Wrench } from 'lucide-react';

// Quick tiles configuration for welcome screen
export const QUICK_TILES = [
  {
    id: 'create-new-client',
    title: 'Create New Client',
    description: 'Set up a new client with guided configuration including delivery methods and credentials',
    icon: Building
  },
  {
    id: 'create-client-simplified',
    title: 'Create Client (Simplified)',
    description: 'Quick conversational client setup - just answer questions in the chat',
    icon: Building
  },
  {
    id: 'all-tools',
    title: 'All Tools',
    description: 'Access all 25+ tools organized by category',
    icon: Wrench
  }
] as const;

// Flow step definitions
export const CLIENT_SETUP_STEPS = [
  { id: 'basic-info', title: 'Basic Information', hint: 'Company details and contact info' },
  { id: 'delivery-method', title: 'Delivery Method', hint: 'Choose how leads will be sent' },  
  { id: 'configuration', title: 'Configuration', hint: 'Set up preferences and settings' },
  { id: 'creation', title: 'Creation', hint: 'Create the client in LeadExec' },
  { id: 'review', title: 'Review', hint: 'Confirm setup and next steps' }
] as const;

export const BULK_UPLOAD_STEPS = [
  { id: 'overview', title: 'Process Overview', hint: 'Understanding the bulk upload process' },
  { id: 'template', title: 'Download Template', hint: 'Get the Excel template file' },
  { id: 'upload', title: 'Upload File', hint: 'Upload your completed client data' },
  { id: 'validation', title: 'Validation', hint: 'System validates your data' },
  { id: 'processing', title: 'Processing', hint: 'Creating clients and generating credentials' },
  { id: 'completion', title: 'Completion', hint: 'Review results and next steps' }
] as const;


// Delivery method options
export const DELIVERY_OPTIONS = [
  {
    id: 'email',
    label: 'Email Delivery',
    description: 'Send leads directly to client email',
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
    id: 'pingpost',
    label: 'Ping Post',
    description: 'Real-time lead validation and delivery',
    icon: 'Zap'
  },
  {
    id: 'skip',
    label: 'Skip for Now',
    description: 'Configure delivery method later',
    icon: 'Clock'
  }
] as const;

// Tool categories for unimplemented tools
export const TOOL_CATEGORIES: Record<string, { 
  category: string; 
  alternativeTools: Array<{id: string, name: string, description: string}> 
}> = {
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
  'lead-sources': {
    category: 'Leads',
    alternativeTools: [
      { id: 'lead-distribution', name: 'Lead Distribution', description: 'Configure lead routing and distribution' },
      { id: 'lead-tracking', name: 'Lead Tracking', description: 'Track lead delivery and conversion' }
    ]
  },
  'revenue-reports': {
    category: 'Financial',
    alternativeTools: [
      { id: 'billing-management', name: 'Billing Management', description: 'Manage billing and invoicing' },
      { id: 'payment-tracking', name: 'Payment Tracking', description: 'Track client payments and invoices' }
    ]
  },
  'user-management': {
    category: 'System',
    alternativeTools: [
      { id: 'system-settings', name: 'System Settings', description: 'Global system configuration' },
      { id: 'integrations', name: 'Integrations', description: 'Configure third-party integrations' }
    ]
  }
};

// Help sources by category
export const HELP_SOURCES_BY_CATEGORY: Record<string, Array<{
  id: string;
  title: string;
  description: string;
  url: string;
  kind: 'howto' | 'article' | 'api';
  source: 'KnowledgeBase' | 'API Docs';
}>> = {
  'Clients': [
    { id: '1', title: 'Client Setup Guide', description: 'Complete walkthrough for setting up new clients in LeadExec', url: '#client-setup', kind: 'howto', source: 'KnowledgeBase' },
    { id: '2', title: 'Delivery Methods Explained', description: 'Understanding email, webhook, and FTP delivery options', url: '#delivery-methods', kind: 'article', source: 'KnowledgeBase' },
    { id: '3', title: 'Client API Reference', description: 'API endpoints for programmatic client management', url: '#client-api', kind: 'api', source: 'API Docs' }
  ],
  'Leads': [
    { id: '1', title: 'Lead Source Configuration', description: 'How to set up and configure lead sources', url: '#lead-sources', kind: 'howto', source: 'KnowledgeBase' },
    { id: '2', title: 'Lead Distribution Rules', description: 'Creating routing rules for optimal lead distribution', url: '#lead-distribution', kind: 'article', source: 'KnowledgeBase' },
    { id: '3', title: 'Lead Tracking Guide', description: 'Monitor lead performance and conversion rates', url: '#lead-tracking', kind: 'howto', source: 'KnowledgeBase' }
  ],
  'Financial': [
    { id: '1', title: 'Revenue Reporting Guide', description: 'Generate and analyze revenue reports', url: '#revenue-reports', kind: 'howto', source: 'KnowledgeBase' },
    { id: '2', title: 'Billing Management', description: 'Handle client invoicing and payment tracking', url: '#billing', kind: 'article', source: 'KnowledgeBase' },
    { id: '3', title: 'Financial API', description: 'Integrate with financial systems via API', url: '#financial-api', kind: 'api', source: 'API Docs' }
  ],
  'System': [
    { id: '1', title: 'User Management Guide', description: 'Add users and configure permissions', url: '#user-management', kind: 'howto', source: 'KnowledgeBase' },
    { id: '2', title: 'Integration Setup', description: 'Connect third-party services and APIs', url: '#integrations', kind: 'article', source: 'KnowledgeBase' },
    { id: '3', title: 'System Configuration', description: 'Global settings and system preferences', url: '#system-config', kind: 'howto', source: 'KnowledgeBase' }
  ],
  'General': [
    { id: '1', title: 'Getting Started with LeadExec', description: 'Overview of key features and workflows', url: '#getting-started', kind: 'article', source: 'KnowledgeBase' },
    { id: '2', title: 'API Documentation', description: 'Complete API reference for developers', url: '#api-docs', kind: 'api', source: 'API Docs' }
  ]
};

// Tool name mappings
export const TOOL_NAMES: Record<string, string> = {
  'create-new-client': 'Create New Client',
  'create-client-simplified': 'Create Client (Simplified)',
  'bulk-client-upload': 'Bulk Client Upload'
};

// Method labels for delivery
export const DELIVERY_METHOD_LABELS: Record<string, string> = {
  'email': 'Email Delivery',
  'webhook': 'HTTP Webhook',
  'ftp': 'FTP Delivery',
  'pingpost': 'Ping Post', 
  'skip': 'Skip for Now'
};