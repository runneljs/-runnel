#!/usr/bin/env node

/**
 * Target files: ~/.chirpybus/*.json (except contracts.json)
 * The JSON file contains the report data for each file.
 * Example:
 * {"/src/App.test.tsx":{"fullName":{"subscribe":1,"publish":0,"schema":{"type":"object","properties":{"firstName":{"type":"string"},"lastName":{"type":"string"}},"required":["firstName","lastName"],"additionalProperties":false,"$schema":"http://json-schema.org/draft-07/schema#"}},"count":{"subscribe":0,"publish":1,"schema":{"type":"number"}}}}
 * Another file example would be:
 * {"/src/Another.test.tsx":{"fullName":{"subscribe":0,"publish":1,"schema":{"type":"object","properties":{"firstName":{"type":"string"},"lastName":{"type":"string"}},"required":["firstName","lastName"],"additionalProperties":false,"$schema":"http://json-schema.org/draft-07/schema#"}},"count":{"subscribe":1,"publish":1,"schema":{"type":"number"}}}}
 * Then aggregate the data and generate a summary report as "contracts.json"
 * Example:
 * {"contracts":{"fullName":{"subscribe":1,"publish":1,"schema":{"type":"object","properties":{"firstName":{"type":"string"},"lastName":{"type":"string"}},"required":["firstName","lastName"],"additionalProperties":false,"$schema":"http://json-schema.org/draft-07/schema#"}},"count":{"subscribe":1,"publish":2,"schema":{"type":"number"}}}}
 */

import fs from "node:fs";
import { join } from "node:path";
import process from "node:process";

type TopicId = string;
type TopicMetrics = Record<
  TopicId,
  { subscribe: number; publish: number; schema: object }
>;
type FilePath = string;
type Report = Record<FilePath, TopicMetrics>;

const reportsDir = join(process.cwd(), ".chirpybus");
const contracts = new Map<
  TopicId,
  { subscribe: number; publish: number; schema: object }
>();

// Read all the JSON files in .chirpybus, except contracts.json
const files = fs.readdirSync(reportsDir).filter((f) => f !== "contracts.json");
for (const file of files) {
  const report = JSON.parse(
    fs.readFileSync(join(reportsDir, file), "utf-8"),
  ) as Report;
  for (const filePath in report) {
    const metrics = report[filePath];
    for (const topicId in metrics) {
      const topic = metrics[topicId];
      if (contracts.has(topicId)) {
        const contract = contracts.get(topicId)!;
        contracts.set(topicId, {
          subscribe: contract.subscribe + topic.subscribe,
          publish: contract.publish + topic.publish,
          schema: contract.schema,
        });
      } else {
        contracts.set(topicId, topic);
      }
    }
  }
}
// Serialize the contracts to contracts.json
fs.writeFileSync(
  join(reportsDir, "contracts.json"),
  JSON.stringify({ contracts: Object.fromEntries(contracts) }),
);
