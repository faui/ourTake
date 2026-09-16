import { spawn } from 'node:child_process';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { validateManualEntries } from '../lib/player-model.mjs';

export const styles = ['clean','pulse','mono','study'];
export function run(program,args,timeout=600000) {
  return new Promise((resolve,reject)=>{
    const child=spawn(program,args,{windowsHide:true,stdio:['ignore','pipe','pipe']});
    let out='',err='';
    child.stdout.on('data',d=>{out=(out+d).slice(-2000000)});
    child.stderr.on('data',d=>{err=(err+d).slice(-16000)});
    const timer=setTimeout(()=>{child.kill();reject(new Error('Media processing timed out. Try a shorter composition.'))},timeout);
    child.on('error',e=>{clearTimeout(timer);reject(e)});
    child.on('close',code=>{clearTimeout(timer);code===0?resolve(out):reject(new Error(`${program} failed (${code}): ${err.slice(-1200)}`))});
  });
}
export async function probe(file) {
 const info=JSON.parse(await run(process.env.FFPROBE_PATH||'ffprobe',['-v','error','-protocol_whitelist','file,pipe','-format_whitelist','mov,matroska,webm','-show_format','-show_streams','-of','json',file],45000));
 const v=info.streams.find(s=>s.codec_type==='video');
 if(!v)throw new Error('This file does not contain a supported video stream.');
 let duration=Number(info.format.duration||v.duration);
 // Browser WebM recordings often omit the duration header. Read packet timestamps instead.
 if(!Number.isFinite(duration)||duration<=0){const packets=await run(process.env.FFPROBE_PATH||'ffprobe',['-v','error','-protocol_whitelist','file,pipe','-format_whitelist','mov,matroska,webm','-select_streams','v:0','-show_entries','packet=pts_time,duration_time','-of','csv=p=0',file],120000);duration=packets.split(/\r?\n/).reduce((max,line)=>{const [pts,span]=line.split(',').map(Number);return Number.isFinite(pts)?Math.max(max,pts+(Number.isFinite(span)?span:1/30)):max},0)}
 if(!Number.isFinite(duration)||duration<=0)throw new Error('This recording has no usable duration.');
 return {duration,width:v.width,height:v.height,hasAudio:info.streams.some(s=>s.codec_type==='audio'),codec:v.codec_name,mime:info.format.format_name.includes('webm')||info.format.format_name.includes('matroska')?'video/webm':'video/mp4'};
}

// Deterministic, source-grounded editor. No invented sports events or synthesized frames.
export function planComposition(clips, options) {
 if(options.entries) return validateManualEntries(clips,options.entries);
 const duration=Math.max(5,Math.min(120,Number(options.duration)||30));
 const shot=options.style==='pulse'?2.5:options.style==='study'?8:5;
 let pool=clips.filter(c=>options.scope!=='camera'||c.ownerId===options.memberId);
 let windows=[];
 if(options.scope==='person') {
   windows=pool.flatMap(c=>(c.tags||[]).filter(t=>t.memberId===options.memberId).map(t=>({clip:c,from:t.start,to:Math.min(t.end,c.duration)})));
 } else if(options.useMarks!==false && pool.some(c=>(c.marks||[]).length)) {
   windows=pool.flatMap(c=>(c.marks||[]).map(t=>({clip:c,from:Math.max(0,t-3),to:Math.min(c.duration,t+5)})));
 } else {
   windows=pool.map(c=>({clip:c,from:0,to:c.duration}));
 }
 windows=windows.filter(w=>w.to-w.from>.15).sort((a,b)=>a.clip.startTime+a.from*1000-b.clip.startTime-b.from*1000);
 if(!windows.length) throw new Error(options.scope==='person'?'Tag the intervals featuring you in Footage first.':'Add footage or mark more usable moments first.');
 const total=windows.reduce((a,w)=>a+w.to-w.from,0),target=Math.min(duration,total);
 const entries=[]; let remaining=target;
 const used=new Map();
 // Traverse timeline bins and alternate available angles. Retain full source-frame bounds.
 const min=Math.min(...windows.map(w=>w.clip.startTime+w.from*1000));
 const max=Math.max(...windows.map(w=>w.clip.startTime+w.to*1000));
 const count=Math.ceil(target/shot);
 for(let i=0;i<count&&remaining>.1;i++) {
   const time=min+(max-min)*(count===1?0:i/count);
   let candidates=windows.filter(w=>w.clip.startTime+w.from*1000<=time && w.clip.startTime+w.to*1000>time);
   if(!candidates.length)candidates=windows;
   const sorted=[...candidates].sort((a,b)=>(used.get(a.clip.id)||0)-(used.get(b.clip.id)||0));
   let selected=null;
   for(const w of sorted){
     const previous=entries.filter(e=>e.clipId===w.clip.id);
     let start=Math.max(w.from,Math.min((time-w.clip.startTime)/1000,w.to-Math.min(shot,w.to-w.from)));
     for(const e of previous) if(start<e.start+e.duration && start+shot>e.start) start=e.start+e.duration;
     const len=Math.min(shot,remaining,w.to-start);
     if(len>.15){selected={w,start,len};break;}
   }
   if(!selected)continue;
   const {w,start,len}=selected;entries.push({clipId:w.clip.id,start,duration:len,globalStart:w.clip.startTime+start*1000});used.set(w.clip.id,(used.get(w.clip.id)||0)+len);remaining-=len;
 }
 // Never repeat source to manufacture the requested duration.
 if(!entries.length)throw new Error('No usable footage remains for this selection.');
 return {entries,duration:entries.reduce((s,e)=>s+e.duration,0),requestedDuration:duration,method:options.scope==='person'?'participant-tagged':windows.some(w=>w.from>0)?'marked-moments':'timeline-sampled'};
}

