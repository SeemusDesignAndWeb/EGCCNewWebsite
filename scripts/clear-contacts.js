import { writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

const DATA_DIR = join(process.cwd(), 'data');
const CONTACTS_FILE = join(DATA_DIR, 'contacts.ndjson');

async function clearContacts() {
	try {
		// Check if file exists
		if (!existsSync(CONTACTS_FILE)) {
			console.log('✅ Contacts file does not exist - nothing to clear');
			return;
		}

		// Write empty file (just newline for valid NDJSON)
		await writeFile(CONTACTS_FILE, '\n', 'utf8');
		console.log('✅ All contacts have been deleted');
		console.log('   You can now import contacts from /hub/contacts/import');
	} catch (error) {
		console.error('❌ Error clearing contacts:', error.message);
		process.exit(1);
	}
}

clearContacts();


