import { describe, expect, it } from 'vitest';
import { createPayload, minifyHtml, validatePayload } from './validator.ts';

// ─── minifyHtml ──────────────────────────────────────────────────────

describe('minifyHtml', () => {
  it('strips leading and trailing whitespace', () => {
    expect(minifyHtml('  <div>hello</div>  ')).toBe('<div>hello</div>');
  });

  it('collapses whitespace between tags', () => {
    const input = '<div>  \n  <span>hi</span>  \n</div>';
    expect(minifyHtml(input)).toBe('<div><span>hi</span></div>');
  });

  it('collapses runs of whitespace to a single space', () => {
    const input = '<span>hello    world</span>';
    expect(minifyHtml(input)).toBe('<span>hello world</span>');
  });

  it('removes HTML comments', () => {
    const input = '<div><!-- this is a comment --><span>hi</span></div>';
    expect(minifyHtml(input)).toBe('<div><span>hi</span></div>');
  });

  it('removes multiline HTML comments', () => {
    const input = `<div>
      <!--
        multi
        line
        comment
      -->
      <span>hi</span>
    </div>`;
    expect(minifyHtml(input)).toBe('<div><span>hi</span></div>');
  });

  it('handles deeply indented TRMNL markup', () => {
    const input = `<div class="layout layout--col gap--space-between">
  <div class="item">
    <div class="content">
      <span class="value value--xlarge value--tnums">42</span>
      <span class="label">Answer</span>
    </div>
  </div>
</div>`;
    const expected =
      '<div class="layout layout--col gap--space-between">' +
      '<div class="item">' +
      '<div class="content">' +
      '<span class="value value--xlarge value--tnums">42</span>' +
      '<span class="label">Answer</span>' +
      '</div>' +
      '</div>' +
      '</div>';
    expect(minifyHtml(input)).toBe(expected);
  });

  it('handles real-world TRMNL payload with title_bar', () => {
    const input = `<div class="layout layout--col gap--space-between">
  <div class="item">
    <div class="content">
      <span class="value value--xlarge value--tnums">🦊</span>
      <span class="label">TRMNL skill updated!</span>
    </div>
  </div>
</div>
<div class="title_bar">
  <span class="title">Setup Complete</span>
  <span class="instance">18:52</span>
</div>
`;
    const result = minifyHtml(input);

    // No newlines remain
    expect(result).not.toContain('\n');

    // No leading indentation
    expect(result).not.toMatch(/^\s/);
    expect(result).not.toMatch(/\s$/);

    // Content is preserved
    expect(result).toContain('🦊');
    expect(result).toContain('TRMNL skill updated!');
    expect(result).toContain('Setup Complete');
    expect(result).toContain('18:52');

    // Tags are directly adjacent
    expect(result).toContain('</span></div>');
    expect(result).toContain('</div></div>');
    expect(result).toContain('</div><div class="title_bar">');
  });

  it('preserves text content with single spaces', () => {
    const input = '<span>Hello World</span>';
    expect(minifyHtml(input)).toBe('<span>Hello World</span>');
  });

  it('preserves attribute values with spaces', () => {
    const input = '<div class="layout layout--col gap--space-between">x</div>';
    expect(minifyHtml(input)).toBe(
      '<div class="layout layout--col gap--space-between">x</div>',
    );
  });

  it('handles empty string', () => {
    expect(minifyHtml('')).toBe('');
  });

  it('handles whitespace-only string', () => {
    expect(minifyHtml('   \n\n   ')).toBe('');
  });

  it('handles already-minified content', () => {
    const input = '<div><span>hi</span></div>';
    expect(minifyHtml(input)).toBe('<div><span>hi</span></div>');
  });

  it('handles tabs and mixed whitespace between tags', () => {
    const input = "<div>\n\t\t<span>hello</span>\n\t\t<span>world</span>\n</div>";
    expect(minifyHtml(input)).toBe('<div><span>hello</span><span>world</span></div>');
  });

  it('handles blank lines between sections', () => {
    const input = `<div class="layout">
  <div class="item">one</div>
  
  <div class="divider"></div>
  
  <div class="item">two</div>
</div>

<div class="title_bar">
  <span class="title">Test</span>
</div>
`;
    const result = minifyHtml(input);
    expect(result).not.toContain('\n');
    expect(result).toContain('</div><div class="divider">');
    expect(result).toContain('</div><div class="title_bar">');
  });

  it('produces smaller output than the input', () => {
    const input = `<div class="layout layout--col gap--space-between">
  <div class="item">
    <div class="content">
      <span class="value value--xxxlarge value--tnums">✨</span>
      <span class="label label--medium">New TRMNL CLI Skill</span>
    </div>
  </div>
  
  <div class="divider"></div>
  
  <div class="item">
    <div class="content">
      <span class="value value--large">🦊 Fuchsi</span>
      <span class="label">Now sending via trmnl CLI</span>
    </div>
  </div>
  
  <div class="divider"></div>
  
  <div class="columns">
    <div class="column">
      <span class="label label--small label--gray">Features</span>
      <span class="label">• Validation</span>
      <span class="label">• History tracking</span>
      <span class="label">• 5KB payload limit</span>
    </div>
  </div>
</div>

<div class="title_bar">
  <span class="title">Skill Updated</span>
  <span class="instance">Saturday 19:01</span>
</div>
`;
    const result = minifyHtml(input);
    expect(result.length).toBeLessThan(input.length);
    // Should save at least 10%
    expect(result.length).toBeLessThan(input.length * 0.9);
  });
});

