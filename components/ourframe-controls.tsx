'use client';
import { Select,SelectContent,SelectItem,SelectTrigger,SelectValue } from '@/components/ui/select';
export function Choice({label,value,onChange,options,disabled=false}:{label:string;value:string;onChange:(value:string)=>void;options:{value:string;label:string}[];disabled?:boolean}){
 return <div className="field"><span>{label}</span><Select value={value} onValueChange={v=>v&&onChange(v)} disabled={disabled} items={options}><SelectTrigger aria-label={label} className="choice"><SelectValue/></SelectTrigger><SelectContent>{options.map(o=><SelectItem value={o.value} key={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></div>
}
