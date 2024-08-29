/**
 * @param {AstAttribute} query
 *   Query.
 * @param {Element} element
 *   Element.
 * @param {Schema} schema
 *   Schema of element.
 * @returns {boolean}
 *   Whether `element` matches `query`.
 */
export function attribute(query: AstAttribute, element: Element, schema: Schema): boolean;
export type AstAttribute = import('css-selector-parser').AstAttribute;
export type Element = import('hast').Element;
export type Properties = import('hast').Properties;
export type Info = import('property-information').Info;
export type Schema = import('property-information').Schema;
