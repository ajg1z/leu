// Leu Framework - Entry Point
// Здесь будет основная логика вашего фреймворка

import { destroyDom } from "./destroy-dom";
import { Dispatcher } from "./dispatcher";
import { h, VNode, hString, hFragment } from "./h";
import { mountDom } from "./mount-dom";
import { patchDom } from "./patch-dom";
export { h, VNode, hString, hFragment };
/**
 * Creates a new app instance.
 * @param {Object} options - The options for the app.
 * @param {Record<string, any>} options.state - The initial state of the app.
 * @param {Function} options.view - The view function for the app.
 * @returns {Object} The app instance.
 */
export function createApp({
  state,
  view,
  reducers,
}: {
  state: Record<string, any>;
  view: (
    state: Record<string, any>,
    emit: (key: string, value: unknown) => void
  ) => VNode;
  reducers: Record<
    string,
    (state: Record<string, any>, value: unknown) => Record<string, any>
  >;
}) {
  var parentElement: HTMLElement | null = null;
  var vdom: VNode | null = null;

  const dispatcher = new Dispatcher();
  const subscriptions = [dispatcher.subscribeAfter(renderApp)];

  function emit(key: string, value: unknown) {
    dispatcher.dispatch(key, value);
  }

  for (const key in reducers) {
    const reducer = reducers[key];
    const subs = dispatcher.subscribe(key, (value) => {
      state = reducer(state, value);
    });
    subscriptions.push(subs);
  }

  function renderApp() {
    const newVdom = view(state, emit);
    vdom = patchDom(vdom!, newVdom, parentElement!);
  }

  return {
    mount(container: HTMLElement) {
      if (!vdom) {
        parentElement = container;
        vdom = view(state, emit);
        mountDom(vdom!, parentElement!);
      } else {
        console.info("app already mounted");
      }
    },
    unmount() {
      destroyDom(vdom!);
      vdom = null;
      subscriptions.forEach((unsubscribe) => unsubscribe());
      parentElement = null;
    },
  };
}

function App(
  state: Record<string, any>,
  emit: (key: string, value: unknown) => void
) {
  return h(
    "div",
    {
      class: "container",
      on: { click: () => emit("click", "test") },
    },
    [
      {
        type: "element",
        tag: "button",
        props: {
          class: "button",
          on: {
            click: () => {
              emit("increment", state.count + 1);
            },
          },
        },
        children: ["Increment"],
      },
      {
        type: "element",
        tag: "button",
        props: {
          class: "button",
          on: { click: () => emit("decrement", state.count - 1) },
        },
        children: ["Decrement"],
      },
      {
        type: "text",
        value: `Count: ${state.count}`,
      },
    ]
  );
}

// Основная функция инициализации фреймворка
function init() {
  console.log("Leu Framework инициализирован");
  const appElement = document.getElementById("app");
  if (appElement) {
    const app = createApp({
      state: { count: 0 },
      view: App,
      reducers: {
        increment: (state, value) => ({
          count: value as number,
        }),
        decrement: (state, value) => ({
          count: value as number,
        }),
      },
    });
    app.mount(appElement);
  } else {
    console.error("App not found");
  }
  // Здесь будет логика инициализации
}

// Автоматическая инициализация при загрузке модуля
init();
