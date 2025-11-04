/**
 * Adds an event listener to an element.
 * @param evtName - The name of the event to listen for.
 * @param handler - The handler function to call when the event is triggered.
 * @param element - The element to add the event listener to.
 * @returns The handler function.
 */
export function addEventListener(
  evtName: string,
  handler: (event: Event) => void,
  element: HTMLElement
) {
  element.addEventListener(evtName, handler);
  return handler;
}

/**
 * Adds event listeners to an element.
 * @param events - The events to listen for.
 * @param element - The element to add the event listeners to.
 * @returns The listeners.
 */
export function addEventListeners(
  events: Record<string, (event: Event) => void> | undefined,
  element: HTMLElement
) {
  const safeEvents = events ?? {};
  const listeners: Record<string, (event: Event) => void> = {};
  for (const [event, handler] of Object.entries(safeEvents)) {
    listeners[event] = addEventListener(event, handler, element);
  }
  return listeners;
}

/**
 * Removes event listeners from an element.
 * @param listeners - The previously added listeners to remove.
 * @param element - The element to remove the event listeners from.
 */
export function removeEventListeners(
  listeners: Record<string, (event: Event) => void>,
  element: HTMLElement | undefined
) {
  if (!element) return;
  for (const [event, handler] of Object.entries(listeners)) {
    element.removeEventListener(event, handler);
  }
}
