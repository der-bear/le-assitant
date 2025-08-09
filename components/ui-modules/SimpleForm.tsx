import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { AlertCircle } from 'lucide-react';

interface FormField {
  id: string;
  label: string;
  type: 'text' | 'email' | 'number' | 'textarea' | 'select' | 'checkbox';
  required?: boolean;
  placeholder?: string;
  options?: string[]; // For select fields
  value?: any;
  disabled?: boolean;
}

interface SimpleFormProps {
  title?: string;
  description?: string;
  fields: FormField[];
  onSubmit: (data: Record<string, any>) => void;
  onCancel?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
}

export function SimpleForm({ 
  title, 
  description,
  fields, 
  onSubmit, 
  onCancel, 
  submitLabel = "Submit",
  cancelLabel = "Cancel",
  isLoading = false
}: SimpleFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    fields.forEach(field => {
      initial[field.id] = field.value ?? (field.type === 'checkbox' ? false : '');
    });
    return initial;
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple validation
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

  const renderField = (field: FormField) => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'number':
        return (
          <Input
            id={field.id}
            type={field.type}
            placeholder={field.placeholder}
            value={formData[field.id]}
            onChange={(e) => updateField(field.id, e.target.value)}
            disabled={field.disabled || isLoading}
            className="text-sm font-normal"
          />
        );

      case 'textarea':
        return (
          <Textarea
            id={field.id}
            placeholder={field.placeholder}
            value={formData[field.id]}
            onChange={(e) => updateField(field.id, e.target.value)}
            disabled={field.disabled || isLoading}
            className="text-sm font-normal"
            rows={3}
          />
        );

      case 'select':
        return (
          <Select
            value={formData[field.id]}
            onValueChange={(value) => updateField(field.id, value)}
            disabled={field.disabled || isLoading}
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
        );

      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.id}
              checked={formData[field.id]}
              onCheckedChange={(checked) => updateField(field.id, checked)}
              disabled={field.disabled || isLoading}
            />
            <Label htmlFor={field.id} className="text-sm font-normal">
              {field.placeholder || field.label}
            </Label>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="p-4 max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {(title || description) && (
          <div className="space-y-1">
            {title && <h4 className="text-sm font-medium">{title}</h4>}
            {description && (
              <p className="text-xs font-normal text-muted-foreground">{description}</p>
            )}
          </div>
        )}

        {fields.map(field => (
          <div key={field.id} className="space-y-2">
            {field.type !== 'checkbox' && (
              <Label htmlFor={field.id} className="text-sm font-normal">
                {field.label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </Label>
            )}
            
            {renderField(field)}

            {errors[field.id] && (
              <div className="flex items-center gap-1 text-destructive">
                <AlertCircle className="w-3 h-3" />
                <span className="text-xs font-normal">{errors[field.id]}</span>
              </div>
            )}
          </div>
        ))}

        <div className="flex gap-2 pt-2">
          <Button 
            type="submit" 
            className="flex-1 text-sm font-normal" 
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
              disabled={isLoading}
            >
              {cancelLabel}
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}