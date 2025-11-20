import { VComponent, VElement } from "../view/h";

export function extractPropsAndEvents(vdom: VElement | VComponent) {
  const { on: events, ...props } = vdom.props;

  return { props, events };
}
