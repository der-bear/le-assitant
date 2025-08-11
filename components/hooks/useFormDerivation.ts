// Custom hook for form derivation logic
import { useCallback, useState } from 'react';
import { deriveFieldValue } from '../chat-utils';
import { DerivationRule } from '../chat-types';

export function useFormDerivation() {
  const [derivedValues, setDerivedValues] = useState<Record<string, any>>({});

  const handleDeriveRequest = useCallback((
    targets: DerivationRule[],
    currentValues: Record<string, any>
  ) => {
    console.log('🔄 Derivation triggered for:', targets, 'with values:', currentValues);
    const updates: Record<string, any> = {};
    
    targets.forEach(target => {
      const value = deriveFieldValue(target.strategy, currentValues);
      if (value) {
        updates[target.fieldId] = value;
        console.log(`✅ Generated ${target.strategy}:`, value);
      }
    });
    
    // Set the derived values
    if (Object.keys(updates).length > 0) {
      console.log('🚀 Setting derived values:', updates);
      setDerivedValues(updates);
    }
    
    return updates;
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