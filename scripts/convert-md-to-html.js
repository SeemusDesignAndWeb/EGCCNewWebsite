const fs = require('fs');
const path = require('path');

function slugify(text) {
	return text.toLowerCase()
		.replace(/[^\w\s-]/g, '')
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-')
		.trim();
}

function markdownToHtml(md) {
	let html = md;
	
	// Remove the markdown TOC (we'll create our own)
	html = html.replace(/^## Table of Contents[\s\S]*?^---$/m, '');
	
	// Headers with IDs
	html = html.replace(/^### (.*)$/gm, (match, title) => {
		const id = slugify(title);
		return `<h3 id="${id}">${title}</h3>`;
	});
	
	html = html.replace(/^## (.*)$/gm, (match, title) => {
		const id = slugify(title);
		return `<h2 id="${id}">${title}</h2>`;
	});
	
	html = html.replace(/^# (.*)$/gm, '<h1>$1</h1>');
	
	// Bold
	html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
	
	// Italic
	html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
	
	// Code blocks (inline)
	html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
	
	// Horizontal rules
	html = html.replace(/^---$/gm, '<hr>');
	
	// Ordered lists
	const lines = html.split('\n');
	const processed = [];
	let inList = false;
	let listType = null;
	
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const olMatch = line.match(/^(\d+)\.\s+(.*)$/);
		const ulMatch = line.match(/^-\s+(.*)$/);
		
		if (olMatch) {
			if (!inList || listType !== 'ol') {
				if (inList) processed.push(`</${listType}>`);
				processed.push('<ol>');
				inList = true;
				listType = 'ol';
			}
			processed.push(`<li>${olMatch[2]}</li>`);
		} else if (ulMatch) {
			if (!inList || listType !== 'ul') {
				if (inList) processed.push(`</${listType}>`);
				processed.push('<ul>');
				inList = true;
				listType = 'ul';
			}
			processed.push(`<li>${ulMatch[1]}</li>`);
		} else {
			if (inList) {
				processed.push(`</${listType}>`);
				inList = false;
				listType = null;
			}
			processed.push(line);
		}
	}
	
	if (inList) {
		processed.push(`</${listType}>`);
	}
	
	html = processed.join('\n');
	
	// Paragraphs (wrap consecutive non-empty lines)
	html = html.split('\n').map(line => {
		if (line.trim() === '' || line.startsWith('<') || line.startsWith('</')) {
			return line;
		}
		return `<p>${line}</p>`;
	}).join('\n');
	
	// Clean up empty paragraphs
	html = html.replace(/<p><\/p>/g, '');
	html = html.replace(/<p>(<[^>]+>)/g, '$1');
	html = html.replace(/(<\/[^>]+>)<\/p>/g, '$1');
	
	return html;
}

// Read the markdown file
const mdPath = path.join(__dirname, '../static/docs/USER_GUIDE.md');
const mdContent = fs.readFileSync(mdPath, 'utf8');

// Extract TOC structure
const tocMatch = mdContent.match(/## Table of Contents([\s\S]*?)---/);
let tocHtml = '';
if (tocMatch) {
	const tocText = tocMatch[1];
	const tocLines = tocText.split('\n').filter(l => l.trim());
	
	let currentLevel = 0;
	let tocItems = [];
	
	for (const line of tocLines) {
		if (line.match(/^\d+\.\s+\[/)) {
			// Main item
			const match = line.match(/^\d+\.\s+\[([^\]]+)\]\(#([^)]+)\)/);
			if (match) {
				tocItems.push({ level: 1, text: match[1], href: match[2] });
			}
		} else if (line.match(/^\s+-\s+\[/)) {
			// Sub item
			const match = line.match(/^\s+-\s+\[([^\]]+)\]\(#([^)]+)\)/);
			if (match) {
				tocItems.push({ level: 2, text: match[1], href: match[2] });
			}
		}
	}
	
	tocHtml = '<ul class="toc">';
	let inMainItem = false;
	for (const item of tocItems) {
		if (item.level === 1) {
			if (inMainItem) {
				tocHtml += '</ul></li>';
			}
			tocHtml += `<li><a href="#${item.href}">${item.text}</a>`;
			inMainItem = true;
		} else {
			if (!tocItems.find(i => i.level === 1 && tocItems.indexOf(i) < tocItems.indexOf(item))) {
				tocHtml += '<ul>';
			}
			tocHtml += `<li><a href="#${item.href}">${item.text}</a></li>`;
		}
	}
	if (inMainItem) {
		tocHtml += '</ul></li>';
	}
	tocHtml += '</ul>';
}

// Convert markdown to HTML
const contentHtml = markdownToHtml(mdContent);

// Read the existing HTML template
const htmlTemplate = fs.readFileSync(path.join(__dirname, '../static/docs/USER_GUIDE.html'), 'utf8');

// Replace the TOC and content
const finalHtml = htmlTemplate
	.replace(/<ul class="toc">[\s\S]*?<\/ul>/, tocHtml)
	.replace(/<main class="content">[\s\S]*?<\/main>/, `<main class="content">${contentHtml}</main>`);

// Write the final HTML
fs.writeFileSync(path.join(__dirname, '../static/docs/USER_GUIDE.html'), finalHtml);

console.log('HTML conversion complete!');

