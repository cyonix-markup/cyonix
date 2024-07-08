let cy = {};

function escapeHtml(unsafe) {
    return unsafe.replace(/[&<"']/g, function (m) {
        switch (m) {
            case '&':
                return '&amp;';
            case '<':
                return '&lt;';
            case '>':
                return '&gt;';
            case '"':
                return '&quot;';
            default:
                return '&#039;';
        }
    });
}

function parseCY(cyMarkup) {
    cy.output = ''; // Initialize output variable
    const lines = cyMarkup.split('\n');
    let inList = false;
    let inCodeBlock = false;
    let inTable = false;
    let tableHeaders = [];

    for (let line of lines) {
        if (line.startsWith('## ')) {
            // Heading 2
            cy.output += `<h2>${escapeHtml(line.slice(3))}</h2>`;
        } else if (line.startsWith('# ')) {
            // Heading 1
            cy.output += `<h1>${escapeHtml(line.slice(2))}</h1>`;
        } else if (line.startsWith('### ')) {
            // Heading 3
            cy.output += `<h3>${escapeHtml(line.slice(4))}</h3>`;
        } else if (line.startsWith('* [ ] ') || line.startsWith('* [x] ')) {
            // Checkbox
            const isChecked = line.startsWith('* [x] ');
            const checkboxLabel = line.slice(6);
            cy.output += `<label><input type="checkbox" ${isChecked ? 'checked' : ''}> ${escapeHtml(checkboxLabel)}</label><br>`;
        } else if (line.startsWith('* ')) {
            // Unordered list item
            if (!inList) {
                cy.output += '<ul>';
                inList = true;
            }
            cy.output += `<li>${escapeHtml(line.slice(2))}</li>`;
        } else if (line.startsWith('1. ')) {
            // Ordered list item
            if (!inList) {
                cy.output += '<ol>';
                inList = true;
            }
            cy.output += `<li>${escapeHtml(line.slice(3))}</li>`;
        } else if (line.trim() === '') {
            // End of a paragraph or list
            if (inList) {
                if (cy.output.endsWith('</ul>') || cy.output.endsWith('</ol>')) {
                    cy.output += '</ul>'; // Close unordered list if open
                } else {
                    cy.output += '</ol>'; // Close ordered list if open
                }
                inList = false;
            }
            cy.output += '<br>';
        } else if (line.startsWith('>> ')) {
            // Blockquote
            cy.output += `<blockquote>${escapeHtml(line.slice(3))}</blockquote>`;
        } else if (line.startsWith('{')) {
            // Link
            const linkStartIndex = line.indexOf('{') + 1;
            const linkEndIndex = line.indexOf('}');
            const urlStartIndex = line.indexOf('(') + 1;
            const urlEndIndex = line.indexOf(')');
            const linkText = line.slice(linkStartIndex, linkEndIndex);
            const linkUrl = line.slice(urlStartIndex, urlEndIndex);
            cy.output += `<a href="${escapeHtml(linkUrl)}">${escapeHtml(linkText)}</a>`;
        } else if (line.startsWith('!')) {
            // Image
            const altStartIndex = line.indexOf('[') + 1;
            const altEndIndex = line.indexOf(']');
            const imageUrlStartIndex = line.indexOf('{') + 1;
            const imageUrlEndIndex = line.indexOf('}');
            const altText = line.slice(altStartIndex, altEndIndex);
            const imageUrl = line.slice(imageUrlStartIndex, imageUrlEndIndex);
            cy.output += `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(altText)}">`;
        } else if (line.startsWith('---')) {
            // Horizontal rule
            cy.output += '<hr>';
        } else if (line.startsWith('|')) {
            // Table row
            if (!inTable) {
                cy.output += '<table>';
                inTable = true;
            }
            line = line.replace(/\|/g, '');
            const cells = line.split('|');
            if (tableHeaders.length === 0) {
                cy.output += '<thead><tr>';
                for (let cell of cells) {
                    tableHeaders.push(cell.trim());
                    cy.output += `<th>${escapeHtml(cell.trim())}</th>`;
                }
                cy.output += '</tr></thead><tbody>';
            } else {
                cy.output += '<tr>';
                for (let i = 0; i < cells.length; i++) {
                    cy.output += `<td>${escapeHtml(cells[i].trim())}</td>`;
                }
                cy.output += '</tr>';
            }
        } else if (line.includes('``')) {
            // Inline code
            let parts = line.split('``');
            for (let i = 0; i < parts.length; i++) {
                if (i % 2 === 0) {
                    parts[i] = parts[i].replace(/<<([^<>]+)>>/g, '<strong>$1</strong>'); // Bold
                    parts[i] = parts[i].replace(/\[\[([^\[\]]+)\]\]/g, '<em>$1</em>'); // Italic
                    parts[i] = parts[i].replace(/\[([^\[\]]+)\]/g, '<kbd>$1</kbd>'); // Kbd
                    parts[i] = parts[i].replace(/~~([^~]+)~~/g, '<del>$1</del>'); // Strikethrough
                } else {
                    parts[i] = `<code>${parts[i]}</code>`;
                }
            }
            cy.output += parts.join('');
        } else {
            // Paragraph
            line = line.replace(/<<([^<>]+)>>/g, '<strong>$1</strong>'); // Bold
            line = line.replace(/\[\[([^\[\]]+)\]\]/g, '<em>$1</em>'); // Italic
            line = line.replace(/\[([^\[\]]+)\]/g, '<kbd>$1</kbd>'); // Kbd
            line = line.replace(/~~([^~]+)~~/g, '<del>$1</del>'); // Strikethrough
            cy.output += `<p>${line}</p>`;
        }
    }

    if (inList) {
        if (cy.output.endsWith('</ul>') || cy.output.endsWith('</ol>')) {
            cy.output += '</ul>'; // Close unordered list if open
        } else {
            cy.output += '</ol>'; // Close ordered list if open
        }
    }

    if (inTable) {
        cy.output += '</tbody></table>'; // Close table if open
    }

    return cy.output;
}

function renderCY() {
    const cyMarkup = document.getElementById('cy-input').value;
    const htmlOutput = parseCY(cyMarkup);
    document.getElementById('html-output').innerHTML = htmlOutput;
}
