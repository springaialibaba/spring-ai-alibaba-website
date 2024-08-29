export interface Options {
    /**
     * @default "__tla"
     */
    promiseExportName?: string;
    /**
     * @default i => `__tla_${i}`
     */
    promiseImportName?: (i: number) => string;
}
export declare const DEFAULT_OPTIONS: Options;
