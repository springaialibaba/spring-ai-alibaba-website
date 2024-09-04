import { z } from 'zod';
import { type ActionAPIContext, getApiContext as _getApiContext } from '../store.js';
import { type MaybePromise } from '../utils.js';
import { type ErrorInferenceObject, type SafeResult } from './shared.js';
export * from './shared.js';
export { z } from 'zod';
/** @deprecated Access context from the second `handler()` parameter. */
export declare const getApiContext: typeof _getApiContext;
export type Accept = 'form' | 'json';
export type InputSchema<T extends Accept> = T extends 'form' ? z.AnyZodObject | z.ZodType<FormData> : z.ZodType;
type Handler<TInputSchema, TOutput> = TInputSchema extends z.ZodType ? (input: z.infer<TInputSchema>, context: ActionAPIContext) => MaybePromise<TOutput> : (input: any, context: ActionAPIContext) => MaybePromise<TOutput>;
export type ActionClient<TOutput, TAccept extends Accept, TInputSchema extends InputSchema<TAccept> | undefined> = TInputSchema extends z.ZodType ? ((input: TAccept extends 'form' ? FormData : z.input<TInputSchema>) => Promise<Awaited<TOutput>>) & {
    safe: (input: TAccept extends 'form' ? FormData : z.input<TInputSchema>) => Promise<SafeResult<z.input<TInputSchema> extends ErrorInferenceObject ? z.input<TInputSchema> : ErrorInferenceObject, Awaited<TOutput>>>;
} : ((input?: any) => Promise<Awaited<TOutput>>) & {
    safe: (input?: any) => Promise<SafeResult<never, Awaited<TOutput>>>;
};
export declare function defineAction<TOutput, TAccept extends Accept = 'json', TInputSchema extends InputSchema<Accept> | undefined = TAccept extends 'form' ? z.ZodType<FormData> : undefined>({ accept, input: inputSchema, handler, }: {
    input?: TInputSchema;
    accept?: TAccept;
    handler: Handler<TInputSchema, TOutput>;
}): ActionClient<TOutput, TAccept, TInputSchema>;
/** Transform form data to an object based on a Zod schema. */
export declare function formDataToObject<T extends z.AnyZodObject>(formData: FormData, schema: T): Record<string, unknown>;
