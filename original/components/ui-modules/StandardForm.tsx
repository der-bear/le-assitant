import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Badge } from '../ui/badge';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface FormField {
  id: string;
  label: string;
  type: 'text' | 'email' | 'textarea' | 'select' | 'checkbox';
  required?: boolean;
  placeholder?: string;
  options?: string[];
  value?: any;
  disabled?: boolean;
  description?: string;
}

interface StandardFormProps {
  title: string;
  fields: FormField[];
  onSubmit: (data: Record<string, any>) => void;
  onCancel?: () => void;
  submitLabel?: string;
  isLoading?: boolean;
  completedSteps?: string[];
  currentStep?: string;
}

export function StandardForm({ 
  title, 
  fields, 
  onSubmit, 
  onCancel, 
  submitLabel = "Continue",
  isLoading = false,
  completedSteps = [],
  currentStep
}: StandardFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    fields.forEach(field => {
      initial[field.id] = field.value || (field.type === 'checkbox' ? false : '');
    });
    return initial;
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    const newErrors: Record<string, string> = {};
    fields.forEach(field => {
      if (field.required && !formData[field.id]) {
        newErrors[field.id] = `${field.label} is required`;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    onSubmit(formData);
  };

  const updateField = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
    if (errors[fieldId]) {
      setErrors(prev => ({ ...prev, [fieldId]: '' }));
    }
  };

  return (
    <Card className="p-4 max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-medium">{title}</h4>
          {currentStep && completedSteps.includes(currentStep) && (
            <Badge variant="secondary" className="text-xs font-normal">
              <CheckCircle className="w-3 h-3 mr-1" />
              Completed
            </Badge>
          )}
        </div>

        {fields.map(field => {
          const isDisabled = field.disabled || (completedSteps.includes(field.id) && currentStep !== field.id);
          
          return (
            <div key={field.id} className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor={field.id} className="text-sm font-medium">
                  {field.label}
                  {field.required && <span className="text-destructive">*</span>}
                </Label>
                {completedSteps.includes(field.id) && (
                  <CheckCircle className="w-3 h-3 text-green-600" />
                )}
              </div>
              
              {field.description && (
                <p className="text-xs font-normal text-muted-foreground">{field.description}</p>
              )}

              {field.type === 'text' || field.type === 'email' ? (
                <Input
                  id={field.id}
                  type={field.type}
                  placeholder={field.placeholder}
                  value={formData[field.id]}
                  onChange={(e) => updateField(field.id, e.target.value)}
                  className="text-sm font-normal"
                  disabled={isDisabled}
                />
              ) : field.type === 'textarea' ? (
                <Textarea
                  id={field.id}
                  placeholder={field.placeholder}
                  value={formData[field.id]}
                  onChange={(e) => updateField(field.id, e.target.value)}
                  className="text-sm font-normal"
                  disabled={isDisabled}
                  rows={3}
                />
              ) : field.type === 'select' ? (
                <Select
                  value={formData[field.id]}
                  onValueChange={(value) => updateField(field.id, value)}
                  disabled={isDisabled}
                >
                  <SelectTrigger className="text-sm font-normal">
                    <SelectValue placeholder={field.placeholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options?.map(option => (
                      <SelectItem key={option} value={option} className="text-sm font-normal">
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : field.type === 'checkbox' ? (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={field.id}
                    checked={formData[field.id]}
                    onCheckedChange={(checked) => updateField(field.id, checked)}
                    disabled={isDisabled}
                  />
                  <Label htmlFor={field.id} className="text-sm font-normal">
                    {field.placeholder}
                  </Label>
                </div>
              ) : null}

              {errors[field.id] && (
                <div className="flex items-center gap-1 text-destructive">
                  <AlertCircle className="w-3 h-3" />
                  <span className="text-xs font-normal">{errors[field.id]}</span>
                </div>
              )}
            </div>
          );
        })}

        <div className="flex gap-2 pt-2">
          <Button 
            type="submit" 
            className="flex-1 text-sm font-medium" 
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : submitLabel}
          </Button>
          {onCancel && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              className="text-sm font-normal"
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}