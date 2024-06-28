export class Observable<T> {
  private observers: Array<(data: T) => void>;
  constructor() {
    this.observers = [];
  }

  subscribe(func: (data: T) => void): () => void {
    this.observers.push(func);
    return () => this.unsubscribe(func);
  }

  unsubscribe(func: (data: T) => void): void {
    this.observers = this.observers.filter((observer) => observer !== func);
  }

  notify(data: T): void {
    this.observers.forEach((observer) => observer(data));
  }
}
