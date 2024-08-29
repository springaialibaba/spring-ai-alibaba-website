/**
 * Check whether an element has all class names.
 *
 * @param {AstClassName} query
 *   AST rule (with `classNames`).
 * @param {Element} element
 *   Element.
 * @returns {boolean}
 *   Whether `element` matches `query`.
 */
export function className(query: AstClassName, element: Element): boolean;
export type AstClassName = import('css-selector-parser').AstClassName;
export type Element = import('hast').Element;
