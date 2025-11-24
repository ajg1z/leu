import { VElement, VNode } from "./h";

export function areNodesEqual(nodeOne: VNode, nodeTwo: VNode) {
  if (nodeOne.type !== nodeTwo.type) {
    return false;
  }

  if (nodeOne.type === "element" && nodeTwo.type === "element") {
    const { tag: tagOne, props: { key: keyOne } = {} } = nodeOne;
    const { tag: tagTwo, props: { key: keyTwo } = {} } = nodeTwo;

    return tagOne === tagTwo && keyOne === keyTwo;
  }

  if (nodeOne.type === "component" && nodeTwo.type === "component") {
    const { props: { key: keyOne } = {}, component: componentOne } = nodeOne;
    const { props: { key: keyTwo } = {}, component: componentTwo } = nodeTwo;

    return componentOne === componentTwo && keyOne === keyTwo;
  }

  return true;
}
