/**
 * Flow Registry
 * Central export for all flow definitions
 */

export { clientSetupFlow } from './clientSetup.flow';
export { bulkUploadFlow } from './bulkUpload.flow';

import { clientSetupFlow } from './clientSetup.flow';
import { bulkUploadFlow } from './bulkUpload.flow';
import { FlowDefinition } from '../types/flow.types';

// Registry of all available flows
export const flowRegistry: Map<string, FlowDefinition> = new Map([
  [clientSetupFlow.id, clientSetupFlow],
  [bulkUploadFlow.id, bulkUploadFlow]
]);

// Helper to get flow by ID
export const getFlowById = (flowId: string): FlowDefinition | undefined => {
  return flowRegistry.get(flowId);
};

// Get all flows as array
export const getAllFlows = (): FlowDefinition[] => {
  return Array.from(flowRegistry.values());
};

// Get flows by category
export const getFlowsByCategory = (category: string): FlowDefinition[] => {
  return getAllFlows().filter(flow => flow.category === category);
};