---
name: WanderPlan
description: Station departure board for a small group's trip — today's plan and whose money moves.
colors:
  board: "#123e6b"
  board-ink: "#ffffff"
  board-muted: "#c9daec"
  primary: "#123e6b"
  primary-strong: "#0b2c4f"
  secondary: "#2f5d86"
  change: "#f2b51b"
  change-bg: "#fff2cc"
  on-change: "#3d2a00"
  accent-text: "#8a5a00"
  ground: "#f1f4f8"
  surface: "#ffffff"
  surface-muted: "#e6ebf1"
  field: "#fbfcfe"
  text: "#17202a"
  text-muted: "#4d5966"
  receive: "#1e7a4c"
  receive-bg: "#edf7f1"
  owe: "#b3362c"
  danger-bg: "#fdecea"
  mint: "#e5edf6"
  dark-board: "#0f2c4c"
  dark-ground: "#0b121a"
  dark-surface: "#131c26"
  dark-primary: "#8db9e8"
  dark-text: "#e4ebf2"
typography:
  page-title:
    fontFamily: "Be Vietnam Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.015em"
  section-title:
    fontFamily: "Be Vietnam Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 700
    lineHeight: 1.25
  board-time:
    fontFamily: "Be Vietnam Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1.2
  body:
    fontFamily: "Be Vietnam Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Be Vietnam Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.4
  tag:
    fontFamily: "Be Vietnam Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 700
    lineHeight: 1.4
rounded:
  tight: "4px"
  control: "8px"
  inset: "10px"
  surface: "12px"
  shell: "16px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "20px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.board-ink}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.primary-strong}"
  button-ghost:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "44px"
  button-danger:
    backgroundColor: "{colors.owe}"
    textColor: "{colors.board-ink}"
    rounded: "{rounded.control}"
    height: "44px"
  board-row:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.control}"
    padding: "10px 14px"
  status-tag-changed:
    backgroundColor: "{colors.change}"
    textColor: "{colors.on-change}"
    typography: "{typography.tag}"
    rounded: "{rounded.pill}"
  status-tag-now:
    backgroundColor: "{colors.receive-bg}"
    textColor: "{colors.receive}"
    typography: "{typography.tag}"
    rounded: "{rounded.pill}"
  input:
    backgroundColor: "{colors.field}"
    textColor: "{colors.text}"
    rounded: "{rounded.control}"
    padding: "11px 12px"
    height: "46px"
---

# Design System: WanderPlan

## Overview

**Creative North Star: "The departure board"**

WanderPlan reads like the timetable board in a Vietnamese railway station: rows of times, places and states that a whole group can scan at a glance, on a phone during the trip or on a desktop while planning. The board blue owns the shell and every day header; content sits on white rows over a cool light ground. Money is treated with the same board discipline: tabular figures, actual and estimate never mixed, receive in green and owe in brick red.

Operate mode: the world lends type, palette, density and one signature move (the live day board). Navigation, dialogs and form controls stay standard web controls. Light and dark follow the device; both are defined token by token in `src/styles/foundation.css`, the single source of colour.

**Key Characteristics:**
- Board-blue shell and day headers, white rows, cool light ground.
- One amber reserved for change ("Đã đổi"), nothing else.
- Tabular numerals for every time and amount; amounts never wrap.
- Actual vs estimate shown separately in every total and aggregate.
- Be Vietnam Pro only, 400–700; no display face, no eyebrows.

## Colors

### Primary
- **Board Blue** (`#123e6b`): top bar, day headers, today's board, primary buttons, focus ring. Dark theme uses `#0f2c4c` for the board and `#8db9e8` as the text/fill accent with dark text on it.

### Secondary
- **Rail Steel** (`#2f5d86`): secondary text accents and the faded estimate share of bars.

### Tertiary
- **Signal Amber** (`#f2b51b`, background `#fff2cc`): only for change state and the demo badge.

