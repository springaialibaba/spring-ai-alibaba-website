import { parse as parseJs } from 'acorn';
import { parse, resolve } from 'node:path';
const resolveModulePath = (path) => {
    // Resolve relative paths
    if (path.startsWith('.'))
        return resolve(path);
    // Don’t resolve other paths (e.g. npm modules)
    return path;
};
/**
 * Use a filename to generate a default import name.
 * @example
 * getDefaultImportName('/path/to/cool-component.astro');
 * // => coolcomponent
 */
function getDefaultImportName(path) {
    return parse(path).name.replaceAll(/[^\w\d]/g, '');
}
/**
 * Create an import statement.
 * @param imported Stuff to import (e.g. `Thing` or `{ Named }`)
 * @param module Module to import from (e.g. `module-thing`)
 */
function formatImport(imported, module) {
    return `import ${imported} from ${JSON.stringify(module)};`;
}
/** Get the parts for a named import statement from config. */
function formatNamedImports(namedImport) {
    const imports = [];
    for (const imp of namedImport) {
        if (typeof imp === 'string') {
            imports.push(imp);
        }
        else {
            const [from, as] = imp;
            imports.push(`${from} as ${as}`);
        }
    }
    return `{ ${imports.join(', ')} }`;
}
/** Generate imports from a full imports config array. */
function processImportsConfig(config) {
    const imports = [];
    for (const option of config) {
        if (typeof option === 'string') {
            imports.push(formatImport(getDefaultImportName(option), resolveModulePath(option)));
        }
        else {
            for (const path in option) {
                const namedImportsOrNamespace = option[path];
                if (typeof namedImportsOrNamespace === 'string') {
                    imports.push(formatImport(`* as ${namedImportsOrNamespace}`, resolveModulePath(path)));
                }
                else {
                    const importString = formatNamedImports(namedImportsOrNamespace);
                    imports.push(formatImport(importString, resolveModulePath(path)));
                }
            }
        }
    }
    return imports;
}
/** Get an MDX node representing a block of imports based on user config. */
function generateImportsNode(config) {
    const imports = processImportsConfig(config);
    const js = imports.join('\n');
    return {
        type: 'mdxjsEsm',
        value: '',
        data: {
            estree: {
                body: [],
                ...parseJs(js, { ecmaVersion: 'latest', sourceType: 'module' }),
                type: 'Program',
                sourceType: 'module',
            },
        },
    };
}
export default function AutoImport(integrationConfig) {
    return {
        name: 'auto-import',
        hooks: {
            'astro:config:setup': ({ config, updateConfig }) => {
                // Check MDX integration is initialized after auto-import.
                const mdxIndex = config.integrations.findIndex((i) => i.name === '@astrojs/mdx');
                const thisIndex = config.integrations.findIndex((i) => i.name === 'auto-import');
                if (mdxIndex >= 0 && mdxIndex < thisIndex) {
                    console.warn('[auto-import] ⚠️ @astrojs/mdx initialized BEFORE astro-auto-import.\n' +
                        '              Auto imports in .mdx files won’t work!\n' +
                        '              Move the MDX integration after auto-import in your integrations array in astro.config.');
                }
                // Skip adding MDX plug-in if MDX is not being used.
                if (mdxIndex === -1)
                    return;
                // Add a remark plugin to inject imports into `.mdx`.
                const importsNode = generateImportsNode(integrationConfig.imports);
                updateConfig({
                    markdown: {
                        remarkPlugins: [
                            function rehypeInjectMdxImports() {
                                return function injectMdxImports(tree, vfile) {
                                    if (!vfile.basename?.endsWith('.md')) {
                                        tree.children.unshift(importsNode);
                                    }
                                };
                            },
                        ],
                    },
                });
            },
        },
    };
}
