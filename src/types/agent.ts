export interface ChatRequest {
  message: string;
  thread_id: string;
  intent?: string;
}

export interface ChatResponse {
  text?: string;
  response_text?: string;
  actions: UIAction[];
  tool_calls?: any[];
  intent?: string;
  slots?: Record<string, any>;
}

export type UIAction = 
  | ActionCards 
  | ActionCTA 
  | ActionForm 
  | ActionMap 
  | ActionCompare 
  | ActionClarify 
  | ActionOverview 
  | ActionSources
  | ActionDetail;

export interface ActionCards {
  type: 'cards';
  items: any[];
}

export interface ActionCTA {
  type: 'cta';
  items: any[];
}

export interface ActionForm {
  type: 'form';
  form: any;
}

export interface ActionMap {
  type: 'map';
  map: any;
}

export interface ActionCompare {
  type: 'compare';
  comparison: any;
}

export interface ActionClarify {
  type: 'clarify';
  prompt: string;
  suggestions: Suggestion[];
}

export interface ActionOverview {
  type: 'overview';
  overview: any;
}

export interface ActionSources {
  type: 'sources';
  items: any[];
}

export interface ActionDetail {
  type: 'detail';
  listing: any;
}

export interface Suggestion {
  label: string;
  intent?: string;
  value?: string;
  project_id?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'bot';
  content: string;
  actions?: UIAction[];
}
