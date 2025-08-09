import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { SimpleForm } from './ui-modules/SimpleForm';
import { VerticalCards } from './ui-modules/VerticalCards';
import { RadioGroup } from './ui-modules/RadioGroup';
import { CheckboxGroup } from './ui-modules/CheckboxGroup';
import { SimpleTable } from './ui-modules/SimpleTable';
import { SimpleInsights } from './ui-modules/SimpleInsights';
import { Progress } from './ui-modules/Progress';
import { 
  ChevronLeft,
  ChevronRight,
  FormInput,
  Grid3X3,
  Circle,
  CheckSquare,
  Table,
  BarChart3,
  Mail,
  Settings,
  Upload,
  ArrowRight
} from 'lucide-react';

interface ModulePreviewsProps {
  onClose?: () => void;
}

export function ModulePreviews({ onClose }: ModulePreviewsProps) {
  const [currentModule, setCurrentModule] = useState(0);

  const modules = [
    {
      id: 'simple-form',
      name: 'SimpleForm',
      description: 'Universal form component - handles any field type with validation',
      icon: <FormInput className="w-4 h-4" />,
      component: (
        <SimpleForm
          title="Contact Information"
          fields={[
            { id: 'name', label: 'Name', type: 'text', required: true, placeholder: 'Enter name' },
            { id: 'email', label: 'Email', type: 'email', required: true, placeholder: 'Enter email' },
            { id: 'message', label: 'Message', type: 'textarea', placeholder: 'Your message...' },
            { id: 'subscribe', label: 'Subscribe', type: 'checkbox', placeholder: 'Send me updates' }
          ]}
          onSubmit={(data) => console.log('Form data:', data)}
        />
      )
    },
    {
      id: 'vertical-cards',
      name: 'VerticalCards',
      description: 'Visual selection cards - works with 1-4 options, any selection mode',
      icon: <Grid3X3 className="w-4 h-4" />,
      component: (
        <VerticalCards
          title="Choose Option"
          selectionMode="single"
          options={[
            {
              id: 'email',
              title: 'Email',
              description: 'Send via email',
              icon: <Mail className="w-6 h-6 text-blue-600" />
            },
            {
              id: 'webhook',
              title: 'Webhook',
              description: 'API delivery',
              icon: <Settings className="w-6 h-6 text-green-600" />
            },
            {
              id: 'upload',
              title: 'Upload',
              description: 'File transfer',
              icon: <Upload className="w-6 h-6 text-purple-600" />
            }
          ]}
          onSelect={(selected) => console.log('Selected:', selected)}
        />
      )
    },
    {
      id: 'radio-group',
      name: 'RadioGroup',
      description: 'Single selection from a list - clean and simple',
      icon: <Circle className="w-4 h-4" />,
      component: (
        <RadioGroup
          title="Select Priority"
          options={[
            { id: 'high', label: 'High Priority', description: 'Urgent - process immediately' },
            { id: 'medium', label: 'Medium Priority', description: 'Standard processing time' },
            { id: 'low', label: 'Low Priority', description: 'When resources available' }
          ]}
          onSelect={(value) => console.log('Selected:', value)}
        />
      )
    },
    {
      id: 'checkbox-group',
      name: 'CheckboxGroup',
      description: 'Multiple selection with optional limits - very flexible',
      icon: <CheckSquare className="w-4 h-4" />,
      component: (
        <CheckboxGroup
          title="Select Features"
          description="Choose up to 2 features"
          maxSelection={2}
          options={[
            { id: 'analytics', label: 'Analytics', description: 'Performance metrics' },
            { id: 'alerts', label: 'Alerts', description: 'Real-time notifications' },
            { id: 'reports', label: 'Reports', description: 'Custom reporting' },
            { id: 'api', label: 'API Access', description: 'Integration capabilities' }
          ]}
          onSelect={(values) => console.log('Selected:', values)}
        />
      )
    },
    {
      id: 'simple-table',
      name: 'SimpleTable',
      description: 'Data display with search, sort, and different column types',
      icon: <Table className="w-4 h-4" />,
      component: (
        <SimpleTable
          title="Sample Data"
          columns={[
            { key: 'name', label: 'Name', sortable: true },
            { key: 'value', label: 'Value', type: 'number', sortable: true },
            { key: 'status', label: 'Status', type: 'badge' },
            { key: 'date', label: 'Date', type: 'date', sortable: true }
          ]}
          data={[
            { id: '1', name: 'Item A', value: 100, status: 'Active', date: new Date('2024-01-15') },
            { id: '2', name: 'Item B', value: 250, status: 'Pending', date: new Date('2024-01-14') },
            { id: '3', name: 'Item C', value: 75, status: 'Active', date: new Date('2024-01-12') }
          ]}
          maxHeight="200px"
        />
      )
    },
    {
      id: 'simple-insights',
      name: 'SimpleInsights',
      description: 'Metrics, progress, and alerts - adapts to any data',
      icon: <BarChart3 className="w-4 h-4" />,
      component: (
        <SimpleInsights
          title="Key Metrics"
          metrics={[
            { id: 'total', label: 'Total', value: 1234, type: 'number', change: 5.2, trend: 'up' },
            { id: 'revenue', label: 'Revenue', value: 25000, type: 'currency', change: 12.1, trend: 'up' },
            { id: 'rate', label: 'Success Rate', value: 89.5, type: 'percentage', change: -2.1, trend: 'down' }
          ]}
          progress={[
            { id: 'goal', label: 'Monthly Goal', value: 78, target: 100 }
          ]}
          alerts={[
            {
              id: 'info',
              title: 'System Update',
              message: 'New features available',
              type: 'info'
            }
          ]}
        />
      )
    },
    {
      id: 'progress',
      name: 'Progress',
      description: 'Step-by-step workflow tracking - flexible for any process',
      icon: <ArrowRight className="w-4 h-4" />,
      component: (
        <Progress
          title="Setup Process"
          description="Follow these steps to complete the configuration"
          steps={[
            {
              id: 'start',
              title: 'Getting Started',
              description: 'Learn about the setup process',
              status: 'completed'
            },
            {
              id: 'basic',
              title: 'Basic Information',
              description: 'Enter your details',
              status: 'current'
            },
            {
              id: 'config',
              title: 'Configuration',
              description: 'Set up your preferences',
              status: 'locked'
            },
            {
              id: 'review',
              title: 'Review',
              description: 'Confirm your settings',
              status: 'locked'
            }
          ]}
          onStepClick={(stepId) => console.log('Clicked step:', stepId)}
        />
      )
    }
  ];

  const nextModule = () => {
    setCurrentModule((prev) => (prev + 1) % modules.length);
  };

  const prevModule = () => {
    setCurrentModule((prev) => (prev - 1 + modules.length) % modules.length);
  };

  const currentModuleData = modules[currentModule];

  return (
    <Card className="p-4 max-w-3xl">
      <div className="space-y-4 max-h-[500px] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between flex-shrink-0">
          <div>
            <h4 className="text-sm font-medium">Universal Module Framework</h4>
            <p className="text-xs font-normal text-muted-foreground">
              7 simple, flexible components that handle 90% of interface scenarios
            </p>
          </div>
          {onClose && (
            <Button variant="outline" size="sm" onClick={onClose} className="text-xs font-normal">
              Close
            </Button>
          )}
        </div>

        {/* Module Navigation */}
        <div className="flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
              {currentModuleData.icon}
              <span className="text-sm font-medium">{currentModuleData.name}</span>
              <Badge variant="secondary" className="text-xs font-normal">
                {currentModule + 1} of {modules.length}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={prevModule}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="w-3 h-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={nextModule}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Description */}
        <div className="bg-muted/30 p-3 rounded-lg flex-shrink-0">
          <p className="text-xs font-normal">{currentModuleData.description}</p>
        </div>

        {/* Module Display */}
        <div className="flex-1 overflow-y-auto min-h-0 space-y-4">
          <div className="border rounded-lg p-4 bg-background">
            {currentModuleData.component}
          </div>

          {/* All Modules Overview */}
          <div className="border-t pt-3">
            <h5 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
              All Universal Modules
            </h5>
            <div className="grid grid-cols-2 gap-2">
              {modules.map((module, index) => (
                <Button
                  key={module.id}
                  variant={index === currentModule ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentModule(index)}
                  className="justify-start h-auto p-2"
                >
                  <div className="flex items-center gap-2">
                    {module.icon}
                    <span className="text-xs font-normal">{module.name}</span>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* Key Benefits */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <h5 className="text-xs font-medium mb-2">Why These 7 Modules Are Universal</h5>
            <div className="space-y-1 text-xs font-normal text-muted-foreground">
              <p>• <strong>SimpleForm:</strong> Any input collection (1 field to 20+ fields)</p>
              <p>• <strong>VerticalCards:</strong> Visual choices (1-4 options, any selection mode)</p>
              <p>• <strong>RadioGroup:</strong> Single selection from lists</p>
              <p>• <strong>CheckboxGroup:</strong> Multiple selection with limits</p>
              <p>• <strong>SimpleTable:</strong> Data display (any columns, any data)</p>
              <p>• <strong>SimpleInsights:</strong> Metrics, progress, alerts (any numbers)</p>
              <p>• <strong>Progress:</strong> Step-by-step workflows (any number of steps)</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}