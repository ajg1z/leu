import { ComponentBase } from "../component";
import { withoutNulls } from "../utils/arrays";

export type VNode = VText | VElement | VFragment | VComponent;

interface VNodeBase {
  el?: HTMLElement | Text;
}

export interface VText extends VNodeBase {
  type: "text";
  value: string;
  el?: Text;
}

export interface VComponent<
  Props extends Record<string, any> = Record<string, any>
> extends VNodeBase {
  type: "component";
  component: new (
    props: Props,
    eventsHandlers: Record<string, (data?: unknown) => void>,
    parentComponent: ComponentBase<any, any> | null
  ) => ComponentBase<Record<string, any>, Props>;
  instance?: ComponentBase<Record<string, any>, Props> | null;
  props: Props;
  el?: HTMLElement;
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

// Тип для извлечения Props из конструктора компонента
type ComponentProps<T> = T extends new (props: infer P) => any
  ? P
  : T extends (props: infer P) => any
  ? P
  : never;

// Перегрузка для HTML элементов
export function h<T extends keyof HTMLElementTagNameMap>(
  tag: T,
  props: Record<string, any>,
  children: (VNode | string)[]
): VElement<T>;

// Перегрузка для компонентов
export function h<T extends ComponentBase<Record<string, any>, any>>(
  tag: T,
  props: Record<string, any>,
  children: (VNode | string)[]
): VComponent<Record<string, any>>;

// Реализация функции
export function h(
  tag: keyof HTMLElementTagNameMap | ComponentBase<Record<string, any>, any>,
  props: any,
  children: (VNode | string)[]
): VElement<any> | VComponent<any> {
  const type = typeof tag === "function" ? "component" : "element";

  if (type === "component") {
    return {
      type,
      component: tag as any,
      instance: null,
      props,
      children: mapTextNodes(withoutNulls(children)),
    } as VComponent<any>;
  }

  return {
    tag: tag as keyof HTMLElementTagNameMap,
    props,
    children: mapTextNodes(withoutNulls(children)),
    type,
  } as VElement<any>;
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
