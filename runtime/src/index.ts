import { ComponentBase } from "./component";
import {
  destroyDom,
  h,
  mountDom,
  VComponent,
  VElement,
  VFragment,
  VNode,
} from "./view";
import { defineComponent } from "./component";

export function createApp(
  RootComponent: ComponentBase<any, any>,
  props: Record<string, any> = {}
) {
  let parentElement: HTMLElement | null = null;
  let isMounted = false;
  let vdom: VNode | null = null;

  function reset() {
    parentElement = null;
    isMounted = false;
    vdom = null;
  }

  return {
    mount(_parentElement: HTMLElement) {
      if (isMounted) {
        console.info("app already mounted");
        return;
      }

      parentElement = _parentElement;
      vdom = h(RootComponent, props, []);
      mountDom(vdom, parentElement);
      isMounted = true;
    },
    unmount() {
      if (!isMounted) {
        console.info("app not mounted");
        return;
      }
      destroyDom(vdom);
      reset();
    },
  };
}

export { defineComponent };

export type { VNode, VElement, VFragment, VComponent };
