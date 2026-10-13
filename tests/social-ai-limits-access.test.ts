import {describe,it,expect,vi,beforeEach} from 'vitest';
const m=vi.hoisted(()=>({isAdmin:vi.fn(),user:vi.fn(),access:vi.fn(),admin:vi.fn()}));
vi.mock('@/lib/d2d-platform/access',()=>({getPlatformAdminStatus:m.isAdmin,requireProductAccess:m.access}));
vi.mock('@/lib/site-manager/access',()=>({getCurrentUser:m.user}));
vi.mock('@/lib/supabase/admin',()=>({createSupabaseAdminClient:m.admin}));
import {POST} from '../app/api/social-ai/limits/route';
describe('customer limit administration',()=>{
 beforeEach(()=>{vi.clearAllMocks();m.user.mockResolvedValue({id:'f0c40b16-c544-488e-b3ab-d9592e101380'});m.isAdmin.mockResolvedValue(false)});
 it('rejects customer managers without attempting a database write',async()=>{const response=await POST(new Request('https://webadmin.d2dmktg.com/api/social-ai/limits',{method:'POST',headers:{origin:'https://webadmin.d2dmktg.com'},body:JSON.stringify({organizationId:'209800de-4a2e-41cd-99a7-53bdf5fff3d1',daily_limit:100})}));expect(response.status).toBe(403);expect(m.admin).not.toHaveBeenCalled()});
 it('rejects cross-origin changes even for an administrator',async()=>{m.isAdmin.mockResolvedValue(true);const response=await POST(new Request('https://webadmin.d2dmktg.com/api/social-ai/limits',{method:'POST',headers:{origin:'https://external.example'},body:'{}'}));expect(response.status).toBe(403);expect(m.admin).not.toHaveBeenCalled()});
 it('rejects out-of-range limits before a write',async()=>{m.isAdmin.mockResolvedValue(true);const response=await POST(new Request('https://webadmin.d2dmktg.com/api/social-ai/limits',{method:'POST',headers:{origin:'https://webadmin.d2dmktg.com'},body:JSON.stringify({organizationId:'209800de-4a2e-41cd-99a7-53bdf5fff3d1',enabled:true,video_enabled:true,daily_limit:100000,monthly_limit:60,concurrent_limit:2})}));expect(response.status).toBe(400);expect(m.admin).not.toHaveBeenCalled()});
});
