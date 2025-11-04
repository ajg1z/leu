import { VElement, VNode } from "./h";

export function areNodesEqual(nodeOne: VNode, nodeTwo: VNode) {
  if (nodeOne.type !== nodeTwo.type) {
    return false;
  }

  if (nodeOne.type === "element" && nodeTwo.type === "element") {
    const { tag: tagOne } = nodeOne;
    const { tag: tagTwo } = nodeTwo;

    return tagOne === tagTwo;
  }

  return true;
}
