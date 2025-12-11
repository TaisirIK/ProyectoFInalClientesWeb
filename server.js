const http = require('http');
const fs = require('fs');
const path = require('path');

const port = process.env.PORT || 8000;
const base = process.cwd();

const mime = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.map': 'application/octet-stream'
};

function send404(res) {
  res.statusCode = 404;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.end('404 Not Found');
}

const server = http.createServer((req, res) => {
  try {
    const urlPath = decodeURIComponent(req.url.split('?')[0]);
    let filePath = urlPath === '/' ? '/index.html' : urlPath;
    filePath = path.join(base, filePath);

    // Security: prevent path traversal
    if (!filePath.startsWith(base)) {
      send404(res);
      return;
    }

    fs.stat(filePath, (err, stats) => {
      if (err) {
        send404(res);
        return;
      }

      if (stats.isDirectory()) {
        filePath = path.join(filePath, 'index.html');
      }

      fs.readFile(filePath, (err2, data) => {
        if (err2) {
          send404(res);
          return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const type = mime[ext] || 'application/octet-stream';
        res.setHeader('Content-Type', type + (type.startsWith('text/') ? '; charset=utf-8' : ''));
        res.statusCode = 200;
        res.end(data);
      });
    });
  } catch (e) {
    send404(res);
  }
});

server.listen(port, () => {
  console.log(`Static server running at http://localhost:${port}/`);
});

// Graceful exit handling
process.on('SIGINT', () => process.exit());
process.on('SIGTERM', () => process.exit());
