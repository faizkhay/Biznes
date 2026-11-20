// The local test stack's front door (scripts/accounts-stack.sh), standing in for a Supabase
// project's own: /auth/v1 goes to Supabase Auth and /rest/v1 to PostgREST, as a hosted project
// routes them. Nothing else is behind it.
//
//   node supabase/local/gateway.mjs [port] [auth port] [rest port]
import http from "node:http";

const [port = 54321, auth = 9999, rest = 3001] = process.argv.slice(2).map(Number);
const routes = [
  ["/auth/v1", auth],
  ["/rest/v1", rest],
];

http
  .createServer((request, response) => {
    const route = routes.find(([prefix]) => request.url.startsWith(prefix));
    if (!route) {
      response.writeHead(404).end("no such route");
      return;
    }
    const [prefix, to] = route;
    const onward = http.request({ host: "127.0.0.1", port: to, method: request.method, path: request.url.slice(prefix.length) || "/", headers: { ...request.headers, host: `127.0.0.1:${to}` } }, (answer) => {
      response.writeHead(answer.statusCode ?? 502, answer.headers);
      answer.pipe(response);
    });
    onward.on("error", (error) => response.writeHead(502).end(String(error)));
    request.pipe(onward);
  })
  .listen(port, "127.0.0.1", () => console.log(`gateway on ${port}`));