### Neutral
- **Station Ground** (`#f1f4f8`), **Row White** (`#ffffff`), **Platform Grey** (`#e6ebf1`), **Ink** (`#17202a`), **Muted Ink** (`#4d5966`).
- **Receive Green** (`#1e7a4c`) and **Owe Brick** (`#b3362c`) colour money from the viewer's side.

### Named Rules
**The One Amber Rule.** Amber marks something that changed since you last looked. It never decorates, warns about overlaps, or highlights a total.

**The Viewer's Side Rule.** A transfer or balance is green when the viewer receives and red when the viewer pays; amounts between other people stay in ink.

## Typography

**Body Font:** Be Vietnam Pro (self-hosted, Vietnamese and Latin subsets, 400/500/600/700).

### Hierarchy
- **Page title** (700, 28px desktop / 24px phone): one per page, no label above it.
- **Section title** (700, 18px): card and day-header headings.
- **Board time** (700, 20px desktop / 17px phone, tabular): the left column of every board row.
- **Body** (400, 15px/1.5) and **Label** (600, 14px) for forms and lists.
- **Tag** (700, 12px): status pills.

### Named Rules
**The Tabular Rule.** `font-variant-numeric: tabular-nums` is set on `body`; times and VND amounts align in columns and carry `white-space: nowrap`.

## Layout

Fixed rem-style scale, not fluid type. Pages sit in a 1180px column with a 20px phone gutter (16px below 900px). Today is two columns on desktop (board 1.6fr, ticket 1fr) and one column on phones, where the board bleeds to the screen edge. Below 900px the top nav becomes a fixed bottom nav (52px targets) and dialogs become bottom sheets with sticky actions. Every target is at least 44px on touch.

## Elevation & Depth

Flat by default: surfaces separate with 1px borders and rule lines, not shadows. Raised layers only: menus, toasts, the trip list and dialogs use `--shadow-raised`. No cards inside cards; inner groups use rule-separated rows.

## Shapes

Radii from 4px (tags inside rows) to 16px (dialogs, phone sheets); controls and board rows use 8px; pills are full. Dashed 2px rules mark a ticket stub (money summaries).

## Components

### Buttons
Primary (board blue, white text), ghost (white with strong border), soft (pale blue), danger (brick). All 44px tall, 600 weight; pressed state moves 1px; disabled at 55% opacity.

### Chips
Status tags: Đang diễn ra (green on pale green), Xong/Sắp tới (muted on grey), Đã đổi (amber), Dự kiến (dashed outline). Trùng giờ is an outlined red pill, never amber.

### Cards / Containers
White surface, 1px border, 12px radius, 18–20px padding. Money summaries are tickets: amounts above, dashed rule, budget or note below.

### Inputs / Fields
46px, field background, strong border, primary focus ring plus mint halo. VND inputs are right-aligned with a ₫ suffix and a grouped preview; optional fields say "(không bắt buộc)" beside the label.

### Navigation
Desktop: board-blue top bar with white active pill. Phone: white bottom bar, active item on mint. A "Thêm" menu groups secondary page actions (Excel, trash) and closes on Escape or outside press.

### Departure board (signature)
Board-blue panel holding white rows: time | stop and address | status. Rows changed by someone else since the viewer last looked take the amber background until they leave the page. Multi-day activities show "Ngày k/n" and a segment bar whose length is the number of days.

## Do's and Don'ts

### Do:
- **Do** keep actual and estimate money separate in every total, bar and day sum.
- **Do** colour money from the viewer's side.
- **Do** confirm destructive or money actions in an in-app dialog that names the person and amount.
- **Do** take every colour from the tokens in `foundation.css`, for both themes.

### Don't:
- **Don't** put a small label or kicker above a heading.
- **Don't** use amber for anything except change.
- **Don't** nest cards or use thick coloured accent borders.
- **Don't** let an amount wrap across lines or drop tabular figures.
- **Don't** use `window.confirm` or native alerts.
