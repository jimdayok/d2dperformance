import {describe,it,expect} from "vitest";
import {legacyCreative,legacyDeliveryLocked} from "@/lib/social-review/legacy";
describe("Existing social post media and delivery identity",()=>{
 it("retains exact artwork URLs, carousel order, alternate text and video recognition",()=>{expect(legacyCreative({mediaIds:[],legacyMedia:[{url:"https://example.test/one.jpg",altText:"Original artwork"},{url:"https://example.test/clip.mp4?download=1"}]})).toEqual([{url:"https://example.test/one.jpg",type:"image/jpeg",alt:"Original artwork"},{url:"https://example.test/clip.mp4?download=1",type:"video/mp4",alt:"Post creative"}]);});
 it("does not revive old artwork after an explicit creative replacement",()=>{expect(legacyCreative({mediaIds:["replacement"],legacyMedia:[{url:"https://example.test/old.jpg"}]})).toEqual([]);expect(legacyCreative({mediaIds:[]})).toEqual([]);});
 it("rejects malformed, insecure and executable media URLs",()=>{expect(legacyCreative({legacyMedia:[null,{}, {url:"javascript:alert(1)"},{url:"http://example.test/unsafe.jpg"},{url:"not-a-url"}]})).toEqual([]);});
 it("protects existing publishing schedules without locking ordinary review drafts",()=>{expect(legacyDeliveryLocked({source_legacy_item_id:"original",legacy_batch_status:"scheduled"})).toBe(true);expect(legacyDeliveryLocked({source_legacy_item_id:"original",legacy_batch_status:"client_review"})).toBe(false);expect(legacyDeliveryLocked({legacy_batch_status:"scheduled"})).toBe(false);});
});
