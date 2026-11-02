# สมุดบัญชีทีม (Next.js + Supabase)

เว็บบันทึกรายได้/รายจ่ายจากการแข่งของแต่ละทีม มีสมัครสมาชิก/ล็อกอิน ทุกคนในทีมเห็นข้อมูลร่วมกัน

## เริ่มใช้งาน
1. สมัคร supabase.com (ฟรี) แล้วสร้างโปรเจกต์ใหม่
2. เปิด **SQL Editor** วางเนื้อหาจาก `supabase/schema.sql` แล้วกด Run
3. (แนะนำตอนทดสอบ) ไปที่ **Authentication > Providers > Email** ปิด "Confirm email" จะได้สมัครแล้วเข้าได้เลย
4. ไปที่ **Project Settings > API** คัดลอก Project URL และ anon public key
5. คัดลอก `.env.local.example` เป็น `.env.local` แล้วใส่ค่าสองตัวนั้น
6. รันคำสั่ง
   ```
   npm install
   npm run dev
   ```
   เปิด http://localhost:3000

## วิธีใช้
- สมัครสมาชิก > สร้างทีม > กด "ได้/เสีย" ใส่จำนวนเงิน > บันทึก
- ชวนเพื่อน: ส่ง "รหัสเชิญ" (อยู่ล่างสุดของหน้าทีม) เพื่อนสมัครแล้วใส่รหัสที่หน้าแรก
- ลบได้เฉพาะรายการของตัวเอง (เจ้าของทีมลบของคนอื่นได้ผ่านฐานข้อมูล)

## Deploy ฟรีบน Vercel
อัปโหลดโค้ดขึ้น GitHub > Import ใน vercel.com > ใส่ Environment Variables สองตัวเดียวกับ `.env.local` > Deploy
