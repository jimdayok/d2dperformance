# Studio AI animation
WaveSpeed Wan 2.2 5B creates four five-second shots. The home server saves each clip privately, then assembles an exact 20-second 720p MP4 with optional instrumental music and an approved or uploaded logo. No OpenAI request is made by this mode.

Apply 202610190001_social_video_jobs.sql and 202610190002_social_video_worker_state.sql to the intended private database. Set WAVESPEED_WORKER_ENABLED=true and WAVESPEED_STUDIO_BUDGET_CENTS to an explicitly authorized total allowance. Zero is the default. The SQL reservation serializes all studio reservations, counts failed or uncertain attempts conservatively, and reuses the same request ID. Clients cannot call the reservation directly.

Run node --experimental-strip-types scripts/social-video-worker.ts from the project root, with the same database settings as the web app. The public web app reads a fresh worker heartbeat, balance and budget from that database; it does not need the WaveSpeed key. Run one video job at a time. Paid submissions are journaled before dispatch and never retried after an uncertain response. A worker restart resumes saved provider receipts. Completed clips are saved to private storage before assembly; retries of polling, downloads and assembly do not create new generations. An uncertain submission is held for D2D review.

Keep WAVESPEED_API_KEY in server configuration or use WAVESPEED_KEY_FILE=/run/d2d-social-secrets/wavespeed.key. The private staging connection form is platform-admin-only and disabled outside D2D_STUDIO_STAGING=true. The worker mounts the key directory read-only; it has no funding API calls. No key is returned to the browser.

Private verification uses the isolated staging database and an 80-cent total allowance, representing the free credits remaining after the initial comparison. No new funds or auto top-up are authorized. Do not enable this worker against the public database until the reviewed migration, public app configuration, worker database identity and authorized budget are installed together.

A selected logo and source photos are snapshotted per job so later brand edits cannot change an in-flight video. Wide, vertical and square output preserve the full source image with padding. This model generates silent animation; music is mixed locally. Baby speech or cooing is not generated.
