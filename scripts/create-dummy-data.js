import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { ulid } from 'ulid';

const DATA_DIR = join(process.cwd(), 'data');

// Ensure data directory exists
async function ensureDir() {
	if (!existsSync(DATA_DIR)) {
		await mkdir(DATA_DIR, { recursive: true });
	}
}

// Helper to create a record
function createRecord(data) {
	return {
		...data,
		id: data.id || ulid(),
		createdAt: data.createdAt || new Date().toISOString(),
		updatedAt: new Date().toISOString()
	};
}

// Write NDJSON file
async function writeCollection(collection, records) {
	const filePath = join(DATA_DIR, `${collection}.ndjson`);
	await writeFile(filePath, records.map(r => JSON.stringify(r)).join('\n') + '\n', 'utf8');
}

// Generate dummy contacts
function generateContacts() {
	const firstNames = ['John', 'Sarah', 'Michael', 'Emma', 'David', 'Olivia', 'James', 'Sophia', 'Robert', 'Isabella', 'William', 'Charlotte', 'Richard', 'Amelia', 'Joseph', 'Mia'];
	const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Wilson', 'Anderson', 'Thomas', 'Taylor'];
	const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'example.com'];
	const streets = ['High Street', 'Church Road', 'Main Avenue', 'Park Lane', 'Oak Drive', 'Maple Close', 'Elm Way'];
	const cities = ['London', 'Birmingham', 'Manchester', 'Leeds', 'Glasgow', 'Liverpool', 'Bristol'];
	const counties = ['Greater London', 'West Midlands', 'Greater Manchester', 'West Yorkshire', 'Lancashire', 'Merseyside'];
	const membershipStatuses = ['member', 'regular-attender', 'visitor', 'former-member'];
	const servingAreas = ['Worship', 'Children\'s Ministry', 'Youth', 'Welcome Team', 'Prayer', 'Sound', 'Setup', 'Small Groups'];
	const giftings = ['Teaching', 'Pastoral Care', 'Administration', 'Music', 'Evangelism', 'Hospitality', 'Leadership'];
	const smallGroups = ['Alpha Group', 'Evening Group', 'Morning Group', 'Youth Group', 'Women\'s Group', 'Men\'s Group'];
	
	const contacts = [];
	for (let i = 0; i < 25; i++) {
		const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
		const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
		const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domains[Math.floor(Math.random() * domains.length)]}`;
		
		const hasAddress = Math.random() > 0.3;
		const hasMembership = Math.random() > 0.4;
		const numServingAreas = Math.floor(Math.random() * 3);
		const numGiftings = Math.floor(Math.random() * 3);
		
		const contact = {
			email,
			firstName,
			lastName,
			phone: Math.random() > 0.5 ? `0${Math.floor(Math.random() * 9000000000) + 1000000000}` : '',
			addressLine1: hasAddress ? `${Math.floor(Math.random() * 200) + 1} ${streets[Math.floor(Math.random() * streets.length)]}` : '',
			addressLine2: hasAddress && Math.random() > 0.7 ? 'Flat ' + (Math.floor(Math.random() * 10) + 1) : '',
			city: hasAddress ? cities[Math.floor(Math.random() * cities.length)] : '',
			county: hasAddress ? counties[Math.floor(Math.random() * counties.length)] : '',
			postcode: hasAddress ? `${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(Math.random() * 9) + 1} ${Math.floor(Math.random() * 9) + 1}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}` : '',
			country: hasAddress ? 'United Kingdom' : '',
			membershipStatus: hasMembership ? membershipStatuses[Math.floor(Math.random() * membershipStatuses.length)] : '',
			dateJoined: hasMembership && Math.random() > 0.5 ? new Date(Date.now() - Math.random() * 5 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null,
			baptismDate: hasMembership && Math.random() > 0.6 ? new Date(Date.now() - Math.random() * 10 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null,
			smallGroup: hasMembership && Math.random() > 0.5 ? smallGroups[Math.floor(Math.random() * smallGroups.length)] : '',
			servingAreas: Array.from({ length: numServingAreas }, () => servingAreas[Math.floor(Math.random() * servingAreas.length)]),
			giftings: Array.from({ length: numGiftings }, () => giftings[Math.floor(Math.random() * giftings.length)]),
			notes: Math.random() > 0.7 ? `Contact notes for ${firstName} ${lastName}` : ''
		};
		
		contacts.push(createRecord(contact));
	}
	return contacts;
}

// Generate dummy lists
function generateLists(contacts) {
	const listNames = ['Newsletter Subscribers', 'Volunteers', 'Event Attendees', 'Youth Group', 'Small Groups', 'Prayer Team'];
	const lists = [];
	
	for (let i = 0; i < listNames.length; i++) {
		const name = listNames[i];
		const contactCount = Math.floor(Math.random() * 10) + 5;
		const contactIds = [];
		
		// Randomly assign contacts to this list
		const shuffled = [...contacts].sort(() => 0.5 - Math.random());
		for (let j = 0; j < contactCount && j < shuffled.length; j++) {
			contactIds.push(shuffled[j].id);
		}
		
		lists.push(createRecord({
			name,
			description: `List of ${name.toLowerCase()}`,
			contactIds
		}));
	}
	return lists;
}

// Generate dummy events
function generateEvents() {
	const eventTitles = [
		'Sunday Service',
		'Youth Group Meeting',
		'Prayer Meeting',
		'Community Outreach',
		'Bible Study',
		'Women\'s Fellowship',
		'Men\'s Breakfast',
		'Children\'s Church',
		'Worship Night',
		'Alpha Course'
	];
	
	const locations = [
		'Main Hall',
		'Community Centre',
		'Church Building',
		'Online',
		'Park',
		'Café',
		''
	];
	
	const events = [];
	for (let i = 0; i < eventTitles.length; i++) {
		const title = eventTitles[i];
		events.push(createRecord({
			title,
			description: `<p>Description for ${title}. This is a sample event description.</p>`,
			location: locations[Math.floor(Math.random() * locations.length)],
			visibility: Math.random() > 0.3 ? 'public' : 'private',
			meta: {}
		}));
	}
	return events;
}

// Generate dummy occurrences
function generateOccurrences(events) {
	const occurrences = [];
	
	for (const event of events) {
		// Create 2-4 occurrences per event
		const count = Math.floor(Math.random() * 3) + 2;
		
		for (let i = 0; i < count; i++) {
			const now = new Date();
			const daysOffset = Math.floor(Math.random() * 60) + (i * 7); // Spread over weeks
			const startDate = new Date(now.getTime() + daysOffset * 24 * 60 * 60 * 1000);
			startDate.setHours(10 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 4) * 15, 0, 0);
			
			const endDate = new Date(startDate);
			endDate.setHours(startDate.getHours() + Math.floor(Math.random() * 3) + 1);
			
			occurrences.push(createRecord({
				eventId: event.id,
				startsAt: startDate.toISOString(),
				endsAt: endDate.toISOString(),
				location: Math.random() > 0.5 ? event.location : ''
			}));
		}
	}
	return occurrences;
}

// Generate dummy rotas
function generateRotas(events, occurrences) {
	const roles = ['Worship Leader', 'Sound Technician', 'Usher', 'Children\'s Worker', 'Preacher', 'Prayer Team', 'Setup Team', 'Welcome Team'];
	const rotas = [];
	
	for (const event of events) {
		// Create 2-3 rotas per event
		const rotaCount = Math.floor(Math.random() * 2) + 2;
		
		for (let i = 0; i < rotaCount; i++) {
			const role = roles[Math.floor(Math.random() * roles.length)];
			const eventOccurrences = occurrences.filter(o => o.eventId === event.id);
			const occurrence = eventOccurrences.length > 0 && Math.random() > 0.5 
				? eventOccurrences[Math.floor(Math.random() * eventOccurrences.length)]
				: null;
			
			const capacity = Math.floor(Math.random() * 5) + 1;
			const assigneeCount = Math.floor(Math.random() * capacity);
			
			const assignees = [];
			for (let j = 0; j < assigneeCount; j++) {
				assignees.push({
					contactId: ulid(),
					name: `Volunteer ${j + 1}`,
					email: `volunteer${j + 1}@example.com`
				});
			}
			
			rotas.push(createRecord({
				eventId: event.id,
				occurrenceId: occurrence ? occurrence.id : null,
				role,
				capacity,
				assignees,
				notes: Math.random() > 0.6 ? `<p>Notes for ${role} rota</p>` : ''
			}));
		}
	}
	return rotas;
}

// Generate dummy newsletters
function generateNewsletters() {
	const subjects = [
		'Weekly Update - This Week at Church',
		'Special Announcement: Upcoming Events',
		'Monthly Newsletter - December 2024',
		'Prayer Requests and Praises',
		'Youth Group News',
		'Community Outreach Update'
	];
	
	const newsletters = [];
	for (let i = 0; i < subjects.length; i++) {
		const subject = subjects[i];
		newsletters.push(createRecord({
			subject,
			htmlContent: `<h1>${subject}</h1><p>This is a sample newsletter content. You can edit this in The HUB.</p><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>`,
			textContent: `${subject}\n\nThis is a sample newsletter content. You can edit this in The HUB.\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit.`,
			status: i < 2 ? 'sent' : 'draft',
			logs: [],
			metrics: {}
		}));
	}
	return newsletters;
}

// Generate dummy forms
function generateForms() {
	const forms = [
		{
			name: 'Kids Work Register',
			description: 'Registration form for children\'s activities',
			isSafeguarding: false,
			fields: [
				{ id: '1', type: 'text', label: 'Child\'s Name', name: 'child_name', required: true, placeholder: 'Enter child\'s full name' },
				{ id: '2', type: 'date', label: 'Date of Birth', name: 'dob', required: true },
				{ id: '3', type: 'text', label: 'Parent/Guardian Name', name: 'parent_name', required: true },
				{ id: '4', type: 'email', label: 'Parent Email', name: 'parent_email', required: true },
				{ id: '5', type: 'tel', label: 'Emergency Contact', name: 'emergency_contact', required: true },
				{ id: '6', type: 'textarea', label: 'Medical Information', name: 'medical_info', required: false, placeholder: 'Any allergies or medical conditions' },
				{ id: '7', type: 'checkbox', label: 'Permissions', name: 'permissions', required: false, options: ['Photo consent', 'Video consent', 'Medical treatment consent'] }
			]
		},
		{
			name: 'Safeguarding Disclosure Form',
			description: 'Confidential safeguarding disclosure form',
			isSafeguarding: true,
			fields: [
				{ id: '1', type: 'text', label: 'Your Name', name: 'name', required: true },
				{ id: '2', type: 'email', label: 'Email Address', name: 'email', required: true },
				{ id: '3', type: 'tel', label: 'Phone Number', name: 'phone', required: true },
				{ id: '4', type: 'date', label: 'Date of Incident', name: 'incident_date', required: true },
				{ id: '5', type: 'textarea', label: 'Description of Concern', name: 'description', required: true, placeholder: 'Please provide details of your concern' },
				{ id: '6', type: 'select', label: 'Urgency Level', name: 'urgency', required: true, options: ['Low', 'Medium', 'High', 'Critical'] }
			]
		},
		{
			name: 'Volunteer Application',
			description: 'Application form for new volunteers',
			isSafeguarding: false,
			fields: [
				{ id: '1', type: 'text', label: 'Full Name', name: 'full_name', required: true },
				{ id: '2', type: 'email', label: 'Email', name: 'email', required: true },
				{ id: '3', type: 'tel', label: 'Phone', name: 'phone', required: true },
				{ id: '4', type: 'select', label: 'Area of Interest', name: 'area', required: true, options: ['Children\'s Work', 'Youth', 'Worship', 'Welcome Team', 'Administration', 'Other'] },
				{ id: '5', type: 'textarea', label: 'Why do you want to volunteer?', name: 'motivation', required: true },
				{ id: '6', type: 'radio', label: 'Availability', name: 'availability', required: true, options: ['Weekdays', 'Weekends', 'Both', 'Flexible'] }
			]
		}
	];

	return forms.map(f => createRecord(f));
}

// Generate dummy form submissions (registers)
async function generateFormSubmissions(forms) {
	const registers = [];
	const firstNames = ['John', 'Sarah', 'Michael', 'Emma', 'David', 'Olivia', 'James', 'Sophia', 'Robert', 'Isabella', 'William', 'Charlotte', 'Richard', 'Amelia', 'Joseph', 'Mia'];
	const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Wilson', 'Anderson', 'Thomas', 'Taylor'];
	const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'example.com'];
	
	// Try to import encrypt function for safeguarding forms
	let encrypt = null;
	try {
		const cryptoModule = await import('../src/lib/hub/server/crypto.js');
		encrypt = cryptoModule.encrypt;
	} catch (error) {
		console.warn('⚠️  Encryption not available - safeguarding forms will have plain data (set CRM_SECRET_KEY to encrypt)');
	}
	
	for (const form of forms) {
		// Generate 3-8 submissions per form
		const submissionCount = Math.floor(Math.random() * 6) + 3;
		
		for (let i = 0; i < submissionCount; i++) {
			const submissionData = {};
			
			// Generate data based on form fields
			for (const field of form.fields) {
				if (field.type === 'text' || field.type === 'email' || field.type === 'tel') {
					if (field.name.includes('name') || field.name.includes('Name')) {
						const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
						const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
						if (field.name.includes('child') || field.name.includes('Child')) {
							submissionData[field.name] = `${firstName} ${lastName}`;
						} else if (field.name.includes('parent') || field.name.includes('Parent')) {
							submissionData[field.name] = `${firstName} ${lastName}`;
						} else {
							submissionData[field.name] = `${firstName} ${lastName}`;
						}
					} else if (field.name.includes('email') || field.name.includes('Email')) {
						const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
						const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
						submissionData[field.name] = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domains[Math.floor(Math.random() * domains.length)]}`;
					} else if (field.name.includes('phone') || field.name.includes('Phone') || field.name.includes('contact') || field.name.includes('Contact')) {
						submissionData[field.name] = `0${Math.floor(Math.random() * 9000000000) + 1000000000}`;
					} else {
						submissionData[field.name] = `Sample ${field.label}`;
					}
				} else if (field.type === 'date') {
					if (field.name.includes('birth') || field.name.includes('Birth') || field.name.includes('dob')) {
						// Child's date of birth (5-15 years ago)
						const yearsAgo = Math.floor(Math.random() * 10) + 5;
						const dob = new Date();
						dob.setFullYear(dob.getFullYear() - yearsAgo);
						dob.setMonth(Math.floor(Math.random() * 12));
						dob.setDate(Math.floor(Math.random() * 28) + 1);
						submissionData[field.name] = dob.toISOString().split('T')[0];
					} else if (field.name.includes('incident') || field.name.includes('Incident')) {
						// Incident date (recent past)
						const daysAgo = Math.floor(Math.random() * 90);
						const incidentDate = new Date();
						incidentDate.setDate(incidentDate.getDate() - daysAgo);
						submissionData[field.name] = incidentDate.toISOString().split('T')[0];
					} else {
						// Random date in past year
						const daysAgo = Math.floor(Math.random() * 365);
						const date = new Date();
						date.setDate(date.getDate() - daysAgo);
						submissionData[field.name] = date.toISOString().split('T')[0];
					}
				} else if (field.type === 'textarea') {
					if (field.name.includes('medical') || field.name.includes('Medical')) {
						const medicalInfo = ['No known allergies', 'Peanut allergy', 'Asthma', 'Diabetes', 'None'];
						submissionData[field.name] = medicalInfo[Math.floor(Math.random() * medicalInfo.length)];
					} else if (field.name.includes('description') || field.name.includes('Description') || field.name.includes('concern') || field.name.includes('Concern')) {
						submissionData[field.name] = 'This is a sample description of the concern or issue. It contains detailed information about the situation.';
					} else if (field.name.includes('motivation') || field.name.includes('Why')) {
						submissionData[field.name] = 'I am interested in volunteering because I want to serve the church community and use my gifts to help others.';
					} else {
						submissionData[field.name] = `Sample text for ${field.label}. This is a longer text entry that provides more detailed information.`;
					}
				} else if (field.type === 'select') {
					if (field.options && Array.isArray(field.options) && field.options.length > 0) {
						submissionData[field.name] = field.options[Math.floor(Math.random() * field.options.length)];
					} else if (typeof field.options === 'string') {
						const options = field.options.split(',').map(o => o.trim());
						submissionData[field.name] = options[Math.floor(Math.random() * options.length)];
					} else {
						submissionData[field.name] = 'Option 1';
					}
				} else if (field.type === 'checkbox') {
					if (field.options && Array.isArray(field.options) && field.options.length > 0) {
						const selectedCount = Math.floor(Math.random() * field.options.length) + 1;
						const shuffled = [...field.options].sort(() => 0.5 - Math.random());
						submissionData[field.name] = shuffled.slice(0, selectedCount);
					} else if (typeof field.options === 'string') {
						const options = field.options.split(',').map(o => o.trim());
						const selectedCount = Math.floor(Math.random() * options.length) + 1;
						const shuffled = [...options].sort(() => 0.5 - Math.random());
						submissionData[field.name] = shuffled.slice(0, selectedCount);
					} else {
						submissionData[field.name] = [];
					}
				} else if (field.type === 'radio') {
					if (field.options && Array.isArray(field.options) && field.options.length > 0) {
						submissionData[field.name] = field.options[Math.floor(Math.random() * field.options.length)];
					} else if (typeof field.options === 'string') {
						const options = field.options.split(',').map(o => o.trim());
						submissionData[field.name] = options[Math.floor(Math.random() * options.length)];
					} else {
						submissionData[field.name] = 'Option 1';
					}
				} else {
					submissionData[field.name] = `Sample ${field.type} value`;
				}
			}
			
			// Generate submission date (within last 90 days)
			const daysAgo = Math.floor(Math.random() * 90);
			const submittedAt = new Date();
			submittedAt.setDate(submittedAt.getDate() - daysAgo);
			submittedAt.setHours(Math.floor(Math.random() * 12) + 8, Math.floor(Math.random() * 60), 0, 0);
			
			const register = {
				formId: form.id,
				submittedAt: submittedAt.toISOString()
			};
			
			// Handle encryption for safeguarding forms
			if (form.requiresEncryption || form.isSafeguarding) {
				if (encrypt) {
					try {
						register.encryptedData = encrypt(JSON.stringify(submissionData));
						register.data = null;
					} catch (error) {
						console.warn(`⚠️  Could not encrypt submission for form ${form.name}: ${error.message}`);
						// Store as plain data if encryption fails
						register.data = submissionData;
						register.encryptedData = null;
					}
				} else {
					// If encryption not available, store as plain data
					// In production, this should always be encrypted
					register.data = submissionData;
					register.encryptedData = null;
				}
			} else {
				register.data = submissionData;
				register.encryptedData = null;
			}
			
			registers.push(createRecord(register));
		}
	}
	
	return registers;
}

