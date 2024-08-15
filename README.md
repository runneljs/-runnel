# Runnel Monorepo

[Runnel](https://docs.runnel.run/) is an event bus library specifically tailored for the dynamic world of Micro-Frontend Applications. It aims to bring you seamless communication across various fragments of your application. It's greatly inspired by [@trutoo/event-bus](https://www.npmjs.com/package/@trutoo/event-bus), inheriting its best features while adding some functionalities and flexibilities tailored for micro-frontend architectures.

## Explore the Documentation

Please visit [our documentation](https://docs.runnel.run/) and learn more.

## BroadcastChannel polyfill example

When your client doesn't want to use browsers that support [BroadcastChannel](https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel), you can create this polyfill.

```sh
npm i broadcast-channel
```

```ts
import { BroadcastChannel as FallbackBroadcastChannel } from "broadcast-channel";

(function (global) {
  if (typeof global.BroadcastChannel === "undefined") {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    global.BroadcastChannel = FallbackBroadcastChannel;
  }
})(window);
```
