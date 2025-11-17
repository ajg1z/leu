import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  jest,
} from "@jest/globals";
import { mountDom } from "../mount-dom";
import { h, hString, hFragment } from "../h";

describe("mountDom", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe("text nodes", () => {
    it("should mount a text node", () => {
      const textNode = hString("Hello World");
      mountDom(textNode, container);

      expect(container.childNodes.length).toBe(1);
      expect(container.firstChild).toBeInstanceOf(Text);
      expect((container.firstChild as Text).nodeValue).toBe("Hello World");
      expect(textNode.el).toBe(container.firstChild);
    });

    it("should mount a text node at specific index", () => {
      const existingText = document.createTextNode("Existing");
      container.appendChild(existingText);

      const textNode = hString("New Text");
      mountDom(textNode, container, { index: 0 });

      expect(container.childNodes.length).toBe(2);
      expect(container.childNodes[0].nodeValue).toBe("New Text");
      expect(container.childNodes[1].nodeValue).toBe("Existing");
    });

    it("should mount text node at the end when index is greater than children length", () => {
      container.appendChild(document.createTextNode("First"));
      const textNode = hString("Last");
      mountDom(textNode, container, { index: 10 });

      expect(container.childNodes.length).toBe(2);
      expect(container.lastChild?.nodeValue).toBe("Last");
    });
  });

  describe("element nodes", () => {
    it("should mount a simple element", () => {
      const element = h("div", {}, []);
      mountDom(element, container);

      expect(container.childNodes.length).toBe(1);
      expect(container.firstChild).toBeInstanceOf(HTMLDivElement);
      expect(element.el).toBe(container.firstChild);
    });

    it("should mount element with attributes", () => {
      const element = h("div", { id: "test", "data-test": "value" }, []);
      mountDom(element, container);

      const mountedEl = container.firstChild as HTMLElement;
      expect(mountedEl.id).toBe("test");
      expect(mountedEl.getAttribute("data-test")).toBe("value");
    });

    it("should mount element with class", () => {
      const element = h("div", { class: "test-class" }, []);
      mountDom(element, container);

      const mountedEl = container.firstChild as HTMLElement;
      expect(mountedEl.className).toBe("test-class");
    });

    it("should mount element with array of classes", () => {
      const element = h("div", { class: ["class1", "class2"] }, []);
      mountDom(element, container);

      const mountedEl = container.firstChild as HTMLElement;
      expect(mountedEl.classList.contains("class1")).toBe(true);
      expect(mountedEl.classList.contains("class2")).toBe(true);
    });

    it("should mount element with style", () => {
      const element = h(
        "div",
        { style: { color: "red", fontSize: "16px" } },
        []
      );
      mountDom(element, container);

      const mountedEl = container.firstChild as HTMLElement;
      expect(mountedEl.style.color).toBe("red");
      expect(mountedEl.style.fontSize).toBe("16px");
    });

    it("should mount element with children", () => {
      const element = h("div", {}, [
        hString("Text 1"),
        h("span", {}, [hString("Text 2")]),
      ]);
      mountDom(element, container);

      const mountedEl = container.firstChild as HTMLElement;
      expect(mountedEl.childNodes.length).toBe(2);
      expect(mountedEl.firstChild?.nodeValue).toBe("Text 1");
      expect(mountedEl.lastChild).toBeInstanceOf(HTMLSpanElement);
    });

    it("should mount element with event listeners", () => {
      const clickHandler = jest.fn();
      const element = h("button", { on: { click: clickHandler } }, []);
      mountDom(element, container);

      const button = container.firstChild as HTMLButtonElement;
      expect(element.listeners).toBeDefined();
      expect(element.listeners?.click).toBeDefined();

      button.click();
      expect(clickHandler).toHaveBeenCalledTimes(1);
    });

    it("should mount element at specific index", () => {
      container.appendChild(document.createElement("div"));
      const element = h("span", {}, []);
      mountDom(element, container, { index: 0 });

      expect(container.childNodes[0].nodeName).toBe("SPAN");
      expect(container.childNodes[1].nodeName).toBe("DIV");
    });
  });

  describe("fragment nodes", () => {
    it("should mount a fragment with children", () => {
      const fragment = hFragment([
        hString("Text 1"),
        h("div", {}, [hString("Text 2")]),
      ]);
      mountDom(fragment, container);

      expect(container.childNodes.length).toBe(2);
      expect(container.childNodes[0].nodeValue).toBe("Text 1");
      expect(container.childNodes[1]).toBeInstanceOf(HTMLDivElement);
      expect(fragment.el).toBe(container);
    });

    it("should mount fragment children at specific index", () => {
      container.appendChild(document.createTextNode("Before"));
      const fragment = hFragment([
        hString("Fragment 1"),
        hString("Fragment 2"),
      ]);
      mountDom(fragment, container, { index: 0 });

      expect(container.childNodes.length).toBe(3);
      expect(container.childNodes[0].nodeValue).toBe("Fragment 1");
      expect(container.childNodes[1].nodeValue).toBe("Fragment 2");
      expect(container.childNodes[2].nodeValue).toBe("Before");
    });
  });

  describe("error handling", () => {
    it("should throw error for unknown node type", () => {
      const invalidNode = { type: "invalid" } as any;
      expect(() => mountDom(invalidNode, container)).toThrow(
        "Unknown node type"
      );
    });

    it("should throw error for negative index", () => {
      const element = h("div", {}, []);
      expect(() => mountDom(element, container, { index: -1 })).toThrow(
        "index is negative"
      );
    });
  });
});
