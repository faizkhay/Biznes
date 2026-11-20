// A mail sink for the local test stack (scripts/accounts-stack.sh): it accepts whatever Supabase
// Auth sends and writes each message to a file in the folder named, so a check can read the link
// in it. It speaks just enough SMTP for that. Never for real mail.
//
//   node supabase/local/mail-sink.mjs <folder> [port]
import { mkdirSync, readdirSync, writeFileSync } from "node:fs";
import net from "node:net";
import { join } from "node:path";

const dir = process.argv[2] ?? ".accounts-stack/mail";
const port = Number(process.argv[3] ?? 2525);
mkdirSync(dir, { recursive: true });
let n = readdirSync(dir).length;

net
  .createServer((socket) => {
    let inBody = false;
    let buffer = "";
    socket.write("220 biznes mail sink\r\n");
    socket.on("data", (chunk) => {
      buffer += chunk.toString("utf8");
      for (;;) {
        if (inBody) {
          const end = buffer.indexOf("\r\n.\r\n");
          if (end < 0) return;
          writeFileSync(join(dir, `${String(++n).padStart(4, "0")}.eml`), buffer.slice(0, end));
          buffer = buffer.slice(end + 5);
          inBody = false;
          socket.write("250 kept\r\n");
          continue;
        }
        const nl = buffer.indexOf("\r\n");
        if (nl < 0) return;
        const command = buffer.slice(0, nl).slice(0, 4).toUpperCase();
        buffer = buffer.slice(nl + 2);
        if (command === "DATA") {
          inBody = true;
          socket.write("354 go on\r\n");
        } else if (command === "QUIT") {
          socket.end("221 bye\r\n");
        } else {
          socket.write("250 ok\r\n");
        }
      }
    });
    socket.on("error", () => {});
  })
  .listen(port, "0.0.0.0", () => console.log(`mail sink on ${port}, writing to ${dir}`));
