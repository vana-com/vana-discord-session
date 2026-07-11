import { strict as assert } from "node:assert";
import test from "node:test";
import { CHAT_FIXTURE, CHANNELS } from "../src/data/chat.fixture";

test("chat fixture has messages for the demo feed", () => {
  assert.ok(CHAT_FIXTURE.length >= 3);
  for (const message of CHAT_FIXTURE) {
    assert.ok(message.id);
    assert.ok(message.author);
    assert.ok(message.body);
  }
});

test("channel list includes the demo channel", () => {
  assert.ok((CHANNELS as readonly string[]).includes("ai-chat"));
});
