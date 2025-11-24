import {
  setAttribute,
  removeAttribute,
  removeStyle,
  setStyle,
} from "./attributes";
import { destroyDom } from "./destroy-dom";
import { addEventListener } from "./events";
import { extractChildren, VComponent, VElement, VNode, VText } from "./h";
import { mountDom } from "./mount-dom";
import { areNodesEqual } from "./nodes-equal";
import { arrayDiffSequence, arraysDiff } from "../utils/arrays";
import { objectsDiff } from "../utils/objects";
import { isNotBlankOrEmptyString } from "../utils/string";
import { extractPropsAndEvents } from "../utils/props";

function findIndexInParent(node: ChildNode, parent: HTMLElement) {
  const children = Array.from(parent.childNodes);
  return children.indexOf(node);
}

function patchText(oldVdom: VText, newVdom: VText) {
  const el = newVdom.el!;

  const { value: oldText } = oldVdom;
  const { value: newText } = newVdom;

  if (oldText !== newText) {
    el.nodeValue = newText;
  }
}

function patchAttrs(
  el: HTMLElement,
  oldAttrs: Record<string, any>,
  newAttrs: Record<string, any>
) {
  const { added, changed, removed } = objectsDiff(oldAttrs, newAttrs);

  for (const attr of added.concat(changed)) {
    setAttribute(el, attr, newAttrs[attr]);
  }

  for (const attr of removed) {
    removeAttribute(el, attr);
  }
}

function toClassList(className: string | string[] = "") {
  return Array.isArray(className)
    ? className.filter(isNotBlankOrEmptyString)
    : className.split(" ").filter(isNotBlankOrEmptyString) ?? [];
}

function patchClasses(
  el: HTMLElement,
  oldClass: string | string[],
  newClass: string | string[]
) {
  const oldClasses = toClassList(oldClass);
  const newClasses = toClassList(newClass);

  const { added, removed } = arraysDiff(oldClasses, newClasses);

  for (const classItem of added) {
    el.classList.add(classItem);
  }

  for (const classItem of removed) {
    el.classList.remove(classItem);
  }
}

function patchStyles(
  el: HTMLElement,
  oldStyle: Record<string, any>,
  newStyle: Record<string, any>
) {
  const { added, changed, removed } = objectsDiff(oldStyle, newStyle);

  for (const styleKey of changed.concat(added)) {
    setStyle(el, styleKey as keyof HTMLElement["style"], newStyle[styleKey]);
  }

  for (const style of removed) {
    removeStyle(el, style as keyof HTMLElement["style"]);
  }
}

function patchEvents(
  el: HTMLElement,
  oldListeners: Record<string, (event: Event) => void> | undefined,
  oldEvents: Record<string, any>,
  newEvents: Record<string, any>,
  thisObject?: unknown
) {
  const { added, changed, removed } = objectsDiff(oldEvents, newEvents);

  // Удаляем старые listeners для удаленных и измененных событий
  for (const event of removed.concat(changed)) {
    if (oldListeners?.[event]) {
      el.removeEventListener(event, oldListeners[event]);
    }
  }

  // Сохраняем неизмененные listeners
  const updatedListeners: Record<string, (event: Event) => void> = {};
  if (oldListeners) {
    for (const [event, listener] of Object.entries(oldListeners)) {
      if (!removed.includes(event) && !changed.includes(event)) {
        updatedListeners[event] = listener;
      }
    }
  }

  // Добавляем новые и измененные listeners
  for (const event of added.concat(changed)) {
    const listener = addEventListener(event, newEvents[event], el, thisObject);
    updatedListeners[event] = listener;
  }

  return updatedListeners;
}

function patchElement(
  oldVdom: VElement,
  newVdom: VElement,
  options?: { thisObject?: unknown }
) {
  const { thisObject } = options ?? {};

  const el = newVdom.el!;

  const {
    class: oldClass,
    style: oldStyle,
    on: oldEvents = {},
    ...oldAttrs
  } = oldVdom.props;

  const {
    class: newClass,
    style: newStyle,
    on: newEvents = {},
    ...newAttrs
  } = newVdom.props;

  const { listeners: oldListeners } = oldVdom;

  patchAttrs(el, oldAttrs, newAttrs);
  patchClasses(el, oldClass, newClass);
  patchStyles(el, oldStyle, newStyle);

  newVdom.listeners = patchEvents(
    el,
    oldListeners,
    oldEvents,
    newEvents,
    thisObject
  );
}

function patchChildren(
  oldVdom: VNode,
  newVdom: VNode,
  options: { offset?: number; thisObject?: unknown } = {}
) {
  const { offset = 0 } = options;

  const oldChildren = extractChildren(oldVdom);
  const newChildren = extractChildren(newVdom);
  const parentEl = newVdom.el!;

  const diffSequences = arrayDiffSequence<VNode>(
    oldChildren,
    newChildren,
    areNodesEqual
  );

  for (const operation of diffSequences) {
    switch (operation.type) {
      case "add":
        const { item, index } = operation;
        mountDom(item, parentEl as HTMLElement, { index: index + offset });
        break;
      case "remove":
        const { item: removedItem } = operation;
        destroyDom(removedItem);
        break;
      case "move": {
        const { index, originalIndex } = operation;

        const oldChild = oldChildren[originalIndex];
        const newChild = newChildren[index];

        const el = oldChild.el!;
        const elAtTargetIndex = parentEl.childNodes[index + offset];

        parentEl.insertBefore(el, elAtTargetIndex);
        patchDom(oldChild, newChild, parentEl as HTMLElement, {});
        break;
      }
      case "noop": {
        const { originalIndex, index } = operation;

        patchDom(
          oldChildren[originalIndex],
          newChildren[index],
          parentEl as HTMLElement,
          {}
        );
        break;
      }
    }
  }
}

function patchComponent(
  oldVdom: VComponent,
  newVdom: VComponent,
  options?: { thisObject?: unknown }
) {
  const { thisObject } = options ?? {};

  const { instance, component } = oldVdom;
  const { props } = extractPropsAndEvents(newVdom);

  instance?.updateProps(props);

  newVdom.instance = instance;
  newVdom.component = component;
  newVdom.el = instance?.firstElement as HTMLElement;
}

export function patchDom(
  oldVdom: VNode,
  newVdom: VNode,
  container: HTMLElement,
  options: { offset?: number; thisObject?: unknown } = {}
) {
  if (!areNodesEqual(oldVdom, newVdom)) {
    const index = findIndexInParent(oldVdom.el as ChildNode, container);
    destroyDom(oldVdom);
    mountDom(newVdom, container, { index, thisObject: options?.thisObject });

    return newVdom;
  }

  newVdom.el = oldVdom.el;

  switch (newVdom.type) {
    case "element":
      patchElement(oldVdom as VElement, newVdom, {
        thisObject: options?.thisObject,
      });
      break;
    case "text":
      patchText(oldVdom as VText, newVdom);
      break;
    case "component":
      patchComponent(oldVdom as VComponent, newVdom, {
        thisObject: options?.thisObject,
      });
      break;
  }

  patchChildren(oldVdom, newVdom, options);

  return newVdom;
}
