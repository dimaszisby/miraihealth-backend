// scripts/generate-documentation.ts

import * as fs from 'fs';
import * as path from 'path';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.join(__dirname, '../src');
const typesDir = path.join(__dirname, '../src/types');
const outputDir = path.join(__dirname, '../documents');
const outputFile = path.join(outputDir, 'backend-documentation.md');
async function generateDocumentation() {
  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  let documentation = '# Backend Documentation\n\n';

  // Function to process each type file
  async function processTypeFile(filePath: string) {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const fileName = path.basename(filePath);
    documentation += `## ${fileName}\n\n`;
    // Extract description from the file content
    const descriptionMatch = fileContent.match(/\*\*\n \* @description (.*)\n \*/);
    const description = descriptionMatch ? descriptionMatch[1] : 'No description provided.';
    documentation += `### Description\n\n${description}\n\n`;

    // Extract fields from the file content
    const fieldsMatch = fileContent.match(/\*\n \* @property {(.*)} (.*) - (.*)\n \*/g);
    if (fieldsMatch) {
      documentation += `### Fields\n\n`;
      documentation += `| Name | Type | Description |\n`;
      documentation += `|---|---|---|\n`;
      fieldsMatch.forEach(field => {
        const parts = field.match(/\*\n \* @property {(.*)} (.*) - (.*)\n \*/);
        if (parts && parts.length === 4) {
          const type = parts[1];
          const name = parts[2].trim();
          const description = parts[3];
          documentation += `| ${name} | ${type} | ${description} |\n`;
        }
      });
    }

    documentation += `### Example\n\n`;
    documentation += `\`\`\`json\n`;
    documentation += `{\n  // Example JSON for this data type\n}\n`;
    documentation += `\`\`\`\n\n`;

    documentation += `### Data Mapping\n\n`;
    documentation += `- **Input Data Type:**  \n`;
    documentation += `- **Output Data Type:**  \n`;
    documentation += `- **Mapping Description:**  \n\n`;

    documentation += '```typescript\n';
    documentation += fileContent;
    documentation += '\n```\n\n';
  }

  // Recursively read files from a directory
  async function readDirectory(dirPath: string) {
    const files = fs.readdirSync(dirPath);

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        await readDirectory(filePath); // Recursive call for directories
      } else if (stat.isFile() && file.endsWith('.ts')) {
        await processTypeFile(filePath); // Process .ts files
      }
    }
  }
await readDirectory(typesDir);


  fs.writeFileSync(outputFile, documentation);
  console.log(`Documentation generated at ${outputFile}`);
}

generateDocumentation().catch(console.error);