// ─── createPayload ───────────────────────────────────────────────────

describe('createPayload', () => {
  describe('with raw HTML input', () => {
    it('wraps HTML in merge_variables.content', () => {
      const payload = createPayload('<div>hello</div>');
      expect(payload.merge_variables.content).toBe('<div>hello</div>');
    });

    it('minifies HTML by default', () => {
      const html = `<div class="layout">
  <span>hello</span>
</div>`;
      const payload = createPayload(html);
      expect(payload.merge_variables.content).toBe(
        '<div class="layout"><span>hello</span></div>',
      );
    });

    it('skips minification when minify is false', () => {
      const html = `<div class="layout">
  <span>hello</span>
</div>`;
      const payload = createPayload(html, { minify: false });
      expect(payload.merge_variables.content).toBe(html);
    });
  });

  describe('with JSON input containing merge_variables', () => {
    it('parses JSON and preserves structure', () => {
      const json = JSON.stringify({
        merge_variables: {
          content: '<div>  <span>hi</span>  </div>',
          title: 'Test',
        },
      });
      const payload = createPayload(json);
      expect(payload.merge_variables.content).toBe(
        '<div><span>hi</span></div>',
      );
      expect(payload.merge_variables.title).toBe('Test');
    });

    it('minifies HTML fields in merge_variables', () => {
      const json = JSON.stringify({
        merge_variables: {
          content: '<div>\n  <span>hi</span>\n</div>',
        },
      });
      const payload = createPayload(json);
      expect(payload.merge_variables.content).toBe(
        '<div><span>hi</span></div>',
      );
    });

    it('does not minify non-HTML string values', () => {
      const json = JSON.stringify({
        merge_variables: {
          content: '<div>  <span>hi</span>  </div>',
          title: 'My   Title   With   Spaces',
        },
      });
      const payload = createPayload(json);
      // title has no angle brackets, so it's left as-is
      expect(payload.merge_variables.title).toBe('My   Title   With   Spaces');
    });

    it('skips minification when minify is false', () => {
      const rawContent = '<div>\n  <span>hi</span>\n</div>';
      const json = JSON.stringify({
        merge_variables: { content: rawContent },
      });
      const payload = createPayload(json, { minify: false });
      expect(payload.merge_variables.content).toBe(rawContent);
    });
  });

  describe('with JSON input without merge_variables wrapper', () => {
    it('wraps bare object in merge_variables', () => {
      const json = JSON.stringify({
        content: '<div>  <span>hi</span>  </div>',
      });
      const payload = createPayload(json);
      expect(payload.merge_variables.content).toBe(
        '<div><span>hi</span></div>',
      );
    });
  });

  describe('payload size reduction', () => {
    it('produces a smaller JSON payload after minification', () => {
      const html = `<div class="layout layout--col gap--space-between">
  <div class="item">
    <div class="content">
      <span class="value value--xlarge value--tnums">🦊</span>
      <span class="label">TRMNL skill updated!</span>
    </div>
  </div>
</div>
<div class="title_bar">
  <span class="title">Setup Complete</span>
  <span class="instance">18:52</span>
</div>
`;
      const minified = createPayload(html);
      const unminified = createPayload(html, { minify: false });

      const minifiedSize = new TextEncoder().encode(
        JSON.stringify(minified),
      ).length;
      const unminifiedSize = new TextEncoder().encode(
        JSON.stringify(unminified),
      ).length;

      expect(minifiedSize).toBeLessThan(unminifiedSize);
    });
  });
});

// ─── validatePayload (minified content still validates) ──────────────

describe('validatePayload with minified content', () => {
  it('validates minified TRMNL layout correctly', () => {
    const payload = createPayload(`<div class="layout layout--col">
  <div class="item">
    <span class="value">Test</span>
  </div>
</div>
<div class="title_bar">
  <span class="title">Title</span>
</div>`);

    const result = validatePayload(payload);
    expect(result.valid).toBe(true);
    expect(result.warnings).toEqual([]);
    expect(result.errors).toEqual([]);
  });

  it('still detects missing layout class in minified content', () => {
    const payload = createPayload('<div class="container"><span>hi</span></div>');
    const result = validatePayload(payload);
    expect(result.warnings).toContainEqual(
      expect.stringContaining('Missing .layout class'),
    );
  });

  it('still detects mismatched divs in minified content', () => {
    const payload = createPayload(
      '<div class="layout"><div><span>hi</span></div>',
    );
    const result = validatePayload(payload);
    expect(result.warnings).toContainEqual(
      expect.stringContaining('unclosed divs'),
    );
  });

  it('reports smaller byte count for minified payload', () => {
    const html = `<div class="layout layout--col gap--space-between">
  <div class="item">
    <div class="content">
      <span class="value">Hello</span>
    </div>
  </div>
</div>`;

    const minifiedPayload = createPayload(html);
    const rawPayload = createPayload(html, { minify: false });

    const minResult = validatePayload(minifiedPayload);
    const rawResult = validatePayload(rawPayload);

    expect(minResult.size_bytes).toBeLessThan(rawResult.size_bytes);
  });
});
