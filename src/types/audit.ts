export interface AuditEntry {
  id: string;
  timestamp: string;
  sessionId: string;
  userId?: string;
  action: AuditAction;
  details: AuditDetails;
  beforeState?: any;
  afterState?: any;
}

export interface AuditAction {
  type: 'load' | 'edit' | 'export' | 'censor' | 'transform' | 'adjust';
  category: 'image' | 'layer' | 'tool' | 'session';
  description: string;
}

export interface AuditDetails {
  toolUsed?: string;
  layerId?: string;
  parameters?: Record<string, any>;
  duration?: number;
  fileMetadata?: FileMetadata;
}

export interface FileMetadata {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  width?: number;
  height?: number;
}