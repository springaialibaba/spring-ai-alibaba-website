import type { AstroIntegration } from 'astro';
type NamedImportConfig = string | [from: string, as: string];
type ImportsConfig = (string | Record<string, string | NamedImportConfig[]>)[];
interface AutoImportConfig {
    imports: ImportsConfig;
}
export default function AutoImport(integrationConfig: AutoImportConfig): AstroIntegration;
export {};
