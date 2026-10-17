import test from "node:test";
import assert from "node:assert/strict";
import { recoveryProof } from "../dist/recovery-proof.js";

const completeRecord = () => ({
  workflow: {
    status: "complete",
    metrics: { model_calls: 4 },
    trace: [
      { role: "analyst", action: "model_handoff_completed", request_number: 1, execution_id: "exec-scout", latency_ms: 120 },
      { role: "guide", action: "model_handoff_completed", request_number: 2, execution_id: "exec-guide", latency_ms: 130 },
      { role: "director", action: "worker_interrupted", saved_roles: ["analyst", "guide", "math"], saved_model_requests: 2 },
      { role: "analyst", action: "saved_model_handoff_reused" },
      { role: "guide", action: "saved_model_handoff_reused" },
      { role: "reviewer", action: "model_handoff_completed", request_number: 3, execution_id: "exec-check", latency_ms: 140 },
      { role: "presenter", action: "model_handoff_completed", request_number: 4, execution_id: "exec-host", latency_ms: 150 },
      { role: "director", action: "four_model_handoff_completed" },
    ],
    posts: {
      analyst: { role: "analyst", engine: "azure_openai" },
      guide: { role: "guide", engine: "azure_openai" },
      math: { role: "math", engine: "calculated" },
      reviewer: { role: "reviewer", engine: "azure_openai", guard_engine: "evidence_rules" },
      presenter: { role: "presenter", engine: "azure_openai" },
    },
  },
});

test("recovery proof verifies a two-request checkpoint and two-request restart", () => {
  const proof = recoveryProof(completeRecord());
  assert.equal(proof.verified, true);
  assert.deepEqual([proof.before_interruption, proof.after_restart, proof.total_requests, proof.duplicate_requests], [2, 2, 4, 0]);
  assert.ok(proof.checks.every((check) => check.passed));
});

test("recovery proof fails closed when a saved specialist is called twice", () => {
  const record = completeRecord();
  record.workflow.trace.splice(5, 0, { role: "analyst", action: "model_handoff_completed", request_number: 3, execution_id: "exec-scout-again", latency_ms: 100 });
  record.workflow.metrics.model_calls = 5;
  const proof = recoveryProof(record);
  assert.equal(proof.verified, false);
  assert.ok(proof.checks.some((check) => !check.passed));
  assert.equal(proof.duplicate_requests, 1);
});
