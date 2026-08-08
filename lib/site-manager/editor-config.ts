export type EditorField = {
  path: string;
  label: string;
  kind?:
    | "text"
    | "textarea"
    | "number"
    | "date"
    | "checkbox"
    | "string_list"
    | "content_blocks"
    | "titled_copy_list";
  help?: string;
  maxLength?: number;
};

export type EditorGroup = {
  title: string;
  description?: string;
  fields: EditorField[];
};
