import {NextResponse} from 'next/server'; import {searchCancer} from '../../../lib/research';
export async function POST(req){try{const {cancer}=await req.json();return NextResponse.json(await searchCancer(cancer));}catch(e){return NextResponse.json({error:e.message||'Search failed.'},{status:400})}}
