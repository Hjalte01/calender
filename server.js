const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const port = Number(process.env.PORT || 8000);
const host = process.env.HOST || "127.0.0.1";
const root = __dirname;
const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
};

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);

  if (url.pathname === "/import-ics") {
    await handleCalendarImport(url, response);
    return;
  }

  serveStatic(url.pathname, response);
});

server.listen(port, host, () => {
  console.log(`Calendar builder running at http://localhost:${port}`);
});

async function handleCalendarImport(url, response) {
  const calendarUrl = normalizeCalendarUrl(url.searchParams.get("url") || "");
  if (!calendarUrl) {
    send(response, 400, "Missing url");
    return;
  }

  if (!isAllowedCalendarUrl(calendarUrl)) {
    send(response, 400, "Only http, https, and webcal calendar links are supported");
    return;
  }

  try {
    const calendarResponse = await fetch(calendarUrl, {
      headers: {
        "User-Agent": "photo-calendar-builder/1.0",
      },
    });

    if (!calendarResponse.ok) {
      send(response, calendarResponse.status, "Calendar request failed");
      return;
    }

    send(response, 200, await calendarResponse.text(), "text/calendar; charset=utf-8");
  } catch (error) {
    send(response, 502, "Could not fetch calendar");
  }
}

function serveStatic(requestPath, response) {
  const pathname = requestPath === "/" ? "/index.html" : decodeURIComponent(requestPath);
  const filePath = path.resolve(root, `.${pathname}`);

  if (!filePath.startsWith(root) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    send(response, 404, "Not found");
    return;
  }

  const extension = path.extname(filePath);
  send(response, 200, fs.readFileSync(filePath), mimeTypes[extension] || "application/octet-stream");
}

function normalizeCalendarUrl(url) {
  return url.startsWith("webcal://") ? `https://${url.slice("webcal://".length)}` : url;
}

function isAllowedCalendarUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch (error) {
    return false;
  }
}

function send(response, status, body, contentType = "text/plain; charset=utf-8") {
  response.writeHead(status, {
    "Content-Type": contentType,
    "Cache-Control": "no-store",
  });
  response.end(body);
}
