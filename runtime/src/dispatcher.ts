export class Dispatcher {
  private readonly subscribers: Map<string, ((event: unknown) => void)[]> =
    new Map();
  private afterHandlers: (() => void)[] = [];

  public subscribe(event: string, listener: (event: unknown) => void) {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, []);
    }

    const handlers = this.subscribers.get(event);
    if (handlers?.includes(listener)) {
      return () => {};
    }

    handlers?.push(listener);

    return () => {
      const index = handlers?.indexOf(listener);
      if (index !== undefined && index !== -1) {
        handlers?.splice(index, 1);
      }
    };
  }

  public dispatch(event: string, data: unknown) {
    if (this.subscribers.has(event)) {
      this.subscribers.get(event)?.forEach((handler) => handler(data));
    } else {
      console.warn(`Event ${event} not found`);
    }

    this.afterHandlers.forEach((handler) => handler());
  }

  public subscribeAfter(listener: () => void) {
    this.afterHandlers.push(listener);

    return () => {
      const index = this.afterHandlers.indexOf(listener);
      if (index !== undefined && index !== -1) {
        this.afterHandlers.splice(index, 1);
      }
    };
  }
}
