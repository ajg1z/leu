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
import { enqueueJob, nextTick } from "./scheduler";

export function createApp(
  RootComponent: new (
    props: any,
    eventsHandlers: Record<string, (data?: unknown) => void>,
    parentComponent: ComponentBase<any, any> | null
  ) => ComponentBase<any, any>,
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
      vdom = h(RootComponent as any, props, []);
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

// ============================================
// Простое приложение для тестирования фреймворка
// ============================================

// Компонент счетчика - тестирует updateState
const Counter = defineComponent<
  { count: number },
  {},
  {
    increment: () => void;
    decrement: () => void;
    reset: () => void;
  }
>({
  state: () => ({
    count: 0,
  }),
  methods: {
    increment() {
      console.log("Counter: incrementing state");
      this.updateState({ count: this.state.count + 1 });
    },
    decrement() {
      console.log("Counter: decrementing state");
      this.updateState({ count: this.state.count - 1 });
    },
    reset() {
      console.log("Counter: resetting state");
      this.updateState({ count: 0 });
    },
  },
  render() {
    return h(
      "div",
      {
        style:
          "padding: 20px; border: 2px solid #4CAF50; border-radius: 8px; margin: 10px;",
      },
      [
        h("h2", {}, ["Счетчик (тест updateState)"]),
        h(
          "p",
          { style: "font-size: 24px; font-weight: bold; color: #4CAF50;" },
          [`Текущее значение: ${this.state.count}`]
        ),
        h("div", { style: "display: flex; gap: 10px; margin-top: 10px;" }, [
          h(
            "button",
            {
              on: {
                click: () => this.decrement(),
              },
              style:
                "padding: 10px 20px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;",
            },
            ["-"]
          ),
          h(
            "button",
            {
              on: {
                click: () => this.reset(),
              },
              style:
                "padding: 10px 20px; background: #ff9800; color: white; border: none; border-radius: 4px; cursor: pointer;",
            },
            ["Сброс"]
          ),
          h(
            "button",
            {
              on: {
                click: () => this.increment(),
              },
              style:
                "padding: 10px 20px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;",
            },
            ["+"]
          ),
        ]),
      ]
    );
  },
  onMounted: async function () {
    console.log("✅ Counter: onMounted hook вызван");
    console.log("Counter: состояние до nextTick:", this.state);

    await nextTick();
    console.log("Counter: nextTick выполнен, состояние после:", this.state);
    console.log("Counter: DOM обновлен после nextTick");
  },
  onUnmounted: async function () {
    console.log("✅ Counter: onUnmounted hook вызван");

    await nextTick();
    console.log(
      "Counter: nextTick выполнен в onUnmounted, компонент размонтирован"
    );
  },
});

// Компонент карточки пользователя - тестирует updateProps
const UserCard = defineComponent<
  { displayName: string },
  { name: string; age: number; email: string },
  {
    updateUserInfo: () => void;
  }
>({
  state: (props) => ({
    displayName: `${props.name} (${props.age} лет)`,
  }),
  methods: {
    updateUserInfo() {
      console.log("UserCard: обновление пропсов");
      // Симулируем обновление пропсов извне
      const newProps = {
        name: this.props.name === "Иван" ? "Мария" : "Иван",
        age: this.props.age === 25 ? 30 : 25,
        email:
          this.props.email === "ivan@example.com"
            ? "maria@example.com"
            : "ivan@example.com",
      };
      // Обновляем состояние на основе новых пропсов
      this.updateState({
        displayName: `${newProps.name} (${newProps.age} лет)`,
      });
    },
  },
  render() {
    return h(
      "div",
      {
        style:
          "padding: 20px; border: 2px solid #2196F3; border-radius: 8px; margin: 10px;",
      },
      [
        h("h2", {}, ["Карточка пользователя (тест updateProps)"]),
        h("div", { style: "margin-top: 10px;" }, [
          h("p", {}, [`Имя: ${this.props.name}`]),
          h("p", {}, [`Возраст: ${this.props.age}`]),
          h("p", {}, [`Email: ${this.props.email}`]),
          h("p", { style: "font-weight: bold; color: #2196F3;" }, [
            `Отображаемое имя: ${this.state.displayName}`,
          ]),
        ]),
        h(
          "button",
          {
            on: {
              click: () => this.updateUserInfo(),
            },
            style:
              "padding: 10px 20px; background: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer; margin-top: 10px;",
          },
          ["Обновить пропсы"]
        ),
      ]
    );
  },
  onMounted: async function () {
    console.log("✅ UserCard: onMounted hook вызван");
    console.log("UserCard: props при монтировании:", this.props);
    console.log("UserCard: состояние при монтировании:", this.state);

    await nextTick();
    console.log("UserCard: nextTick выполнен, DOM готов для взаимодействия");
    console.log("UserCard: можно безопасно обращаться к DOM элементам");
  },
  onUnmounted: async function () {
    console.log("✅ UserCard: onUnmounted hook вызван");

    await nextTick();
    console.log("UserCard: nextTick выполнен в onUnmounted");
    console.log("UserCard: все асинхронные операции завершены");
  },
});

// Компонент для демонстрации работы nextTick и flushPromises
const NextTickDemo = defineComponent<
  {
    counter: number;
    messages: string[];
    withoutNextTick: number;
    withNextTick: number;
  },
  {},
  {
    testWithoutNextTick: () => void;
    testWithNextTick: () => void;
    clearMessages: () => void;
  }
>({
  state: () => ({
    counter: 0,
    messages: [],
    withoutNextTick: 0,
    withNextTick: 0,
  }),
  methods: {
    testWithoutNextTick() {
      console.log("\n=== ТЕСТ БЕЗ nextTick ===");
      this.updateState({ counter: this.state.counter + 1 });

      // БЕЗ nextTick - состояние может быть еще не обновлено в DOM
      const currentValue = this.state.counter;
      console.log(
        "❌ БЕЗ nextTick: пытаемся прочитать значение сразу:",
        currentValue
      );
      console.log("❌ Проблема: DOM может быть еще не обновлен!");

      this.updateState({
        messages: [
          ...this.state.messages,
          `Без nextTick: значение = ${currentValue} (может быть устаревшим)`,
        ],
        withoutNextTick: this.state.withoutNextTick + 1,
      });
    },

    async testWithNextTick() {
      console.log("\n=== ТЕСТ С nextTick ===");
      this.updateState({ counter: this.state.counter + 1 });

      enqueueJob(() => {
        console.log("enqueueJob");
      });
      enqueueJob(() => {
        console.log("enqueueJob 2");
      });
      enqueueJob(() => {
        console.log("enqueueJob 3");
      });

      // С nextTick - ждем, пока все задачи выполнятся и DOM обновится
      console.log("⏳ Ждем nextTick...");
      await nextTick();

      const currentValue = this.state.counter;
      console.log("✅ С nextTick: значение после ожидания:", currentValue);
      console.log("✅ DOM гарантированно обновлен!");

      this.updateState({
        messages: [
          ...this.state.messages,
          `С nextTick: значение = ${currentValue} (гарантированно актуальное)`,
        ],
        withNextTick: this.state.withNextTick + 1,
      });
    },

    clearMessages() {
      this.updateState({ messages: [] });
    },
  },
  render() {
    return h(
      "div",
      {
        style:
          "padding: 20px; border: 2px solid #FF9800; border-radius: 8px; margin: 10px; background: #FFF3E0;",
      },
      [
        h("h2", { style: "color: #FF9800; margin-top: 0;" }, [
          "🔍 Демонстрация nextTick и flushPromises",
        ]),
        h(
          "div",
          {
            style:
              "margin: 15px 0; padding: 15px; background: white; border-radius: 4px;",
          },
          [
            h("h3", { style: "margin-top: 0; color: #333;" }, [
              "Как это работает:",
            ]),
            h("ol", { style: "line-height: 1.8; color: #555;" }, [
              h("li", {}, [
                "nextTick() вызывает scheduleUpdate() - планирует выполнение задач через queueMicrotask",
              ]),
              h("li", {}, [
                "flushPromises() возвращает Promise, который резолвится ПОСЛЕ всех микрозадач",
              ]),
              h("li", {}, [
                "Когда промис резолвится, все задачи из очереди уже выполнены, DOM обновлен",
              ]),
              h("li", {}, [
                "Это гарантирует, что вы читаете актуальное состояние после всех обновлений",
              ]),
            ]),
          ]
        ),
        h("div", { style: "margin: 15px 0;" }, [
          h(
            "p",
            { style: "font-size: 18px; font-weight: bold; color: #333;" },
            [`Текущее значение счетчика: ${this.state.counter}`]
          ),
        ]),
        h(
          "div",
          {
            style: "display: flex; gap: 10px; margin: 15px 0; flex-wrap: wrap;",
          },
          [
            h(
              "button",
              {
                on: {
                  click: () => this.testWithoutNextTick(),
                },
                style:
                  "padding: 10px 20px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;",
              },
              ["Тест БЕЗ nextTick"]
            ),
            h(
              "button",
              {
                on: {
                  click: () => this.testWithNextTick(),
                },
                style:
                  "padding: 10px 20px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;",
              },
              ["Тест С nextTick"]
            ),
            h(
              "button",
              {
                on: {
                  click: () => this.clearMessages(),
                },
                style:
                  "padding: 10px 20px; background: #9E9E9E; color: white; border: none; border-radius: 4px; cursor: pointer;",
              },
              ["Очистить логи"]
            ),
          ]
        ),
        h("div", { style: "margin-top: 15px;" }, [
          h("p", { style: "font-weight: bold; color: #333;" }, [
            `Тестов БЕЗ nextTick: ${this.state.withoutNextTick} | С nextTick: ${this.state.withNextTick}`,
          ]),
        ]),
        h(
          "div",
          {
            style:
              "margin-top: 15px; padding: 10px; background: white; border-radius: 4px; max-height: 200px; overflow-y: auto;",
          },
          [
            h("h4", { style: "margin-top: 0; color: #333;" }, ["Логи тестов:"]),
            this.state.messages.length === 0
              ? h("p", { style: "color: #999; font-style: italic;" }, [
                  "Нажмите кнопки выше, чтобы увидеть разницу",
                ])
              : h(
                  "ul",
                  { style: "margin: 0; padding-left: 20px; color: #555;" },
                  this.state.messages.map((msg) => h("li", {}, [msg]))
                ),
          ]
        ),
        h(
          "div",
          {
            style:
              "margin-top: 15px; padding: 10px; background: #E3F2FD; border-left: 4px solid #2196F3; border-radius: 4px;",
          },
          [
            h("p", { style: "margin: 0; color: #1976D2; font-size: 14px;" }, [
              "💡 Откройте консоль браузера (F12), чтобы увидеть подробные логи работы nextTick и flushPromises!",
            ]),
          ]
        ),
      ]
    );
  },
  onMounted: async function () {
    console.log("✅ NextTickDemo: компонент смонтирован");
    console.log(
      "📚 Этот компонент демонстрирует разницу между использованием и без использования nextTick"
    );

    await nextTick();
    console.log("✅ NextTickDemo: nextTick выполнен, компонент готов");
  },
  onUnmounted: async function () {
    console.log("✅ NextTickDemo: компонент размонтирован");

    await nextTick();
    console.log("✅ NextTickDemo: nextTick выполнен в onUnmounted");
  },
});

// Главный компонент приложения - тестирует хуки жизненного цикла
const App = defineComponent<
  { mounted: boolean },
  {},
  {
    toggleUnmount: () => void;
  }
>({
  state: () => ({
    mounted: false,
  }),
  methods: {
    toggleUnmount() {
      console.log("App: переключение состояния монтирования");
      this.updateState({ mounted: !this.state.mounted });
    },
  },
  render() {
    return h(
      "div",
      {
        style:
          "max-width: 800px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;",
      },
      [
        h("h1", { style: "color: #333; text-align: center;" }, [
          "Тестовое приложение Leu Framework",
        ]),
        h("div", { style: "margin: 20px 0;" }, [
          h(
            "button",
            {
              on: {
                click: () => this.toggleUnmount(),
              },
              style:
                "padding: 10px 20px; background: #9C27B0; color: white; border: none; border-radius: 4px; cursor: pointer;",
            },
            [
              this.state.mounted
                ? "Размонтировать компоненты"
                : "Монтировать компоненты",
            ]
          ),
        ]),
        this.state.mounted
          ? h("div", {}, [
              h(NextTickDemo, {}, []),
              h(Counter, {}, []),
              h(
                UserCard,
                {
                  name: "Иван",
                  age: 25,
                  email: "ivan@example.com",
                },
                []
              ),
            ])
          : h(
              "p",
              { style: "color: #999; text-align: center; padding: 40px;" },
              [
                "Компоненты размонтированы. Нажмите кнопку, чтобы смонтировать их.",
              ]
            ),
        h(
          "div",
          {
            style:
              "margin-top: 30px; padding: 15px; background: #f5f5f5; border-radius: 8px;",
          },
          [
            h("h3", {}, ["Инструкции по тестированию:"]),
            h("ul", { style: "line-height: 1.8;" }, [
              h("li", {}, [
                "nextTick и flushPromises: используйте компонент NextTickDemo для демонстрации",
              ]),
              h("li", {}, [
                "Обновление состояния: используйте кнопки +/- в компоненте Counter",
              ]),
              h("li", {}, [
                "Обновление пропсов: нажмите 'Обновить пропсы' в компоненте UserCard",
              ]),
              h("li", {}, [
                "Хуки жизненного цикла: откройте консоль браузера, чтобы увидеть логи onMounted/onUnmounted",
              ]),
            ]),
          ]
        ),
      ]
    );
  },
  onMounted: async function () {
    console.log("✅ App: onMounted hook вызван");
    console.log("App: начальное состояние:", this.state);

    // Обновляем состояние после монтирования
    this.updateState({ mounted: true });
    console.log("App: состояние обновлено на:", this.state);

    await nextTick();
    console.log("App: nextTick выполнен, все дочерние компоненты смонтированы");
    console.log("App: приложение полностью готово к работе");
  },
  onUnmounted: async function () {
    console.log("✅ App: onUnmounted hook вызван");

    await nextTick();
    console.log("App: nextTick выполнен в onUnmounted");
    console.log("App: все компоненты размонтированы, приложение завершено");
  },
});

// Инициализация приложения
const app = createApp(App, {});

// Монтируем приложение в DOM
const container = document.getElementById("app");
if (container) {
  app.mount(container);
  console.log("🚀 Приложение смонтировано!");
} else {
  console.error("❌ Элемент #app не найден в DOM");
}
