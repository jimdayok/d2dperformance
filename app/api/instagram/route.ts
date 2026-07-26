import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json(
    { posts: [], available: false },
    {
      status: 503,
      headers: {
        "cache-control": "no-store",
      },
    },
  );
}
