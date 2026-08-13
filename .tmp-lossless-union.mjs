import fs from "node:fs";

const [mode, currentPath, incomingPath, outputPath] = process.argv.slice(2);

if (mode === "context") {
  const current = fs.readFileSync(currentPath, "utf8").replace(/\r\n/g, "\n");
  const incoming = fs.readFileSync(incomingPath, "utf8").replace(/\r\n/g, "\n");
  const split = (text) => {
    const starts = [...text.matchAll(/^## .+$/gm)].map((match) => match.index);
    const preamble = starts.length ? text.slice(0, starts[0]) : text;
    const sections = starts.map((start, index) => text.slice(start, starts[index + 1] ?? text.length).trimEnd());
    return { preamble, sections };
  };
  const currentParts = split(current);
  const incomingParts = split(incoming);
  const heading = (section) => section.split("\n", 1)[0];
  const seen = new Set(currentParts.sections.map(heading));
  const additions = incomingParts.sections.filter((section) => !seen.has(heading(section)));
  const result = `${currentParts.preamble.trimEnd()}\n\n${[...additions, ...currentParts.sections].join("\n\n")}\n`;
  fs.writeFileSync(outputPath, result, "utf8");
} else if (mode === "parity") {
  const current = JSON.parse(fs.readFileSync(currentPath, "utf8"));
  const incoming = JSON.parse(fs.readFileSync(incomingPath, "utf8"));
  const byId = new Map(current.contracts.map((contract) => [contract.id, contract]));
  for (const contract of incoming.contracts) {
    if (!byId.has(contract.id)) {
      current.contracts.push(contract);
      byId.set(contract.id, contract);
    }
  }
  current.version = Math.max(current.version ?? 0, incoming.version ?? 0);
  current.last_updated = [current.last_updated, incoming.last_updated].sort().at(-1);
  fs.writeFileSync(outputPath, `${JSON.stringify(current, null, 2)}\n`, "utf8");
} else {
  throw new Error(`Unknown mode: ${mode}`);
}
