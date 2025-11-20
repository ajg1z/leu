// Leu Framework - Entry Point
// Здесь будет основная логика вашего фреймворка

import { Dispatcher } from "./dispatcher";
import { defineComponent } from "./component";
import {
  destroyDom,
  h,
  hFragment,
  mountDom,
  patchDom,
  type VNode,
} from "./view";
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

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

interface TodoState {
  todos: Todo[];
  inputValue: string;
}

const TodoAppComponent = defineComponent<
  TodoState & { nextId: number },
  {},
  {
    addTodo: (text: string) => void;
    setInput: (value: string) => void;
    toggleTodo: (id: number) => void;
    deleteTodo: (id: number) => void;
    clearCompleted: () => void;
  }
>({
  state: () => ({ todos: [], inputValue: "", nextId: 1 }),
  render() {
    const { todos, inputValue } = this.state;

    const activeTodos = todos.filter((todo) => !todo.completed);
    const completedTodos = todos.filter((todo) => todo.completed);

    return h(
      "div",
      {
        style: {
          maxWidth: "600px",
          margin: "0 auto",
          padding: "20px",
          fontFamily: "Arial, sans-serif",
        },
      },
      [
        h("h1", { style: { textAlign: "center", color: "#333" } }, [
          "📝 Список задач",
        ]),
        h(
          "div",
          {
            style: {
              display: "flex",
              gap: "10px",
              marginBottom: "20px",
            },
          },
          [
            h(
              "input",
              {
                type: "text",
                placeholder: "Введите новую задачу...",
                value: inputValue,
                style: {
                  flex: "1",
                  padding: "10px",
                  fontSize: "16px",
                  border: "2px solid #ddd",
                  borderRadius: "4px",
                },
                on: {
                  input: (e: Event) => {
                    const target = e.target as HTMLInputElement;
                    this.setInput(target.value);
                  },
                },
              },
              []
            ),
            h(
              "button",
              {
                style: {
                  padding: "10px 20px",
                  fontSize: "16px",
                  backgroundColor: "#4CAF50",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                },
                on: {
                  click: () => {
                    if (inputValue.trim()) {
                      this.addTodo(inputValue.trim());
                      this.setInput("");
                    }
                  },
                },
              },
              ["Добавить"]
            ),
          ]
        ),
        h(
          "div",
          {
            style: {
              marginBottom: "10px",
              color: "#666",
              fontSize: "14px",
            },
          },
          [
            `Всего: ${todos.length} | `,
            `Активных: ${activeTodos.length} | `,
            `Завершено: ${completedTodos.length}`,
          ]
        ),
        todos.length === 0
          ? h(
              "div",
              {
                style: {
                  textAlign: "center",
                  padding: "40px",
                  color: "#999",
                },
              },
              ["Список задач пуст. Добавьте первую задачу!"]
            )
          : hFragment(
              todos.map((todo) =>
                h(
                  "div",
                  {
                    style: {
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "12px",
                      marginBottom: "8px",
                      backgroundColor: todo.completed ? "#f0f0f0" : "#fff",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      textDecoration: todo.completed ? "line-through" : "none",
                      opacity: todo.completed ? 0.7 : 1,
                    },
                  },
                  [
                    h(
                      "input",
                      {
                        type: "checkbox",
                        checked: todo.completed,
                        style: {
                          width: "20px",
                          height: "20px",
                          cursor: "pointer",
                        },
                        on: {
                          change: () => {
                            this.toggleTodo(todo.id);
                          },
                        },
                      },
                      []
                    ),
                    h(
                      "span",
                      {
                        style: {
                          flex: "1",
                          fontSize: "16px",
                          color: todo.completed ? "#999" : "#333",
                        },
                      },
                      [todo.text]
                    ),
                    h(
                      "button",
                      {
                        style: {
                          padding: "6px 12px",
                          fontSize: "14px",
                          backgroundColor: "#f44336",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                        },
                        on: {
                          click: () => {
                            this.deleteTodo(todo.id);
                          },
                        },
                      },
                      ["Удалить"]
                    ),
                  ]
                )
              )
            ),
        completedTodos.length > 0
          ? h(
              "button",
              {
                style: {
                  marginTop: "20px",
                  padding: "10px 20px",
                  fontSize: "14px",
                  backgroundColor: "#ff9800",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  width: "100%",
                },
                on: {
                  click: () => {
                    this.clearCompleted();
                  },
                },
              },
              [`Очистить завершенные (${completedTodos.length})`]
            )
          : h("div", {}, []),
      ]
    );
  },
  methods: {
    setInput(value: string) {
      this.updateState({ inputValue: value });
    },
    addTodo(text: string) {
      if (!text.trim()) return;
      const newTodo: Todo = {
        id: this.state.nextId,
        text,
        completed: false,
      };
      this.updateState({
        todos: [...this.state.todos, newTodo],
        nextId: this.state.nextId + 1,
      });
    },
    toggleTodo(id: number) {
      this.updateState({
        todos: this.state.todos.map((todo) =>
          todo.id === id ? { ...todo, completed: !todo.completed } : todo
        ),
      });
    },
    deleteTodo(id: number) {
      this.updateState({
        todos: this.state.todos.filter((todo) => todo.id !== id),
      });
    },
    clearCompleted() {
      this.updateState({
        todos: this.state.todos.filter((todo) => !todo.completed),
      });
    },
  },
});

// Основная функция инициализации фреймворка
function init() {
  const appElement = document.getElementById("app");
  if (appElement) {
    const component = new TodoAppComponent({});
    component.mount(appElement);
  } else {
    console.error("App not found");
  }
}
// Автоматическая инициализация при загрузке модуля
init();
