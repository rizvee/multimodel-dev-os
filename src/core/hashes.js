import { createHash } from 'crypto';
import { readFileSync } from 'fs';

export function computeSHA256(content) {
  return createHash('sha256').update(content, 'utf8').digest('hex');
}

export function hashFile(filePath) {
  try {
    const data = readFileSync(filePath);
    return createHash('sha256').update(data).digest('hex');
  } catch (e) {
    return '';
  }
}
