# Events Page Setup

The Hub includes functionality to automatically create events pages in your site's page database.

## What Gets Created

When you run `scripts/create-events-page.js`, it creates two pages:

1. **Events Page** (`/events`)
   - Main events listing page
   - Shows in navigation (if enabled)
   - Can be customized in `/admin/pages`

2. **Events Calendar Page** (`/events/calendar`)
   - Calendar view of events
   - Usually accessed via the main events page
   - Hidden from navigation by default

## How to Create Events Pages

### Automatic (During Installation)

The installation script will attempt to create events pages automatically if:
- Your site uses a page database (`database.json`)
- The database file already exists

If the database doesn't exist yet, the pages will be created when:
- The database is initialized, or
- Someone visits `/admin/pages` for the first time

### Manual

Run the script manually:

```bash
node scripts/create-events-page.js
```

This will:
- Check if the database exists
- Create the events pages if they don't already exist
- Update existing pages if they do exist

## Page Structure

### Events Page (`id: 'events'`)
```javascript
{
  id: 'events',
  title: 'Events',
  heroTitle: 'Upcoming Events',
  heroSubtitle: 'Join us for our upcoming events and activities',
  heroImage: '/images/events-bg.jpg',
  heroOverlay: 40,
  sections: [],
  metaDescription: 'View upcoming events and activities...',
  showInNavigation: true,
  navigationLabel: 'Events',
  navigationOrder: 5
}
```

### Events Calendar Page (`id: 'events-calendar'`)
```javascript
{
  id: 'events-calendar',
  title: 'Event Calendar',
  heroTitle: 'Event Calendar',
  heroSubtitle: 'View our upcoming public events and activities',
  heroImage: '/images/events-bg.jpg',
  heroOverlay: 40,
  sections: [],
  metaDescription: 'View our upcoming public events...',
  showInNavigation: false,
  navigationLabel: '',
  navigationOrder: 999
}
```

## Customization

After creation, you can customize these pages:

1. **Via Admin Interface:**
   - Visit `/admin/pages`
   - Edit the "Events" or "Event Calendar" page
   - Modify hero section, add sections, change images, etc.

2. **Via Database:**
   - Edit `data/database.json` directly
   - Find the pages array
   - Modify the page objects

## Integration with Calendar Routes

The events pages work with the public calendar routes:

- `/events` - Shows the events page (from database)
- `/events/calendar` - Shows the calendar view (uses page data for hero)
- `/calendar` - Alternative calendar route
- `/event/[token]` - Public event detail page

## Notes

- The script is **idempotent** - safe to run multiple times
- It won't overwrite existing pages, only creates if missing
- If your site doesn't use a page database, the calendar routes will still work
- You may need to create the pages manually in your CMS if you use a different system
