const http = require("node:http");

const PORT = 8787;
const BACKEND_PORT = 8080;

const CALLBACK_PATH = "/api/payments/ecpay/notify";
const MAX_BODY_SIZE = 64 * 1024;

const server = http.createServer((req, res) => {
  // 只允許綠界付款通知路徑
  if (req.url !== CALLBACK_PATH) {
    res.writeHead(404);
    res.end("Not Found");
    return;
  }

  // 只允許 POST
  if (req.method !== "POST") {
    res.writeHead(405);
    res.end("Method Not Allowed");
    return;
  }

  // 綠界 AIO 通知使用表單格式
  const contentType = req.headers["content-type"] || "";

  if (
    !contentType.toLowerCase().startsWith("application/x-www-form-urlencoded")
  ) {
    res.writeHead(415);
    res.end("Unsupported Media Type");
    return;
  }

  const chunks = [];
  let totalSize = 0;
  let tooLarge = false;

  req.on("data", (chunk) => {
    if (tooLarge) {
      return;
    }

    totalSize += chunk.length;

    if (totalSize > MAX_BODY_SIZE) {
      tooLarge = true;
      res.writeHead(413);
      res.end("Request Too Large");
      return;
    }

    chunks.push(chunk);
  });

  req.on("end", () => {
    if (tooLarge) {
      return;
    }

    const body = Buffer.concat(chunks);

    // 轉發到本機 Spring Boot
    const upstream = http.request(
      {
        hostname: "127.0.0.1",
        port: BACKEND_PORT,
        path: CALLBACK_PATH,
        method: "POST",
        headers: {
          "Content-Type": contentType,
          "Content-Length": body.length,
        },
        timeout: 10000,
      },
      (upstreamResponse) => {
        res.writeHead(upstreamResponse.statusCode || 502, {
          "Content-Type":
            upstreamResponse.headers["content-type"] ||
            "text/plain; charset=utf-8",
        });

        upstreamResponse.pipe(res);
      },
    );

    upstream.on("timeout", () => {
      upstream.destroy(new Error("Spring Boot timeout"));
    });

    upstream.on("error", (error) => {
      console.error("Spring Boot connection error:", error.message);

      if (!res.headersSent) {
        res.writeHead(502);
        res.end("Bad Gateway");
      } else {
        res.destroy();
      }
    });

    upstream.end(body);
  });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log("================================");
  console.log("綠界付款通知專用入口已啟動");
  console.log("Port:", PORT);
  console.log("只允許:", CALLBACK_PATH);
  console.log("================================");
});
