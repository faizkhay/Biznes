// robots.txt, read the way RFC 9309 says to.
//
// A file is groups of "User-agent" lines followed by rules. The crawler obeys the group that names
// it; if none does, the group for "*". Among the rules that match a path the longest wins, and
// "Allow" wins a tie. "*" in a rule matches anything and "$" pins the end.

/** Turns a robots.txt body into { groups: [{ agents, rules, delay }] }. */
export function parseRobots(text) {
  const groups = [];
  let current = null;
  let lastWasAgent = false;
  for (const raw of String(text).split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, "").trim();
    if (!line) continue;
    const at = line.indexOf(":");
    if (at < 0) continue;
    const field = line.slice(0, at).trim().toLowerCase();
    const value = line.slice(at + 1).trim();
    if (field === "user-agent") {
      if (!current || !lastWasAgent) {
        current = { agents: [], rules: [], delay: null };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      lastWasAgent = true;
      continue;
    }
    lastWasAgent = false;
    if (!current) continue;
    if (field === "allow" || field === "disallow") {
      // An empty Disallow allows everything, so it adds no rule.
      if (value) current.rules.push({ allow: field === "allow", path: value });
    } else if (field === "crawl-delay") {
      const seconds = Number(value);
      if (Number.isFinite(seconds) && seconds >= 0) current.delay = seconds;
    }
  }
  return { groups };
}

function matches(rule, path) {
  let pattern = "";
  for (const ch of rule) {
    if (ch === "*") pattern += ".*";
    else if (ch === "$") pattern += "$";
    else pattern += ch.replace(/[.+?^{}()|[\]\\]/g, "\\$&");
  }
  try {
    return new RegExp(`^${pattern}`).test(path);
  } catch {
    return false;
  }
}

/** The group that applies to a crawler with this name: its own if the file has one, else "*". */
export function groupFor(robots, token) {
  const name = token.toLowerCase();
  const own = robots.groups.filter((g) => g.agents.some((a) => a !== "*" && name.includes(a)));
  if (own.length) return { agents: own.flatMap((g) => g.agents), rules: own.flatMap((g) => g.rules), delay: own.find((g) => g.delay != null)?.delay ?? null };
  const any = robots.groups.filter((g) => g.agents.includes("*"));
  return { agents: ["*"], rules: any.flatMap((g) => g.rules), delay: any.find((g) => g.delay != null)?.delay ?? null };
}

/** Whether this path may be fetched under these rules. */
export function allowed(group, path) {
  let best = null;
  for (const rule of group.rules) {
    if (!matches(rule.path, path)) continue;
    if (!best || rule.path.length > best.path.length || (rule.path.length === best.path.length && rule.allow && !best.allow)) best = rule;
  }
  return best ? best.allow : true;
}
