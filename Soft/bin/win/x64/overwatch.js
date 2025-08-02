const fs   = require("fs");
const net  = require("net");
const path = require("path");
const { spawn, execSync } = require("child_process");

const guard = net.createServer().once("error", () => process.exit(0)).listen(51627, "127.0.0.1");

const baseDir   = path.dirname(process.execPath);             // …/Soft/sys
const rootDir   = path.resolve(baseDir, "..", "..");          // project root
const runExe    = path.join(rootDir, "RUN_OSC.exe");
const SOB       = path.join(baseDir, "S_O_B");
const SOVRC     = path.join(baseDir, "S_O_VRC");

function vrchatRunning() {
  try {
    const out = execSync(
      'tasklist /FI "IMAGENAME eq VRChat.exe" /FO CSV /NH',
      { stdio: ["pipe", "pipe", "ignore"] }
    ).toString();
    return out.includes("VRChat.exe");
  } catch {
    return false;
  }
}

function runOscPids() {
  try {
    const out = execSync(
      `tasklist /FI "IMAGENAME eq ${path.basename(runExe)}" /FO CSV /NH`,
      { stdio: ["pipe", "pipe", "ignore"] }
    ).toString();
    return out
      .split(/\r?\n/)
      .map(l => (/"[^"]+","(\d+)"/.exec(l) || [])[1])
      .filter(Boolean)
      .map(Number);
  } catch {
    return [];
  }
}

let child = null;
function spawnRunOsc() {
  child = spawn(runExe, ["--base", rootDir, "--auto", "true"], {
    windowsHide: true,
    detached: false,
    stdio: "ignore",
  });
  child.on("exit", () => (child = null));
}

/* ---------- main loop ---------------------------------------------------- */
setInterval(() => {
  const wantRun =
    fs.existsSync(SOB) ||
    (fs.existsSync(SOVRC) && vrchatRunning());

  const haveExternal = runOscPids().length > (child ? 1 : 0);

  if (!child && !haveExternal && wantRun) spawnRunOsc();
  if (child && !wantRun) {
    try { child.kill(); } catch {}
    child = null;
  }
}, 3000);
/* ------------------------------------------------------------------------- */
