import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { 
  Users, 
  Mail, 
  Upload, 
  CheckCircle, 
  ArrowRight,
  ArrowLeft,
  Building,
  Key,
  Settings,
  Globe,
  Clock,
  RefreshCw,
  Bell
} from 'lucide-react';

interface ClientData {
  companyName: string;
  email: string;
  username: string;
  password: string;
  setupDelivery: boolean;
  deliveryMethod?: {
    type: 'email' | 'webhook' | 'ftp' | 'pingpost' | 'other';
    useClientEmail: boolean;
    useAllFields: boolean;
    excludedFields: string;
    customTemplate: boolean;
    templateFile?: File;
    hasSchedule: boolean;
    scheduleDetails: string;
    hasRetryLogic: boolean;
    retryRules: string;
    notifyOnFailure: boolean;
    notificationRecipient: string;
  };
  deliveryAccount?: {
    accountName: string;
    hourlyLimit: string;
    dailyLimit: string;
    weeklyLimit: string;
    monthlyLimit: string;
    useDeliveryMethod: boolean;
    exclusiveDelivery: boolean;
    useOrderSystem: boolean;
    minRevenue: string;
    minProfit: string;
    criteria: string;
  };
}

interface LeadExecClientFlowProps {
  onComplete: (clientData: ClientData) => void;
  onBack: () => void;
}

type FlowStep = 
  | 'entry'
  | 'individual-setup'
  | 'bulk-upload'
  | 'delivery-method-choice'
  | 'delivery-method-setup'
  | 'delivery-account-setup'
  | 'completion';

