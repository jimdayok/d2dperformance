import { forwardProjectBrief } from "../../../../lib/project-brief-proxy";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  return forwardProjectBrief(request, "contact", "performance");
}
