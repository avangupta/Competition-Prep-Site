// utils/downloadFile.js
const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");
const crypto = require("crypto");

module.exports = function downloadFile(url) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const ext = path.extname(parsed.pathname) || ".txt";
    const filename = crypto.randomBytes(16).toString("hex") + ext;
    const filepath = path.join("uploads", filename);

    const file = fs.createWriteStream(filepath);
    const client = parsed.protocol === "https:" ? https : http;

    client.get(url, res => {
      if (res.statusCode !== 200) {
        reject(new Error("Failed to download file"));
        return;
      }

      res.pipe(file);

      file.on("finish", () => {
        file.close(() => {
          resolve({
            path: filepath,
            originalname: path.basename(parsed.pathname),
            mimetype: res.headers["content-type"] || "application/octet-stream",
            size: fs.statSync(filepath).size
          });
        });
      });
    }).on("error", err => {
      fs.unlink(filepath, () => reject(err));
    });
  });
};
