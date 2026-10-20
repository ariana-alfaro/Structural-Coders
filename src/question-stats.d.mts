export type QuestionStat={id:number;title:string;topic:string;type:string;position:number;answered:number;wrong:number;failRate:number|null};
export type QuizStats={quizId:string;revision:number;title:string;attempts:number;questions:QuestionStat[]};
export function questionStats(rows:{quizId?:string;revision?:number;quizTitle?:string;marks?:(boolean|null)[];questions?:{id:number;title:string;topic:string;type:string}[]}[]):QuizStats[];
