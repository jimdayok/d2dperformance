import { forwardProjectBrief } from "../../../../lib/project-brief-proxy";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  return forwardProjectBrief(request, "challenge", "performance");
}
