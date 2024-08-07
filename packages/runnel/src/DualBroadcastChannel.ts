export class DualBroadcastChannel {
  private sender: BroadcastChannel;
  private receiver: BroadcastChannel;

  constructor(name: string) {
    this.sender = new BroadcastChannel(name);
    this.receiver = new BroadcastChannel(name);
  }

  public postMessage(message: unknown) {
    this.sender.postMessage(message);
  }

  public exclusivePostMessage(message: unknown) {
    this.receiver.postMessage(message);
  }

  public onMessage(callback: (message: MessageEvent) => void) {
    this.receiver.onmessage = callback;
  }

  public addEventListener(
    event: string,
    callback: (message: MessageEvent) => void,
  ) {
    this.receiver.addEventListener(event, callback as EventListener);
  }

  public removeEventListener(
    event: string,
    callback: (message: MessageEvent) => void,
  ) {
    this.receiver.removeEventListener(event, callback as EventListener);
  }

  public close() {
    this.sender.close();
    this.receiver.close();
  }
}
