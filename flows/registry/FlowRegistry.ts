/**
 * Flow Registry
 * Centralized registration of all flow definitions
 */

import { FlowDefinition } from '../types/flow.types';
import { flowOrchestrator } from '../orchestrator/FlowOrchestrator';

// Import flow definitions
import { clientSetupFlow } from '../definitions/clientSetup.flow';
import { bulkUploadFlow } from '../definitions/bulkUpload.flow';

/**
 * Register all available flows
 */
export function initializeFlows(): void {
  const flows: FlowDefinition[] = [
    clientSetupFlow,
    bulkUploadFlow
  ];

  flowOrchestrator.registerFlows(flows);
  console.log(`Registered ${flows.length} flows:`, flows.map(f => f.id));
}

/**
 * Get all registered flow definitions
 */
export function getAllFlows(): FlowDefinition[] {
  return [
    clientSetupFlow,
    bulkUploadFlow
  ];
}

/**
 * Get flow by ID
 */
export function getFlowById(id: string): FlowDefinition | null {
  const flows = getAllFlows();
  return flows.find(flow => flow.id === id) || null;
}