import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { renderEventPitch } from "../dist/event-pitch.js";
test("event pitch identifies observed participants without inventing an interceptor or full formation", () => {
  const dom = new JSDOM('<svg><g id="events"></g></svg>'),
    group = dom.window.document.getElementById("events"),
    names = { home: ["Passer", "Receiver"] };
  const event = {
    type: "pass",
    team: "home",
    player: 1,
    recipient: 2,
    from: [35, 20],
    to: [62, 38],
    complete: true,
  };
  renderEventPitch(group, event, names);
  assert.equal(group.querySelectorAll("path").length, 2);
  assert.match(group.textContent, /Passer/);
  assert.match(group.textContent, /Receiver/);
  assert.ok(group.querySelector("line"));
  renderEventPitch(group, { ...event, complete: false }, names);
  assert.equal(group.querySelectorAll("path").length, 1);
  assert.doesNotMatch(group.textContent, /Receiver/);
  assert.equal(group.querySelectorAll("circle").length, 1);
  renderEventPitch(group, null, names);
  assert.equal(group.children.length, 0);
  dom.window.close();
});

test("short passes keep both participant labels separated and inside the pitch", () => {
  const dom = new JSDOM('<svg><g id="events"></g></svg>'),
    group = dom.window.document.getElementById("events");
  for (const point of [
    [2, 2],
    [50, 3],
    [103, 65],
    [50, 35],
  ]) {
    renderEventPitch(
      group,
      {
        type: "pass",
        team: "home",
        player: 1,
        recipient: 2,
        from: point,
        to: [point[0] + 1, point[1] + 1],
        complete: true,
      },
      { home: ["Amir Cole", "Isaac Hart"] },
    );
    const boxes = [...group.querySelectorAll("[data-participant-label]")].map((n) =>
      Object.fromEntries(
        ["x", "y", "width", "height"].map((k) => [k, Number(n.getAttribute(k))]),
      ),
    );
    assert.equal(boxes.length, 2);
    for (const b of boxes) {
      assert.ok(b.x >= 0 && b.y >= 0 && b.x + b.width <= 105 && b.y + b.height <= 68);
    }
    const [a, b] = boxes;
    assert.ok(
      a.y + a.height <= b.y ||
        b.y + b.height <= a.y ||
        a.x + a.width <= b.x ||
        b.x + b.width <= a.x,
    );
  }
  dom.window.close();
});