// Main function
async function main() {
	console.log('Creating dummy data...\n');
	
	await ensureDir();
	
	// Generate data
	const contacts = generateContacts();
	console.log(`✅ Created ${contacts.length} contacts`);
	
	const lists = generateLists(contacts);
	console.log(`✅ Created ${lists.length} lists`);
	
	const events = generateEvents();
	console.log(`✅ Created ${events.length} events`);
	
	const occurrences = generateOccurrences(events);
	console.log(`✅ Created ${occurrences.length} occurrences`);
	
	const rotas = generateRotas(events, occurrences);
	console.log(`✅ Created ${rotas.length} rotas`);
	
	const newsletters = generateNewsletters();
	console.log(`✅ Created ${newsletters.length} newsletters`);
	
	const forms = generateForms();
	console.log(`✅ Created ${forms.length} forms`);
	
	const registers = await generateFormSubmissions(forms);
	console.log(`✅ Created ${registers.length} form submissions`);
	
	// Write to files
	await writeCollection('contacts', contacts);
	await writeCollection('lists', lists);
	await writeCollection('events', events);
	await writeCollection('occurrences', occurrences);
	await writeCollection('rotas', rotas);
	await writeCollection('newsletters', newsletters);
	await writeCollection('forms', forms);
	await writeCollection('registers', registers);
	
	console.log('\n✨ Dummy data created successfully!');
	console.log('\nYou can now view the data in The HUB at /hub');
}

main().catch(error => {
	console.error('❌ Error:', error);
	process.exit(1);
});

