import type { Metadata } from "next";
import { FeedbackWorkspace } from "@/components/website-feedback/feedback-workspace";
import "./website-feedback.css";

export const metadata: Metadata = {
  title: "Website Feedback & Concept Guidance | D2D Digital",
  description: "A private, page-by-page website review workspace for D2D Digital clients.",
  robots: { index: false, follow: false, nocache: true },
};

export default async function WebsiteFeedbackPage({ searchParams }: { searchParams: Promise<{ url?: string; session?: string; site?: string }> }) {
  const query = await searchParams;
  return <FeedbackWorkspace initialUrl={query.url ?? ""} initialSessionId={query.session ?? ""} sourceSiteSlug={query.site ?? ""} />;
}
