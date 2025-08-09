import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ModulePreviews } from './ModulePreviews';
import { 
  Eye,
  ArrowRight,
  FormInput,
  Grid3X3,
  Circle,
  CheckSquare,
  Table,
  BarChart3,
  TrendingUp
} from 'lucide-react';
import exampleImage from 'figma:asset/946362ffa5de9e42bf8076e50acf488321632317.png';

interface DesignShowcaseProps {
  onClose?: () => void;
}

export function DesignShowcase({ onClose }: DesignShowcaseProps) {
  const [showLiveModules, setShowLiveModules] = useState(false);

  if (showLiveModules) {
    return <ModulePreviews onClose={() => setShowLiveModules(false)} />;
  }

  return (
    <Card className="p-6 max-w-4xl">
      <div className="space-y-6 max-h-[600px] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-medium">Universal Module Framework</h3>
            <p className="text-sm font-normal text-muted-foreground">
              Simple, flexible components that adapt to any scenario
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowLiveModules(true)}
              className="text-sm font-normal"
            >
              <Eye className="w-4 h-4 mr-2" />
              View Live Modules
            </Button>
            {onClose && (
              <Button variant="outline" onClick={onClose} className="text-sm font-normal">
                Close
              </Button>
            )}
          </div>
        </div>

        {/* Design Examples */}
        <div className="border rounded-lg overflow-hidden">
          <img
            src={exampleImage}
            alt="Design Examples"
            className="w-full h-auto"
          />
        </div>

        {/* Framework Overview */}
        <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg border">
          <h4 className="text-sm font-medium mb-3">7 Universal Components Handle Everything</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { name: 'SimpleForm', icon: <FormInput className="w-4 h-4" />, use: 'Any input collection' },
              { name: 'VerticalCards', icon: <Grid3X3 className="w-4 h-4" />, use: 'Visual option selection' },
              { name: 'RadioGroup', icon: <Circle className="w-4 h-4" />, use: 'Single choice from list' },
              { name: 'CheckboxGroup', icon: <CheckSquare className="w-4 h-4" />, use: 'Multiple selection' },
              { name: 'SimpleTable', icon: <Table className="w-4 h-4" />, use: 'Data display & sorting' },
              { name: 'SimpleInsights', icon: <BarChart3 className="w-4 h-4" />, use: 'Metrics & alerts' },
              { name: 'Progress', icon: <TrendingUp className="w-4 h-4" />, use: 'Step workflows' }
            ].map((component) => (
              <div key={component.name} className="bg-white p-3 rounded-md">
                <div className="flex items-center gap-2 mb-1">
                  {component.icon}
                  <span className="text-sm font-medium">{component.name}</span>
                </div>
                <p className="text-xs font-normal text-muted-foreground">{component.use}</p>
              </div>
            ))}
          </div>
        </div>

        {/* AI Agent Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h5 className="text-sm font-medium">Perfect for AI Agents</h5>
            <div className="space-y-2 text-sm font-normal text-muted-foreground">
              <p>• <strong>Simple APIs:</strong> Easy to understand and configure</p>
              <p>• <strong>Flexible:</strong> Each component adapts to different scenarios</p>
              <p>• <strong>Universal:</strong> 7 components handle 90% of UI needs</p>
              <p>• <strong>Consistent:</strong> Same patterns across all modules</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <h5 className="text-sm font-medium">Example Scenarios</h5>
            <div className="space-y-2 text-sm font-normal text-muted-foreground">
              <p>• Contact forms, feedback, settings</p>
              <p>• Method selection, feature choices</p>
              <p>• Priority levels, preferences</p>
              <p>• Feature toggles, permissions</p>
              <p>• Client lists, performance data</p>
              <p>• Dashboards, KPIs, status updates</p>
              <p>• Setup flows, onboarding, multi-step forms</p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-muted/30 p-4 rounded-lg text-center space-y-3">
          <div>
            <h4 className="text-sm font-medium">See the Framework in Action</h4>
            <p className="text-xs font-normal text-muted-foreground">
              Explore interactive examples of each universal component
            </p>
          </div>
          <Button onClick={() => setShowLiveModules(true)} className="text-sm font-normal">
            <Eye className="w-4 h-4 mr-2" />
            View Interactive Examples
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </Card>
  );
}