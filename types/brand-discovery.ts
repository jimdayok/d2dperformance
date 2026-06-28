export type DiscoveryQuestionType =
  | "short-text"
  | "paragraph"
  | "multiple-choice"
  | "checkboxes"
  | "ranking"
  | "priority-order"
  | "slider"
  | "website"
  | "color"
  | "upload"
  | "voice-placeholder"
  | "video-placeholder";

export type DiscoveryOption = {
  value: string;
  label: string;
  description?: string;
};

export type DiscoveryUploadMetadata = {
  id: string;
  name: string;
  size: number;
  type: string;
  lastModified: number;
};

export type DiscoveryAnswer =
  | string
  | string[]
  | number
  | DiscoveryUploadMetadata[];

export type DiscoveryFormValues = Record<string, DiscoveryAnswer>;

export type DiscoveryQuestion = {
  id: string;
  label: string;
  type: DiscoveryQuestionType;
  description?: string;
  placeholder?: string;
  required?: boolean;
  rows?: number;
  options?: DiscoveryOption[];
  min?: number;
  max?: number;
  step?: number;
  accept?: string;
  multiple?: boolean;
  helpTitle?: string;
  helpBody?: string;
  helpExamples?: string[];
  brandExamples?: string[];
};

export type DiscoverySection = {
  id: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  questions: DiscoveryQuestion[];
};

export type DiscoveryDraft = {
  currentSectionIndex: number;
  answers: DiscoveryFormValues;
  summaries: Record<string, string[]>;
  completedSections: string[];
  updatedAt?: string;
  submittedAt?: string;
};

export type DiscoverySubmission = {
  submittedAt: string;
  answers: DiscoveryFormValues;
  summaries: Record<string, string[]>;
};

export type ReportBlock = {
  title: string;
  body: string;
  bullets?: string[];
};
