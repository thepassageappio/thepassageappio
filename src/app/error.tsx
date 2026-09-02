"use client";
export default function ErrorPage({reset}:{error:Error&{digest?:string};reset:()=>void}){return <main className="centered-page"><p>Passage Authority</p><h1>We could not load this request.</h1><button type="button" onClick={reset}>Try again</button></main>}
