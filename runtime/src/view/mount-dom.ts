import { ComponentBase } from "../component";
import { enqueueJob } from "../scheduler";
import { extractPropsAndEvents } from "../utils/props";
import { setAttributes } from "./attributes";
import { addEventListeners } from "./events";
import { VComponent, VElement, VFragment, VNode, VText } from "./h";

export function mountDom(
  vdom: VNode,
  container: HTMLElement,
  options?: { index?: number; thisObject?: unknown }
) {
  switch (vdom.type) {
    case "text":
      createTextNode(vdom, container, options);
      break;
    case "element":
      createElementNode(vdom, container, options);
      break;
    case "fragment":
      createFragmentsNodes(vdom, container, options);
      break;
    case "component":
      createComponentNode(vdom, container, options);
      enqueueJob(() => {
        vdom.instance?.onMounted();
      });
      break;
    default:
      throw new Error(`Unknown node type ${vdom}`);
  }
}

/**
 * Проверяет, является ли значение классом (конструктором).
 * @param value - Значение для проверки.
 * @returns true, если значение является классом.
 */
function isClass(value: unknown): value is new (...args: any[]) => any {
  if (typeof value !== "function") {
    return false;
  }

  // Проверка строкового представления - классы начинаются с "class"
  const stringRepresentation = Function.prototype.toString.call(value);
  if (stringRepresentation.startsWith("class")) {
    return true;
  }

  // Проверка, что это функция-конструктор (не стрелочная функция)
  // Стрелочные функции не имеют prototype
  if (!value.prototype) {
    return false;
  }

  // Проверка, что это не обычная функция (обычные функции могут иметь prototype,
  // но классы имеют prototype.constructor, который равен самой функции)
  return value.prototype.constructor === value;
}

function createComponentNode(
  vdom: VComponent,
  container: HTMLElement,
  options?: { index?: number; thisObject?: unknown }
) {
  const { index } = options ?? {};
  const { component } = vdom;

  if (!isClass(component)) {
    throw new Error("component is not a class");
  }

  const { props, events } = extractPropsAndEvents(vdom);

  const instance = new component(
    props,
    events,
    options?.thisObject as ComponentBase<any, any> | null
  );

  instance.mount(container, index);
  vdom.el = instance.firstElement as HTMLElement;

  vdom.instance = instance;
  vdom.component = component;
  vdom.props = instance.props;
}

function createFragmentsNodes(
  vdom: VFragment,
  container: HTMLElement,
  options?: { index?: number; thisObject?: unknown }
) {
  const { index } = options ?? {};

  const { children } = vdom;
  vdom.el = container;

  children.forEach((child, i) => {
    mountDom(child, container, {
      index: index != null ? index + i : undefined,
      thisObject: options?.thisObject,
    });
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
  options?: { index?: number; thisObject?: unknown }
) {
  const { index } = options ?? {};

  const { tag, children } = vdom;

  const element = document.createElement(tag);

  addProps(element, vdom, options);
  vdom.el = element;
  children.forEach((child) => {
    mountDom(child as VNode, element, { thisObject: options?.thisObject });
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
  vdom: VElement,
  options?: { thisObject?: unknown }
) {
  const { props, events } = extractPropsAndEvents(vdom);

  vdom.listeners = addEventListeners(events, element, options);
  setAttributes(element, props);
}

/**
 * Creates a text node and appends it to the container.
 * @param vdom - The text node to create.
 * @param container - The container to append the text node to.
 */
function createTextNode(
  vdom: VText,
  container: HTMLElement,
  options?: { index?: number; thisObject?: unknown }
) {
  const { index } = options ?? {};

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
