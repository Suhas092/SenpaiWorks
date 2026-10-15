import { describe, it, expect } from 'vitest';
import { validateFields, replySchema } from '@/lib/validation';
describe('Admin validation',()=>{
 it('rejects empty required product names',()=>expect(validateFields([{key:'name',label:'Product name',required:true}],{name:'  '}).success).toBe(false));
 it('rejects negative inventory',()=>expect(validateFields([{key:'stock',label:'Stock',type:'number'}],{stock:-1}).success).toBe(false));
 it('requires a valid email before sending an admin reply',()=>expect(replySchema.safeParse({admin_reply:'Thanks for your feedback',email:''}).success).toBe(false));
 it('accepts an admin reply with a valid email',()=>expect(replySchema.safeParse({admin_reply:'Thank you',email:'customer@example.com'}).success).toBe(true));
});
