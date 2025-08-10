/**
 * FlowRegistry Service
 * Manages flow definitions and initialization
 */

import { flowOrchestrator } from '../orchestrator/FlowOrchestrator';
import { clientSetupFlow, bulkUploadFlow } from '../definitions';
import { FlowDefinition } from '../types/flow.types';

export class FlowRegistry {
  private static initialized = false;

  /**
   * Initialize the flow registry with all available flows
   */
  static initialize(): void {
    if (this.initialized) {
      console.warn('FlowRegistry already initialized');
      return;
    }

    try {
      // Register all flows with the orchestrator
      flowOrchestrator.registerFlows([
        clientSetupFlow,
        bulkUploadFlow
      ]);

      this.initialized = true;
      console.log('FlowRegistry initialized with', this.getFlowCount(), 'flows');
    } catch (error) {
      console.error('Failed to initialize FlowRegistry:', error);
      throw error;
    }
  }

  /**
   * Add a new flow definition
   */
  static addFlow(flow: FlowDefinition): void {
    this.ensureInitialized();
    flowOrchestrator.registerFlow(flow);
    console.log(`Registered flow: ${flow.id} (${flow.name})`);
  }

  /**
   * Get all available flows
   */
  static getFlows(): FlowDefinition[] {
    this.ensureInitialized();
    
    // Get flows from orchestrator's registry
    const flows: FlowDefinition[] = [];
    const registry = (flowOrchestrator as any).flowRegistry;
    
    if (registry && registry.values) {
      for (const flow of registry.values()) {
        flows.push(flow);
      }
    }
    
    return flows;
  }

  /**
   * Get flows by category
   */
  static getFlowsByCategory(category: string): FlowDefinition[] {
    return this.getFlows().filter(flow => flow.category === category);
  }

  /**
   * Get flow by ID
   */
  static getFlow(flowId: string): FlowDefinition | null {
    this.ensureInitialized();
    
    const registry = (flowOrchestrator as any).flowRegistry;
    return registry?.get(flowId) || null;
  }

  /**
   * Check if flow exists
   */
  static hasFlow(flowId: string): boolean {
    return this.getFlow(flowId) !== null;
  }

  /**
   * Get total number of flows
   */
  static getFlowCount(): number {
    return this.getFlows().length;
  }

  /**
   * Get flow categories
   */
  static getCategories(): string[] {
    const categories = new Set<string>();
    this.getFlows().forEach(flow => categories.add(flow.category));
    return Array.from(categories);
  }

  /**
   * Search flows by name or description
   */
  static searchFlows(query: string): FlowDefinition[] {
    const lowerQuery = query.toLowerCase();
    return this.getFlows().filter(flow => 
      flow.name.toLowerCase().includes(lowerQuery) ||
      flow.description.toLowerCase().includes(lowerQuery) ||
      (flow.metadata?.tags && flow.metadata.tags.some(tag => 
        tag.toLowerCase().includes(lowerQuery)
      ))
    );
  }

  /**
   * Get flow statistics
   */
  static getStatistics() {
    const flows = this.getFlows();
    const categories = this.getCategories();
    
    const categoryStats = categories.map(category => ({
      category,
      count: this.getFlowsByCategory(category).length
    }));

    return {
      totalFlows: flows.length,
      categories: categoryStats,
      averageStepsPerFlow: flows.reduce((sum, flow) => sum + flow.steps.length, 0) / flows.length
    };
  }

  /**
   * Validate a flow definition
   */
  static validateFlow(flow: FlowDefinition): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Basic validation
    if (!flow.id) errors.push('Flow ID is required');
    if (!flow.name) errors.push('Flow name is required');
    if (!flow.steps || flow.steps.length === 0) errors.push('Flow must have at least one step');

    // Validate steps
    if (flow.steps) {
      const stepIds = new Set<string>();
      
      flow.steps.forEach((step, index) => {
        if (!step.id) {
          errors.push(`Step ${index} missing ID`);
        } else if (stepIds.has(step.id)) {
          errors.push(`Duplicate step ID: ${step.id}`);
        } else {
          stepIds.add(step.id);
        }

        if (!step.type) errors.push(`Step ${step.id} missing type`);
        if (!step.component) errors.push(`Step ${step.id} missing component`);
        
        // Validate transitions reference valid steps
        if (step.transitions) {
          Object.values(step.transitions).forEach(targetStep => {
            if (typeof targetStep === 'string' && 
                targetStep !== 'complete' && 
                !stepIds.has(targetStep)) {
              errors.push(`Step ${step.id} references invalid step: ${targetStep}`);
            }
          });
        }
      });

      // Check if first step is overview
      if (flow.steps[0] && flow.steps[0].type !== 'overview') {
        console.warn(`Flow ${flow.id}: First step should be 'overview' type`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Reset registry (for testing)
   */
  static reset(): void {
    this.initialized = false;
    const registry = (flowOrchestrator as any).flowRegistry;
    if (registry && registry.clear) {
      registry.clear();
    }
  }

  /**
   * Ensure registry is initialized
   */
  private static ensureInitialized(): void {
    if (!this.initialized) {
      this.initialize();
    }
  }
}

// Auto-initialize on import
FlowRegistry.initialize();