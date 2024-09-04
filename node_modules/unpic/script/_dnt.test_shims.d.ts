import { Deno } from "@deno/shim-deno-test";
export { Deno } from "@deno/shim-deno-test";
export declare const dntGlobalThis: Omit<typeof globalThis, "Deno"> & {
    Deno: typeof Deno;
};
