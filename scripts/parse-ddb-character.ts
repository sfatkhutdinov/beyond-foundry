// Script to transform a raw DDB character JSON to FoundryVTT format using CharacterParser
import { CharacterParser } from '../src/parsers/character/CharacterParser';
import * as fs from 'fs';

async function main() {
  const inputPath = process.argv[2];
  const outputPath = process.argv[3];

  if (!inputPath || !outputPath) {
    console.error('Usage: ts-node scripts/parse-ddb-character.ts <input.json> <output.json>');
    process.exit(1);
  }

  const rawData = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  // Handle wrapped DDB response format
  const ddb = rawData.data ?? rawData;
  const foundry = await CharacterParser.parseCharacter(ddb);
  fs.writeFileSync(outputPath, JSON.stringify(foundry, null, 2));
  console.log('Done.');
}

main().catch(console.error);
