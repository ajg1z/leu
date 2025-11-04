// Тип для стилей элемента (исключаем readonly свойства)
type ElementStyle = Partial<
  Omit<CSSStyleDeclaration, "length" | "parentRule" | "cssText">
>;

// Тип для атрибутов элемента
type ElementAttributes = {
  class?: string | string[];
  style?: ElementStyle;
  [key: string]: unknown;
};

/**
 * Sets the attributes of an element.
 * @param element - The element to set the attributes of.
 * @param attrs - The attributes to set.
 */
export function setAttributes(element: HTMLElement, attrs: ElementAttributes) {
  const { class: className, style, ...otherAttrs } = attrs;

  if (className) {
    setClass(element, className);
  }

  if (style) {
    Object.entries(style).forEach(([key, value]) => {
      setStyle(element, key as keyof ElementStyle, value as string);
    });
  }

  for (const [key, value] of Object.entries(otherAttrs)) {
    setAttribute(element, key, value as string);
  }
}

/**
 * Sets the class of an element.
 * @param element - The element to set the class of.
 * @param className - The class to set.
 */
function setClass(element: HTMLElement, className: string | string[]) {
  element.className = "";

  if (typeof className === "string") {
    element.className = className;
  } else {
    element.classList.add(...className);
  }
}

/**
 * Sets a style on an element.
 * @param element - The element to set the style on.
 * @param key - The style to set.
 * @param value - The value to set.
 */
function setStyle(
  element: HTMLElement,
  key: keyof ElementStyle,
  value: string
) {
  (element.style as any)[key] = value;
}

/**
 * Removes a style from an element.
 * @param element - The element to remove the style from.
 * @param key - The style to remove.
 */
function removeStyle(element: HTMLElement, key: keyof HTMLElement["style"]) {
  (element.style as any)[key] = null;
}

/**
 * Sets an attribute on an element.
 * @param element - The element to set the attribute on.
 * @param key - The attribute to set.
 * @param value - The value to set.
 */
function setAttribute(element: HTMLElement, key: string, value: string) {
  if (value === null) {
    removeAttribute(element, key);
  } else if (key.startsWith("data-")) {
    element.setAttribute(key, value);
  } else {
    (element as HTMLElement & Record<string, any>)[key] = value;
  }
}

/**
 * Removes an attribute from an element.
 * @param element - The element to remove the attribute from.
 * @param key - The attribute to remove.
 */
function removeAttribute(element: HTMLElement, key: string) {
  (element as HTMLElement & Record<string, any>)[key] = null;
  element.removeAttribute(key);
}
