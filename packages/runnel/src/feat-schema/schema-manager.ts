import { SchemaMismatchError } from "../errors";
import type { JsonSchema, TopicId } from "../primitive-types";

export type DeepEqual = (value: JsonSchema, other: JsonSchema) => boolean;

export type SchemaManager = {
  checkSchema: (topicId: TopicId, incomingSchema: JsonSchema) => void;
  getTopics: () => Array<TopicId>;
  getSchemaByTopicId: (topicId: TopicId) => JsonSchema | undefined;
};

export function createSchemaManager(
  deepEqual: DeepEqual,
  schemaStore: Map<TopicId, JsonSchema>,
): SchemaManager {
  return {
    checkSchema,
    getTopics: () => Array.from(schemaStore.keys()),
    getSchemaByTopicId: (topicId: TopicId) => {
      return schemaStore.get(topicId);
    },
  };

  function checkSchema(topicId: TopicId, incomingSchema: JsonSchema): void {
    if (schemaStore.has(topicId)) {
      const schema = schemaStore.get(topicId)!;
      if (!deepEqual(incomingSchema, schema)) {
        throw new SchemaMismatchError(topicId, schema, incomingSchema);
      }
    } else {
      schemaStore.set(topicId, incomingSchema);
    }
  }
}
