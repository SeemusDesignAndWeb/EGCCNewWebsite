#!/usr/bin/env node
import { cp, mkdir, readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const INSTALL_DIR = resolve(__dirname);

// Get target directory from command line or use current directory
const TARGET_DIR = process.argv[2] || process.cwd();

const REQUIRED_DEPS = {
  bcryptjs: '^3.0.3',
  dompurify: '^3.3.1',
  jsdom: '^27.4.0',
  quill: '^2.0.3',
  resend: '^6.4.2',
  ulid: '^3.0.2',
  xlsx: '^0.18.5'
};

async function copyDir(src, dest) {
  try {
    execSync(`cp -r "${src}" "${dest}"`, { stdio: 'inherit' });
  } catch (error) {
    console.error(`Error copying ${src} to ${dest}:`, error.message);
    throw error;
  }
}

async function updatePackageJson(targetDir) {
  const packageJsonPath = join(targetDir, 'package.json');
  
  if (!existsSync(packageJsonPath)) {
    console.error('❌ package.json not found in target directory');
    console.error('   Make sure you are running this from a SvelteKit project root');
    process.exit(1);
  }

  const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'));
  
  // Add dependencies
  if (!packageJson.dependencies) {
    packageJson.dependencies = {};
  }
  
  let addedDeps = false;
  Object.entries(REQUIRED_DEPS).forEach(([dep, version]) => {
    if (!packageJson.dependencies[dep]) {
      packageJson.dependencies[dep] = version;
      console.log(`  ✓ Added dependency: ${dep}@${version}`);
      addedDeps = true;
    } else {
      console.log(`  ⚠  ${dep} already exists (${packageJson.dependencies[dep]}), skipping`);
    }
  });

  // Add create-admin script
  if (!packageJson.scripts) {
    packageJson.scripts = {};
  }
  if (!packageJson.scripts['create-admin']) {
    packageJson.scripts['create-admin'] = 'node scripts/create-admin.js';
    console.log('  ✓ Added create-admin script');
  }

  if (addedDeps) {
    await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
    console.log('  ✓ Updated package.json');
  } else {
    console.log('  ✓ package.json already has all dependencies');
  }
}

async function updateHooksServer(targetDir) {
  const hooksPath = join(targetDir, 'src', 'hooks.server.js');
  
  if (!existsSync(hooksPath)) {
    // Create new hooks.server.js
    const hooksTemplate = await readFile(join(INSTALL_DIR, 'hooks.server.js.template'), 'utf8');
    await mkdir(join(targetDir, 'src'), { recursive: true });
    await writeFile(hooksPath, hooksTemplate);
    console.log('  ✓ Created src/hooks.server.js');
  } else {
    // Update existing hooks.server.js
    let hooksContent = await readFile(hooksPath, 'utf8');
    
    if (!hooksContent.includes('crmHandle')) {
      // Add imports at the top
      if (!hooksContent.includes("from '$lib/crm/server/hook-plugin.js'")) {
        const importMatch = hooksContent.match(/^import .+ from '@sveltejs\/kit\/hooks';/m);
        if (importMatch) {
          hooksContent = hooksContent.replace(
            importMatch[0],
            `${importMatch[0]}\nimport { crmHandle } from '$lib/crm/server/hook-plugin.js';\nimport { cleanupExpiredSessions } from '$lib/crm/server/auth.js';`
          );
        } else {
          hooksContent = `import { sequence } from '@sveltejs/kit/hooks';\nimport { crmHandle } from '$lib/crm/server/hook-plugin.js';\nimport { cleanupExpiredSessions } from '$lib/crm/server/auth.js';\n${hooksContent}`;
        }
      }
      
      // Add session cleanup function
      if (!hooksContent.includes('sessionCleanupHandle')) {
        const sessionCleanup = `
// Session cleanup (runs every hour)
let lastCleanup = 0;
const CLEANUP_INTERVAL = 60 * 60 * 1000;

async function sessionCleanupHandle({ event, resolve }) {
	const now = Date.now();
	if (now - lastCleanup > CLEANUP_INTERVAL) {
		lastCleanup = now;
		cleanupExpiredSessions().catch(err => {
			console.error('Session cleanup error:', err?.message || 'Unknown error');
		});
	}
	return resolve(event);
}`;
        
        // Insert before export
        const exportIndex = hooksContent.indexOf('export const handle');
        if (exportIndex !== -1) {
          hooksContent = hooksContent.slice(0, exportIndex) + sessionCleanup + '\n' + hooksContent.slice(exportIndex);
        } else {
          hooksContent += sessionCleanup;
        }
      }
      
      // Update handle export
      if (hooksContent.includes('export const handle =')) {
        const handleMatch = hooksContent.match(/export const handle = (.+);/);
        if (handleMatch) {
          const existingHandle = handleMatch[1].trim();
          // Check if it's already using sequence
          if (existingHandle.includes('sequence')) {
            // Add to existing sequence
            hooksContent = hooksContent.replace(
              /export const handle = (.+);/,
              `export const handle = sequence($1, sessionCleanupHandle, crmHandle);`
            );
          } else {
            // Wrap in sequence
            hooksContent = hooksContent.replace(
              /export const handle = (.+);/,
              `export const handle = sequence($1, sessionCleanupHandle, crmHandle);`
            );
          }
        }
      } else {
        // Add handle export at the end
        hooksContent += '\n\nexport const handle = sequence(baseHandle, sessionCleanupHandle, crmHandle);';
      }
      
      await writeFile(hooksPath, hooksContent);
      console.log('  ✓ Updated src/hooks.server.js');
    } else {
      console.log('  ⚠  hooks.server.js already has CRM integration');
    }
  }
}

async function createEnvExample(targetDir) {
  const envExamplePath = join(targetDir, '.env.example');
  const envExampleContent = await readFile(join(INSTALL_DIR, 'env.example'), 'utf8');

  if (!existsSync(envExamplePath)) {
    await writeFile(envExamplePath, envExampleContent);
    console.log('  ✓ Created .env.example');
  } else {
    console.log('  ⚠  .env.example already exists, skipping');
  }
}

async function createDataDirectory(targetDir) {
  const dataDir = join(targetDir, 'data');
  const uploadsDir = join(dataDir, 'uploads');
  
  if (!existsSync(dataDir)) {
    await mkdir(dataDir, { recursive: true });
    console.log('  ✓ Created data directory');
  }
  
  if (!existsSync(uploadsDir)) {
    await mkdir(uploadsDir, { recursive: true });
    console.log('  ✓ Created data/uploads directory');
  }
}

async function main() {
  console.log('\n🚀 Hub CRM Installation Script\n');
  console.log(`Installing from: ${INSTALL_DIR}`);
  console.log(`Target directory: ${TARGET_DIR}\n`);

  // Verify target is a SvelteKit project
  if (!existsSync(join(TARGET_DIR, 'package.json'))) {
    console.error('❌ Target directory does not appear to be a SvelteKit project');
    console.error('   Make sure you are running this from a SvelteKit project root');
    process.exit(1);
  }

  try {
    // 1. Copy CRM library
    console.log('📦 Copying CRM library...');
    const crmSrc = join(INSTALL_DIR, 'src', 'lib', 'crm');
    const crmDest = join(TARGET_DIR, 'src', 'lib', 'crm');
    await copyDir(crmSrc, crmDest);
    console.log('  ✓ Copied src/lib/crm\n');

    // 2. Copy hub routes
    console.log('📁 Copying hub routes...');
    const hubSrc = join(INSTALL_DIR, 'src', 'routes', 'hub');
    const hubDest = join(TARGET_DIR, 'src', 'routes', 'hub');
    await copyDir(hubSrc, hubDest);
    console.log('  ✓ Copied src/routes/hub\n');

    // 3. Copy signup routes
    console.log('📁 Copying signup routes...');
    const signupSrc = join(INSTALL_DIR, 'src', 'routes', 'signup');
    const signupDest = join(TARGET_DIR, 'src', 'routes', 'signup');
    await copyDir(signupSrc, signupDest);
    console.log('  ✓ Copied src/routes/signup\n');

    // 4. Copy public calendar routes
    console.log('📅 Copying public calendar routes...');
    const calendarSrc = join(INSTALL_DIR, 'src', 'routes', 'calendar');
    const calendarDest = join(TARGET_DIR, 'src', 'routes', 'calendar');
    if (existsSync(calendarSrc)) {
      await copyDir(calendarSrc, calendarDest);
      console.log('  ✓ Copied src/routes/calendar');
    }
    
    // Copy events routes (including calendar subdirectory)
    const eventsSrc = join(INSTALL_DIR, 'src', 'routes', 'events');
    const eventsDest = join(TARGET_DIR, 'src', 'routes', 'events');
    if (existsSync(eventsSrc)) {
      await mkdir(join(TARGET_DIR, 'src', 'routes', 'events'), { recursive: true });
      await copyDir(eventsSrc, eventsDest);
      console.log('  ✓ Copied src/routes/events');
    }
    
    const eventSrc = join(INSTALL_DIR, 'src', 'routes', 'event');
    const eventDest = join(TARGET_DIR, 'src', 'routes', 'event');
    if (existsSync(eventSrc)) {
      await copyDir(eventSrc, eventDest);
      console.log('  ✓ Copied src/routes/event');
    }
    console.log('');

    // 5. Copy scripts
    console.log('📜 Copying utility scripts...');
    const scriptsSrc = join(INSTALL_DIR, 'scripts');
    const scriptsDest = join(TARGET_DIR, 'scripts');
    await mkdir(scriptsDest, { recursive: true });
    await copyDir(scriptsSrc, scriptsDest);
    console.log('  ✓ Copied scripts\n');

    // 6. Update package.json
    console.log('📝 Updating package.json...');
    await updatePackageJson(TARGET_DIR);
    console.log('');

    // 7. Update hooks.server.js
    console.log('🔧 Setting up hooks.server.js...');
    await updateHooksServer(TARGET_DIR);
    console.log('');

    // 8. Create .env.example
    console.log('📄 Creating .env.example...');
    await createEnvExample(TARGET_DIR);
    console.log('');

    // 9. Create data directory
    console.log('📂 Creating data directory...');
    await createDataDirectory(TARGET_DIR);
    console.log('');

    // 10. Optionally create events pages in site database
    console.log('📄 Checking for site page database...');
    try {
      // Copy the script to target first, then run it
      const scriptSrc = join(INSTALL_DIR, 'scripts', 'create-events-page.js');
      const scriptDest = join(TARGET_DIR, 'scripts', 'create-events-page.js');
      
      if (existsSync(scriptSrc)) {
        // Script was already copied, now try to run it
        const originalCwd = process.cwd();
        process.chdir(TARGET_DIR);
        
        try {
          // Try to import and run
          const scriptUrl = `file://${resolve(scriptDest)}`;
          const { createEventsPages } = await import(scriptUrl);
          createEventsPages();
        } catch (importError) {
          // If import fails, suggest manual run
          console.log('  ℹ  Events page script available at: scripts/create-events-page.js');
          console.log('     Run manually: node scripts/create-events-page.js');
        }
        
        process.chdir(originalCwd);
      }
    } catch (error) {
      // Script might fail if database doesn't exist - that's okay
      console.log('  ℹ  Events page script available at: scripts/create-events-page.js');
      console.log('     Run manually: node scripts/create-events-page.js');
      console.log('     Events pages will also be created automatically when:');
      console.log('     - The database is initialized, or');
      console.log('     - Someone visits /admin/pages for the first time');
    }
    console.log('');

    console.log('✅ Installation complete!\n');
    console.log('📋 Next steps:');
    console.log('  1. Install dependencies: npm install');
    console.log('  2. Copy .env.example to .env and fill in your values:');
    console.log('     cp .env.example .env');
    console.log('     # Then edit .env and add:');
    console.log('     # - CRM_SECRET_KEY (generate with: openssl rand -base64 32)');
    console.log('     # - RESEND_API_KEY (get from https://resend.com)');
    console.log('  3. Create your first admin user:');
    console.log('     npm run create-admin <email> <password> [name]');
    console.log('  4. (Optional) Create events pages in site database:');
    console.log('     node scripts/create-events-page.js');
    console.log('  5. Start your dev server: npm run dev');
    console.log('  6. Visit http://localhost:5173/hub to access the CRM');
    console.log('  7. Visit http://localhost:5173/calendar to view the public events calendar\n');
    console.log('📅 Public Calendar:');
    console.log('  - Events marked as "public" will appear on /calendar and /events/calendar');
    console.log('  - Public events get token-based URLs at /event/[token]');
    console.log('  - Note: Calendar pages reference $lib/components/Footer.svelte');
    console.log('    You may need to create a Footer component or remove the import\n');

  } catch (error) {
    console.error('\n❌ Installation failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
