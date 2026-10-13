import {describe,it,expect} from 'vitest';
import sharp from 'sharp';
import {composeGraphic,lines} from '../lib/social-ai/render';
describe('branded social graphics',()=>{
 it('keeps a real transparent logo visible and produces the required portrait dimensions',async()=>{
  const background=await sharp({create:{width:100,height:100,channels:3,background:'#fff'}}).png().toBuffer();
  const logo=await sharp({create:{width:100,height:25,channels:4,background:'#ff0000'}}).png().toBuffer();
  const result=await composeGraphic(background,logo,'A useful customer question','Meet our team','#2d2022');const meta=await sharp(result).metadata();expect(meta.width).toBe(1080);expect(meta.height).toBe(1350);
  const pixel=await sharp(result).extract({left:280,top:1260,width:1,height:1}).raw().toBuffer();expect(pixel[0]).toBeGreaterThan(180);expect(pixel[1]).toBeLessThan(90);
 });
 it('wraps headlines without losing the original words',()=>{const text='Clear customer questions deserve useful answers';expect(lines(text,18).join(' ')).toBe(text);expect(lines(text,18).length).toBeGreaterThan(1)});
});
