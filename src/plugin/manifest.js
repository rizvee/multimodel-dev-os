export function validatePluginManifest(manifestObj) {
  const errors = [];

  const reqKeys = ['name', 'slug', 'version', 'description', 'author'];
  reqKeys.forEach(k => {
    if (manifestObj[k] === undefined || manifestObj[k] === null) {
      errors.push(`Missing required key: ${k}`);
    } else if (typeof manifestObj[k] !== 'string') {
      errors.push(`Key '${k}' must be a string`);
    } else if (k === 'slug') {
      if (!/^[a-z0-9-_]+$/i.test(manifestObj[k])) {
        errors.push(`Key 'slug' must be alphanumeric with dashes or underscores only`);
      }
    }
  });

  if (manifestObj.allowed_file_patterns !== undefined) {
    if (!Array.isArray(manifestObj.allowed_file_patterns)) {
      errors.push(`allowed_file_patterns must be an array`);
    } else {
      manifestObj.allowed_file_patterns.forEach(pat => {
        if (typeof pat !== 'string') {
          errors.push(`allowed_file_patterns item must be a string: ${pat}`);
          return;
        }
        const normPattern = pat.replace(/\\/g, '/').trim();
        const isSafeSubdir = [
          '.ai/plugins/',
          '.ai/registries/',
          '.ai/templates/',
          '.ai/skills/',
          '.ai/checks/',
          '.ai/prompts/',
          '.ai/adapters/',
          'adapters/'
        ].some(prefix => normPattern.startsWith(prefix));

        const hasTraversal = normPattern.includes('..') || normPattern.startsWith('/');
        const isBlacklisted = [
          '.env',
          '.npmrc',
          '.git/',
          'node_modules/',
          'package.json',
          'package-lock.json'
        ].some(black => normPattern.includes(black));

        if (!isSafeSubdir || hasTraversal || isBlacklisted) {
          errors.push(`File pattern '${pat}' violates safety boundaries`);
        }
      });
    }
  }

  if (manifestObj.denied_file_patterns !== undefined) {
    if (!Array.isArray(manifestObj.denied_file_patterns)) {
      errors.push(`denied_file_patterns must be an array`);
    } else {
      manifestObj.denied_file_patterns.forEach(pat => {
        if (typeof pat !== 'string') {
          errors.push(`denied_file_patterns item must be a string: ${pat}`);
        }
      });
    }
  }

  if (manifestObj.workflows !== undefined) {
    if (typeof manifestObj.workflows !== 'object' || Array.isArray(manifestObj.workflows)) {
      errors.push(`workflows must be an object`);
    }
  }

  if (manifestObj.templates !== undefined) {
    if (typeof manifestObj.templates !== 'object' || Array.isArray(manifestObj.templates)) {
      errors.push(`templates must be an object`);
    }
  }

  if (manifestObj.adapters !== undefined) {
    if (typeof manifestObj.adapters !== 'object' || Array.isArray(manifestObj.adapters)) {
      errors.push(`adapters must be an object`);
    }
  }

  if (manifestObj.safety_notes !== undefined) {
    if (typeof manifestObj.safety_notes !== 'string') {
      errors.push(`safety_notes must be a string`);
    }
  }

  return {
    success: errors.length === 0,
    errors
  };
}
