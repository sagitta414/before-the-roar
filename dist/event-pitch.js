// Draws only participants located by the current event; it never invents team tracking.
export function renderEventPitch(group, event, names) {
  group.replaceChildren();
  if (!event?.to) return;
  const ns = "http://www.w3.org/2000/svg";
  const make = (tag, attrs, text) => {
    const n = group.ownerDocument.createElementNS(ns, tag);
    for (const [key, value] of Object.entries(attrs)) n.setAttribute(key, value);
    if (text !== undefined) n.textContent = text;
    group.append(n);
    return n;
  };
  const color = event.team === "home" ? "#d5f577" : "#8fc7ff";
  if (event.from)
    make("line", {
      x1: event.from[0],
      y1: event.from[1],
      x2: event.to[0],
      y2: event.to[1],
      stroke: color,
      "stroke-width": 0.75,
      "stroke-dasharray": event.complete === false ? "1.5 1.5" : "none",
    });
  const labels = [];
  const marker = (point, number, label, caption, above = false) => {
    const [x, y] = point,
      shirt = make("path", {
        d: `M${x - 1.5} ${y - 2}l-1.4 1.2 .8 1.2 .6-.5v2.3h3v-2.3l.6.5 .8-1.2-1.4-1.2Z`,
        fill: color,
        stroke: "#10212b",
        "stroke-width": 0.25,
        role: "img",
        "aria-label": label,
      });
    const title = group.ownerDocument.createElementNS(ns, "title");
    title.textContent = label;
    shirt.append(title);
    make(
      "text",
      {
        x,
        y: y + 0.7,
        fill: "#0e1c29",
        "text-anchor": "middle",
        "font-size": 1.8,
        "font-weight": 800,
      },
      String(number),
    );
    const box = {
      x: Math.max(1, Math.min(66, x - 19)),
      y: Math.max(1, Math.min(57, above ? y - 14 : y + 5)),
      label,
      caption,
    };
    const previous = labels[0];
    if (
      previous &&
      Math.abs(box.x - previous.x) < 39 &&
      Math.abs(box.y - previous.y) < 11
    ) {
      box.y = previous.y + 11 <= 57 ? previous.y + 11 : previous.y - 11;
    }
    labels.push(box);
  };
  const actor = names[event.team]?.[event.player - 1];
  if (event.from && actor) marker(event.from, event.player, actor, "EVENT ORIGIN", true);
  if (
    event.type === "pass" &&
    event.complete === true &&
    Number.isInteger(event.recipient)
  ) {
    const receiver = names[event.team]?.[event.recipient - 1];
    if (receiver) marker(event.to, event.recipient, receiver, "COMPLETED RECEPTION");
  }
  for (const { x, y, label, caption } of labels) {
    make("rect", {
      x,
      y,
      width: 38,
      height: 9.5,
      rx: 1,
      fill: "#0b1522",
      opacity: 0.94,
      "data-participant-label": label,
    });
    make(
      "text",
      {
        x: x + 19,
        y: y + 4,
        fill: "#fff",
        "text-anchor": "middle",
        "font-size": 3.2,
        "font-weight": 700,
      },
      label,
    );
    make(
      "text",
      {
        x: x + 19,
        y: y + 7.5,
        fill: "#b8c8d9",
        "text-anchor": "middle",
        "font-size": 2.1,
      },
      caption,
    );
  }
  make("circle", {
    cx: event.to[0],
    cy: event.to[1],
    r: 0.85,
    fill: "#fff",
    stroke: "#15212e",
    "stroke-width": 0.3,
    "aria-label": "Recorded ball destination",
  });
}
