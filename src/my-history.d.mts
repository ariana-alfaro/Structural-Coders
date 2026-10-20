export type LiveEntry={key:string;title:string;finished:string;score:number;correct:number;total:number;position:number;of:number};
export type PracticeEntry={quizId:string;revision:number;title:string;nick:string;score:number;correct:number;total:number;finished:string};
export type History={evals:string[];live:LiveEntry[];practices:PracticeEntry[]};
type Store=Pick<Storage,'getItem'|'setItem'|'removeItem'>;
export function readHistory(storage?:Store):History;
export function rememberEval(token:string,storage?:Store):History;
export function rememberLive(entry:LiveEntry,storage?:Store):History;
export function rememberPractice(entry:PracticeEntry,storage?:Store):History;
export function clearHistory(storage?:Store):History;
