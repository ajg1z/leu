import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  jest,
} from "@jest/globals";
import { patchDom } from "../patch-dom";
import { h, hString, hFragment } from "../h";
import { mountDom } from "../mount-dom";

describe("patchDom", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (container.parentNode) {
      document.body.removeChild(container);
    }
  });

  describe("text nodes", () => {
    it("should patch text node with new value", () => {
      const oldText = hString("Old Text");
      mountDom(oldText, container);
      const newText = hString("New Text");

      patchDom(oldText, newText, container);

      expect(container.firstChild?.nodeValue).toBe("New Text");
      expect(newText.el).toBe(oldText.el);
    });

    it("should not update DOM if text value is the same", () => {
      const oldText = hString("Same Text");
      mountDom(oldText, container);
      const originalEl = oldText.el;
      const newText = hString("Same Text");

      patchDom(oldText, newText, container);

      expect(newText.el).toBe(originalEl);
      expect(container.firstChild?.nodeValue).toBe("Same Text");
    });

    it("should replace text node if type changes", () => {
      const oldText = hString("Text");
      mountDom(oldText, container);
      const newElement = h("div", {}, []);

      patchDom(oldText, newElement, container);

      expect(container.firstChild).toBeInstanceOf(HTMLDivElement);
      expect(container.childNodes.length).toBe(1);
    });
  });

  describe("element nodes", () => {
    it("should patch element attributes", () => {
      const oldElement = h("div", { id: "old", "data-test": "old-value" }, []);
      mountDom(oldElement, container);
      const newElement = h("div", { id: "new", "data-test": "new-value" }, []);

      patchDom(oldElement, newElement, container);

      const el = container.firstChild as HTMLElement;
      expect(el.id).toBe("new");
      expect(el.getAttribute("data-test")).toBe("new-value");
    });

    it("should remove attributes that are no longer present", () => {
      const oldElement = h("div", { id: "test", class: "old-class" }, []);
      mountDom(oldElement, container);
      const newElement = h("div", { id: "test" }, []);

      patchDom(oldElement, newElement, container);

      const el = container.firstChild as HTMLElement;
      expect(el.id).toBe("test");
      expect(el.className).toBe("");
    });

    it("should patch classes", () => {
      const oldElement = h("div", { class: "old-class" }, []);
      mountDom(oldElement, container);
      const newElement = h("div", { class: "new-class" }, []);

      patchDom(oldElement, newElement, container);

      const el = container.firstChild as HTMLElement;
      expect(el.classList.contains("new-class")).toBe(true);
      expect(el.classList.contains("old-class")).toBe(false);
    });

    it("should patch array of classes", () => {
      const oldElement = h("div", { class: ["class1", "class2"] }, []);
      mountDom(oldElement, container);
      const newElement = h("div", { class: ["class2", "class3"] }, []);

      patchDom(oldElement, newElement, container);

      const el = container.firstChild as HTMLElement;
      expect(el.classList.contains("class1")).toBe(false);
      expect(el.classList.contains("class2")).toBe(true);
      expect(el.classList.contains("class3")).toBe(true);
    });

    it("should patch styles", () => {
      const oldElement = h(
        "div",
        { style: { color: "red", fontSize: "12px" } },
        []
      );
      mountDom(oldElement, container);
      const newElement = h(
        "div",
        { style: { color: "blue", margin: "10px" } },
        []
      );

      patchDom(oldElement, newElement, container);

      const el = container.firstChild as HTMLElement;
      expect(el.style.color).toBe("blue");
      expect(el.style.fontSize).toBe("");
      expect(el.style.margin).toBe("10px");
    });

    it("should patch event listeners", () => {
      const oldHandler = jest.fn();
      const newHandler = jest.fn();
      const oldElement = h("button", { on: { click: oldHandler } }, []);
      mountDom(oldElement, container);
      const newElement = h("button", { on: { click: newHandler } }, []);

      patchDom(oldElement, newElement, container);

      const button = container.firstChild as HTMLButtonElement;
      button.click();
      expect(oldHandler).not.toHaveBeenCalled();
      expect(newHandler).toHaveBeenCalledTimes(1);
      expect(newElement.listeners).toBeDefined();
      expect(newElement.listeners?.click).toBeDefined();
    });

    it("should preserve unchanged event listeners", () => {
      const unchangedHandler = jest.fn();
      const oldHandler = jest.fn();
      const newHandler = jest.fn();
      const oldElement = h(
        "button",
        {
          on: {
            click: oldHandler,
            focus: unchangedHandler,
          },
        },
        []
      );
      mountDom(oldElement, container);
      const newElement = h(
        "button",
        {
          on: {
            click: newHandler,
            focus: unchangedHandler,
          },
        },
        []
      );

      patchDom(oldElement, newElement, container);

      const button = container.firstChild as HTMLButtonElement;
      button.click();
      button.dispatchEvent(new Event("focus"));

      expect(oldHandler).not.toHaveBeenCalled();
      expect(newHandler).toHaveBeenCalledTimes(1);
      expect(unchangedHandler).toHaveBeenCalledTimes(1);
    });

    it("should remove event listeners", () => {
      const handler = jest.fn();
      const oldElement = h("button", { on: { click: handler } }, []);
      mountDom(oldElement, container);
      const newElement = h("button", {}, []);

      patchDom(oldElement, newElement, container);

      const button = container.firstChild as HTMLButtonElement;
      button.click();
      expect(handler).not.toHaveBeenCalled();
    });

    it("should replace element if tag changes", () => {
      const oldElement = h("div", {}, []);
      mountDom(oldElement, container);
      const newElement = h("span", {}, []);

      patchDom(oldElement, newElement, container);

      expect(container.firstChild).toBeInstanceOf(HTMLSpanElement);
      expect(container.childNodes.length).toBe(1);
    });
  });

  describe("children patching", () => {
    it("should patch children when they are the same", () => {
      const oldElement = h("div", {}, [hString("Child")]);
      mountDom(oldElement, container);
      const newElement = h("div", {}, [hString("Child")]);

      patchDom(oldElement, newElement, container);

      expect(container.firstChild?.firstChild?.nodeValue).toBe("Child");
    });

    it("should add new children", () => {
      const oldElement = h("div", {}, [hString("Child 1")]);
      mountDom(oldElement, container);
      const newElement = h("div", {}, [hString("Child 1"), hString("Child 2")]);

      patchDom(oldElement, newElement, container);

      const div = container.firstChild as HTMLElement;
      expect(div.childNodes.length).toBe(2);
      expect(div.childNodes[0].nodeValue).toBe("Child 1");
      expect(div.childNodes[1].nodeValue).toBe("Child 2");
    });

    it("should remove children", () => {
      const oldElement = h("div", {}, [hString("Child 1"), hString("Child 2")]);
      mountDom(oldElement, container);
      const newElement = h("div", {}, [hString("Child 1")]);

      patchDom(oldElement, newElement, container);

      const div = container.firstChild as HTMLElement;
      expect(div.childNodes.length).toBe(1);
      expect(div.childNodes[0].nodeValue).toBe("Child 1");
    });

    it("should update children", () => {
      const oldElement = h("div", {}, [hString("Old Child")]);
      mountDom(oldElement, container);
      const newElement = h("div", {}, [hString("New Child")]);

      patchDom(oldElement, newElement, container);

      const div = container.firstChild as HTMLElement;
      expect(div.childNodes.length).toBe(1);
      expect(div.childNodes[0].nodeValue).toBe("New Child");
    });

    it("should move children", () => {
      const oldElement = h("div", {}, [
        h("span", { id: "1" }, []),
        h("span", { id: "2" }, []),
        h("span", { id: "3" }, []),
      ]);
      mountDom(oldElement, container);
      const newElement = h("div", {}, [
        h("span", { id: "3" }, []),
        h("span", { id: "1" }, []),
        h("span", { id: "2" }, []),
      ]);

      patchDom(oldElement, newElement, container);

      const div = container.firstChild as HTMLElement;
      expect(div.childNodes.length).toBe(3);
      expect((div.childNodes[0] as HTMLElement).id).toBe("3");
      expect((div.childNodes[1] as HTMLElement).id).toBe("1");
      expect((div.childNodes[2] as HTMLElement).id).toBe("2");
    });

    it("should handle complex children updates", () => {
      const oldElement = h("div", {}, [
        hString("Text 1"),
        h("span", { id: "span1" }, []),
        hString("Text 2"),
      ]);
      mountDom(oldElement, container);
      const newElement = h("div", {}, [
        h("span", { id: "span1" }, []),
        hString("Text 3"),
        h("div", { id: "div1" }, []),
      ]);

      patchDom(oldElement, newElement, container);

      const div = container.firstChild as HTMLElement;
      expect(div.childNodes.length).toBe(3);
      expect((div.childNodes[0] as HTMLElement).id).toBe("span1");
      expect(div.childNodes[1].nodeValue).toBe("Text 3");
      expect((div.childNodes[2] as HTMLElement).id).toBe("div1");
    });
  });

  describe("fragments", () => {
    it("should patch fragment children", () => {
      const oldFragment = hFragment([hString("Old")]);
      mountDom(oldFragment, container);
      const newFragment = hFragment([hString("New")]);

      patchDom(oldFragment, newFragment, container);

      expect(container.childNodes[0].nodeValue).toBe("New");
    });
  });

  describe("edge cases", () => {
    it("should handle empty children", () => {
      const oldElement = h("div", {}, []);
      mountDom(oldElement, container);
      const newElement = h("div", {}, []);

      patchDom(oldElement, newElement, container);

      const div = container.firstChild as HTMLElement;
      expect(div.childNodes.length).toBe(0);
    });

    it("should handle element with no attributes", () => {
      const oldElement = h("div", {}, []);
      mountDom(oldElement, container);
      const newElement = h("div", {}, []);

      expect(() => patchDom(oldElement, newElement, container)).not.toThrow();
    });

    it("should handle element with undefined listeners", () => {
      const oldElement = h("div", {}, []);
      mountDom(oldElement, container);
      oldElement.listeners = undefined;
      const newElement = h("div", { on: { click: jest.fn() } }, []);

      expect(() => patchDom(oldElement, newElement, container)).not.toThrow();
    });
  });
});
