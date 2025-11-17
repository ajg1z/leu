// Public API for view module
// Экспортирует все публичные функции и типы для работы с DOM и VDOM

// Types
export type { VNode, VElement, VText, VFragment } from "./h";

// VDOM creation functions
export { h, hFragment, hString } from "./h";

// DOM manipulation functions
export { mountDom } from "./mount-dom";
export { patchDom } from "./patch-dom";
export { destroyDom } from "./destroy-dom";
