import {describe,it,expect} from 'vitest';
import {centralPeriodStart,reportedTokens,summarizeJobs} from '../lib/social-ai/usage';
describe('customer AI usage',()=>{
 it('does not turn missing historical usage into zero',()=>{expect(reportedTokens(null)).toBeNull();expect(reportedTokens({usage:{total_tokens:0}})).toBe(0);expect(reportedTokens({usage:{total_tokens:-1}})).toBeNull();expect(summarizeJobs([{created_at:'2026-10-13T07:00:00Z',copy_usage:{usage:{total_tokens:720}},image_usage:null},{created_at:'2026-10-12T07:00:00Z',copy_usage:{usage:{total_tokens:200}},image_usage:{usage:{total_tokens:1600}}}],'2026-10-13T05:00:00Z')).toEqual({monthRequests:2,dayRequests:1,reportedTokens:2520,unreportedJobs:1})});
 it('resets by Central dates rather than UTC and handles DST',()=>{expect(centralPeriodStart(new Date('2026-10-13T02:00:00Z'))).toEqual({day:'2026-10-12T05:00:00.000Z',month:'2026-10-01T05:00:00.000Z'});expect(centralPeriodStart(new Date('2026-11-02T18:00:00Z'))).toEqual({day:'2026-11-02T06:00:00.000Z',month:'2026-11-01T05:00:00.000Z'})});
});
