import type { RehypePlugin } from '@astrojs/markdown-remark';
import type { VFile } from 'vfile';
export declare const rehypeAnalyzeAstroMetadata: RehypePlugin;
export declare function getAstroMetadata(file: VFile): {
    hydratedComponents: import("@astrojs/compiler/types").HydratedComponent[];
    clientOnlyComponents: import("@astrojs/compiler/types").HydratedComponent[];
    scripts: import("@astrojs/compiler").HoistedScript[];
    containsHead: boolean;
    propagation: import("../@types/astro.js").PropagationHint;
    pageOptions: import("../vite-plugin-astro/types.js").PageOptions;
} | undefined;
