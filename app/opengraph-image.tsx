import { ImageResponse } from "next/og";
import { companyName, tagline } from "@/lib/site-data";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          background: "#f8f6f2",
          color: "#1f2933",
          padding: "56px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            width: "100%",
            border: "1px solid rgba(31,41,51,0.12)",
            borderRadius: 40,
            padding: 48,
            justifyContent: "space-between",
            alignItems: "stretch",
            background: "#fffdf9",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", maxWidth: 740 }}>
            <div
              style={{
                display: "flex",
                fontSize: 18,
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: "#1a6ac9",
              }}
            >
              {companyName}
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 36,
                fontSize: 68,
                lineHeight: 1.02,
                fontWeight: 700,
              }}
            >
              Build a better business.
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 18,
                fontSize: 30,
                lineHeight: 1.35,
                color: "#5b6672",
              }}
            >
              {tagline}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              width: 240,
              borderRadius: 32,
              background: "#1f2933",
              color: "white",
              padding: 28,
              fontSize: 26,
              lineHeight: 1.4,
              alignItems: "flex-end",
            }}
            >
            Strategy
            <br />
            Leadership
            <br />
            Systems
            <br />
            DAY2DAY
          </div>
        </div>
      </div>
    ),
    size,
  );
}
