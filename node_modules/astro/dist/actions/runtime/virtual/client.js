export * from "./shared.js";
function defineAction() {
  throw new Error("[astro:action] `defineAction()` unexpectedly used on the client.");
}
function getApiContext() {
  throw new Error("[astro:action] `getApiContext()` unexpectedly used on the client.");
}
const z = new Proxy(
  {},
  {
    get() {
      throw new Error("[astro:action] `z` unexpectedly used on the client.");
    }
  }
);
export {
  defineAction,
  getApiContext,
  z
};
