import { ArrowRight, MessageSquareText } from "lucide-react";

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
      className={`portal-preview-review-action ${previewOpen ? "portal-preview-review-action-visible" : ""}`}
    >
      {previewOpen ? (
        <div className="portal-preview-review-pointer" aria-hidden="true">
          <span>
            {disabled
              ? "Save your draft, then review"
              : "Click here to review this page"}
          </span>
          <span className="portal-preview-review-arrow">
            <ArrowRight size={22} strokeWidth={2.5} />
          </span>
        </div>
      ) : null}
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
