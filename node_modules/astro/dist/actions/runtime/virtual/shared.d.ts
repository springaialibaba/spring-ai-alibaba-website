import type { z } from 'zod';
import type { MaybePromise } from '../utils.js';
type ActionErrorCode = 'BAD_REQUEST' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND' | 'TIMEOUT' | 'CONFLICT' | 'PRECONDITION_FAILED' | 'PAYLOAD_TOO_LARGE' | 'UNSUPPORTED_MEDIA_TYPE' | 'UNPROCESSABLE_CONTENT' | 'TOO_MANY_REQUESTS' | 'CLIENT_CLOSED_REQUEST' | 'INTERNAL_SERVER_ERROR';
export type ErrorInferenceObject = Record<string, any>;
export declare class ActionError<T extends ErrorInferenceObject = ErrorInferenceObject> extends Error {
    type: string;
    code: ActionErrorCode;
    status: number;
    constructor(params: {
        message?: string;
        code: ActionErrorCode;
        stack?: string;
    });
    static codeToStatus(code: ActionErrorCode): number;
    static statusToCode(status: number): ActionErrorCode;
    static fromResponse(res: Response): Promise<ActionError<ErrorInferenceObject>>;
}
export declare function isInputError<T extends ErrorInferenceObject>(error?: ActionError<T>): error is ActionInputError<T>;
export type SafeResult<TInput extends ErrorInferenceObject, TOutput> = {
    data: TOutput;
    error: undefined;
} | {
    data: undefined;
    error: ActionError<TInput>;
};
export declare class ActionInputError<T extends ErrorInferenceObject> extends ActionError {
    type: string;
    issues: z.ZodIssue[];
    fields: z.ZodError<T>['formErrors']['fieldErrors'];
    constructor(issues: z.ZodIssue[]);
}
export declare function callSafely<TOutput>(handler: () => MaybePromise<TOutput>): Promise<SafeResult<z.ZodType, TOutput>>;
export declare function getActionProps<T extends (args: FormData) => MaybePromise<unknown>>(action: T): {
    readonly type: "hidden";
    readonly name: "_astroAction";
    readonly value: string;
};
export {};
