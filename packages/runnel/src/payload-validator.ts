import { PayloadMismatchError } from "./errors";
import type { JsonSchema, TopicId } from "./primitive-types";

export type Validator = (
  jsonSchema: JsonSchema,
) => (payload: unknown) => boolean;

export function payloadValidator(validator: Validator) {
  return function validate(
    topicId: TopicId,
    jsonSchema: JsonSchema,
    payload: unknown,
  ) {
    if (!validator(jsonSchema)(payload)) {
      throw new PayloadMismatchError(topicId, jsonSchema, payload);
    }
  };
}
