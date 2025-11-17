import { hasOwnProperty } from "./utils/objects";
import { destroyDom, h, mountDom, patchDom, VNode } from "./view";
import { extractChildren } from "./view/h";

export interface ComponentBase<
  State extends Record<string, any>,
  Props extends Record<string, any>
> {
  vdom: VNode | null;
  hostElement: HTMLElement | null;
  isMounted: boolean;
  state: State;
  props: Props;
  elements: (HTMLElement | Text | undefined)[];
  firstElement: HTMLElement | Text | undefined;
  offset: number;
  updateState(state: any): void;
  patch(): void;
  render(): VNode;
  mount(hostElement: HTMLElement, index?: number): void;
  unmount(): void;
}

type ComponentWithMethods<
  State extends Record<string, any>,
  Props extends Record<string, any>,
  Methods extends Record<string, (this: any, ...args: any[]) => any>
> = ComponentBase<State, Props> & Methods;

export function defineComponent<
  State extends Record<string, any> = Record<string, any>,
  Props extends Record<string, any> = Record<string, any>,
  Methods extends Record<
    string,
    (this: ComponentWithMethods<State, Props, Methods>, ...args: any[]) => any
  > = {}
>({
  render,
  state,
  methods,
}: {
  render(this: ComponentWithMethods<State, Props, Methods>): VNode;
  state: (props: Props) => State;
  methods: {
    [K in keyof Methods]: (
      this: ComponentWithMethods<State, Props, Methods>,
      ...args: any[]
    ) => any;
  };
}) {
  class Component implements ComponentBase<State, Props> {
    public vdom: VNode | null = null;
    public hostElement: HTMLElement | null = null;
    public isMounted = false;
    public state: State = {} as State;
    public props: Props = {} as Props;

    constructor(props: Props = {} as Props) {
      this.props = props;
      this.state = state ? state(props) : ({} as State);
    }

    /**
     * Returns the elements of the component.
     */
    get elements() {
      if (this.vdom == null) {
        return [];
      }

      if (this.vdom.type === "fragment") {
        return extractChildren(this.vdom).map((child) => child.el);
      }

      return [this.vdom.el];
    }

    /**
     * Returns the first element of the component.
     */
    get firstElement() {
      return this.elements[0];
    }

    /**
     * Returns the index of the component in the parent element.
     */
    get offset() {
      if (this.vdom?.type === "fragment") {
        return Array.from(this.hostElement?.children ?? []).findIndex(
          (child) => child === this.firstElement
        );
      }

      return 0;
    }

    static test() {
      console.log("test");
    }

    updateState(state: any) {
      this.state = { ...this.state, ...state };
      this.patch();
    }

    patch() {
      if (!this.isMounted) {
        console.info("component not mounted");
        return;
      }

      const newVdom = this.render();
      this.vdom = patchDom(this.vdom!, newVdom, this.hostElement!, {
        offset: this.offset,
        thisObject: this,
      });
    }

    render() {
      return render.call(
        this as unknown as ComponentWithMethods<State, Props, Methods>
      );
    }

    mount(hostElement: HTMLElement, index?: number) {
      if (this.isMounted) {
        console.info("component already mounted");
        return;
      }

      this.vdom = this.render();

      mountDom(
        this.vdom,
        hostElement,
        index !== undefined ? { index, thisObject: this } : { thisObject: this }
      );

      this.hostElement = hostElement;
      this.isMounted = true;
    }

    unmount() {
      if (!this.isMounted) {
        console.info("component not mounted");
        return;
      }

      destroyDom(this.vdom);
      this.vdom = null;
      this.hostElement = null;
      this.isMounted = false;
    }
  }

  for (const key of Object.keys(methods)) {
    if (!hasOwnProperty(Component, key)) {
      (Component.prototype as Record<string, any>)[key] = methods[key];
    }
  }

  return Component;
}
