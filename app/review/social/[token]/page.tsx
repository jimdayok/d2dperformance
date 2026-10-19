import {loadGuestReview} from "@/lib/social-review/guest";
import {SocialClientReview} from "@/components/d2d-platform/social-client-review";
export const dynamic="force-dynamic";
export const metadata={title:"Private social review | D2D Marketing",robots:{index:false,follow:false},referrer:"no-referrer"};
export default async function ClientReviewPage({params}:{params:Promise<{token:string}>}){
 const {token}=await params;const payload=await loadGuestReview(token);
 if(!payload)return <main style={{maxWidth:600,margin:"80px auto",padding:30,fontFamily:"sans-serif"}}><h1>This private review link is unavailable.</h1><p>It may have expired or been revoked. Ask D2D Marketing for a fresh invitation.</p><a href="mailto:socialpages@d2dmktg.com">socialpages@d2dmktg.com</a></main>;
 return <SocialClientReview token={token} initial={payload}/>;
}
