import { type PreactPluginOptions as VitePreactPluginOptions } from '@preact/preset-vite';
import type { AstroIntegration, ContainerRenderer } from 'astro';
export declare function getContainerRenderer(): ContainerRenderer;
export interface Options extends Pick<VitePreactPluginOptions, 'include' | 'exclude'> {
    compat?: boolean;
    devtools?: boolean;
}
export default function ({ include, exclude, compat, devtools }?: Options): AstroIntegration;
