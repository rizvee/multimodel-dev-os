import { describe, it, expect } from 'vitest';
import { parseYaml, parseFlowArray } from '../../src/core/yaml.js';

describe('YAML Parser', () => {
  describe('parseFlowArray', () => {
    it('should parse standard flow arrays', () => {
      expect(parseFlowArray('[a, b, c]')).toEqual(['a', 'b', 'c']);
      expect(parseFlowArray('["a", \'b\', c]')).toEqual(['a', 'b', 'c']);
      expect(parseFlowArray('[true, false, null, 123, -45]')).toEqual([true, false, null, 123, -45]);
    });

    it('should handle empty flow array', () => {
      expect(parseFlowArray('[]')).toEqual([]);
    });
  });

  describe('parseYaml', () => {
    it('should parse basic key-value pairs', () => {
      const yaml = `
        name: test-plugin
        version: "1.0.0"
        enabled: true
        count: 42
      `;
      const result = parseYaml(yaml);
      expect(result).toEqual({
        name: 'test-plugin',
        version: '1.0.0',
        enabled: true,
        count: 42
      });
    });

    it('should ignore comments', () => {
      const yaml = `
        # This is a comment
        name: test-plugin # trailing comment
        version: '1.0.0'
      `;
      const result = parseYaml(yaml);
      expect(result).toEqual({
        name: 'test-plugin',
        version: '1.0.0'
      });
    });

    it('should not treat comments inside quoted strings as comments', () => {
      const yaml = `
        name: "test # plugin"
        description: 'simple # description'
      `;
      const result = parseYaml(yaml);
      expect(result).toEqual({
        name: 'test # plugin',
        description: 'simple # description'
      });
    });

    it('should parse nested objects', () => {
      const yaml = `
        meta:
          name: test
          slug: test-slug
      `;
      const result = parseYaml(yaml);
      expect(result).toEqual({
        meta: {
          name: 'test',
          slug: 'test-slug'
        }
      });
    });

    it('should parse list arrays', () => {
      const yaml = `
        items:
          - one
          - "two"
          - three
      `;
      const result = parseYaml(yaml);
      expect(result).toEqual({
        items: ['one', 'two', 'three']
      });
    });

    it('should return empty object on malformed YAML', () => {
      const result = parseYaml(null);
      expect(result).toEqual({});
    });
  });
});
