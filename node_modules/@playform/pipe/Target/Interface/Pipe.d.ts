/**
 * @module Pipe
 *
 */
export default interface Interface {
    /**
     *
     * The function Pipe takes a Plan and an Action object as input, and performs a series of
     * operations based on the plan, handling various callbacks and error handling along the way.
     *
     * @param  Plan
     *
     * @param  Action
     *
     */
    (Plan: Plan, Action: Action): Promise<Plan>;
}
import type Action from "../Interface/Action.js";
import type Plan from "../Interface/Plan.js";
