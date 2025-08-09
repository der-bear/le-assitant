import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { 
  Code2, 
  Copy, 
  Eye
} from 'lucide-react';
import { toast } from 'sonner';

// Import all modules
import { Form } from './ui-modules/Form';
import { ChoiceList } from './ui-modules/ChoiceList';
import { Table } from './ui-modules/Table';
import { Metrics } from './ui-modules/Metrics';
import { Steps } from './ui-modules/Steps';
import { FileDrop } from './ui-modules/FileDrop';
import { Chart } from './ui-modules/Chart';
import { Alert } from './ui-modules/Alert';
import { EntitySelect } from './ui-modules/EntitySelect';
import { SummaryCard } from './ui-modules/SummaryCard';
import { ProcessState } from './ui-modules/ProcessState';
import { HelpSources } from './ui-modules/HelpSources';

interface ComponentExample {
  id: string;
  title: string;
  description: string;
  module: string;
  props: any;
  component: React.ComponentType<any>;
}

const componentExamples: ComponentExample[] = [
  {
    id: 'form-basic',
    title: 'Form - Basic Fields',
    description: 'Simple form with text, email, and validation',
    module: 'Form',
    props: {
      kind: 'form',
      title: 'Basic Client Information',
      description: 'Enter client details with validation',
      fields: [
        { id: 'name', label: 'Company Name', type: 'text', required: true, placeholder: 'Enter company name' },
        { id: 'email', label: 'Email', type: 'email', required: true, placeholder: 'Enter email address' },
        { id: 'phone', label: 'Phone', type: 'tel', placeholder: 'Optional phone number' }
      ],
      validations: [
        { fieldId: 'name', rule: 'required', message: 'Company name is required' },
        { fieldId: 'email', rule: 'required', message: 'Email is required' },
        { fieldId: 'email', rule: 'regex', pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$', message: 'Invalid email format' }
      ],
      submitLabel: 'Create Client',
      cancelLabel: 'Cancel'
    },
    component: Form
  },
  {
    id: 'form-sections',
    title: 'Form - Progressive Sections',
    description: 'Form with sections and progressive reveal',
    module: 'Form',
    props: {
      kind: 'form',
      title: 'Advanced Client Setup',
      sections: [
        {
          id: 'basic',
          title: 'Basic Information',
          fields: [
            { id: 'company', label: 'Company Name', type: 'text', required: true },
            { id: 'email', label: 'Email', type: 'email', required: true }
          ]
        },
        {
          id: 'credentials',
          title: 'Generated Credentials',
          description: 'Auto-generated from email (editable)',
          fields: [
            { id: 'username', label: 'Username', type: 'text', value: 'john.doe' },
            { id: 'password', label: 'Temp Password', type: 'password', value: 'TempPass123!' }
          ],
          reveal: { kind: 'afterValid', fields: ['company', 'email'] }
        }
      ],
      validations: [
        { fieldId: 'company', rule: 'required', message: 'Required' },
        { fieldId: 'email', rule: 'required', message: 'Required' }
      ],
      derive: [
        { fieldId: 'username', from: ['email'], strategy: 'usernameFromEmail', editable: true },
        { fieldId: 'password', from: [], strategy: 'strongPassword', editable: true }
      ]
    },
    component: Form
  },
  {
    id: 'choicelist-single',
    title: 'ChoiceList - Single Selection',
    description: 'Single-select choice list with card layout',
    module: 'ChoiceList',
    props: {
      kind: 'choices',
      title: 'Choose Delivery Method',
      description: 'Select how leads will be delivered to your client',
      options: [
        { id: 'email', label: 'Email Delivery', description: 'Send leads directly to email - simple and reliable', icon: 'Mail', badge: 'Popular' },
        { id: 'webhook', label: 'HTTP Webhook', description: 'Real-time API delivery to client systems', icon: 'Webhook' },
        { id: 'ftp', label: 'FTP Upload', description: 'Batch file delivery via secure FTP', icon: 'Server' },
        { id: 'pingpost', label: 'Ping Post', description: 'Real-time lead posting with ping validation', icon: 'Zap' }
      ],
      mode: 'single',
      layout: 'card'
    },
    component: ChoiceList
  },
  {
    id: 'table-clients',
    title: 'Table - Client Directory',
    description: 'Sortable table with filtering and row actions',
    module: 'Table',
    props: {
      kind: 'table',
      title: 'Client Directory',
      description: 'Manage your active clients with sorting and filtering',
      columns: [
        { key: 'company', label: 'Company', sortable: true, width: '30%' },
        { key: 'email', label: 'Email', sortable: true, width: '25%' },
        { key: 'status', label: 'Status', sortable: true, width: '15%' },
        { key: 'leads', label: 'Leads', type: 'number', sortable: true, width: '15%' },
        { key: 'created', label: 'Created', type: 'date', sortable: true, width: '15%' }
      ],
      data: [
        { id: '1', company: 'Acme Corp', email: 'contact@acme.com', status: 'Active', leads: 1247, created: '2024-01-15' },
        { id: '2', company: 'TechStart Inc', email: 'hello@techstart.io', status: 'Active', leads: 856, created: '2024-02-03' },
        { id: '3', company: 'Global Solutions', email: 'info@globalsol.com', status: 'Paused', leads: 2103, created: '2023-11-20' },
        { id: '4', company: 'Digital Dynamics', email: 'team@digitaldyn.com', status: 'Active', leads: 542, created: '2024-03-12' },
        { id: '5', company: 'Innovation Labs', email: 'contact@innolabs.com', status: 'Setup', leads: 0, created: '2024-03-15' }
      ],
      filterable: true,
      filterPlaceholder: 'Search clients...',
      selection: 'multiple',
      rowAction: { id: 'view', label: 'View' },
      export: { formats: ['csv', 'xlsx'], filename: 'clients' },
      maxHeight: '300px'
    },
    component: Table
  },
  {
    id: 'metrics-grid',
    title: 'Metrics - KPI Cards',
    description: 'Metric cards with change indicators',
    module: 'Metrics',
    props: {
      kind: 'metrics',
      title: 'Performance Overview',
      metrics: [
        { id: 'leads', label: 'Total Leads', value: 1247, kind: 'number', change: 12.5 },
        { id: 'revenue', label: 'Revenue', value: 45670, kind: 'currency', change: -3.2 },
        { id: 'conversion', label: 'Conversion Rate', value: 23.4, kind: 'percent', change: 5.1 },
        { id: 'clients', label: 'Active Clients', value: 89, kind: 'number', change: 0 }
      ],
      layout: 'grid',
      exportable: true
    },
    component: Metrics
  },
  {
    id: 'steps-progress',
    title: 'Steps - Progress Indicator',
    description: 'Step progress with current state',
    module: 'Steps',
    props: {
      kind: 'steps',
      variant: 'progress',
      title: 'Client Setup Progress',
      steps: [
        { id: 'info', title: 'Basic Information', hint: 'Company details' },
        { id: 'delivery', title: 'Delivery Method', hint: 'Choose delivery type' },
        { id: 'config', title: 'Configuration', hint: 'Set preferences' },
        { id: 'review', title: 'Review & Create', hint: 'Final confirmation' }
      ],
      status: {
        info: 'done',
        delivery: 'current',
        config: 'todo',
        review: 'todo'
      },
      current: 'delivery',
      showIndex: true
    },
    component: Steps
  },
  {
    id: 'filedrop-excel',
    title: 'FileDrop - Excel Upload',
    description: 'File upload with validation and progress',
    module: 'FileDrop',
    props: {
      kind: 'filedrop',
      title: 'Bulk Client Upload',
      description: 'Upload multiple clients using Excel template',
      accept: '.xlsx,.xls,.csv',
      multiple: false,
      maxSizeMb: 10,
      note: 'Download our Excel template to ensure proper formatting'
    },
    component: FileDrop
  },
  {
    id: 'chart-metrics',
    title: 'Chart - Revenue Trends',
    description: 'Chart with header metrics and type switching',
    module: 'Chart',
    props: {
      kind: 'chart',
      title: 'Revenue Analysis',
      type: 'line',
      series: [
        { id: 'revenue', label: 'Revenue', data: [15000, 18000, 22000, 19000, 25000, 28000] },
        { id: 'profit', label: 'Profit', data: [5000, 7000, 9000, 8000, 12000, 14000] }
      ],
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      unit: 'currency',
      switchableTypes: ['line', 'bar', 'pie'],
      legend: true,
      headerMetrics: [
        { id: 'total', label: 'Total Revenue', value: 127000, kind: 'currency', change: 15.2 },
        { id: 'avg', label: 'Avg Monthly', value: 21167, kind: 'currency', change: 8.7 }
      ],
      exportable: true
    },
    component: Chart
  },
  {
    id: 'alert-success',
    title: 'Alert - Success',
    description: 'Success notification with green styling',
    module: 'Alert',
    props: {
      kind: 'alert',
      type: 'success',
      title: 'Client Created Successfully',
      message: 'Acme Corp has been added to your LeadExec system and is ready to receive leads.',
      placement: 'inline',
      dismissible: true
    },
    component: Alert
  },
  {
    id: 'alert-error',
    title: 'Alert - Error',
    description: 'Error notification with red styling',
    module: 'Alert',
    props: {
      kind: 'alert',
      type: 'error',
      title: 'Connection Failed',
      message: 'Unable to connect to the API. Please check your network connection and try again.',
      placement: 'inline',
      dismissible: true
    },
    component: Alert
  },
  {
    id: 'alert-warning',
    title: 'Alert - Warning',
    description: 'Warning notification with amber styling',
    module: 'Alert',
    props: {
      kind: 'alert',
      type: 'warning',
      title: 'High Usage Detected',
      message: 'You have used 90% of your monthly lead quota. Consider upgrading your plan.',
      placement: 'inline',
      dismissible: true
    },
    component: Alert
  },
  {
    id: 'alert-info',
    title: 'Alert - Info',
    description: 'Information notification with blue styling',
    module: 'Alert',
    props: {
      kind: 'alert',
      type: 'info',
      title: 'Maintenance Scheduled',
      message: 'System maintenance is scheduled for tonight at 2 AM EST. Service may be briefly interrupted.',
      placement: 'inline',
      dismissible: true
    },
    component: Alert
  },
  {
    id: 'entityselect-clients',
    title: 'EntitySelect - Client Search',
    description: 'Searchable entity selector with remote loading',
    module: 'EntitySelect',
    props: {
      kind: 'entity-select',
      title: 'Select Clients',
      description: 'Search and select from your client list',
      mode: 'multiple',
      placeholder: 'Search clients...',
      options: [
        { id: '1', label: 'Acme Corp', description: 'contact@acme.com' },
        { id: '2', label: 'TechStart Inc', description: 'hello@techstart.io' },
        { id: '3', label: 'Global Solutions', description: 'info@globalsol.com' },
        { id: '4', label: 'Digital Dynamics', description: 'team@digitaldyn.com' }
      ],
      remote: false,
      creatable: { label: 'Create new client' },
      allowClear: true
    },
    component: EntitySelect
  },
  {
    id: 'summarycard-results',
    title: 'SummaryCard - Batch Results',
    description: 'Summary of batch operation results',
    module: 'SummaryCard',
    props: {
      kind: 'summary',
      title: 'Bulk Upload Results',
      description: 'Summary of client import operation',
      items: [
        { id: '1', title: 'Acme Corp', subtitle: 'contact@acme.com', status: 'success', message: 'Created successfully' },
        { id: '2', title: 'TechStart Inc', subtitle: 'hello@techstart.io', status: 'success', message: 'Created successfully' },
        { id: '3', title: 'Bad Data Co', subtitle: 'invalid-email', status: 'error', message: 'Invalid email format' },
        { id: '4', title: 'Global Solutions', subtitle: 'info@globalsol.com', status: 'warning', message: 'Duplicate found, skipped' }
      ],
      compact: false,
      actions: [
        { id: 'retry', label: 'Retry Failed', variant: 'secondary' },
        { id: 'export', label: 'Export Report' }
      ]
    },
    component: SummaryCard
  },
  {
    id: 'processstate-creating',
    title: 'ProcessState - Processing',
    description: 'Inline processing indicator',
    module: 'ProcessState',
    props: {
      kind: 'process-state',
      state: 'processing',
      detail: 'Setting up delivery configuration...'
    },
    component: ProcessState
  }
];

export function ComponentGallery() {
  const [showCode, setShowCode] = useState<Record<string, boolean>>({});

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Copied to clipboard');
    });
  };

  const formatJSON = (obj: any) => {
    return JSON.stringify(obj, null, 2);
  };

  const toggleCode = (exampleId: string) => {
    setShowCode(prev => ({
      ...prev,
      [exampleId]: !prev[exampleId]
    }));
  };

  const renderExample = (example: ComponentExample) => {
    const Component = example.component;
    return (
      <Component
        {...example.props}
        onChange={() => {}}
        onSubmit={() => {}}
        onAction={() => {}}
      />
    );
  };

  return (
    <div className="h-full w-full bg-background flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto py-8 px-6">
          {/* Header */}
          <div className="mb-8 space-y-3">
            <h1 className="text-2xl font-medium text-foreground">Component Gallery</h1>
            <p className="text-base text-muted-foreground leading-relaxed max-w-3xl">
              Browse all 12 universal UI modules with live examples and JSON payloads. 
              These components can be embedded in chat conversations to collect input or display structured data.
            </p>
          </div>

          {/* Component Grid */}
          <div className="space-y-12">
            {componentExamples.map((example, index) => (
              <div key={example.id} className="space-y-6">
                {/* Section Header */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-medium text-foreground">{example.title}</h2>
                    <Badge variant="outline" className="text-xs font-normal">
                      {example.module}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {example.description}
                  </p>

                  {/* Controls */}
                  <div className="flex items-center gap-3">
                    <Button
                      variant={showCode[example.id] ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleCode(example.id)}
                      className="h-8 px-3 text-sm gap-2 font-medium"
                    >
                      {showCode[example.id] ? <Eye className="w-4 h-4" /> : <Code2 className="w-4 h-4" />}
                      {showCode[example.id] ? 'Preview' : 'Show Code'}
                    </Button>
                    
                    {showCode[example.id] && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(formatJSON(example.props))}
                        className="h-8 px-3 text-sm gap-2 font-medium"
                      >
                        <Copy className="w-4 h-4" />
                        Copy JSON
                      </Button>
                    )}
                  </div>
                </div>

                {/* Content */}
                {showCode[example.id] ? (
                  <Card className="border border-border rounded-lg bg-card">
                    <div className="px-6 py-4 border-b border-border bg-muted/30">
                      <h3 className="text-sm font-medium text-foreground">Component Props</h3>
                    </div>
                    <div className="p-6">
                      <pre className="text-sm font-mono leading-6 overflow-x-auto text-muted-foreground bg-muted/20 p-4 rounded-md border border-border">
                        {formatJSON(example.props)}
                      </pre>
                    </div>
                  </Card>
                ) : (
                  (() => {
                    // Check if component needs wrapper (Alert and ProcessState don't)
                    const needsWrapper = example.module !== 'Alert' && example.module !== 'ProcessState';
                    
                    if (needsWrapper) {
                      return (
                        <Card className="border border-border rounded-lg bg-card overflow-hidden">
                          <div className="p-8 bg-background">
                            {renderExample(example)}
                          </div>
                        </Card>
                      );
                    } else {
                      // Render Alert and ProcessState with no wrapper at all
                      return renderExample(example);
                    }
                  })()
                )}

                {/* Separator between examples */}
                {index < componentExamples.length - 1 && (
                  <Separator className="mt-12" />
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground text-center">
              That's all {componentExamples.length} universal modules. Each can be embedded in conversations 
              with customized props to create rich, interactive experiences.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}