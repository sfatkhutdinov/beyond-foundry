import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function fixImports(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            fixImports(filePath);
        } else if (file.endsWith('.js')) {
            let content = fs.readFileSync(filePath, 'utf8');
            
            // Fix relative imports to include .js extension
            // Match: from './module' or from "./module"
            content = content.replace(
                /from\s+['"`](\.\/[^'"`\s]+)['"`]/g,
                (match, importPath) => {
                    if (!importPath.endsWith('.js') && !importPath.includes('.', 2)) {
                        return match.replace(importPath, importPath + '.js');
                    }
                    return match;
                }
            );
            
            // Match: import ... from './module'
            content = content.replace(
                /import\s+[^'"`]+\s+from\s+['"`](\.\/[^'"`\s]+)['"`]/g,
                (match, importPath) => {
                    if (!importPath.endsWith('.js') && !importPath.includes('.', 2)) {
                        return match.replace(importPath, importPath + '.js');
                    }
                    return match;
                }
            );
            
            fs.writeFileSync(filePath, content);
            console.log(`Fixed imports in: ${filePath}`);
        }
    }
}

const distDir = path.join(__dirname, 'dist');
if (fs.existsSync(distDir)) {
    fixImports(distDir);
    console.log('Fixed import extensions in compiled files');
}
