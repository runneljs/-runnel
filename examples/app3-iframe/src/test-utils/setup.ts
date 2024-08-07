/* eslint-disable @typescript-eslint/ban-ts-comment */
import MockBroadcastChannel from "./MockBroadcastChannel";
// @ts-ignore
window.BroadcastChannel = MockBroadcastChannel;
// @ts-ignore
global.BroadcastChannel = MockBroadcastChannel;
