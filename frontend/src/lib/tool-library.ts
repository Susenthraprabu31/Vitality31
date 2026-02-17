/**
 * Tool Library - Fallback Implementation
 * Basic tool definitions for OpenAI Agent SDK
 * Generated: 2026-02-14T14:37:38.217Z
 */

export interface ToolConfig {
  id: string;
  name: string;
  description: string;
  category: 'external' | 'data' | 'ai' | 'utility' | 'file' | 'communication';
  icon: string;
  enabled: boolean;
  functions: ToolFunction[];
  configSchema?: ToolConfigSchema;
  requiresConfig: boolean;
  tags: string[];
}

export interface ToolFunction {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };
}

export interface ToolConfigSchema {
  [key: string]: {
    type: 'text' | 'number' | 'boolean' | 'select' | 'password';
    label: string;
    description?: string;
    required?: boolean;
    options?: Array<{ value: string; label: string }>;
    placeholder?: string;
    defaultValue?: any;
    min?: number;
    max?: number;
  };
}

export const TOOL_LIBRARY: ToolConfig[] = [
  {
    id: 'web_search',
    name: 'Web Search',
    description: 'Search the web for information',
    category: 'external',
    icon: '🔍',
    enabled: true,
    requiresConfig: false,
    tags: ['search', 'web'],
    functions: [
      {
        name: 'search_web',
        description: 'Search the web for information',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query' },
            max_results: { type: 'number', description: 'Maximum results', default: 10 }
          },
          required: ['query']
        }
      }
    ]
  },
  {
    id: 'text_processor',
    name: 'Text Processor',
    description: 'Advanced text manipulation and analysis',
    category: 'data',
    icon: '📝',
    enabled: true,
    requiresConfig: false,
    tags: ['text', 'string', 'regex', 'format'],
    functions: [
      {
        name: 'extract_text',
        description: 'Extract text using regex patterns',
        parameters: {
          type: 'object',
          properties: {
            text: { type: 'string', description: 'Input text' },
            pattern: { type: 'string', description: 'Regex pattern to match' },
            flags: { type: 'string', description: 'Regex flags', default: 'g' }
          },
          required: ['text', 'pattern']
        }
      },
      {
        name: 'format_text',
        description: 'Format and transform text',
        parameters: {
          type: 'object',
          properties: {
            text: { type: 'string', description: 'Input text' },
            operation: { type: 'string', description: 'Text operation', enum: ['uppercase', 'lowercase', 'title_case', 'trim', 'reverse'] }
          },
          required: ['text', 'operation']
        }
      }
    ]
  },
  {
    id: 'document_processor',
    name: 'Document Processor',
    description: 'Extract text and data from documents (PDF, Word, images) including invoices and forms',
    category: 'ai',
    icon: '📄',
    enabled: true,
    requiresConfig: false,
    tags: ['ocr', 'pdf', 'document', 'text-extraction', 'invoice'],
    functions: [
      {
        name: 'extract_document_text',
        description: 'Extract all text content from documents and images using OCR. Document data is automatically detected from the uploaded file.',
        parameters: {
          type: 'object',
          properties: {
            document_data: { type: 'string', description: 'Base64 encoded document or image data (optional - will use uploaded document if not provided)' },
            document_type: { type: 'string', description: 'Type of document: pdf, image, word, auto-detect', enum: ['pdf', 'image', 'word', 'auto'], default: 'auto' },
            extract_tables: { type: 'boolean', description: 'Whether to extract and structure table data', default: true },
            extract_metadata: { type: 'boolean', description: 'Whether to extract document metadata', default: true }
          },
          required: []
        }
      },
      {
        name: 'process_invoice',
        description: 'Extract structured data from invoices and receipts. Invoice data is automatically detected from the uploaded document.',
        parameters: {
          type: 'object',
          properties: {
            invoice_data: { type: 'string', description: 'Base64 encoded invoice image or PDF (optional - will use uploaded document if not provided)' },
            extract_items: { type: 'boolean', description: 'Whether to extract line items', default: true },
            currency: { type: 'string', description: 'Expected currency for amount parsing', default: 'USD' }
          },
          required: []
        }
      }
    ]
  },
  {
    id: 'image_analyzer',
    name: 'Image Analyzer',
    description: 'Analyze and extract information from images',
    category: 'ai',
    icon: '🖼️',
    enabled: true,
    requiresConfig: false,
    tags: ['image', 'ocr', 'analysis', 'text-extraction'],
    functions: [
      {
        name: 'analyze_image_content',
        description: 'Analyze image content and detect objects. Image data is automatically detected from the uploaded file.',
        parameters: {
          type: 'object',
          properties: {
            image_data: { type: 'string', description: 'Base64 encoded image data (optional - will use uploaded image if not provided)' },
            analysis_type: { type: 'string', description: 'Type of analysis', enum: ['comprehensive', 'ocr_only', 'objects_only'], default: 'comprehensive' },
            extract_text: { type: 'boolean', description: 'Whether to extract text from the image', default: true },
            detect_objects: { type: 'boolean', description: 'Whether to detect objects in the image', default: true }
          },
          required: []
        }
      },
      {
        name: 'extract_image_text',
        description: 'Extract text from images using OCR. Image data is automatically detected from the uploaded file.',
        parameters: {
          type: 'object',
          properties: {
            image_data: { type: 'string', description: 'Base64 encoded image data (optional - will use uploaded image if not provided)' },
            language: { type: 'string', description: 'OCR language hint', default: 'auto' },
            preserve_layout: { type: 'boolean', description: 'Whether to preserve text layout and positioning', default: true }
          },
          required: []
        }
      }
    ]
  },
  {
    id: 'base64_converter',
    name: 'Base64 Converter',
    description: 'Handle base64 data conversion and file type detection',
    category: 'utility',
    icon: '🔄',
    enabled: true,
    requiresConfig: false,
    tags: ['base64', 'conversion', 'file-type', 'data'],
    functions: [
      {
        name: 'detect_file_type',
        description: 'Detect file type from base64 data',
        parameters: {
          type: 'object',
          properties: {
            base64_data: { type: 'string', description: 'Base64 encoded data' },
            include_metadata: { type: 'boolean', description: 'Whether to include detailed metadata', default: true }
          },
          required: ['base64_data']
        }
      },
      {
        name: 'convert_base64_to_file',
        description: 'Convert base64 data to file format',
        parameters: {
          type: 'object',
          properties: {
            base64_data: { type: 'string', description: 'Base64 encoded data' },
            target_format: { type: 'string', description: 'Target file format', enum: ['auto', 'pdf', 'image', 'text'], default: 'auto' },
            extract_content: { type: 'boolean', description: 'Whether to extract readable content', default: true }
          },
          required: ['base64_data']
        }
      }
    ]
  },
  {
    id: 'date_time',
        name: 'DateTime',
    description: 'Work with dates, times, and timestamps',
    category: 'utility',
    icon: '📅',
    enabled: true,
    requiresConfig: false,
    tags: ['date', 'time', 'timestamp', 'format'],
    functions: [
      {
        name: 'current_datetime',
        description: 'Get current date and time',
        parameters: {
          type: 'object',
          properties: {
            format: {
              type: 'string',
              description: 'Date format (ISO, timestamp, custom)',
              default: 'ISO'
            },
            timezone: {
              type: 'string',
              description: 'Timezone (e.g., "UTC", "America/New_York")',
              default: 'UTC'
            }
          },
          required: []
        }
      },
      {
        name: 'format_date',
        description: 'Format date string to different format',
        parameters: {
          type: 'object',
          properties: {
            date: {
              type: 'string',
              description: 'Input date string'
            },
            input_format: {
              type: 'string',
              description: 'Input date format',
              default: 'auto'
            },
            output_format: {
              type: 'string',
              description: 'Desired output format',
              default: 'YYYY-MM-DD'
            }
          },
          required: ['date']
        }
      }
    ]
  }
];

