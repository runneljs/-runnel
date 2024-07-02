import { PayloadMismatchError } from "./errors";
import type { JsonSchema, TopicId } from "./primitive-types";

export type Validator = (
  jsonSchema: JsonSchema,
) => (payload: unknown) => boolean;

export type PayloadValidator = <T>(
  topicId: TopicId,
  jsonSchema: JsonSchema,
  payload: T,
) => T;

export function createPayloadValidator(validator: Validator): PayloadValidator {
  return function validate<T>(
    topicId: TopicId,
    jsonSchema: JsonSchema,
    payload: T,
  ) {
    if (!validator(jsonSchema)(payload)) {
      throw new PayloadMismatchError(topicId, jsonSchema, payload);
    }
    return payload;
  };
}
