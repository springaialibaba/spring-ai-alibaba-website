/**
 * Test a rule.
 *
 * @param {AstRule} query
 *   AST rule (with `pseudoClasses`).
 * @param {Element} element
 *   Element.
 * @param {number | undefined} index
 *   Index of `element` in `parent`.
 * @param {Parents | undefined} parent
 *   Parent of `element`.
 * @param {State} state
 *   State.
 * @returns {boolean}
 *   Whether `element` matches `query`.
 */
export function test(query: AstRule, element: Element, index: number | undefined, parent: Parents | undefined, state: State): boolean;
export type AstRule = import('css-selector-parser').AstRule;
export type Element = import('hast').Element;
export type Parents = import('hast').Parents;
export type State = import('./index.js').State;