export const TOOL_CATEGORIES = [
  { id: 'external', name: 'External APIs', icon: '🌐', description: 'Connect to external services and APIs' },
  { id: 'data', name: 'Data Processing', icon: '⚙️', description: 'Process and transform data' },
  { id: 'ai', name: 'AI Tools', icon: '🤖', description: 'AI-powered analysis and generation' },
  { id: 'utility', name: 'Utilities', icon: '🔧', description: 'General utility functions' },
  { id: 'file', name: 'File Processing', icon: '📁', description: 'Work with files and data formats' },
  { id: 'communication', name: 'Communication', icon: '💬', description: 'Email, messaging, and notifications' }
];

export function getToolById(id: string): ToolConfig | undefined {
  return TOOL_LIBRARY.find(tool => tool.id === id);
}

export function getAllEnabledTools(): ToolConfig[] {
  return TOOL_LIBRARY.filter(tool => tool.enabled);
}

export function getToolsByCategory(category: string): ToolConfig[] {
  return TOOL_LIBRARY.filter(tool => tool.category === category && tool.enabled);
}

export function searchTools(query: string): ToolConfig[] {
  const lowercaseQuery = query.toLowerCase();
  return TOOL_LIBRARY.filter(tool => 
    tool.enabled && (
      tool.name.toLowerCase().includes(lowercaseQuery) ||
      tool.description.toLowerCase().includes(lowercaseQuery) ||
      tool.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    )
  );
}

export function getToolFunctions(toolId: string): ToolFunction[] {
  const tool = getToolById(toolId);
  return tool ? tool.functions : [];
}
