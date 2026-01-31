import { json } from '@sveltejs/kit';
import { addHoliday } from '$lib/crm/server/holidays.js';
import { findMany } from '$lib/crm/server/fileStore.js';

/**
 * Book a holiday for a contact
 * POST /api/holidays
 */
export async function POST({ request }) {
    try {
        const { email, name, startDate, endDate, allDay } = await request.json();

        if (!email || !startDate || !endDate) {
            return json({ error: 'Email, start date, and end date are required' }, { status: 400 });
        }

        // 1. Find the contact
        const normalizedEmail = email.trim().toLowerCase();
        const contacts = await findMany('contacts', c => 
            c.email && c.email.toLowerCase() === normalizedEmail
        );

        if (contacts.length === 0) {
            return json({ error: 'No account found with this email address. Please sign up as a member first.' }, { status: 404 });
        }

        const contact = contacts[0];

        // 2. Optional: validate name matches (similar to check-contact-spouse)
        if (name) {
            const nameParts = name.trim().split(/\s+/);
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';
            
            const contactFirstName = (contact.firstName || '').trim().toLowerCase();
            const contactLastName = (contact.lastName || '').trim().toLowerCase();
            const inputFirstName = firstName.trim().toLowerCase();
            const inputLastName = lastName.trim().toLowerCase();
            
            const firstNameMatches = !inputFirstName || contactFirstName.includes(inputFirstName) || inputFirstName.includes(contactFirstName);
            const lastNameMatches = !inputLastName || !contactLastName || contactLastName.includes(inputLastName) || inputLastName.includes(contactLastName) || inputLastName === '';
            
            if ((contactLastName && inputLastName && !lastNameMatches) || (inputFirstName && !firstNameMatches)) {
                return json({ error: 'The name provided does not match the account for this email address.' }, { status: 400 });
            }
        }

        // 3. Normalize dates
        let normalizedStart = startDate;
        let normalizedEnd = endDate;

        if (allDay) {
            // Handle YYYY-MM-DD from <input type="date">
            if (startDate.includes('T')) {
                normalizedStart = startDate.split('T')[0] + 'T00:00:00.000Z';
            } else {
                normalizedStart = startDate + 'T00:00:00.000Z';
            }
            
            if (endDate.includes('T')) {
                normalizedEnd = endDate.split('T')[0] + 'T23:59:59.999Z';
            } else {
                normalizedEnd = endDate + 'T23:59:59.999Z';
            }
        } else {
            // Handle YYYY-MM-DDTHH:mm from <input type="datetime-local">
            // Convert to ISO string
            normalizedStart = new Date(startDate).toISOString();
            normalizedEnd = new Date(endDate).toISOString();
        }

        // 4. Add the holiday
        const holiday = await addHoliday({
            contactId: contact.id,
            startDate: normalizedStart,
            endDate: normalizedEnd,
            allDay: !!allDay
        });

        return json({ success: true, holiday });
    } catch (error) {
        console.error('[Holidays API] Error:', error);
        return json({ error: 'Failed to book away day' }, { status: 500 });
    }
}
