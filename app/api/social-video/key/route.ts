import {NextResponse} from 'next/server';
import {writeFile} from 'node:fs/promises';
import {z} from 'zod';
import {getCurrentUser} from '@/lib/site-manager/access';
import {requireProductAccess} from '@/lib/d2d-platform/access';
import {isSameOrigin} from '@/lib/social-ai/request';
import {checkWaveBalance} from '@/lib/social-ai/wavespeed';
export async function POST(request:Request){
 try{
  const user=await getCurrentUser();if(!user)return NextResponse.json({error:'Sign in first.'},{status:401});
  if(!isSameOrigin(request))return NextResponse.json({error:'Refresh and try again.'},{status:403});
  if(process.env.D2D_STUDIO_STAGING!=='true'||!process.env.WAVESPEED_KEY_FILE)throw Error('Use the server configuration to connect WaveSpeed.');
  if(Number(request.headers.get('content-length'))>2000)throw Error('Invalid connection request.');
  const input=z.object({organizationId:z.string().uuid(),key:z.string().trim().min(20).max(300)}).parse(await request.json());
  const access=await requireProductAccess(input.organizationId,'social',['manager','creator']);if(access.role!=='platform_admin')return NextResponse.json({error:'D2D administrator access required.'},{status:403});
  const balance=await checkWaveBalance(input.key);
  await writeFile(process.env.WAVESPEED_KEY_FILE,input.key+'\n',{mode:0o600});
  return NextResponse.json({connected:true,balance,message:'WaveSpeed connected privately on the home server. No credits purchased.'});
 }catch{return NextResponse.json({error:'The WaveSpeed connection could not be verified or saved.'},{status:400})}
}
