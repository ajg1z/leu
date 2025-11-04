import { setAttributes, setAttribute, removeAttribute, removeStyle, setStyle } from "./attributes";
import { destroyDom } from "./destroy-dom";
import { addEventListener } from "./events";
import { extractChildren, VElement, VFragment, VNode, VText } from "./h";
import { mountDom } from "./mount-dom";
import { areNodesEqual } from "./nodes-equal";
import { arrayDiffSequence, arraysDiff } from "./utils/arrays";
import { objectsDiff } from "./utils/objects";
import { isNotBlankOrEmptyString } from "./utils/string";

function findIndexInParent(node: ChildNode, parent: HTMLElement) {
  const children = Array.from(parent.childNodes);
  return children.indexOf(node);
}


function patchText(oldVdom: VText, newVdom: VText) {
  const el = newVdom.el!;

  const { value: oldText } = oldVdom
  const { value: newText } = newVdom

  if (oldText !== newText) {
    el.nodeValue = newText
  }
}


function patchAttrs(el: HTMLElement, oldAttrs: Record<string, any>, newAttrs: Record<string, any>) {
  const { added, changed, removed } = objectsDiff(oldAttrs, newAttrs);

  for (const attr of added.concat(changed)) {
    setAttribute(el, attr, newAttrs[attr])
  }

  for (const attr of removed) {
    removeAttribute(el, attr)
  }
}

function toClassList(className: string | string[]) {
  return Array.isArray(className) ? className.filter(isNotBlankOrEmptyString) :
    className.split(' ').filter(isNotBlankOrEmptyString);

}

function patchClasses(el: HTMLElement, oldClass: string | string[], newClass: string | string[]) {
  const oldClasses = toClassList(oldClass);
  const newClasses = toClassList(newClass);

  const { added, removed } = arraysDiff(oldClasses, newClasses);

  for (const classItem of added) {
    el.classList.add(classItem)
  }

  for (const classItem of removed) {
    el.classList.remove(classItem)
  }
}

function patchStyles(el: HTMLElement, oldStyle: Record<string, any>, newStyle: Record<string, any>) {
  const { added, changed, removed } = objectsDiff(oldStyle, newStyle);

  for (const styleKey of changed.concat(added)) {
    setStyle(el, styleKey as keyof HTMLElement["style"], newStyle[styleKey])
  }

  for (const style of removed) {
    removeStyle(el, style as keyof HTMLElement["style"])
  }
}

function patchEvents(el: HTMLElement, oldListeners: Record<string, (event: Event) => void>, oldEvents: Record<string, any>, newEvents: Record<string, any>) {
  const { added, changed, removed } = objectsDiff(oldEvents, newEvents);

  for (const event of removed.concat(changed)) {
    el.removeEventListener(event, oldListeners?.[event])
  }

  const addedListeners: Record<string, (event: Event) => void> = {};

  for (const event of added.concat(changed)) {
    const listener = addEventListener(event, newEvents[event], el)
    addedListeners[event] = listener
  }

  return addedListeners;
}

function patchElement(oldVdom: VElement, newVdom: VElement) {
  const el = newVdom.el!;

  const {
    class: oldClass,
    style: oldStyle,
    on: oldEvents,
    ...oldAttrs
  } = oldVdom.props
  const { class: newClass, style: newStyle, on: newEvents, ...newAttrs }
    = newVdom.props

  const { listeners: oldListeners } = oldVdom

  patchAttrs(el, oldAttrs, newAttrs)
  patchClasses(el, oldClass, newClass)
  patchStyles(el, oldStyle, newStyle)

  newVdom.listeners = patchEvents(el, oldListeners!, oldEvents, newEvents)
}


function patchChildren(oldVdom: VNode, newVdom: VNode) {
  const oldChildren = extractChildren(oldVdom);
  const newChildren = extractChildren(newVdom);
  const parentEl = newVdom.el!;

  const diffSequences = arrayDiffSequence<VNode>(oldChildren, newChildren);

  for (const operation of diffSequences) {
    switch (operation.type) {
      case "add":
        const { item, index, } = operation;
        mountDom(item, parentEl as HTMLElement, index)
        break;
      case "remove":
        const { item: removedItem } = operation;
        destroyDom(removedItem)
        break;
      case "move": {
        const { from, index, originalIndex, item } = operation;
        
        const oldChild = oldChildren[originalIndex];
        const newChild = newChildren[index];

        const el = oldChild.el!;
        const elAtTargetIndex = parentEl.childNodes[index];

        parentEl.insertBefore(el, elAtTargetIndex)
        patchDom(oldChild, newChild, parentEl as HTMLElement)
        break;
      }
    }
  }
}

export function patchDom(
  oldVdom: VNode,
  newVdom: VNode,
  container: HTMLElement
) {
  if (!areNodesEqual(oldVdom, newVdom)) {
    const index = findIndexInParent(oldVdom.el as ChildNode, container);
    destroyDom(oldVdom);
    mountDom(newVdom, container, index);

    return newVdom;
  }

  newVdom.el = oldVdom.el;

  switch (newVdom.type) {
    case "element":
      patchElement(oldVdom as VElement, newVdom);
      break;
    case "text":
      patchText(oldVdom as VText, newVdom);
      break;
  }

  patchChildren(oldVdom, newVdom)

  return newVdom;
}
