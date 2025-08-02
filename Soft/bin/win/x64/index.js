/*
  ___                      _            _                  _                     ___    ___    ___ 
 | __|  _  _   _ _   ___  ( )  ___     /_\   __ __  __ _  | |_   __ _   _ _     / _ \  / __|  / __|
 | _|  | || | | '_| / _ \ |/  (_-<    / _ \  \ V / / _` | |  _| / _` | | '_|   | (_) | \__ \ | (__ 
 |_|    \_,_| |_|   \___/     /__/   /_/ \_\  \_/  \__,_|  \__| \__,_| |_|      \___/  |___/  \___|



  Hello curious individual! This is my lazily thrown together piece of software, that Sends your current time as floats thru AvatarOSC to your VRChat Avatar.

  Here's my socials:

  YOUTUBE     : https://youtube.com/@furofloof
  BLUESKY     : https://bluesky.social/profile/furofloof.com
  GIT-HUB     : https://github.com/furofloof
  FLOOFWORKS  : https://floof.works/@furofloof
  DISCORD     : @furofloof

  And my personal website: https://furofloof.com


  If you're curious enough to read thru my dogwater code, i'd be happy to get feedback :D
  here's my email if you want to send me silly stuff!

  <furothelucario@gmail.com>

  Please take a look at README.txt and LICENSE.txt for more information.
*/

const fs   = require("fs");
const path = require("path");
const osc  = require("osc");
const { spawn, execSync } = require("child_process");

const isPkg     = typeof process.pkg !== "undefined";

function getCliArg(name){
  const i = process.argv.indexOf(name);
  return i!==-1 && process.argv[i+1] ? process.argv[i+1] : null;
}

const autoStart = getCliArg("--auto") === "true";
const baseDir   = getCliArg("--base") || path.dirname(process.execPath);

try{
  const exeName = path.basename(process.execPath);
  const csv = execSync(`tasklist /FI "IMAGENAME eq ${exeName}" /FO CSV /NH`)
               .toString();
  csv.split(/\r?\n/).forEach(l=>{
    const m=l.match(/^"[^"]+","(\d+)"/);
    if(m){
      const pid=parseInt(m[1],10);
      if(pid && pid!==process.pid){
        try{execSync(`taskkill /PID ${pid} /T /F`,{stdio:"ignore"});}catch{}
      }
    }
  });
}catch{}

const CONFIG_PATH = path.join(baseDir,"Soft","dev","config.cfg");
const LOG_PATH    = path.join(baseDir,"Soft","dev","logs.txt");

fs.mkdirSync(path.dirname(LOG_PATH),{recursive:true});
const logStream = fs.createWriteStream(LOG_PATH,{flags:"w"});
function ts(){
  const d=new Date();
  return `[${d.getDate()}.${d.getMonth()+1}.${d.getFullYear()}@${d.getHours()}:${String(d.getMinutes()).padStart(2,"0")}]`;
}
["log","info","warn","error"].forEach(fn=>{
  const orig=console[fn].bind(console);
  console[fn]=(...a)=>{orig(...a);logStream.write(`${ts()} : ${a.join(" ")}\n`);}
});
process.on("exit",()=>logStream.end());

const SYS_DIR   = path.join(baseDir,"Soft","sys");
const SETUP_DONE= path.join(SYS_DIR,"SETUP_DONE");
const SOB_PATH  = path.join(SYS_DIR,"S_O_B");
const SOVRC_PATH= path.join(SYS_DIR,"S_O_VRC");

fs.mkdirSync(SYS_DIR,{recursive:true});

function launchSetup(cb){
  const setupBat = path.join(SYS_DIR,"SETUP.bat");
  if(!fs.existsSync(setupBat)){
    console.error("Setup script missing: "+setupBat);
    return cb();
  }
  console.log("Launching first-run setup …");
  spawn("cmd",["/c",setupBat],{stdio:"inherit"});
  const poll = setInterval(()=>{
    if(fs.existsSync(SETUP_DONE)){
      clearInterval(poll);
      console.log("Setup complete, continuing …");
      cb();
    }
  },500);
}

(function bootstrap(){
  if(!fs.existsSync(SETUP_DONE)){
    launchSetup(continueInit);
  }else{
    continueInit();
  }
})();

function continueInit(){

  const startupDir = path.join(process.env.APPDATA,"Microsoft","Windows","Start Menu","Programs","Startup");
  const vbsPath    = path.join(startupDir,"OSC_STARTUP.vbs");
  if(fs.existsSync(SOB_PATH) || fs.existsSync(SOVRC_PATH)){
    if(!fs.existsSync(vbsPath)){
      const autoExe = path.join(baseDir,"Soft","sys","AUTORUN.exe");
      const cmdLine = `"${autoExe.replace(/"/g,'""')}" --base "${baseDir}" --auto true`;
      fs.writeFileSync(
        vbsPath,
        `Set WshShell = CreateObject("WScript.Shell")\r\n` +
        `WshShell.Run "${cmdLine.replace(/"/g,'""')}", 0, False\r\n`
      );
      console.log("✓ Added Start-on-Boot launcher");
    }
  }else{
    try{
      if(fs.existsSync(vbsPath)){
        fs.unlinkSync(vbsPath);
        console.log("✗ Removed Start-on-Boot launcher");
      }
    }catch{}
  }

  const cfg = (()=>{try{return JSON.parse(fs.readFileSync(CONFIG_PATH,"utf8"));}catch(e){console.error(e.message)||process.exit(1)}})();
  const PORT = cfg.OSCPort|0;
  if(!(PORT>0 && PORT<65536)){console.error("Bad port");process.exit(1);}
  const VRCHAT_IP  = cfg.IP?.trim()||"127.0.0.1";
  const PUSH_EVERY = cfg.TIME_BETWEEN_UPDATES>0 ? cfg.TIME_BETWEEN_UPDATES : 1000;

  const udp = new osc.UDPPort({
    localAddress:"0.0.0.0",
    localPort:0,
    remoteAddress:VRCHAT_IP,
    remotePort:PORT,
    metadata:true
  });

  udp.open();
  udp.on("ready",()=>{
    console.log(`Running OSC @ ${VRCHAT_IP}:${PORT}`);
    const tick = ()=>{
      const n=new Date();
      [["Hours",24],["Minutes",60],["Seconds",60]].forEach(([p,d])=>{
        udp.send({
          address:`/avatar/parameters/FW_P_${p}`,
          args:[{type:"f",value:n[`get${p}`]()/d}]
        });
      });
    };
    tick();
    setInterval(tick,PUSH_EVERY);
  });
}
