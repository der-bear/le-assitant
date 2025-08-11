// Custom hook for form derivation logic
import { useCallback, useState } from 'react';
import { deriveFieldValue } from '../chat-utils';

// Match the DeriveTarget type from Form.tsx
type DeriveTarget = {
  fieldId: string;
  from: string[];
  strategy?: 'usernameFromEmail' | 'strongPassword' | 'slug' | 'custom';
  editable?: boolean;
};

export function useFormDerivation() {
  const [derivedValues, setDerivedValues] = useState<Record<string, any>>({});

  const handleDeriveRequest = useCallback((
    targets: DeriveTarget[],
    currentValues: Record<string, any>
  ) => {
    console.log('🔄 Derivation triggered for:', targets, 'with values:', currentValues);
    const updates: Record<string, any> = {};
    
    targets.forEach(target => {
      // Default to handling all known strategies
      const strategy = target.strategy || 'usernameFromEmail'; // fallback if not specified
      if (strategy === 'usernameFromEmail' || strategy === 'strongPassword') {
        const value = deriveFieldValue(strategy, currentValues);
        if (value) {
          updates[target.fieldId] = value;
          console.log(`✅ Generated ${strategy}:`, value);
        }
      }
    });
    
    // Set the derived values
    if (Object.keys(updates).length > 0) {
      console.log('🚀 Setting derived values:', updates);
      setDerivedValues(updates);
    }
  }, []);

  const clearDerivedValues = useCallback(() => {
    setDerivedValues({});
  }, []);

  return {
    derivedValues,
    handleDeriveRequest,
    clearDerivedValues
  };
}