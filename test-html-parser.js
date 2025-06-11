const fs = require('fs');
const { JSDOM } = require('jsdom');

// Read the DDBSpellHTMLParser TypeScript file and convert it to JavaScript for testing
const parserCode = `
class DDBSpellHTMLParser {
    static parseSpellFromHTML(htmlContent) {
        const dom = new JSDOM(htmlContent);
        const document = dom.window.document;
        
        // Extract spell ID from script tag or URL pattern
        const spellId = this.extractSpellId(document, htmlContent);
        
        // Parse basic spell information
        const name = this.parseSpellName(document);
        const level = this.parseSpellLevel(document);
        const school = this.parseSpellSchool(document);
        const castingTime = this.parseCastingTime(document);
        const range = this.parseRange(document);
        const components = this.parseComponents(document);
        const duration = this.parseDuration(document);
        const description = this.parseDescription(document);
        const higherLevel = this.parseHigherLevel(document);
        
        return {
            id: spellId,
            name,
            level,
            school,
            castingTime,
            range,
            components,
            duration,
            description,
            higherLevel,
            source: 'D&D Beyond HTML'
        };
    }
    
    static extractSpellId(document, htmlContent) {
        // Method 1: Look for spell ID in window.cobaltVcmList
        const cobaltMatch = htmlContent.match(/window\\.cobaltVcmList\\s*=\\s*\\[([^\\]]+)\\]/);
        if (cobaltMatch) {
            const cobaltContent = cobaltMatch[1];
            const idMatch = cobaltContent.match(/"spells\\/(\\d+)"/);
            if (idMatch) {
                return parseInt(idMatch[1]);
            }
        }
        
        // Method 2: Look for spell ID in URL patterns
        const urlMatch = htmlContent.match(/spells\\/(\\d+)/);
        if (urlMatch) {
            return parseInt(urlMatch[1]);
        }
        
        // Method 3: Look for data attributes
        const spellElement = document.querySelector('[data-spell-id]');
        if (spellElement) {
            return parseInt(spellElement.getAttribute('data-spell-id'));
        }
        
        return null;
    }
    
    static parseSpellName(document) {
        // Try multiple selectors for spell name
        const selectors = [
            '.ddb-statblock-spell .ddb-statblock-item-name',
            '.spell-name',
            'h1.page-title',
            '.ddbc-spell-name',
            'h1'
        ];
        
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim()) {
                return element.textContent.trim();
            }
        }
        
        return 'Unknown Spell';
    }
    
    static parseSpellLevel(document) {
        // Look for level in various formats
        const selectors = [
            '.ddb-statblock-spell .ddb-statblock-item-level',
            '.spell-level',
            '.ddbc-spell-level'
        ];
        
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                const text = element.textContent.trim();
                const match = text.match(/(\\d+)(st|nd|rd|th)?\\s*level/i);
                if (match) {
                    return parseInt(match[1]);
                }
                if (text.toLowerCase().includes('cantrip')) {
                    return 0;
                }
            }
        }
        
        // Look in the full text for level information
        const bodyText = document.body.textContent;
        const levelMatch = bodyText.match(/(\\d+)(st|nd|rd|th)?\\s*level/i);
        if (levelMatch) {
            return parseInt(levelMatch[1]);
        }
        
        if (bodyText.toLowerCase().includes('cantrip')) {
            return 0;
        }
        
        return null;
    }
    
    static parseSpellSchool(document) {
        const selectors = [
            '.ddb-statblock-spell .ddb-statblock-item-school',
            '.spell-school',
            '.ddbc-spell-school'
        ];
        
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim()) {
                return element.textContent.trim();
            }
        }
        
        // Look for school in spell subtitle or description
        const bodyText = document.body.textContent;
        const schools = ['Abjuration', 'Conjuration', 'Divination', 'Enchantment', 'Evocation', 'Illusion', 'Necromancy', 'Transmutation'];
        for (const school of schools) {
            if (bodyText.includes(school)) {
                return school.toLowerCase();
            }
        }
        
        return null;
    }
    
    static parseCastingTime(document) {
        const selectors = [
            '.ddb-statblock-spell .ddb-statblock-item-casting-time',
            '.spell-casting-time',
            '.ddbc-casting-time'
        ];
        
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim()) {
                return element.textContent.trim();
            }
        }
        
        return null;
    }
    
    static parseRange(document) {
        const selectors = [
            '.ddb-statblock-spell .ddb-statblock-item-range',
            '.spell-range',
            '.ddbc-range'
        ];
        
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim()) {
                return element.textContent.trim();
            }
        }
        
        return null;
    }
    
    static parseComponents(document) {
        const selectors = [
            '.ddb-statblock-spell .ddb-statblock-item-components',
            '.spell-components',
            '.ddbc-components'
        ];
        
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim()) {
                return element.textContent.trim();
            }
        }
        
        return null;
    }
    
    static parseDuration(document) {
        const selectors = [
            '.ddb-statblock-spell .ddb-statblock-item-duration',
            '.spell-duration',
            '.ddbc-duration'
        ];
        
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim()) {
                return element.textContent.trim();
            }
        }
        
        return null;
    }
    
    static parseDescription(document) {
        const selectors = [
            '.ddb-statblock-spell .ddb-statblock-item-description',
            '.spell-description',
            '.ddbc-spell-description',
            '.more-info-content'
        ];
        
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim()) {
                return element.textContent.trim();
            }
        }
        
        return null;
    }
    
    static parseHigherLevel(document) {
        const description = document.body.textContent;
        const higherLevelMatch = description.match(/At Higher Levels[.:]*\\s*([^\\n]+)/i);
        
        if (higherLevelMatch) {
            return higherLevelMatch[1].trim();
        }
        
        return null;
    }
}
`;

// Evaluate the parser code
eval(parserCode);

// Test the parser with the spell.html file
console.log('Testing DDBSpellHTMLParser with spell.html...');

try {
    const htmlContent = fs.readFileSync('spell.html', 'utf8');
    console.log('HTML file loaded successfully, size:', htmlContent.length, 'characters');
    
    const spellData = DDBSpellHTMLParser.parseSpellFromHTML(htmlContent);
    
    console.log('\\n=== PARSED SPELL DATA ===');
    console.log(JSON.stringify(spellData, null, 2));
    
    console.log('\\n=== SPELL SUMMARY ===');
    console.log(\`Name: \${spellData.name}\`);
    console.log(\`Level: \${spellData.level}\`);
    console.log(\`School: \${spellData.school}\`);
    console.log(\`Casting Time: \${spellData.castingTime}\`);
    console.log(\`Range: \${spellData.range}\`);
    console.log(\`Components: \${spellData.components}\`);
    console.log(\`Duration: \${spellData.duration}\`);
    console.log(\`ID: \${spellData.id}\`);
    
    if (spellData.description) {
        console.log(\`Description: \${spellData.description.substring(0, 200)}...\`);
    }
    
    if (spellData.higherLevel) {
        console.log(\`At Higher Levels: \${spellData.higherLevel}\`);
    }
    
} catch (error) {
    console.error('Error testing HTML parser:', error);
}
