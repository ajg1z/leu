import { VElement, VFragment, VNode, VText } from "./h";
import { removeEventListeners } from "./events";

export function destroyDom(vdom: VNode) {
  switch (vdom.type) {
    case "text":
      removeTextNode(vdom);
      break;
    case "element":
      removeElementNode(vdom);
      break;
    case "fragment":
      removeFragmentsNodes(vdom);
      break;
    default:
      throw new Error(`Unknown node type`);
  }

  delete vdom.el;
}

function removeTextNode(vdom: VText) {
  vdom.el?.remove();
}

function removeElementNode(vdom: VElement) {
  const { children, listeners, el } = vdom;

  children.forEach((child) => destroyDom(child as VNode));

  if (listeners) {
    removeEventListeners(listeners, el);
    delete vdom.listeners;
  }

  el?.remove();
}

function removeFragmentsNodes(vdom: VFragment) {
  const { children } = vdom;
  children.forEach(destroyDom);
}
