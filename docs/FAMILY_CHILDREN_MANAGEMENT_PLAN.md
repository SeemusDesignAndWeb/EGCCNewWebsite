# Family and Children Management System

## Overview

This plan implements a family and children management system that allows tracking children separately from contacts, linking them to parent contacts, managing age groups, and integrating with events and groups for planning kids and youth activities.

## Architecture

### Data Models

**Children Database** (`data/children.ndjson`):
- Separate NDJSON file for children records
- Links to parent contacts via `parentContactIds` array
- Fields: `id`, `firstName`, `lastName`, `dateOfBirth`, `age` (calculated), `ageGroup`, `schoolYear`, `medicalNotes`, `allergyInfo`, `notes`, `parentContactIds[]`, `createdAt`, `updatedAt`

**Age Groups Configuration** (`data/age_groups.ndjson`):
- Configurable age groups with custom names and age ranges
- Fields: `id`, `name`, `minAge`, `maxAge`, `description`, `order`, `createdAt`, `updatedAt`
- Example: "Adventurers" (0-7), "Explorers" (8-14), "Youth" (15-17)

### Database Layer

**New Files:**
- `src/lib/crm/server/database/children.js` - CRUD operations for children
- `src/lib/crm/server/database/ageGroups.js` - CRUD operations for age groups

**Functions to implement:**
- `create`, `findById`, `findMany`, `update`, `remove` for children
- `create`, `findById`, `findMany`, `update`, `remove` for age groups
- `getChildrenByParentContactId(contactId)` - Get all children for a parent
- `getAgeGroupForAge(age)` - Determine age group from age
- `calculateAge(dateOfBirth)` - Calculate age from date of birth

### Validation

**New Validator** (`src/lib/crm/server/validators.js`):
- `validateChild(data)` - Validate child records
- `validateAgeGroup(data)` - Validate age group configuration
- Age calculation and age group assignment logic

## UI Components

### Hub Pages

**1. Children List Page** (`src/routes/hub/children/+page.svelte`):
- List all children with name, age, age group, parents
- Filter by age group, parent contact
- Search functionality
- Link to child detail page

**2. Child Detail/Edit Page** (`src/routes/hub/children/[id]/+page.svelte`):
- View/edit child information
- Display linked parents
- Show age group assignment
- Medical/allergy information section
- Link to related events/groups

**3. New Child Page** (`src/routes/hub/children/new/+page.svelte`):
- Form to create new child
- Parent contact selector (multi-select)
- Date of birth picker
- Age group auto-assignment preview
- School year input

**4. Age Groups Management** (`src/routes/hub/age-groups/+page.svelte`):
- List all age groups
- Create/edit age groups
- Set age ranges (min/max)
- Reorder groups
- Delete groups (with validation for existing children)

### Contact Integration

**Contact Detail Page Updates** (`src/routes/hub/contacts/[id]/+page.svelte`):
- Add "Children" section displaying linked children
- Quick links to add child or view child details
- Show children's age groups and upcoming events

**Contact List Enhancements**:
- Optional filter to show contacts with children
- Display child count badge

### Navigation Updates

**Hub Navigation** (`src/lib/crm/components/CrmShell.svelte`):
- Add "Children" menu item under Contacts section
- Add "Age Groups" menu item (or under Settings)

## Age Group System

### Age Calculation
- Calculate age from date of birth
- Auto-assign age group based on current age
- Handle age group transitions (when child ages up)

### Age Group Assignment
- On child creation/update, automatically assign age group
- Allow manual override if needed
- Display current and next age group

## Event Integration

### Event Signups
- Allow parents to sign up children for events
- Filter events by age group eligibility
- Show age-appropriate events for each child

### Event Configuration
- Add `ageGroups` field to events (array of age group IDs)
- Filter events by age group in event listings
- Display age group requirements on event pages

### Group Integration
- Link age groups to existing groups (Adventurers, Explorers, etc.)
- Show children count per age group in group management
- Generate reports by age group

## API Endpoints

**Server Actions:**
- `src/routes/hub/children/+page.server.js` - List children
- `src/routes/hub/children/[id]/+page.server.js` - View/edit child
- `src/routes/hub/children/new/+page.server.js` - Create child
- `src/routes/hub/age-groups/+page.server.js` - Manage age groups

**API Functions:**
- `getChildrenByParent(contactId)` - Get children for parent
- `getChildrenByAgeGroup(ageGroupId)` - Get all children in age group
- `assignAgeGroup(childId)` - Auto-assign age group
- `getUpcomingEventsForChild(childId)` - Get age-appropriate events

## Data Migration

**Migration Script** (`scripts/migrate-children.js`):
- Optional script to extract children from contact notes
- Create initial age groups based on existing group names
- Link children to parents based on shared addresses/names

## Reporting & Analytics

**Future Enhancements:**
- Children count by age group dashboard
- Age group distribution charts
- Event attendance by age group
- Growth trends (children aging into new groups)

## Security & Privacy

- Medical/allergy information should be marked as sensitive
- Consider encryption for medical notes (similar to safeguarding forms)
- Access controls for viewing children's information
- Audit logging for child record access

## Implementation Order

1. **Phase 1: Core Data Models**
   - Create children database structure
   - Create age groups database structure
   - Implement database CRUD operations
   - Add validators

2. **Phase 2: Age Group Management**
   - Age groups admin UI
   - Age calculation utilities
   - Auto-assignment logic

3. **Phase 3: Children Management**
   - Children list page
   - Child detail/edit page
   - New child creation
   - Parent linking

4. **Phase 4: Contact Integration**
   - Add children section to contact detail page
   - Update contact list with child indicators

5. **Phase 5: Event Integration**
   - Add age group filtering to events
   - Child signup functionality
   - Age-appropriate event suggestions

## Files to Create/Modify

**New Files:**
- `data/children.ndjson` (empty initially)
- `data/age_groups.ndjson` (with default groups)
- `src/lib/crm/server/database/children.js`
- `src/lib/crm/server/database/ageGroups.js`
- `src/routes/hub/children/+page.svelte`
- `src/routes/hub/children/+page.server.js`
- `src/routes/hub/children/[id]/+page.svelte`
- `src/routes/hub/children/[id]/+page.server.js`
- `src/routes/hub/children/new/+page.svelte`
- `src/routes/hub/children/new/+page.server.js`
- `src/routes/hub/age-groups/+page.svelte`
- `src/routes/hub/age-groups/+page.server.js`
- `src/lib/crm/utils/ageCalculation.js`

**Modified Files:**
- `src/lib/crm/server/validators.js` - Add child and age group validators
- `src/routes/hub/contacts/[id]/+page.svelte` - Add children section
- `src/lib/crm/components/CrmShell.svelte` - Add navigation items
- `static/docs/DATA_MODELS.md` - Document new data models
