# Content Intake Requirements (Form-Friendly)
Use this checklist to collect all textual/structured inputs needed to recreate the current SvelteKit site. Provide final copy (ready to publish). For any image/video slots, supply a file reference/URL plus alt text; no files need to be uploaded now.

## Global
- Site identity: site title, short tagline/boilerplate, preferred CTA tone (formal/warm).
- Navigation labels (order): Home, Im New, Church, Team, Community Groups, Activities, Audio, Media, plus any others.
- Contact info (shown in multiple pages): address, phone, email.
- Event highlight banner (sitewide when enabled): event title, date, time, location, Learn More link (event URL), banner visibility preference.
- Latest message popup (sitewide when enabled): video title, YouTube/Embed URL, external watch URL, optional supporting line if different from the default “Catch up from Sunday”.
- Footer basics (if used): service times summary, contact recap text or leave blank to use defaults.
- SEO/social defaults: sitewide fallback title/description, default OpenGraph/Twitter title/description, default OG image reference.

## Home (`/`)
- SEO: title, meta description.
- Hero carousel (multiple slides): for each slide provide title, subtitle, CTA label, CTA anchor/URL, background image reference.
- Featured events (sidebar in hero): for each featured event include title, date, time, location, detail URL, image reference.
- About section: label, title, rich text body (HTML allowed), main image reference + alt.
- Services & programs grid: list of services with name, time, description (HTML allowed), image reference + alt, optional URL/target behavior.
- Contact section uses global contact info.

## Activities (`/activities`)
- SEO: title, meta description.
- Hero: title, subtitle, hero image, overlay %, optional hero buttons (text, link, target, style primary/secondary).
- Intro section (id `intro-section`): title, rich text body.
- Activities grid items: title, description (HTML allowed), image reference + alt, time info or audience label, optional link + link text, sort order.
- CTA: “We Look Forward to Welcoming You!” copy is fixed; confirm if any change is needed to headline, blurb, or button text/target (`#contact`).
- Contact section uses global contact info.

## Community Groups (`/community-groups`)
- SEO: title, meta description.
- Hero: title, subtitle, hero messages (list), hero image, overlay %, default buttons “Learn More” (#intro) and “Join a Group” (#contact) unless overridden.
- Intro section (first text block): title, rich text body.
- Details section (second text block): title, rich text body, CTA (text, link), image reference + alt.
- Schedule cards: day, time, description, optional order, optional icon color (primary/brand-yellow/brand-red/brand-blue).
- “What You’ll Experience” benefits: confirm if default copy is acceptable; if not, provide three benefit titles + descriptions.
- Contact section uses global contact info.

## Audio / Podcasts (`/audio`)
- SEO: title, meta description, RSS title if different.
- Hero: title, subtitle, hero buttons list (text, link, target, style primary/secondary), hero image, overlay %.
- Podcast feed list (each item): title, description (or speaker if no description), published date, duration, series label, Spotify show URL (global), optional link target override.
- Empty state messages: confirm defaults or provide custom text for “No sermons available” and filter hints (even though filters are hidden).

## Media / Videos (`/media`)
- SEO: title, meta description.
- Hero: title, subtitle, hero buttons list (text, link, target, style primary/secondary), hero image, overlay %.
- Playlist info: playlist title; optionally custom error/help text if playlist missing/private.
- Video items (per entry): title, embed URL, published date, channel title, optional view count, thumbnail/image reference if different from embed default.
- Empty/error states: custom copy (if different from defaults) for “No playlist configured”, “Playlist empty”, and “Error loading playlist”.

## Events Detail (`/events/[id]`)
- SEO: per-event meta description (or derive from description).
- Event content: title, date, time, location, hero image reference, main description (HTML), event info sidebar/body (HTML), contact CTA link text/target (defaults to “Contact Us” → `/#contact`).

## Im New (`/im-new`)
- SEO: title, meta description.
- Hero: title, subtitle, rotating hero messages (list), hero image, overlay %, hero buttons (text/link/target/style).
- Welcome section: title, rich text body, signature image (optional) + alt, portrait image + alt.
- “What to Expect” columns: list of steps/cards with title and rich text body (HTML), order.
- “For All Ages” section: label, title, rich text body (can include headings), children groups list (name, age range), service time, service title, doors-open note, bullet details list, optional footer note.
- “Get Connected” CTA: headline/body/CTA text/link (defaults to Explore Community Groups).
- Contact section uses global contact info.

## Church (`/church`)
- SEO: title, meta description.
- Hero: title, subtitle, hero messages list, hero image, overlay %, hero buttons (text/link/target/style).
- History section: title, rich text body, image reference + alt.
- Additional “Who We Are” cards: for each card provide title, rich text body (HTML), image reference + alt, order.
- Values section: title, description, list of values (title + description).
- Mission Life Grace section: logo reference + alt, label, title, rich text body, button text/link (defaults to Mission Life Grace site).
- Contact/footer use global defaults.

## Team (`/team`)
- SEO: title, meta description.
- Hero: title, subtitle, hero buttons (text/link/target/style), hero image, overlay %.
- Team intro: teamDescription (rich text) or short blurb.
- Team members: name, role, bio/quote, photo reference + alt, order.
- Optional text sections: for each provide title, rich text body, optional image + alt, optional CTA (text/link/target), order.
- Contact section uses global contact info.

## Media Placeholders (no uploads now)
- For every image/video slot above, provide: file name or URL, short description/context, alt text, and (if known) preferred dimensions/crop.

## Forms & Messages
- Contact form copy: headings/subhead (“Contact Us”, “Get in touch with us”), success message, error message fallback, submit button text (“Send Message”), per-field labels/placeholders (Name, Email, Phone, Message), validation messages (min lengths, email format), honeypot field label (hidden) if you want a custom one.
- Notification recipients: email address(es) that should receive contact submissions; subject line prefix if desired.
- Map embed: Google Maps embed URL and map title text.

## SEO & Sharing (page-level)
- For each route/page: browser title, meta description, OpenGraph title/description, OG image reference, Twitter card image/text if different, canonical URL rules (if any).

## Open Questions to Fill Later
- Analytics/metrics IDs (GA/other), cookie/consent text, privacy/terms URLs, any additional CTAs or integrations not covered above.




