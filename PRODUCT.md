# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
- **Trip organiser (trưởng đoàn):** creates the trip, invites members, builds the itinerary and budget, usually on a desktop before the trip.
- **Group members (friends or family, up to 20 per trip):** open the shared plan on their phones during the trip, check what is next, record expenses and see who owes whom.

## Product Purpose
WanderPlan lets a small Vietnamese travel group plan one trip together: itinerary, shared checklist, members and shared spending in one place. Success means the group always knows the plan for the day and can settle money fairly without arguments or spreadsheets.

## Positioning
- Itinerary and shared spending live in the same trip, so nobody has to run two apps.
- Splitting money is transparent: equal, by shares or exact amounts. Only the recipient confirms a payment. Money involving members who left is frozen.
- Built for Vietnamese groups: Vietnamese interface, whole-dong VND amounts and familiar Excel import/export.

## Operating Context
- Planning happens before the trip, mostly on desktop. Viewing and recording happen during the trip, mostly on phones, often one-handed and on mobile data.
- Group Realtime collaboration through Supabase; a browser-only demo mode exists with private local data.
- Excel workbooks are used to share and bulk-edit plans and reports.

## Capabilities and Constraints
- Multiple trips per account; invitations need recipient consent; owners and co-owners manage the trip; a website admin can manage every trip.
- Itinerary with multi-day activities and non-blocking overlap warnings, 7-day itinerary trash, trip date shift and template cloning.
- Expenses with estimate (Dự kiến) and actual (Thực tế) amounts; settlement balances use recorded payments; 7-day expense trash (P34).
- Shared checklist with optional assignees; self-managed global display names.
- Behaviour, permissions and data rules are fixed by the database; visual work must not change them.
- Terminology: chuyến đi, lịch trình, chi phí, nhóm, chủ nhóm, thành viên, Dự kiến, Thực tế, Đã nhận tiền.

## Brand Commitments
- Keep the name **WanderPlan**. Palette, typography and layout may change completely (customer decision A063, 29/10/2026).
- Interface language is Vietnamese; currency is VND.

## Evidence on Hand
- No testimonials, customer counts, press or pricing exist. Do not invent them.
- Demo data in `src/data/demoWorkspace.ts` is sample content, not real users.

## Product Principles
1. The day's plan and each person's balance come first; everything else is secondary.
2. Money must be unambiguous: estimate and actual are never mixed silently.
3. Phone use during the trip is the hard case; desktop planning is the comfortable case.
4. Destructive or money-moving actions explain their consequences and are recoverable where the rules allow.
5. Plain Vietnamese over clever copy.

## Accessibility & Inclusion
WCAG 2.2 AA: contrast, visible keyboard focus, touch targets of at least 44px on mobile, reduced-motion support and labelled forms.
