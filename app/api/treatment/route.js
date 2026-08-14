import {NextResponse} from 'next/server'; import {treatmentEvidence,profile} from '../../../lib/research';
export async function POST(req){try{const {cancer,treatment,limit=14}=await req.json();const papers=await treatmentEvidence(cancer,treatment,limit);return NextResponse.json({papers,profile:profile(papers)});}catch(e){return NextResponse.json({error:e.message},{status:400})}}
