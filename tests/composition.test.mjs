import test from 'node:test';
import assert from 'node:assert/strict';
import { planComposition } from '../server/composition.mjs';
const clips=[{id:'a',ownerId:'one',startTime:100000,duration:20,marks:[],tags:[{memberId:'two',start:8,end:12}]},{id:'b',ownerId:'two',startTime:100000,duration:20,marks:[],tags:[]}];
test('personal edits include only explicitly tagged intervals across other cameras',()=>{const p=planComposition(clips,{scope:'person',memberId:'two',duration:30,style:'clean'});assert.equal(p.duration,4);assert.ok(p.entries.every(e=>e.clipId==='a'&&e.start>=8&&e.start+e.duration<=12))});
test('camera filter is different from subject identification',()=>{const p=planComposition(clips,{scope:'camera',memberId:'two',duration:10,style:'pulse'});assert.ok(p.entries.every(e=>e.clipId==='b'))});
test('never fabricates duration or repeats the same source interval',()=>{const p=planComposition([clips[0]],{scope:'all',duration:120,style:'clean'});assert.ok(p.duration<=20);for(let i=0;i<p.entries.length;i++)for(let j=i+1;j<p.entries.length;j++){const a=p.entries[i],b=p.entries[j];assert.ok(a.start+a.duration<=b.start||b.start+b.duration<=a.start)}});
test('rejects a personal composition without tags',()=>assert.throws(()=>planComposition(clips,{scope:'person',memberId:'absent',duration:10}),/Tag/));
test('marked windows stay within source bounds',()=>{const p=planComposition([{...clips[0],marks:[.3,19.7]}],{scope:'all',duration:30,style:'pulse'});assert.ok(p.entries.every(e=>e.start>=0&&e.start+e.duration<=20))});
