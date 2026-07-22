# Site Manager authentication email links

The production portal uses a server-side token-hash confirmation route. This avoids requiring the recipient's browser to possess the PKCE verifier cookie that was created when an email flow began.

In Supabase Dashboard, open **Authentication → Emails → Templates** and use these links in the corresponding templates.

## Invite user

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&amp;type=invite&amp;next=/portal/set-password">Set up your password</a>
```

An invited user is authenticated by the one-time token and taken directly to the password setup page.

## Reset password

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&amp;type=recovery&amp;next=/portal/set-password">Reset password</a>
```

Both links are single-use and expire according to the Supabase Email OTP expiration setting. The production Site URL must remain `https://portal.d2dperformance.com`.
