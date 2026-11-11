# P42 — Mobile actions menu overflow

Status: locally verified · A085/E081 · 2026-11-11 Asia/Saigon
Owner: primary agent. Branch fix/mobile-actions-menu from main e8bee8a plus P41 release receipt cbd5fdd.

User reports the ellipsis menu below Thêm địa điểm is off screen on a phone. At 320px, the wrapped trigger lands at the left of its flex row while its 220px panel aligns to the trigger right. Chromium measured x = -105px in Itinerary and Expenses. Keep the trigger right-aligned even when it wraps. Scope: shared responsive CSS, browser regression checks and tracker. Production rollout requires current-batch approval.
