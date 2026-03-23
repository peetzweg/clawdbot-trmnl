import { describe, expect, it } from 'vitest';
import { wrapContent } from '../wrapper.ts';

describe('wrapContent', () => {
  it('wraps HTML in TRMNL page structure', () => {
    const html = '<div class="layout"><span>Hello</span></div>';
    const result = wrapContent(html, {
      cssPath: '/tmp/plugins.css',
      jsPath: '/tmp/plugins.js',
      deviceClass: 'screen--og',
      bitDepth: '2bit',
    });

    expect(result).toContain('<!DOCTYPE html>');
    expect(result).toContain('<body class="trmnl">');
    expect(result).toContain('class="screen screen--og 2bit"');
    expect(result).toContain('class="view view--full"');
    expect(result).toContain(html);
    expect(result).toContain('file:///tmp/plugins.css');
    expect(result).toContain('file:///tmp/plugins.js');
  });

  it('includes the TRMNL body styles matching Terminus layout', () => {
    const result = wrapContent('<div></div>', {
      cssPath: '/tmp/p.css',
      jsPath: '/tmp/p.js',
      deviceClass: 'screen--og',
      bitDepth: '2bit',
    });

    expect(result).toContain('align-items: center');
    expect(result).toContain('display: flex');
    expect(result).toContain('flex-direction: column');
    expect(result).toContain('justify-content: center');
  });

  it('supports different device classes', () => {
    const result = wrapContent('<div></div>', {
      cssPath: '/tmp/p.css',
      jsPath: '/tmp/p.js',
      deviceClass: 'screen--v2',
      bitDepth: '4bit',
    });

    expect(result).toContain('class="screen screen--v2 4bit"');
  });
});
