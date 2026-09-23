'use client'

import { useCallback, useRef, useState } from 'react'

type RecognitionLike={lang:string;continuous:boolean;interimResults:boolean;start:()=>void;stop:()=>void;onresult:((event:any)=>void)|null;onend:(()=>void)|null;onerror:(()=>void)|null}
export function useVoiceInput(onText:(text:string)=>void,continuous=false){
  const recognitionRef=useRef<RecognitionLike|null>(null);const [listening,setListening]=useState(false);const [supported,setSupported]=useState(true)
  const start=useCallback(()=>{const w=window as any;const Recognition=w.SpeechRecognition||w.webkitSpeechRecognition;if(!Recognition){setSupported(false);return}const recognition:RecognitionLike=new Recognition();recognition.lang='id-ID';recognition.continuous=continuous;recognition.interimResults=false;recognition.onresult=(event:any)=>{for(let i=event.resultIndex??0;i<(event.results?.length||0);i++){if(event.results[i]?.isFinal!==false){const transcript=event.results[i]?.[0]?.transcript?.trim();if(transcript)onText(transcript)}}};recognition.onend=()=>setListening(false);recognition.onerror=()=>setListening(false);recognitionRef.current=recognition;setListening(true);recognition.start()},[continuous,onText])
  const stop=useCallback(()=>{recognitionRef.current?.stop();setListening(false)},[])
  return{start,stop,toggle:listening?stop:start,listening,supported}
}
