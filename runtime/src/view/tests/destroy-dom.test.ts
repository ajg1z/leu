import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  jest,
} from "@jest/globals";
import { destroyDom } from "../destroy-dom";
import { h, hString, hFragment } from "../h";
import { addEventListeners } from "../events";
import { mountDom } from "../mount-dom";

describe("destroyDom", () => {
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
    it("should remove text node from DOM", () => {
      const textNode = hString("Test");
      const domText = document.createTextNode("Test");
      container.appendChild(domText);
      textNode.el = domText;

      destroyDom(textNode);

      expect(container.childNodes.length).toBe(0);
      expect(textNode.el).toBeUndefined();
    });

    it("should handle text node without el", () => {
      const textNode = hString("Test");
      expect(() => destroyDom(textNode)).not.toThrow();
      expect(textNode.el).toBeUndefined();
    });
  });

  describe("element nodes", () => {
    it("should remove element from DOM", () => {
      const element = h("div", {}, []);
      const domElement = document.createElement("div");
      container.appendChild(domElement);
      element.el = domElement;

      destroyDom(element);

      expect(container.childNodes.length).toBe(0);
      expect(element.el).toBeUndefined();
    });

    it("should remove element with children", () => {
      const child1 = hString("Child 1");
      const child2 = h("span", {}, []);
      const element = h("div", {}, [child1, child2]);

      mountDom(element, container);

      expect(container.childNodes.length).toBe(1);
      expect(element.el).toBeDefined();
      const div = element.el as HTMLElement;
      expect(div.childNodes.length).toBe(2);
      expect(child1.el).toBeDefined();
      // child2.el should be set after mounting
      const child2FromElement = element.children[1] as typeof child2;
      expect(child2FromElement.el).toBeDefined();

      destroyDom(element);

      expect(container.childNodes.length).toBe(0);
      expect(element.el).toBeUndefined();
      expect(child1.el).toBeUndefined();
      expect(child2FromElement.el).toBeUndefined();
    });

    it("should remove event listeners from element", () => {
      const clickHandler = jest.fn();
      const element = h("button", { on: { click: clickHandler } }, []);
      const domElement = document.createElement("button");
      container.appendChild(domElement);
      element.el = domElement;
      element.listeners = addEventListeners(
        { click: clickHandler },
        domElement
      );

      // Verify listener is attached
      domElement.click();
      expect(clickHandler).toHaveBeenCalledTimes(1);

      destroyDom(element);

      // Verify listener is removed
      domElement.click();
      expect(clickHandler).toHaveBeenCalledTimes(1); // Still 1, not 2
      expect(element.listeners).toBeUndefined();
      expect(element.el).toBeUndefined();
    });

    it("should handle element without listeners", () => {
      const element = h("div", {}, []);
      const domElement = document.createElement("div");
      container.appendChild(domElement);
      element.el = domElement;

      expect(() => destroyDom(element)).not.toThrow();
      expect(element.el).toBeUndefined();
    });

    it("should handle element without el", () => {
      const element = h("div", {}, []);
      expect(() => destroyDom(element)).not.toThrow();
      expect(element.el).toBeUndefined();
    });
  });

  describe("fragment nodes", () => {
    it("should remove all children of fragment", () => {
      const child1 = hString("Child 1");
      const child2 = h("div", {}, []);
      const fragment = hFragment([child1, child2]);

      mountDom(fragment, container);

      expect(container.childNodes.length).toBe(2);
      expect(fragment.el).toBeDefined();
      expect(child1.el).toBeDefined();
      // child2.el should be set after mounting
      const child2FromFragment = fragment.children[1] as typeof child2;
      expect(child2FromFragment.el).toBeDefined();

      destroyDom(fragment);

      expect(container.childNodes.length).toBe(0);
      expect(fragment.el).toBeUndefined();
      expect(child1.el).toBeUndefined();
      expect(child2FromFragment.el).toBeUndefined();
    });

    it("should handle nested fragments", () => {
      const innerChild = hString("Inner");
      const innerFragment = hFragment([innerChild]);
      const outerFragment = hFragment([innerFragment]);

      const domInner = document.createTextNode("Inner");
      container.appendChild(domInner);

      innerChild.el = domInner;
      innerFragment.el = container;
      outerFragment.el = container;

      destroyDom(outerFragment);

      expect(container.childNodes.length).toBe(0);
      expect(outerFragment.el).toBeUndefined();
      expect(innerChild.el).toBeUndefined();
    });
  });

  describe("error handling", () => {
    it("should throw error for unknown node type", () => {
      const invalidNode = { type: "invalid" } as any;
      expect(() => destroyDom(invalidNode)).toThrow("Unknown node type");
    });
  });
});
