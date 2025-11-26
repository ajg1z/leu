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
 * Parses a style string into an object.
 * @param style - The style string to parse.
 * @returns The parsed style object.
 */
export function parseStyle(style: string) {
  if (!style) {
    return {};
  }

  return String(style)
    .split(";")
    .filter(Boolean)
    .reduce((acc, item) => {
      const [key, value] = String(item).trim().split(":");
      if (key && value) {
        acc[key] = String(value).trim();
      }
      return acc;
    }, {} as Record<string, string>);
}

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
    if (typeof style === "string") {
      const styleObject = parseStyle(style as string);

      Object.entries(styleObject ?? {}).forEach(([key, value]) => {
        setStyle(element, key as keyof ElementStyle, value as string);
      });
    } else {
      Object.entries(style).forEach(([key, value]) => {
        setStyle(element, key as keyof ElementStyle, value as string);
      });
    }
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
export function setStyle(
  element: HTMLElement,
  key: keyof HTMLElement["style"],
  value: string
) {
  (element.style as any)[key] = value;
}

/**
 * Removes a style from an element.
 * @param element - The element to remove the style from.
 * @param key - The style to remove.
 */
export function removeStyle(
  element: HTMLElement,
  key: keyof HTMLElement["style"]
) {
  (element.style as any)[key] = null;
}

/**
 * Sets an attribute on an element.
 * @param element - The element to set the attribute on.
 * @param key - The attribute to set.
 * @param value - The value to set.
 */
export function setAttribute(element: HTMLElement, key: string, value: string) {
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
export function removeAttribute(element: HTMLElement, key: string) {
  (element as HTMLElement & Record<string, any>)[key] = null;
  element.removeAttribute(key);
}
