import { withoutNulls } from "../utils/arrays";

export type VNode = VText | VElement | VFragment;

interface VNodeBase {
  el?: HTMLElement | Text;
}

export interface VText extends VNodeBase {
  type: "text";
  value: string;
  el?: Text;
}

export interface VElement<
  T extends keyof HTMLElementTagNameMap = keyof HTMLElementTagNameMap
> extends VNodeBase {
  type: "element";
  tag: T;
  props: Record<string, any>;
  children: VNode[] | string[];
  listeners?: Record<string, (event: Event) => void>;
  el?: HTMLElement;
}

export interface VFragment extends VNodeBase {
  type: "fragment";
  children: VNode[];
  el?: HTMLElement;
}

export function h<T extends keyof HTMLElementTagNameMap>(
  tag: T,
  props: Record<string, any>,
  children: (VNode | string)[]
): VElement<T> {
  return {
    tag,
    props,
    children: mapTextNodes(withoutNulls(children)),
    type: "element",
  };
}

export function mapTextNodes(children: (VNode | string)[]): VNode[] {
  return children.map((child) => {
    if (typeof child === "string") {
      return hString(child);
    } else if (child.type === "element") {
      const children = mapTextNodes(child.children);

      return {
        ...child,
        children,
      };
    }
    return child;
  });
}

export function hString(value: string): VText {
  return { type: "text", value };
}

export function hFragment(children: VNode[]): VFragment {
  return { type: "fragment", children: mapTextNodes(withoutNulls(children)) };
}

export function lipsum(length: number) {
  const text =
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";

  return Array.from({ length }, () => hString(text + "\n"));
}

export function extractChildren(vdom: VNode): VNode[] {
  if (!vdom || !(vdom as VFragment)?.children) {
    return [];
  }

  const children: VNode[] = [];

  for (const child of (vdom as VFragment).children) {
    if (child.type === "fragment") {
      children.push(...extractChildren(child));
    } else {
      children.push(child);
    }
  }

  return children;
}
