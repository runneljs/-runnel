import { beforeEach, describe, expect, jest, test } from "bun:test";
import { Observable } from "./observable";

describe("Observable", () => {
  let observer: Observable<number>;
  beforeEach(() => {
    observer = new Observable();
  });

  describe("subscribe", () => {
    let func: jest.Mock;
    beforeEach(() => {
      func = jest.fn();
      observer.subscribe(func);
    });

    describe("then notify", () => {
      test("should call function", () => {
        observer.notify(1);
        expect(func).toHaveBeenCalledWith(1);
      });

      describe("then unsubscribe", () => {
        beforeEach(() => {
          observer.unsubscribe(func);
        });

        test("should not call function", () => {
          observer.notify(1);
          expect(func).not.toHaveBeenCalled();
        });
      });
    });
  });
});
