import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Separator } from '../ui/separator';
import { HelpCircle, ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react';

type Textish = 'text'|'email'|'password'|'number'|'tel'|'url';

type Field =
  | { id:string; label:string; type:Textish; required?:boolean; placeholder?:string; value?:string|number; min?:number; max?:number; mask?:string }
  | { id:string; label:string; type:'textarea'; required?:boolean; placeholder?:string; value?:string; rows?:number }
  | { id:string; label:string; type:'select'; required?:boolean; value?:string; options:{value:string; label:string}[]; searchable?:boolean }
  | { id:string; label:string; type:'checkbox'; value?:boolean }
  | { id:string; label:string; type:'radio'; value?:string; options:{value:string; label:string; hint?:string}[] }
  | { id:string; label:string; type:'date'; value?:string }
  | { id:string; label:string; type:'file'; accept?:string; multiple?:boolean };

type Validation = { fieldId:string; rule:'required'|'regex'|'min'|'max'; message:string; pattern?:string; value?:number };

type RevealRule =
  | { kind:'afterValid'; fields:string[] }
  | { kind:'when'; equals:Record<string,unknown> }
  | { kind:'afterSubmit' };

type Section = {
  id:string;
  title?:string;
  description?:string;
  fields: Field[];
  reveal?: RevealRule;
};

type DeriveTarget = {
  fieldId:string;
  from:string[];
  strategy?: 'usernameFromEmail'|'strongPassword'|'slug'|'custom';
  editable?: boolean;
};

type Action = { id: string; label: string; variant?: 'default'|'secondary'|'ghost'; disabled?: boolean };

type FormModule = {
  id?: string;
  title?: string;
  description?: string;
  helpUrl?: string;
  loading?: boolean;
  error?: string;
  empty?: string;
  actions?: Action[];
  kind:'form';
  fields?: Field[];
  sections?: Section[];
  validations?: Validation[];
  derive?: DeriveTarget[];
  submitLabel?: string;
  cancelLabel?: string;
  disabled?: boolean;
  locked?: boolean;
};

interface FormProps extends FormModule {
  onSubmit?: (data: Record<string, any>, dirtyFields: string[]) => void;
  onCancel?: () => void;
  onChange?: (fieldId: string, value: any) => void;
  onAction?: (actionId: string) => void;
  onRequestDerive?: (targets: DeriveTarget[], currentValues: Record<string, any>) => void;
  derivedValues?: Record<string, any>;
}

export function Form({
  id,
  title,
  description,
  helpUrl,
  loading = false,
  error,
  empty,
  actions = [],
  fields = [],
  sections = [],
  validations = [],
  derive = [],
  submitLabel = 'Submit',
  cancelLabel = 'Cancel',
  disabled = false,
  locked = false,
  onSubmit,
  onCancel,
  onChange,
  onAction,
  onRequestDerive,
  derivedValues = {}
}: FormProps) {
  const [values, setValues] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dirtyFields, setDirtyFields] = useState<Set<string>>(new Set());
  const [revealedSections, setRevealedSections] = useState<Set<string>>(new Set());
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [passwordVisibility, setPasswordVisibility] = useState<Record<string, boolean>>({});

  // Use refs to store stable references and break dependency cycles
  const valuesRef = useRef<Record<string, any>>({});
  const validationRulesRef = useRef<Map<string, Validation[]>>(new Map());
  const deriveTargetsRef = useRef<Map<string, DeriveTarget>>(new Map());
  const effectiveSectionsRef = useRef<Section[]>([]);

  // Update refs when props change (but don't cause re-renders)
  useEffect(() => {
    valuesRef.current = values;
  }, [values]);

  // Memoize effective sections - only compute when props change
  const effectiveSections = useMemo(() => {
    const computed = sections.length > 0 ? sections : [{ id: 'default', fields }];
    effectiveSectionsRef.current = computed;
    return computed;
  }, [sections, fields]);

  // Initialize values only once from field defaults
  useEffect(() => {
    const initialValues: Record<string, any> = {};
    effectiveSections.forEach(section => {
      section.fields.forEach(field => {
        if (field.value !== undefined) {
          initialValues[field.id] = field.value;
        }
      });
    });
    setValues(initialValues);
  }, []); // Only run once on mount

  // Build validation rules map - update ref when validations change
  useEffect(() => {
    const rulesMap = new Map<string, Validation[]>();
    validations.forEach(validation => {
      const existing = rulesMap.get(validation.fieldId) || [];
      rulesMap.set(validation.fieldId, [...existing, validation]);
    });
    validationRulesRef.current = rulesMap;
  }, [validations]);

  // Build derive targets map - update ref when derive changes
  useEffect(() => {
    const map = new Map<string, DeriveTarget>();
    derive.forEach(target => {
      map.set(target.fieldId, target);
    });
    deriveTargetsRef.current = map;
  }, [derive]);

  // Stable validation function using refs
  const validateField = useCallback((field: Field, value: any): string | null => {
    const fieldValidations = validationRulesRef.current.get(field.id) || [];
    
    for (const validation of fieldValidations) {
      switch (validation.rule) {
        case 'required':
          if (field.required && (!value || value === '')) {
            return validation.message || `${field.label} is required`;
          }
          break;
        case 'regex':
          if (value && validation.pattern && !new RegExp(validation.pattern).test(value)) {
            return validation.message;
          }
          break;
        case 'min':
          if (value && validation.value !== undefined && value < validation.value) {
            return validation.message;
          }
          break;
        case 'max':
          if (value && validation.value !== undefined && value > validation.value) {
            return validation.message;
          }
          break;
      }
    }
    return null;
  }, []); // No dependencies - uses refs

  // Stable function to check if section should be revealed - uses refs
  const shouldRevealSection = useCallback((section: Section): boolean => {
    if (!section.reveal) return true;

    const { reveal } = section;
    const currentValues = valuesRef.current;
    
    switch (reveal.kind) {
      case 'afterValid':
        return reveal.fields.every(fieldId => {
          const field = effectiveSectionsRef.current
            .flatMap(s => s.fields)
            .find(f => f.id === fieldId);
          const value = currentValues[fieldId];
          return field && value && !validateField(field, value);
        });
      
      case 'when':
        return Object.entries(reveal.equals).every(([fieldId, expectedValue]) => {
          return currentValues[fieldId] === expectedValue;
        });
      
      case 'afterSubmit':
        return false;
        
      default:
        return true;
    }
  }, [validateField]); // Only depends on stable validateField

  // Initialize revealed sections on mount - sections without reveal rules should be revealed by default
  useEffect(() => {
    const initialRevealedSections = new Set<string>();
    effectiveSectionsRef.current.forEach(section => {
      if (!section.reveal) {
        initialRevealedSections.add(section.id);
      }
    });
    setRevealedSections(initialRevealedSections);
  }, []); // Only run once on mount

  // Check reveal rules when values change - stable effect
  useEffect(() => {
    // Use a timeout to batch updates and prevent rapid state changes
    const timeoutId = setTimeout(() => {
      const newRevealedSections = new Set<string>();
      const derivesToRequest: DeriveTarget[] = [];
      
      effectiveSectionsRef.current.forEach(section => {
        // Always reveal sections without reveal rules
        if (!section.reveal) {
          newRevealedSections.add(section.id);
        } else {
          const shouldReveal = shouldRevealSection(section);
          if (shouldReveal) {
            newRevealedSections.add(section.id);
          }
        }
        
        // Check if this section was just revealed and has derive targets
        if (newRevealedSections.has(section.id) && !revealedSections.has(section.id)) {
          const sectionFieldIds = section.fields.map(f => f.id);
          sectionFieldIds.forEach(fieldId => {
            const deriveTarget = deriveTargetsRef.current.get(fieldId);
            if (deriveTarget) {
              // Only request derive if dependencies are met and field is empty
              const allDepsValid = deriveTarget.from.every(depFieldId => {
                const depField = effectiveSectionsRef.current
                  .flatMap(s => s.fields)
                  .find(f => f.id === depFieldId);
                const depValue = valuesRef.current[depFieldId];
                return depField && depValue && !validateField(depField, depValue);
              });
              
              const targetFieldValue = valuesRef.current[fieldId];
              if (allDepsValid && (!targetFieldValue || targetFieldValue === '')) {
                derivesToRequest.push(deriveTarget);
              }
            }
          });
        }
      });

      // Only update if there's an actual change
      const currentKeys = Array.from(revealedSections).sort().join(',');
      const newKeys = Array.from(newRevealedSections).sort().join(',');
      
      if (currentKeys !== newKeys) {
        setRevealedSections(newRevealedSections);
        
        // Request derives only if we have new sections and the callback exists
        if (derivesToRequest.length > 0 && onRequestDerive) {
          onRequestDerive(derivesToRequest, valuesRef.current);
        }
      }
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [values, shouldRevealSection, revealedSections, onRequestDerive, validateField]);

  const handleFieldChange = useCallback((fieldId: string, value: any) => {
    console.log('🎯 Field change:', fieldId, '=', value);
    
    // Update values immediately using functional update to avoid stale closures
    setValues(prev => {
      const newValues = { ...prev, [fieldId]: value };
      console.log('📝 Updated values:', newValues);
      
      // Real-time derivation check - using the fresh values
      setTimeout(() => {
        // Find field definition
        const field = effectiveSectionsRef.current
          .flatMap(s => s.fields)
          .find(f => f.id === fieldId);
        
        if (field) {
          const error = validateField(field, value);
          console.log('🔍 Validation result for', fieldId, ':', error ? 'INVALID' : 'VALID');
          
          // Update errors
          setErrors(prev => {
            const newErrors = { ...prev };
            if (error) {
              newErrors[fieldId] = error;
            } else {
              delete newErrors[fieldId];
            }
            return newErrors;
          });
          
          // Real-time derivation - trigger immediately when field becomes valid
          if (!error && value) {
            console.log('🔍 Field is valid, checking for derivation:', fieldId, value);
            const derivesToRequest: DeriveTarget[] = [];
            
            // Find derive targets that depend on this field
            const allFields = effectiveSectionsRef.current.flatMap(s => s.fields);
            console.log('📋 Available derive targets:', Array.from(deriveTargetsRef.current.entries()));
            
            deriveTargetsRef.current.forEach((deriveTarget, targetFieldId) => {
              console.log('🎯 Checking derive target:', targetFieldId, 'depends on:', deriveTarget.from);
              
              if (deriveTarget.from.includes(fieldId)) {
                console.log('✅ Field', fieldId, 'is a dependency for', targetFieldId);
                
                // Check if all dependencies are valid
                const allDepsValid = deriveTarget.from.every(depFieldId => {
                  const depField = allFields.find(f => f.id === depFieldId);
                  const depValue = newValues[depFieldId];
                  const isValid = depField && depValue && !validateField(depField, depValue);
                  console.log('  🔍 Checking dependency:', depFieldId, '=', depValue, 'isValid:', isValid);
                  return isValid;
                });
                
                // Only derive if all dependencies valid and target field is empty
                const targetFieldValue = newValues[targetFieldId];
                console.log('🎯 All deps valid:', allDepsValid, 'target value:', targetFieldValue);
                
                if (allDepsValid && (!targetFieldValue || targetFieldValue === '')) {
                  console.log('🚀 Adding to derivation request:', deriveTarget);
                  derivesToRequest.push(deriveTarget);
                }
              }
            });
            
            // Trigger derivation immediately if we have valid derives
            if (derivesToRequest.length > 0 && onRequestDerive) {
              console.log('📤 Requesting derivation for:', derivesToRequest);
              onRequestDerive(derivesToRequest, newValues);
            } else {
              console.log('❌ No derivation needed or callback missing');
            }
          } else {
            console.log('❌ Field validation failed or empty:', fieldId, 'error:', error, 'value:', value);
          }
        }
      }, 0);
      
      return newValues;
    });
    
    setDirtyFields(prev => new Set([...prev, fieldId]));
    onChange?.(fieldId, value);
  }, [validateField, onChange, onRequestDerive]);

  // Apply derived values when they change
  useEffect(() => {
    console.log('📥 Form component received derivedValues:', derivedValues);
    if (derivedValues && Object.keys(derivedValues).length > 0) {
      console.log('📥 Applying derived values to form:', derivedValues);
      setValues(prev => {
        const newValues = { ...prev, ...derivedValues };
        console.log('📝 Form values updated:', newValues);
        return newValues;
      });
      // Mark derived fields as dirty
      setDirtyFields(prev => new Set([...prev, ...Object.keys(derivedValues)]));
    }
  }, [derivedValues]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all visible fields
    const newErrors: Record<string, string> = {};
    effectiveSectionsRef.current.forEach(section => {
      if (revealedSections.has(section.id)) {
        section.fields.forEach(field => {
          const error = validateField(field, valuesRef.current[field.id]);
          if (error) {
            newErrors[field.id] = error;
          }
        });
      }
    });

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onSubmit?.(valuesRef.current, Array.from(dirtyFields));
    } else {
      // Focus first invalid field
      const firstErrorField = effectiveSectionsRef.current
        .flatMap(s => s.fields)
        .find(field => newErrors[field.id]);
      if (firstErrorField) {
        const element = document.getElementById(firstErrorField.id);
        element?.focus();
      }
    }
  }, [revealedSections, dirtyFields, validateField, onSubmit]);

  const toggleSectionCollapse = useCallback((sectionId: string) => {
    setCollapsedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  }, []);

  const togglePasswordVisibility = useCallback((fieldId: string) => {
    setPasswordVisibility(prev => ({
      ...prev,
      [fieldId]: !prev[fieldId]
    }));
  }, []);

  const handleDeriveRequest = useCallback((target: DeriveTarget) => {
    if (onRequestDerive) {
      onRequestDerive([target]);
    }
  }, [onRequestDerive]);

  const renderField = useCallback((field: Field) => {
    const fieldError = errors[field.id];
    // Priority: derivedValues > form values > field default
    const fieldValue = derivedValues[field.id] ?? values[field.id] ?? field.value ?? '';
    const isDerived = deriveTargetsRef.current.has(field.id);
    const deriveTarget = deriveTargetsRef.current.get(field.id);
    const isPasswordVisible = passwordVisibility[field.id];
    
    // Debug log for field rendering
    if (isDerived) {
      console.log('🎨 Rendering derived field:', field.id, 'derivedValue:', derivedValues[field.id], 'formValue:', values[field.id], 'finalValue:', fieldValue);
    }

    switch (field.type) {
      case 'text':
      case 'email':
      case 'password':
      case 'number':
      case 'tel':
      case 'url':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <div className="relative">
              <Input
                id={field.id}
                type={field.type === 'password' ? 'text' : field.type}
                placeholder={field.placeholder}
                value={String(fieldValue)}
                min={field.min}
                max={field.max}
                disabled={loading || disabled || locked}
                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                className={fieldError ? 'border-destructive' : ''}
              />

            </div>
            {fieldError && (
              <p className="text-sm text-destructive">{fieldError}</p>
            )}
          </div>
        );

      case 'textarea':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Textarea
              id={field.id}
              placeholder={field.placeholder}
              value={fieldValue || ''}
              rows={Math.min(field.rows || 3, 6)}
              disabled={loading || disabled || locked}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              className={fieldError ? 'border-destructive' : ''}
            />
            {fieldError && (
              <p className="text-sm text-destructive">{fieldError}</p>
            )}
          </div>
        );

      case 'select':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Select
              disabled={loading || disabled || locked}
              value={fieldValue || ''}
              onValueChange={(value) => handleFieldChange(field.id, value)}
            >
              <SelectTrigger className={fieldError ? 'border-destructive' : ''}>
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                {field.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldError && (
              <p className="text-sm text-destructive">{fieldError}</p>
            )}
          </div>
        );

      case 'checkbox':
        return (
          <div key={field.id} className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id={field.id}
                checked={fieldValue || false}
                disabled={loading || disabled || locked}
                onCheckedChange={(checked) => handleFieldChange(field.id, checked)}
              />
              <Label htmlFor={field.id} className="text-sm font-normal">
                {field.label}
              </Label>
            </div>
            {fieldError && (
              <p className="text-sm text-destructive">{fieldError}</p>
            )}
          </div>
        );

      case 'radio':
        return (
          <div key={field.id} className="space-y-3">
            <Label>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <RadioGroup
              value={fieldValue || ''}
              disabled={loading || disabled || locked}
              onValueChange={(value) => handleFieldChange(field.id, value)}
            >
              {field.options.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={`${field.id}-${option.value}`} />
                  <Label htmlFor={`${field.id}-${option.value}`} className="text-sm font-normal">
                    {option.label}
                    {option.hint && (
                      <span className="text-muted-foreground ml-1">({option.hint})</span>
                    )}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            {fieldError && (
              <p className="text-sm text-destructive">{fieldError}</p>
            )}
          </div>
        );

      case 'date':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={field.id}
              type="date"
              value={fieldValue || ''}
              disabled={loading || disabled || locked}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              className={fieldError ? 'border-destructive' : ''}
            />
            {fieldError && (
              <p className="text-sm text-destructive">{fieldError}</p>
            )}
          </div>
        );

      case 'file':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={field.id}
              type="file"
              accept={field.accept}
              multiple={field.multiple}
              disabled={loading || disabled || locked}
              onChange={(e) => handleFieldChange(field.id, e.target.files)}
              className={fieldError ? 'border-destructive' : ''}
            />
            {fieldError && (
              <p className="text-sm text-destructive">{fieldError}</p>
            )}
          </div>
        );

      default:
        return null;
    }
  }, [values, errors, loading, passwordVisibility, derivedValues, handleFieldChange, handleDeriveRequest, togglePasswordVisibility]);

  const renderSection = useCallback((section: Section, index: number) => {
    const isRevealed = revealedSections.has(section.id);
    const isCollapsed = collapsedSections.has(section.id);

    if (!isRevealed) {
      return null;
    }

    return (
      <React.Fragment key={section.id}>
        {/* Add separator between progressive sections (not for the first section) */}
        {index > 0 && section.reveal && (
          <Separator className="my-8" />
        )}
        
        <div className="space-y-4">
          {(section.title || section.description) && (
            <div className="space-y-2">
              {section.title && (
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{section.title}</h4>
                  {section.fields.length > 3 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSectionCollapse(section.id)}
                      className="h-auto p-1"
                    >
                      {isCollapsed ? (
                        <ChevronDown className="h-3 w-3" />
                      ) : (
                        <ChevronUp className="h-3 w-3" />
                      )}
                    </Button>
                  )}
                </div>
              )}
              {section.description && (
                <p className="text-sm text-muted-foreground">{section.description}</p>
              )}
            </div>
          )}

          {!isCollapsed && (
            <div className="space-y-4">
              {section.fields.map(renderField)}
            </div>
          )}
        </div>
      </React.Fragment>
    );
  }, [revealedSections, collapsedSections, renderField, toggleSectionCollapse]);

  if (empty && effectiveSections.length === 0) {
    return (
      <div className="space-y-6">
        <Alert>
          <AlertDescription>{empty}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${
      locked 
        ? 'opacity-60 pointer-events-none' 
        : ''
    }`}>
      {/* Header */}
      {(title || description) && (
        <div className="space-y-2">
          {title && (
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-medium">{title}</h3>
              {helpUrl && (
                <Button variant="ghost" size="sm" asChild className="h-4 w-4 p-0">
                  <a href={helpUrl} target="_blank" rel="noopener noreferrer">
                    <HelpCircle className="h-3 w-3" />
                  </a>
                </Button>
              )}
            </div>
          )}
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Form Content - no container, direct form */}
      {effectiveSections.length > 0 && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {effectiveSections.map((section, index) => renderSection(section, index))}

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={loading || disabled || locked}>
              {submitLabel}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} disabled={loading || disabled || locked}>
                {cancelLabel}
              </Button>
            )}
            {actions.map((action) => (
              <Button
                key={action.id}
                type="button"
                variant={action.variant || 'outline'}
                disabled={loading || disabled || locked || action.disabled}
                onClick={() => onAction?.(action.id)}
              >
                {action.label}
              </Button>
            ))}
          </div>
        </form>
      )}
    </div>
  );
}