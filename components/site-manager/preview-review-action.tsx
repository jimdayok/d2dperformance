import { MessageSquareText } from "lucide-react";

export function PreviewReviewAction({
  previewOpen,
  disabled,
  onReview,
}: {
  previewOpen: boolean;
  disabled: boolean;
  onReview: () => void;
}) {
  return (
    <div
      className="portal-preview-review-action"
      data-preview-open={previewOpen}
    >
      <button
        type="button"
        onClick={onReview}
        disabled={disabled}
        className="portal-preview-review-button"
      >
        <MessageSquareText size={17} />
        Review this preview
      </button>
    </div>
  );
}
