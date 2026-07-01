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

export type DiscoveryEmailAttachment = {
  filename: string;
  content: string;
  contentType: string;
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
  inputType?: "text" | "email" | "tel" | "url";
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
  sessionId?: string;
  started: boolean;
  currentSectionIndex: number;
  answers: DiscoveryFormValues;
  startedAt: string;
  updatedAt?: string;
  submittedAt?: string;
};

export type DiscoveryCompletionStatus =
  | "started"
  | "in_progress"
  | "submitted"
  | "abandoned_notified";

export type DiscoveryProgressPayload = {
  sessionId: string;
  startedAt: string;
  updatedAt: string;
  submittedAt?: string | null;
  currentStep: number;
  lastCompletedStep: number;
  completionPercentage: number;
  completionStatus: DiscoveryCompletionStatus;
  answers: DiscoveryFormValues;
};

export type DiscoverySubmission = {
  sessionId?: string;
  startedAt: string;
  updatedAt: string;
  submittedAt: string;
  currentStep?: number;
  lastCompletedStep?: number;
  completionPercentage?: number;
  completionStatus?: DiscoveryCompletionStatus;
  answers: DiscoveryFormValues;
  attachments?: DiscoveryEmailAttachment[];
};

export type ReportBlock = {
  title: string;
  body: string;
  bullets?: string[];
};
