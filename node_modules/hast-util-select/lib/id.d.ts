/**
 * Check whether an element has an ID.
 *
 * @param {AstId} query
 *   AST rule (with `ids`).
 * @param {Element} element
 *   Element.
 * @returns {boolean}
 *   Whether `element` matches `query`.
 */
export function id(query: AstId, element: Element): boolean;
export type AstId = import('css-selector-parser').AstId;
export type Element = import('hast').Element;
