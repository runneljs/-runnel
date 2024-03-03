import { SchemaMismatchError } from "./errors";
import type { JsonSchema, TopicId } from "./primitive-types";

export type DeepEqual = (value: JsonSchema, other: JsonSchema) => boolean;

/**
 * This function is only needed at build time, unless someone wants to create a new topic at runtime.
 */
export function schemaManager(
  deepEqual: DeepEqual,
  schemaStore: Map<TopicId, JsonSchema>,
): (topicId: TopicId, incomingSchema: JsonSchema) => void {
  return function checkSchema(
    topicId: TopicId,
    incomingSchema: JsonSchema,
  ): void {
    if (schemaStore.has(topicId)) {
      const schema = schemaStore.get(topicId)!;
      if (!deepEqual(incomingSchema, schema)) {
        throw new SchemaMismatchError(topicId, schema, incomingSchema);
      }
    } else {
      schemaStore.set(topicId, incomingSchema);
    }
  };
}
