"use client";

import { useEffect } from "react";
import type {} from "altcha/types/react";

export function AltchaVerification() {
  useEffect(() => {
    void import("altcha");
  }, []);

  return (
    <altcha-widget
      challenge="/api/website-feedback/challenge"
      name="altcha"
      type="checkbox"
      auto="off"
      display="standard"
      language="en"
      style={{ "--altcha-color-base": "#101820", "--altcha-color-base-content": "#f8faf8", "--altcha-border-color": "rgba(126,232,238,.32)", "--altcha-color-primary": "#7ee8ee", "--altcha-color-primary-content": "#101820", "--altcha-max-width": "100%" }}
    />
  );
}
