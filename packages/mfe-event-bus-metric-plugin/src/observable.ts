export class Observable<T> {
  private observers: Array<(data: T) => void>;
  constructor() {
    this.observers = [];
  }

  subscribe(func: (data: T) => void) {
    this.observers.push(func);
  }

  unsubscribe(func: (data: T) => void) {
    this.observers = this.observers.filter((observer) => observer !== func);
  }

  notify(data: T) {
    this.observers.forEach((observer) => observer(data));
  }
}
