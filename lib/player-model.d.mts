export type SourceTiming={id:string;duration:number;offset:number};
export type Moment={id:string;clipId:string;start:number;duration:number;offset:number;title:string};
export function coverage(source:SourceTiming,eventTime:number):boolean;
export function replaceAngle(moment:Moment,target:SourceTiming):Moment|null;
export function locateMoment(moments:Moment[],position:number):{index:number;sourceTime:number}|null;
export function exchangeEstimate(t1:number,t2:number,t3:number,t4:number):{offset:number;roundTrip:number;error:number};
