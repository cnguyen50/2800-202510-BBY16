const fs   = require('fs').promises;   // Node ≥ v10
const path = require('path');

/**
 * Return an array of N random .svg filenames from a directory.
 * @param {string} dir   – absolute path to the folder
 * @param {number} min   – minimum number of svgs (default 5)
 * @param {number} max   – maximum number of svgs (default 10)
 * @returns {Promise<string[]>}
 */
async function getRandomSvgs(dir, min = 5, max = 10) {
  const files = await fs.readdir(dir);               // throws if bad path
  const svgs  = files.filter(f => f.endsWith('.svg'));

  if (svgs.length === 0) return [];                  // nothing in folder

  const shuffled = svgs.sort(() => Math.random() - 0.5);
  const count    = Math.floor(Math.random() * (max - min + 1)) + min;
  return shuffled.slice(0, count);
}

module.exports = getRandomSvgs;
