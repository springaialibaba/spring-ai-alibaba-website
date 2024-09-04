import * as SWC from "@swc/core";
export interface ModuleInfo {
    imported: string[];
    importedBy: string[];
    withTopLevelAwait: boolean;
    transformNeeded: boolean;
}
export type BundleInfo = Record<string, ModuleInfo>;
export declare function parseBundleAsts(bundleChunks: Record<string, string>): Promise<Record<string, SWC.Module>>;
export declare function parseBundleInfo(bundleAsts: Record<string, SWC.Module>): Promise<BundleInfo>;
