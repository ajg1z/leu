import { destroyDom } from "./destroy-dom";
import { VNode } from "./h";
import { mountDom } from "./mount-dom";
import { areNodesEqual } from "./nodes-equal";

function findIndexInParent(node: ChildNode, parent: HTMLElement) {
  const children = Array.from(parent.childNodes);
  return children.indexOf(node);
}

export function patchDom(
  oldVdom: VNode,
  newVdom: VNode,
  container: HTMLElement
): VNode {
  if (!areNodesEqual(oldVdom, newVdom)) {
    const index = findIndexInParent(oldVdom.el as ChildNode, container);
    destroyDom(oldVdom);
    mountDom(newVdom, container, index);

    return newVdom;
  }

  newVdom.el = oldVdom.el;

  switch (newVdom.type) {
    case "element":
      patchElement(newVdom);
      break;
    case "fragment":
      patchFragment(newVdom);
      break;
    case "text":
      patchText(newVdom);
  }
}
