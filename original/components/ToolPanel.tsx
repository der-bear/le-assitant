import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { LeadExecClientFlow } from './LeadExecClientFlow';
import { leadexecApi } from '../services/leadexecApi';
import { 
  ArrowLeft, 
  Users, 
  Target, 
  Mail, 
  FileText, 
  FolderOpen, 
  Settings,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface ToolPanelProps {
  selectedTool: string | null;
  onBack: () => void;
}

export function ToolPanel({ selectedTool, onBack }: ToolPanelProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setIsSubmitting(false);
      setSuccess(true);
      
      // Reset after showing success
      setTimeout(() => {
        setSuccess(false);
        setFormData({});
      }, 2000);
    } catch (err) {
      setIsSubmitting(false);
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleLeadExecClientComplete = async (clientData: any) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Create the client using the LeadExec API
      const clientResponse = await leadexecApi.createClient({
        companyName: clientData.companyName,
        email: clientData.email,
        username: clientData.username,
        password: clientData.password,
        notes: `Created via AI Assistant on ${new Date().toLocaleDateString()}`
      });

      if (clientResponse.success && clientResponse.ClientUID) {
        let deliveryMethodUID, deliveryAccountUID;

        // Create delivery method if configured
        if (clientData.setupDelivery && clientData.deliveryMethod) {
          const deliveryResponse = await leadexecApi.createDeliveryMethod(
            clientResponse.ClientUID,
            {
              type: clientData.deliveryMethod.type,
              settings: clientData.deliveryMethod
            }
          );
          
          if (deliveryResponse.success) {
            deliveryMethodUID = deliveryResponse.deliveryMethodUID;
          }
        }

        // Create delivery account if configured
        if (clientData.deliveryAccount && deliveryMethodUID) {
          const accountResponse = await leadexecApi.createDeliveryAccount(
            clientResponse.ClientUID,
            {
              accountName: clientData.deliveryAccount.accountName,
              limits: {
                hourly: clientData.deliveryAccount.hourlyLimit ? parseInt(clientData.deliveryAccount.hourlyLimit) : undefined,
                daily: clientData.deliveryAccount.dailyLimit ? parseInt(clientData.deliveryAccount.dailyLimit) : undefined,
                weekly: clientData.deliveryAccount.weeklyLimit ? parseInt(clientData.deliveryAccount.weeklyLimit) : undefined,
                monthly: clientData.deliveryAccount.monthlyLimit ? parseInt(clientData.deliveryAccount.monthlyLimit) : undefined,
              },
              settings: clientData.deliveryAccount
            }
          );
          
          if (accountResponse.success) {
            deliveryAccountUID = accountResponse.deliveryAccountUID;
          }
        }

        setSuccess(true);
        setIsSubmitting(false);

        // Show success for 3 seconds then navigate back to chat
        setTimeout(() => {
          onBack();
        }, 3000);

      } else {
        throw new Error(clientResponse.error || 'Failed to create client');
      }
    } catch (err) {
      setIsSubmitting(false);
      setError(err instanceof Error ? err.message : 'Failed to create client');
    }
  };

  const updateFormData = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  if (!selectedTool) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <h3 className="font-medium mb-2">Select a Tool</h3>
          <p className="text-sm">Choose a tool from the sidebar or chat to get started</p>
        </div>
      </div>
    );
  }

  // Handle LeadExec client setup flow
  if (selectedTool === 'leadexec-client-setup') {
    if (isSubmitting) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-16 h-16 mx-auto mb-4 animate-spin text-primary" />
            <h3 className="font-medium mb-2">Creating Client...</h3>
            <p className="text-sm text-muted-foreground">Setting up client and delivery configuration</p>
          </div>
        </div>
      );
    }

    if (success) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
            <h3 className="font-medium mb-2">Client Created Successfully!</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Your client has been added to LeadExec with all delivery settings configured.
            </p>
            <p className="text-xs text-muted-foreground">Redirecting to chat...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h3 className="font-medium mb-2">Error Creating Client</h3>
            <p className="text-sm text-red-600 mb-4">{error}</p>
            <Button onClick={() => setError(null)}>Try Again</Button>
          </div>
        </div>
      );
    }

    return (
      <LeadExecClientFlow
        onComplete={handleLeadExecClientComplete}
        onBack={onBack}
      />
    );
  }

  if (success) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
          <h3 className="font-medium mb-2">Success!</h3>
          <p className="text-sm text-muted-foreground">Your action has been completed successfully</p>
        </div>
      </div>
    );
  }

  const renderToolContent = () => {
    switch (selectedTool) {
      case 'create-client':
        return (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h3 className="font-medium mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Create New Client (Legacy Form)
              </h3>
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
                <p className="text-sm text-blue-800">
                  <strong>Tip:</strong> Use the new LeadExec Client Setup for a guided experience with delivery configuration.
                </p>
                <Button
                  type="button"
                  variant="link"
                  className="p-0 h-auto text-blue-600 hover:text-blue-800"
                  onClick={() => onBack()}
                >
                  Switch to guided setup →
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName || ''}
                  onChange={(e) => updateFormData('firstName', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName || ''}
                  onChange={(e) => updateFormData('lastName', e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => updateFormData('email', e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="company">Company Name</Label>
              <Input
                id="company"
                value={formData.company || ''}
                onChange={(e) => updateFormData('company', e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone || ''}
                  onChange={(e) => updateFormData('phone', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="tier">Client Tier</Label>
                <Select value={formData.tier || ''} onValueChange={(value) => updateFormData('tier', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select tier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes about the client..."
                value={formData.notes || ''}
                onChange={(e) => updateFormData('notes', e.target.value)}
                rows={3}
              />
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Creating Client...' : 'Create Client'}
            </Button>
          </form>
        );

      case 'create-lead-source':
        return (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h3 className="font-medium mb-4 flex items-center gap-2">
                <Target className="w-5 h-5" />
                Create Lead Source
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Set up a new lead generation source to track where your prospects are coming from.
              </p>
            </div>

            <div>
              <Label htmlFor="sourceName">Source Name</Label>
              <Input
                id="sourceName"
                placeholder="e.g., Google Ads, LinkedIn, Content Marketing"
                value={formData.sourceName || ''}
                onChange={(e) => updateFormData('sourceName', e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="sourceType">Source Type</Label>
              <Select value={formData.sourceType || ''} onValueChange={(value) => updateFormData('sourceType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select source type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid-ads">Paid Advertising</SelectItem>
                  <SelectItem value="organic">Organic Search</SelectItem>
                  <SelectItem value="social">Social Media</SelectItem>
                  <SelectItem value="email">Email Marketing</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                  <SelectItem value="direct">Direct Traffic</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cost">Monthly Cost ($)</Label>
                <Input
                  id="cost"
                  type="number"
                  placeholder="0.00"
                  value={formData.cost || ''}
                  onChange={(e) => updateFormData('cost', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="expectedLeads">Expected Leads/Month</Label>
                <Input
                  id="expectedLeads"
                  type="number"
                  placeholder="0"
                  value={formData.expectedLeads || ''}
                  onChange={(e) => updateFormData('expectedLeads', e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="trackingUrl">Tracking URL (Optional)</Label>
              <Input
                id="trackingUrl"
                placeholder="https://example.com/utm_source=..."
                value={formData.trackingUrl || ''}
                onChange={(e) => updateFormData('trackingUrl', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe this lead source and your strategy..."
                value={formData.description || ''}
                onChange={(e) => updateFormData('description', e.target.value)}
                rows={3}
              />
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Creating Lead Source...' : 'Create Lead Source'}
            </Button>
          </form>
        );

      default:
        return (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-medium mb-2">Tool Not Implemented</h3>
            <p className="text-sm text-muted-foreground mb-4">
              This tool is coming soon. Please try another tool from the sidebar.
            </p>
            <Button variant="outline" onClick={onBack}>
              Back to Chat
            </Button>
          </div>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="border-b p-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="mb-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Chat
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6">
        <Card className="max-w-2xl mx-auto p-6">
          {renderToolContent()}
        </Card>
      </div>
    </div>
  );
}