export async function renderComposition(job,clips,folder,onProgress=()=>{}) {
 await mkdir(folder,{recursive:true});
 const plan=planComposition(clips,job); await writeFile(join(folder,'edit.json'),JSON.stringify(plan,null,2));
 const portrait=job.aspect!=='landscape',w=portrait?1080:1920,h=portrait?1920:1080;
 const grade=job.style==='mono'?',hue=s=0,eq=contrast=1.08':job.style==='pulse'?',eq=saturation=1.12:contrast=1.035':'';
 const parts=[];
 for(let i=0;i<plan.entries.length;i++){
   const e=plan.entries[i],clip=clips.find(c=>c.id===e.clipId),path=join(folder,`part-${i}.mp4`);
   const args=['-y','-v','error','-protocol_whitelist','file,pipe','-format_whitelist','mov,matroska,webm','-ss',String(e.start),'-i',clip.path];
   if(!clip.hasAudio)args.push('-f','lavfi','-i','anullsrc=channel_layout=stereo:sample_rate=48000');
   // Fit preserves players at frame edges. Soft background fills portrait canvas without inventing action.
   const vf=portrait?`[0:v]split=2[bg][fg];[bg]scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h},boxblur=24:2[back];[fg]scale=${w}:${h}:force_original_aspect_ratio=decrease[front];[back][front]overlay=(W-w)/2:(H-h)/2,setsar=1,fps=30${grade}[v]`:`[0:v]scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30${grade}[v]`;
   args.push('-filter_complex',vf,'-map','[v]','-map',clip.hasAudio?'0:a:0':'1:a:0','-t',String(e.duration),'-c:v','libx264','-preset','fast','-crf','18','-maxrate','24M','-bufsize','48M','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-ar','48000','-ac','2','-af',`aresample=async=1:first_pts=0,afade=t=in:d=0.02,afade=t=out:st=${Math.max(0,e.duration-.02)}:d=0.02`,'-movflags','+faststart',path);
   await run(process.env.FFMPEG_PATH||'ffmpeg',args);parts.push(path);onProgress(Math.round((i+1)/plan.entries.length*90));
 }
 const list=join(folder,'concat.txt');await writeFile(list,parts.map((_,i)=>`file 'part-${i}.mp4'`).join('\n'));
 const output=join(folder,'ourframe.mp4');
 // ffmpeg's concat demuxer resolves relative entries against the list's directory
 // but only recognizes '/' as the separator; a backslash Windows path makes it
 // resolve against the process cwd instead and every entry fails with ENOENT.
 await run(process.env.FFMPEG_PATH||'ffmpeg',['-y','-v','error','-f','concat','-safe','1','-i',list.replaceAll('\\','/'),'-c','copy','-movflags','+faststart',output]);
 const info=await probe(output);await Promise.all(parts.map(path=>rm(path,{force:true})));await rm(list,{force:true});
 return {path:output,...info,plan};
}
