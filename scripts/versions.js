const path = require("path");
const fs = require('fs');

const root = path.resolve(__dirname, "..");
const lock = JSON.parse(fs.readFileSync(path.join(root, "package-lock.json")));
const dest = path.join(root, "src", "versions.ts")

var code = ["export function versions() {",
              "    return {",
              `        dfoptim: "${lock.packages["node_modules/dfoptim"].version}",`,
              `        dopri: "${lock.packages["node_modules/dopri"].version}",`,
              `        odin: "${lock.version}",`,
              "    };",
              "}"];

fs.writeFileSync(dest, code.map((x) => x + "\n").join(""));
