# Prompt: Event Bookings View (Hub) and Public Signup Restriction

Use this prompt to replicate the **Hub event bookings view**, **CSV export**, and **public event signup restriction to today onwards** in an identical or similar system.

---

## 1. Hub event page: Bookings view

### Purpose
- On the event detail page (`/hub/events/[id]`), when the event has **signup enabled**, provide a dedicated **Bookings** section so admins can see who has signed up for which date/time, including when there are multiple occurrences.

### Server (`+page.server.js`)
- **All occurrences for bookings:** In addition to `occurrences` (upcoming only, for the Occurrences table), load **all** occurrences for the event (no date filter). For each occurrence, compute signup stats and attach the full list of signups (name, email, guestCount, dietaryRequirements, etc.). Enrich each signup with a display name from contacts (match by email; fallback to signup.name). Sort by `startsAt` ascending. Expose as `allOccurrencesForBookings`.
- **Contacts:** Load contacts (org-filtered) to enrich signup display names. Use the same filter as elsewhere (e.g. `filterByOrganisation(await readCollection('contacts'), organisationId)`).

### Page (`+page.svelte`)
- **Bookings section:** Collapsible block (e.g. “Bookings”) shown only when `event.enableSignup` is true. Header can show total signup count, e.g. “(N signups)”.
- **Content:** For each occurrence in `allOccurrencesForBookings` that has at least one signup, render a card/block with:
  - **Date/time:** Occurrence start (and end) in a clear format (e.g. UK date/time).
  - **Summary:** Signup count, total attendees, and if max spaces exist: “X / Y spots” and “(Full)” or “(N available)”.
  - **Table:** Rows per signup: Name (display name or name), Email, Guests, Dietary (if event has `showDietaryRequirements`), and a **Remove** action that posts to a delete-signup action.
- **Empty state:** If no occurrence has signups, show a short message (e.g. “No signups yet. When people sign up…”).
- **Remove signup:** Reuse or mirror the existing delete-signup form/action (CSRF, signupId); after success, invalidate or reload so the Bookings list updates.

---

## 2. Hub event page: Export bookings to CSV

### Behaviour
- **Button:** “Export to CSV” in the Bookings section header, shown only when there is at least one signup across any occurrence.
- **Client-side download:** Build CSV from `allOccurrencesForBookings`. One row per signup. Columns: Occurrence date, Occurrence time (or “All day” if occurrence is all-day), Name, Email, Guests, Total attendees (1 + guests), Dietary requirements, Signed up at (formatted datetime).
- **Formatting:** UTF-8 with BOM; escape CSV cells (quotes, commas, newlines). Filename derived from event title and date (e.g. `event-bookings-Event-Title-YYYY-MM-DD.csv`). Trigger download via a temporary object URL and revoke after click.
- **Success feedback:** Optional short notification (e.g. “CSV downloaded”).

---

## 3. Public event signup: Only today onwards

### Purpose
- On the **public** event view (`/event/[token]`), the “Sign up for this event” form must only allow selecting **occurrences from today onwards** (including today). Past dates must not be selectable and must not be accepted on submit.

### Server (`+page.server.js`)
- **Upcoming filter:** Use a shared “upcoming” helper that considers an occurrence upcoming if its date (start-of-day, local) is >= today (start-of-day, local). Example: `filterUpcomingOccurrences(occurrences)` or `isUpcomingOccurrence(occ)`.
- **Data for signup dropdown:** Build `upcomingOccurrencesForSignup`:
  - If the token is **occurrence-specific** (`occurrenceId` set): include that occurrence only if it is upcoming (0 or 1 item).
  - If the token is **event-level**: set `upcomingOccurrencesForSignup = filterUpcomingOccurrences(allOccurrencesWithSignups)` (same signup stats: totalAttendees, availableSpots, isFull).
- **Return:** Pass `upcomingOccurrencesForSignup` to the page; keep `occurrences` and `allOccurrences` as needed for display/rotas.
- **Signup action:** When processing signup, after resolving the occurrence and checking it belongs to the event, **reject** if the occurrence is not upcoming (e.g. `if (!isUpcomingOccurrence(occurrence)) return fail(400, { error: 'This date has passed. Please select a date from today onwards.' })`).

### Page (`+page.svelte`)
- **Dropdown:** The “Select Date” &lt;select&gt; options must iterate over `upcomingOccurrencesForSignup`, not all occurrences. Only show options that are not full (same as before) and that are in the upcoming list.
- **Selected occurrence:** Resolve `selectedOccurrence` from `upcomingOccurrencesForSignup` first, then fall back to `occurrences` or `allOccurrences` so the selected date still displays correctly.
- **No upcoming dates:** If `upcomingOccurrencesForSignup.length === 0`, do not render the signup form; instead show a message such as: “There are no dates available to sign up for from today onwards. All occurrences for this event have passed.”

---

## 4. Files touched (reference)

- `src/routes/hub/events/[id]/+page.server.js` – `allOccurrencesForBookings`, contacts for display names.
- `src/routes/hub/events/[id]/+page.svelte` – Bookings section, CSV export, `showBookings`, `exportBookingsToCsv`, `escapeCsvCell`.
- `src/routes/event/[token]/+page.server.js` – `upcomingOccurrencesForSignup`, `isUpcomingOccurrence` import, signup action rejection for past dates.
- `src/routes/event/[token]/+page.svelte` – use `upcomingOccurrencesForSignup` for dropdown and selected occurrence; message when no upcoming dates.
- `src/lib/crm/utils/occurrenceFilters.js` – existing `filterUpcomingOccurrences` and `isUpcomingOccurrence` (date-only, today = start of day local).
