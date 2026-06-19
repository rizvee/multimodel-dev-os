export function parseFlowArray(str) {
  const contents = str.slice(1, -1).trim();
  if (!contents) return [];

  const result = [];
  const regex = /"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'|([^,\s][^,]*[^,\s]|[^,\s])/g;
  let match;
  while ((match = regex.exec(contents)) !== null) {
    if (match[1] !== undefined) {
      result.push(match[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\'));
    } else if (match[2] !== undefined) {
      result.push(match[2].replace(/\\'/g, "'").replace(/\\\\/g, '\\'));
    } else if (match[3] !== undefined) {
      let val = match[3].trim();
      if (val === 'true') val = true;
      else if (val === 'false') val = false;
      else if (val === 'null') val = null;
      else if (/^-?\d+$/.test(val)) val = parseInt(val, 10);
      result.push(val);
    }
  }
  return result;
}

export function parseYaml(content) {
  try {
    const root = {};
    const stack = [{ obj: root, indent: -1, key: null, isArray: false }];

    const lines = content.split(/\r?\n/);
    for (let line of lines) {
      // Find comment index outside quotes
      let commentIdx = -1;
      let insideDouble = false;
      let insideSingle = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' && (i === 0 || line[i-1] !== '\\')) {
          insideDouble = !insideDouble;
        } else if (char === "'" && (i === 0 || line[i-1] !== '\\')) {
          insideSingle = !insideSingle;
        } else if (char === '#' && !insideDouble && !insideSingle) {
          commentIdx = i;
          break;
        }
      }
      if (commentIdx !== -1) {
        line = line.substring(0, commentIdx);
      }
      line = line.trimEnd();
      if (!line.trim()) continue;

      const indent = line.match(/^ */)[0].length;
      let trimmed = line.trim();

      while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
        stack.pop();
      }

      const parent = stack[stack.length - 1];

      if (trimmed.startsWith('-')) {
        trimmed = trimmed.substring(1).trim();
        if (!Array.isArray(parent.obj)) {
          const grandparent = stack[stack.length - 2];
          if (grandparent) {
            grandparent.obj[parent.key] = [];
            parent.obj = grandparent.obj[parent.key];
          }
        }
        
        const colonIdx = trimmed.indexOf(':');
        if (colonIdx === -1) {
          let val = trimmed;
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.substring(1, val.length - 1);
          }
          if (val.startsWith('[') && val.endsWith(']')) {
            val = parseFlowArray(val);
          }
          parent.obj.push(val);
        } else {
          const key = trimmed.substring(0, colonIdx).trim();
          let val = trimmed.substring(colonIdx + 1).trim();
          let isQuoted = false;
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.substring(1, val.length - 1);
            isQuoted = true;
          }
          if (val.startsWith('[') && val.endsWith(']')) {
            val = parseFlowArray(val);
          } else if (!isQuoted) {
            if (val === 'true') val = true;
            else if (val === 'false') val = false;
            else if (val === 'null') val = null;
            else if (/^-?\d+$/.test(val)) val = parseInt(val, 10);
          }

          const newObj = { [key]: val };
          parent.obj.push(newObj);
          stack.push({ obj: newObj, indent: indent, key: key, isArray: false });
        }
      } else {
        const colonIdx = trimmed.indexOf(':');
        if (colonIdx === -1) continue;

        const key = trimmed.substring(0, colonIdx).trim();
        let val = trimmed.substring(colonIdx + 1).trim();
        let isQuoted = false;
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.substring(1, val.length - 1);
          isQuoted = true;
        }
        if (val.startsWith('[') && val.endsWith(']')) {
          val = parseFlowArray(val);
        } else if (!isQuoted) {
          if (val === 'true') val = true;
          else if (val === 'false') val = false;
          else if (val === 'null') val = null;
          else if (/^-?\d+$/.test(val)) val = parseInt(val, 10);
        }

        if (val === '') {
          parent.obj[key] = {};
          stack.push({ obj: parent.obj[key], indent: indent, key: key, isArray: false });
        } else {
          parent.obj[key] = val;
        }
      }
    }
    return root;
  } catch (e) {
    console.warn(`\x1b[33m[WARNING] Failed to parse YAML: ${e.message}\x1b[0m`);
    return {};
  }
}
