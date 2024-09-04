/**
 * @param {string} selector
 *   Selector to parse.
 * @returns {AstSelector}
 *   Parsed selector.
 */
export function parse(selector: string): AstSelector;
export type AstSelector = import('css-selector-parser').AstSelector;
