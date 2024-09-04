/// <reference types="node" resolution-mode="require"/>
import { AsyncLocalStorage } from 'node:async_hooks';
import type { APIContext } from '../../@types/astro.js';
export type ActionAPIContext = Omit<APIContext, 'getActionResult' | 'props'>;
export declare const ApiContextStorage: AsyncLocalStorage<ActionAPIContext>;
export declare function getApiContext(): ActionAPIContext;
