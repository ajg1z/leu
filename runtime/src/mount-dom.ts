import { setAttributes } from "./attributes";
import { addEventListeners } from "./events";
import { VElement, VFragment, VNode, VText } from "./h";

export function mountDom(vdom: VNode, container: HTMLElement, index?: number) {
  switch (vdom.type) {
    case "text":
      createTextNode(vdom, container, index);
      break;
    case "element":
      createElementNode(vdom, container, index);
      break;
    case "fragment":
      createFragmentsNodes(vdom, container, index);
      break;
    default:
      throw new Error(`Unknown node type ${vdom}`);
  }
}

function createFragmentsNodes(
  vdom: VFragment,
  container: HTMLElement,
  index?: number
) {
  const { children } = vdom;
  vdom.el = container;

  children.forEach((child, i) => {
    mountDom(child, container, index != null ? index + i : undefined);
  });
}

/**
 * Creates an element node and appends it to the container.
 * @param vdom - The element node to create.
 * @param container - The container to append the element node to.
 */
function createElementNode(
  vdom: VElement,
  container: HTMLElement,
  index?: number
) {
  const { tag, props, children } = vdom;

  const element = document.createElement(tag);

  addProps(element, props, vdom);
  vdom.el = element;
  children.forEach((child) => {
    mountDom(child as VNode, element);
  });
  insert(element, container, index);
}

/**
 * Adds the properties of an element.
 * @param element - The element to add the properties to.
 * @param props - The properties to add.
 * @param vdom - The virtual DOM element.
 */
function addProps(
  element: HTMLElement,
  props: Record<string, any>,
  vdom: VElement
) {
  const { on: events, ...attrs } = props;

  vdom.listeners = addEventListeners(events, element);
  setAttributes(element, attrs);
}

/**
 * Creates a text node and appends it to the container.
 * @param vdom - The text node to create.
 * @param container - The container to append the text node to.
 */
function createTextNode(vdom: VText, container: HTMLElement, index?: number) {
  const { value } = vdom;

  const textNode = document.createTextNode(value);
  vdom.el = textNode;
  insert(textNode, container, index);
}

function insert(node: Node, container: HTMLElement, index?: number) {
  if (typeof index !== "number") {
    container.append(node);
    return;
  }

  if (index < 0) {
    throw new Error("index is negative");
  }

  const children = container.childNodes;

  if (index >= children.length) {
    container.append(node);
  } else {
    container.insertBefore(node, children[index]);
  }
}
