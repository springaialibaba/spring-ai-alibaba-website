import { h } from 'preact';
type Props = {
    value: string;
    name?: string;
    hydrate?: boolean;
};
/**
 * Astro passes `children` as a string of HTML, so we need
 * a wrapper `div` to render that content as VNodes.
 *
 * As a bonus, we can signal to Preact that this subtree is
 * entirely static and will never change via `shouldComponentUpdate`.
 */
declare const StaticHtml: {
    ({ value, name, hydrate }: Props): import("preact").VNode<(import("preact").ClassAttributes<HTMLElement> & h.JSX.HTMLAttributes<EventTarget> & h.JSX.SVGAttributes<SVGElement>) | null> | null;
    /**
     * This tells Preact to opt-out of re-rendering this subtree,
     * In addition to being a performance optimization,
     * this also allows other frameworks to attach to `children`.
     *
     * See https://preactjs.com/guide/v8/external-dom-mutations
     */
    shouldComponentUpdate(): boolean;
};
export default StaticHtml;
