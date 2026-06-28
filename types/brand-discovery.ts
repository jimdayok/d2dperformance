export type DiscoveryField = {
  id: string;
  label: string;
  type: "text" | "textarea";
  placeholder: string;
};

export type DiscoveryStep = {
  id: string;
  title: string;
  helper: string;
  fields: DiscoveryField[];
};

export type DiscoveryFormValues = Record<string, string>;

export type DiscoverySubmission = {
  submittedAt: string;
  values: DiscoveryFormValues;
};
