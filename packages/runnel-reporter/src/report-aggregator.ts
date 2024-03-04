#!/usr/bin/env node

/**
 * Target files: ~/.runnel/*.json (except contract.json)
 * The JSON file contains the report data for each file.
 * Example:
 * {"/src/App.test.tsx":{"fullName":{"subscribe":1,"publish":0,"schema":{"type":"object","properties":{"firstName":{"type":"string"},"lastName":{"type":"string"}},"required":["firstName","lastName"],"additionalProperties":false,"$schema":"http://json-schema.org/draft-07/schema#"}},"count":{"subscribe":0,"publish":1,"schema":{"type":"number"}}}}
 * Another file example would be:
 * {"/src/Another.test.tsx":{"fullName":{"subscribe":0,"publish":1,"schema":{"type":"object","properties":{"firstName":{"type":"string"},"lastName":{"type":"string"}},"required":["firstName","lastName"],"additionalProperties":false,"$schema":"http://json-schema.org/draft-07/schema#"}},"count":{"subscribe":1,"publish":1,"schema":{"type":"number"}}}}
 * Then aggregate the data and generate a summary report as "contract.json"
 * Example:
 * {"contract":{"fullName":{"subscribe":1,"publish":1,"schema":{"type":"object","properties":{"firstName":{"type":"string"},"lastName":{"type":"string"}},"required":["firstName","lastName"],"additionalProperties":false,"$schema":"http://json-schema.org/draft-07/schema#"}},"count":{"subscribe":1,"publish":2,"schema":{"type":"number"}}}}
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

const reportsDir = join(process.cwd(), ".runnel");
const contract = new Map<
  TopicId,
  { subscribe: number; publish: number; schema: object }
>();

// Read all the JSON files in .runnel, except contract.json
const files = fs.readdirSync(reportsDir).filter((f) => f !== "contract.json");
for (const file of files) {
  const report = JSON.parse(
    fs.readFileSync(join(reportsDir, file), "utf-8"),
  ) as Report;
  for (const filePath in report) {
    const metrics = report[filePath];
    for (const topicId in metrics) {
      const topic = metrics[topicId];
      if (contract.has(topicId)) {
        const _contract = contract.get(topicId)!;
        contract.set(topicId, {
          subscribe: _contract.subscribe + topic.subscribe,
          publish: _contract.publish + topic.publish,
          schema: _contract.schema,
        });
      } else {
        contract.set(topicId, topic);
      }
    }
  }
}
// Serialize the contracts to contracts.json
fs.writeFileSync(
  join(reportsDir, "contract.json"),
  JSON.stringify({ contract: Object.fromEntries(contract) }),
);