export function LeadExecClientFlow({ onComplete, onBack }: LeadExecClientFlowProps) {
  const [currentStep, setCurrentStep] = useState<FlowStep>('entry');
  const [clientData, setClientData] = useState<ClientData>({
    companyName: '',
    email: '',
    username: '',
    password: '',
    setupDelivery: false
  });

  const generateUsername = (email: string): string => {
    return email.split('@')[0] || '';
  };

  const generatePassword = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const updateClientData = (updates: Partial<ClientData>) => {
    setClientData(prev => ({ ...prev, ...updates }));
  };

  const updateDeliveryMethod = (updates: Partial<ClientData['deliveryMethod']>) => {
    setClientData(prev => ({
      ...prev,
      deliveryMethod: { ...prev.deliveryMethod, ...updates } as ClientData['deliveryMethod']
    }));
  };

  const updateDeliveryAccount = (updates: Partial<ClientData['deliveryAccount']>) => {
    setClientData(prev => ({
      ...prev,
      deliveryAccount: { ...prev.deliveryAccount, ...updates } as ClientData['deliveryAccount']
    }));
  };

  const handleEmailChange = (email: string) => {
    updateClientData({
      email,
      username: generateUsername(email),
      password: generatePassword()
    });
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'entry':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h3 className="text-xl font-medium mb-2">Welcome to Client Setup</h3>
              <p className="text-muted-foreground">
                Would you like to create a single new client or upload multiple clients via Excel?
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={() => setCurrentStep('individual-setup')}
                className="h-auto p-6 flex flex-col items-center gap-3"
                variant="outline"
              >
                <Building className="w-8 h-8" />
                <div className="text-center">
                  <p className="font-medium">Single Client</p>
                  <p className="text-sm text-muted-foreground">Create one client with guided setup</p>
                </div>
              </Button>
              
              <Button
                onClick={() => setCurrentStep('bulk-upload')}
                className="h-auto p-6 flex flex-col items-center gap-3"
                variant="outline"
              >
                <Upload className="w-8 h-8" />
                <div className="text-center">
                  <p className="font-medium">Bulk Upload</p>
                  <p className="text-sm text-muted-foreground">Upload multiple clients via Excel</p>
                </div>
              </Button>
            </div>
          </div>
        );

      case 'individual-setup':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                <Building className="w-5 h-5" />
                Individual Client Setup
              </h3>
            </div>

            <div>
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                placeholder="Enter the company name"
                value={clientData.companyName}
                onChange={(e) => updateClientData({ companyName: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter a unique email address for this client"
                value={clientData.email}
                onChange={(e) => handleEmailChange(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                This will be used for portal access and communication
              </p>
            </div>

            {clientData.email && (
              <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  Auto-Generated Credentials
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label>Username</Label>
                    <div className="p-2 bg-background rounded border">
                      {clientData.username}
                    </div>
                  </div>
                  <div>
                    <Label>Temporary Password</Label>
                    <div className="p-2 bg-background rounded border font-mono">
                      {clientData.password}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  These credentials will be used for portal access. The client should change their password on first login.
                </p>
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep('entry')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button 
                onClick={() => setCurrentStep('delivery-method-choice')}
                disabled={!clientData.companyName || !clientData.email}
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        );

      case 'bulk-upload':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Bulk Client Upload
              </h3>
              <p className="text-muted-foreground mb-6">
                Please upload an Excel file that includes at minimum:
              </p>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Required Columns:</h4>
              <ul className="text-sm space-y-1">
                <li>• Company Name</li>
                <li>• Email Address (used for login)</li>
              </ul>
              <p className="text-xs text-muted-foreground mt-3">
                Temporary passwords will be auto-generated for each client.
              </p>
            </div>

            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
              <Upload className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
              <p className="font-medium mb-1">Drop your Excel file here</p>
              <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
              <Button variant="outline">
                Choose File
              </Button>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep('entry')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button onClick={() => setCurrentStep('delivery-method-choice')}>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        );

      case 'delivery-method-choice':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Delivery Method Setup
              </h3>
              <p className="text-muted-foreground">
                Would you like to set up a delivery method for this client?
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={() => {
                  updateClientData({ setupDelivery: true });
                  setCurrentStep('delivery-method-setup');
                }}
                className="h-auto p-6 flex flex-col items-center gap-3"
                variant="outline"
              >
                <CheckCircle className="w-8 h-8 text-green-500" />
                <div className="text-center">
                  <p className="font-medium">Yes, Set Up Delivery</p>
                  <p className="text-sm text-muted-foreground">Configure how leads are delivered</p>
                </div>
              </Button>
              
              <Button
                onClick={() => {
                  updateClientData({ setupDelivery: false });
                  setCurrentStep('completion');
                }}
                className="h-auto p-6 flex flex-col items-center gap-3"
                variant="outline"
              >
                <ArrowRight className="w-8 h-8" />
                <div className="text-center">
                  <p className="font-medium">Skip for Now</p>
                  <p className="text-sm text-muted-foreground">Set up delivery later</p>
                </div>
              </Button>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep('individual-setup')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </div>
          </div>
        );

      case 'delivery-method-setup':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Delivery Method Configuration</h3>
            </div>

            <div>
              <Label>Delivery Method Type</Label>
              <Select 
                value={clientData.deliveryMethod?.type || ''} 
                onValueChange={(value) => updateDeliveryMethod({ type: value as any })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select delivery method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </div>
                  </SelectItem>
                  <SelectItem value="webhook">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      HTTP Webhook
                    </div>
                  </SelectItem>
                  <SelectItem value="ftp">FTP</SelectItem>
                  <SelectItem value="pingpost">Ping Post</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {clientData.deliveryMethod?.type === 'email' && (
              <div className="space-y-4 bg-muted/50 p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="useClientEmail"
                    checked={clientData.deliveryMethod?.useClientEmail || false}
                    onCheckedChange={(checked) => updateDeliveryMethod({ useClientEmail: checked as boolean })}
                  />
                  <Label htmlFor="useClientEmail">Use client email ({clientData.email})</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="useAllFields"
                    checked={clientData.deliveryMethod?.useAllFields || false}
                    onCheckedChange={(checked) => updateDeliveryMethod({ useAllFields: checked as boolean })}
                  />
                  <Label htmlFor="useAllFields">Use all lead type mappings</Label>
                </div>

                {!clientData.deliveryMethod?.useAllFields && (
                  <div>
                    <Label htmlFor="excludedFields">Excluded Fields</Label>
                    <Textarea
                      id="excludedFields"
                      placeholder="Enter fields to exclude (comma-separated)"
                      value={clientData.deliveryMethod?.excludedFields || ''}
                      onChange={(e) => updateDeliveryMethod({ excludedFields: e.target.value })}
                    />
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="customTemplate"
                    checked={clientData.deliveryMethod?.customTemplate || false}
                    onCheckedChange={(checked) => updateDeliveryMethod({ customTemplate: checked as boolean })}
                  />
                  <Label htmlFor="customTemplate">Upload custom email template</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="hasSchedule"
                    checked={clientData.deliveryMethod?.hasSchedule || false}
                    onCheckedChange={(checked) => updateDeliveryMethod({ hasSchedule: checked as boolean })}
                  />
                  <Label htmlFor="hasSchedule">Follow delivery schedule</Label>
                </div>

                {clientData.deliveryMethod?.hasSchedule && (
                  <div>
                    <Label htmlFor="scheduleDetails">Schedule Details</Label>
                    <Textarea
                      id="scheduleDetails"
                      placeholder="Enter schedule details..."
                      value={clientData.deliveryMethod?.scheduleDetails || ''}
                      onChange={(e) => updateDeliveryMethod({ scheduleDetails: e.target.value })}
                    />
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="hasRetryLogic"
                    checked={clientData.deliveryMethod?.hasRetryLogic || false}
                    onCheckedChange={(checked) => updateDeliveryMethod({ hasRetryLogic: checked as boolean })}
                  />
                  <Label htmlFor="hasRetryLogic">Enable retry logic for failed deliveries</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="notifyOnFailure"
                    checked={clientData.deliveryMethod?.notifyOnFailure || false}
                    onCheckedChange={(checked) => updateDeliveryMethod({ notifyOnFailure: checked as boolean })}
                  />
                  <Label htmlFor="notifyOnFailure">Notify account owner on delivery failures</Label>
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep('delivery-method-choice')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button onClick={() => setCurrentStep('delivery-account-setup')}>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        );

      case 'delivery-account-setup':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Delivery Account Setup</h3>
              <p className="text-muted-foreground">
                Create a delivery account for this client to manage lead distribution.
              </p>
            </div>

            <div>
              <Label htmlFor="accountName">Account Name</Label>
              <Input
                id="accountName"
                value={clientData.deliveryAccount?.accountName || `${clientData.companyName}_${clientData.deliveryMethod?.type}`}
                onChange={(e) => updateDeliveryAccount({ accountName: e.target.value })}
                placeholder="Auto-generated name"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Auto-generated as: {clientData.companyName}_{clientData.deliveryMethod?.type}
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-3">Quantity Limits (Optional)</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="hourlyLimit">Hourly</Label>
                  <Input
                    id="hourlyLimit"
                    type="number"
                    placeholder="No limit"
                    value={clientData.deliveryAccount?.hourlyLimit || ''}
                    onChange={(e) => updateDeliveryAccount({ hourlyLimit: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="dailyLimit">Daily</Label>
                  <Input
                    id="dailyLimit"
                    type="number"
                    placeholder="No limit"
                    value={clientData.deliveryAccount?.dailyLimit || ''}
                    onChange={(e) => updateDeliveryAccount({ dailyLimit: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="weeklyLimit">Weekly</Label>
                  <Input
                    id="weeklyLimit"
                    type="number"
                    placeholder="No limit"
                    value={clientData.deliveryAccount?.weeklyLimit || ''}
                    onChange={(e) => updateDeliveryAccount({ weeklyLimit: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="monthlyLimit">Monthly</Label>
                  <Input
                    id="monthlyLimit"
                    type="number"
                    placeholder="No limit"
                    value={clientData.deliveryAccount?.monthlyLimit || ''}
                    onChange={(e) => updateDeliveryAccount({ monthlyLimit: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="exclusiveDelivery"
                  checked={clientData.deliveryAccount?.exclusiveDelivery || false}
                  onCheckedChange={(checked) => updateDeliveryAccount({ exclusiveDelivery: checked as boolean })}
                />
                <Label htmlFor="exclusiveDelivery">Exclusive delivery (no other client receives leads from this batch)</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="useOrderSystem"
                  checked={clientData.deliveryAccount?.useOrderSystem || false}
                  onCheckedChange={(checked) => updateDeliveryAccount({ useOrderSystem: checked as boolean })}
                />
                <Label htmlFor="useOrderSystem">Use order system</Label>
              </div>

              {clientData.deliveryAccount?.useOrderSystem && (
                <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> You must create an order for this client to receive leads.
                  </p>
                </div>
              )}
            </div>

            <div>
              <h4 className="font-medium mb-3">Revenue Requirements</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minRevenue">Minimum Revenue ($)</Label>
                  <Input
                    id="minRevenue"
                    type="number"
                    placeholder="0.00"
                    value={clientData.deliveryAccount?.minRevenue || ''}
                    onChange={(e) => updateDeliveryAccount({ minRevenue: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="minProfit">Minimum Profit ($ or %)</Label>
                  <Input
                    id="minProfit"
                    placeholder="0.00 or 0%"
                    value={clientData.deliveryAccount?.minProfit || ''}
                    onChange={(e) => updateDeliveryAccount({ minProfit: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="criteria">Additional Criteria</Label>
              <Textarea
                id="criteria"
                placeholder="Enter any criteria filters (e.g., state, zip, lead field filters)"
                value={clientData.deliveryAccount?.criteria || ''}
                onChange={(e) => updateDeliveryAccount({ criteria: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep('delivery-method-setup')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button onClick={() => setCurrentStep('completion')}>
                Complete Setup
                <CheckCircle className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        );

      case 'completion':
        return (
          <div className="space-y-6 text-center">
            <div>
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
              <h3 className="text-xl font-medium mb-2">Setup Complete!</h3>
              <p className="text-muted-foreground mb-6">
                Your client(s) have been successfully added to the system with the selected delivery methods and delivery accounts.
              </p>
            </div>

            <div className="bg-muted/50 p-6 rounded-lg text-left">
              <h4 className="font-medium mb-4">Summary:</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Company:</span>
                  <span className="font-medium">{clientData.companyName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Email:</span>
                  <span className="font-medium">{clientData.email}</span>
                </div>
                <div className="flex justify-between">
                  <span>Username:</span>
                  <span className="font-medium">{clientData.username}</span>
                </div>
                {clientData.setupDelivery && (
                  <div className="flex justify-between">
                    <span>Delivery Method:</span>
                    <span className="font-medium capitalize">{clientData.deliveryMethod?.type}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={() => onComplete(clientData)} className="flex-1">
                View Client List
              </Button>
              <Button variant="outline" onClick={() => setCurrentStep('entry')} className="flex-1">
                Create Another Client
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card className="p-6">
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Chat
          </Button>
          
          {/* Progress indicator */}
          <div className="flex items-center space-x-2 mb-4">
            {['entry', 'individual-setup', 'delivery-method-choice', 'delivery-method-setup', 'delivery-account-setup', 'completion'].map((step, index) => (
              <div key={step} className="flex items-center">
                <div className={`w-2 h-2 rounded-full ${
                  currentStep === step ? 'bg-primary' : 
                  ['entry', 'individual-setup', 'delivery-method-choice', 'delivery-method-setup', 'delivery-account-setup', 'completion'].indexOf(currentStep) > index 
                    ? 'bg-green-500' : 'bg-muted'
                }`} />
                {index < 5 && <div className="w-4 h-px bg-muted mx-1" />}
              </div>
            ))}
          </div>
        </div>
        
        {renderStep()}
      </Card>
    </div>
  );
}