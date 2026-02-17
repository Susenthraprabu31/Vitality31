/**
 * Universal Template Expression Engine
 * Fallback implementation for generated projects
 * 
 * This is a simplified but functional version of the template engine
 * that supports all major features needed by flow integration systems.
 */

export interface TemplateEngineOptions {
  allowFunctions?: boolean;
  allowComplexExpressions?: boolean;
  maxLength?: number;
  returnType?: 'auto' | 'string' | 'number' | 'object';
  securityLevel?: 'strict' | 'moderate' | 'permissive';
  enableCache?: boolean;
  fallbackValue?: any;
}

export interface EvaluationContext {
  [key: string]: any;
}

/**
 * Universal Template Expression Engine
 */
export class TemplateExpressionEngine {
  private static expressionCache = new Map<string, any>();
  
  /**
   * Process a template string with variables
   */
  static processTemplate(
    template: string, 
    context: EvaluationContext, 
    options: TemplateEngineOptions = {}
  ): string {
    if (!template || typeof template !== 'string') {
      return options.fallbackValue || '';
    }
    
    if (!template.includes('{{') || !template.includes('}}')) {
      return template;
    }
    
    try {
      // CRITICAL FIX: Support property access after template variables
      // Handles cases like: {{dataFlow.getByNodeId("form-id")}}.fieldName
      return template.replace(/\{\{([^}]+)\}\}((?:\.[a-zA-Z_$][a-zA-Z0-9_$]*)*)/g, (match, expression, propertyPath) => {
        const cleanExpr = expression.trim();
        
        try {
          // For complex expressions, use safe evaluation
          if (cleanExpr.includes('[') || cleanExpr.includes('.')) {
            let value = this.safeEvaluate(cleanExpr, context);
            
            // If there's a property path after the template variable, access it
            if (propertyPath && value && typeof value === 'object') {
              const props = propertyPath.split('.').filter((p: string) => p);
              for (const prop of props) {
                value = value?.[prop];
                if (value === undefined) break;
              }
            }
            
            // Handle null and undefined separately - null should be converted to empty string for API compatibility
            // but 0 (zero) is a valid value and should be preserved
            if (value === null || value === undefined) {
              return '';
            }
            return String(value);
          } else {
            // Simple variable lookup
            let value = context[cleanExpr];
            
            // If there's a property path after the template variable, access it
            if (propertyPath && value && typeof value === 'object') {
              const props = propertyPath.split('.').filter((p: string) => p);
              for (const prop of props) {
                value = value?.[prop];
                if (value === undefined) break;
              }
            }
            
            // Handle null and undefined separately - null should be converted to empty string for API compatibility
            // but 0 (zero) is a valid value and should be preserved
            if (value === null || value === undefined) {
              return '';
            }
            return String(value);
          }
        } catch (error) {
          console.warn('Template evaluation error:', error);
          return options.fallbackValue || '';
        }
      });
    } catch (error) {
      console.error('Template processing error:', error);
      return options.fallbackValue || template;
    }
  }
  
  /**
   * Safe evaluation of expressions
   */
  private static safeEvaluate(expression: string, context: EvaluationContext): any {
    try {
      // Create a safe evaluation context
      const safeContext = { ...context };
      
     
      
      // Handle function calls: dataFlow.getByNodeId("id") 
      if (expression.includes('(') && expression.includes(')')) {
        return this.evaluateFunctionCall(expression, safeContext);
      }
      
// Handle expressions with array access (including nested): resultvar[0].name[1].value
      if (expression.includes('[') && expression.includes(']')) {
        return this.evaluateWithArrayAccess(expression, safeContext);
      }

      // Handle simple property access: user.profile.name
      if (expression.includes('.')) {
        const parts = expression.split('.');
        let current = safeContext;
        
        for (const part of parts) {
          if (!part) continue;
          current = current?.[part];
          if (current === undefined) break;
        }
        
        return current;
      }
      
      // Simple variable lookup
      return safeContext[expression];
      
    } catch (error) {
      console.warn('Safe evaluation error:', error);
      return undefined;
    }
  }

  /**
   * Evaluate expressions with array access, including nested arrays
   * Handles: httpResult.data[2].values[0].value
   */
  private static evaluateWithArrayAccess(expression: string, context: EvaluationContext): any {
    try {
      // Split the expression into parts, handling both property access and array access
      // Pattern: variable.property[index].property[index].property
      const parts: Array<{ type: 'property' | 'array', value: string | number }> = [];
      let current = expression.trim();
      
      // First, extract the root variable name (before any . or [)
      const rootMatch = current.match(/^([a-zA-Z_$][a-zA-Z0-9_$]*)/);
      if (rootMatch) {
        parts.push({ type: 'property', value: rootMatch[1] });
        current = current.substring(rootMatch[0].length);
      }
      
      while (current) {
        // Check for array access: [index] or [number]
        const arrayMatch = current.match(/^\[(\d+)\]/);
        if (arrayMatch) {
          const index = parseInt(arrayMatch[1], 10);
          parts.push({ type: 'array', value: index });
          current = current.substring(arrayMatch[0].length);
          continue;
        }
        
        // Check for property access: .property
        const propertyMatch = current.match(/^.([a-zA-Z_$][a-zA-Z0-9_$]*)/);
        if (propertyMatch) {
          parts.push({ type: 'property', value: propertyMatch[1] });
          current = current.substring(propertyMatch[0].length);
          continue;
        }
        
        // If we can't parse more, break
        break;
      }
      
      // Start from the context
      let result: any = context;
      
      // Navigate through the parts
      for (const part of parts) {
        if (result === undefined || result === null) {
          return undefined;
        }
        
        if (part.type === 'property') {
          result = result[part.value as string];
        } else if (part.type === 'array') {
          if (Array.isArray(result)) {
            result = result[part.value as number];
          } else {
            return undefined;
          }
        }
      }
      
      return result;
    } catch (error) {
      console.warn('Array access evaluation error:', error);
      return undefined;
    }
  }
  
  /**
   * Evaluate function calls like dataFlow.getByNodeId("id")
   */
  private static evaluateFunctionCall(expression: string, context: EvaluationContext): any {
    try {
             // Parse function call: dataFlow.getByNodeId("input-123").Address
       const functionCallMatch = expression.match(/^([^(]+)\((.*)\)(.*)$/);
       if (!functionCallMatch) {
         return undefined;
       }
       
       const [, functionPath, argsString, propertyPath] = functionCallMatch;
      
      // Parse function path: dataFlow.getByNodeId
      const pathParts = functionPath.trim().split('.');
      let current = context;
      
      // Navigate to the function
      for (let i = 0; i < pathParts.length - 1; i++) {
        current = current?.[pathParts[i]];
        if (!current) return undefined;
      }
      
      const functionName = pathParts[pathParts.length - 1];
      const targetFunction = current?.[functionName];
      
      if (typeof targetFunction !== 'function') {
        console.warn('Function not found or not callable:', functionPath);
        return undefined;
      }
      
      // Parse arguments - simple implementation for quoted strings and basic values
      const args = [];
      if (argsString.trim()) {
        // Handle quoted strings: "input-123" 
        const quotedStringMatch = argsString.match(/^["']([^"']+)["']$/);
        if (quotedStringMatch) {
          args.push(quotedStringMatch[1]);
        } else {
          // Handle other basic arguments (numbers, variables)
          const trimmedArgs = argsString.trim();
          if (trimmedArgs) {
            // Try to parse as number
            const numValue = Number(trimmedArgs);
            if (!isNaN(numValue)) {
              args.push(numValue);
            } else {
              // Treat as variable reference
              args.push(context[trimmedArgs] || trimmedArgs);
            }
          }
        }
      }
      
      // Call the function
      console.log('🔧 Calling function:', functionPath, 'with args:', args);
      const result = targetFunction.apply(current, args);
      console.log('🔧 Function result:', result);
      console.log('🔧 Function result type:', typeof result);
      
      // CRITICAL FIX: Check for property path FIRST before auto-extraction
      // If user specified a property (e.g., .Name), they want that specific field, not auto-extracted data
      if (propertyPath && propertyPath.startsWith('.')) {
        const propertyName = propertyPath.substring(1); // Remove the leading dot
        console.log('🔍 Property path detected:', propertyName);
        
        // Check direct property access FIRST (most specific)
        if (result && typeof result === 'object' && result[propertyName] !== undefined) {
          console.log('✅ Found property directly:', propertyName, '=', result[propertyName]);
          return result[propertyName];
        }
        // Check in formData
        if (result && result.formData && result.formData[propertyName] !== undefined) {
          console.log('✅ Found property in formData:', propertyName, '=', result.formData[propertyName]);
          return result.formData[propertyName];
        }
        // Check in inputData
        if (result && result.inputData && result.inputData[propertyName] !== undefined) {
          console.log('✅ Found property in inputData:', propertyName, '=', result.inputData[propertyName]);
          return result.inputData[propertyName];
        }
        // Check in data
        if (result && result.data && result.data[propertyName] !== undefined) {
          console.log('✅ Found property in data:', propertyName, '=', result.data[propertyName]);
          return result.data[propertyName];
        }
        
        console.warn('⚠️ Property not found:', propertyName);
        return undefined;
      }
      
      // Auto-extraction ONLY if NO property path was specified
      // For input nodes, extract the actual value
      if (result && typeof result === 'object') {
        console.log('🔍 No property path - performing auto-extraction');
        // For switch-case results, prioritize switch-specific fields
        if (result.matchedCase !== undefined || result.switchResult !== undefined) {
          const switchValue = result.matchedCase || result.switchResult || result.switchValue;
          console.log('🔧 Extracting switch result:', switchValue);
          return switchValue;
        }
        // For RAG results, extract the response
        if (result.response && typeof result.response === 'string') {
          console.log('🔧 Auto-extracting response from RAG object for display:', result.response);
          return result.response;
        }
        // For nested RAG responses
        if (result.finalResult && result.finalResult.response) {
          console.log('🔧 Auto-extracting finalResult.response from RAG object for display:', result.finalResult.response);
          return result.finalResult.response;
        }
        // For input nodes, extract the actual value
        if (result.currentValue !== undefined) {
          console.log('🔧 Extracting currentValue from input object:', result.currentValue);
          return result.currentValue;
        } else if (result.result !== undefined) {
          console.log('🔧 Extracting result from object:', result.result);
          return result.result;
        } else if (result.data !== undefined) {
          console.log('🔧 Extracting data from object:', result.data);
          return result.data;
        }
        // For API responses, try common response fields
        if (result.message && typeof result.message === 'string') {
          console.log('🔧 Auto-extracting message field from object for display:', result.message);
          return result.message;
        }
        if (result.content && typeof result.content === 'string') {
          console.log('🔧 Auto-extracting content field from object for display:', result.content);
          return result.content;
        }
      }
      
      // Return the result as-is if no extraction was performed
      return result;
      
    } catch (error) {
      console.warn('Function call evaluation error:', error);
      return undefined;
    }
  }
  
  /**
   * Evaluate a single expression
   */
  static evaluate(
    expression: string,
    context: EvaluationContext,
    options: TemplateEngineOptions = {}
  ): any {
    return this.safeEvaluate(expression, context);
  }
  
  /**
   * Process multiple templates
   */
  static processTemplates(
    templates: Record<string, string>,
    context: EvaluationContext,
    options: TemplateEngineOptions = {}
  ): Record<string, string> {
    const result: Record<string, string> = {};
    
    for (const [key, template] of Object.entries(templates)) {
      result[key] = this.processTemplate(template, context, options);
    }
    
    return result;
  }
  
  /**
   * Check if a string contains template variables
   */
  static hasTemplateVariables(text: string): boolean {
    return typeof text === 'string' && text.includes('{{') && text.includes('}}');
  }
  
  /**
   * Extract template variable names from a string
   */
  static extractVariableNames(text: string): string[] {
    if (!this.hasTemplateVariables(text)) {
      return [];
    }
    
    const matches = text.match(/\{\{([^}]+)\}\}/g) || [];
    return matches.map(match => match.replace(/[{}]/g, '').trim());
  }
}

// Export convenience functions
export const processTemplate = TemplateExpressionEngine.processTemplate.bind(TemplateExpressionEngine);
export const processTemplates = TemplateExpressionEngine.processTemplates.bind(TemplateExpressionEngine);
export const evaluate = TemplateExpressionEngine.evaluate.bind(TemplateExpressionEngine);
export const hasTemplateVariables = TemplateExpressionEngine.hasTemplateVariables.bind(TemplateExpressionEngine);
export const extractVariableNames = TemplateExpressionEngine.extractVariableNames.bind(TemplateExpressionEngine);

// Default export
export default TemplateExpressionEngine;
