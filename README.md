# Sheko Store

متجر Sheko الإلكتروني — Next.js 16 + Supabase. الخطة الكاملة في [PLAN.md](PLAN.md).

## التشغيل محلياً

```bash
npm install
cp .env.example .env.local   # ثم ضع مفاتيح Supabase
npm run dev                  # http://localhost:3000
```

## الأوامر

| الأمر               | الوظيفة                  |
| ------------------- | ------------------------ |
| `npm run dev`       | تشغيل بيئة التطوير       |
| `npm run build`     | بناء نسخة الإنتاج        |
| `npm run lint`      | فحص الكود (ESLint)       |
| `npm run typecheck` | فحص الأنواع (TypeScript) |
| `npm run format`    | تنسيق الكود (Prettier)   |

## الهيكل

```
app/
  (store)/          صفحات المتجر (هيدر + فوتر + شريط سفلي للموبايل)
  layout.tsx        الخطوط، RTL، الـ Metadata
  robots.ts         يمنع الفهرسة حتى الإطلاق (NEXT_PUBLIC_SITE_INDEXABLE)
components/
  store/            مكونات واجهة المتجر
  ui/               مكونات shadcn/ui
lib/
  supabase/         عملاء Supabase (المتصفح، السيرفر، proxy)
  site.ts           إعدادات الموقع العامة
proxy.ts            تحديث جلسة Supabase (بديل middleware في Next 16)
public/brand/       اللوجو وأيقونة الأسد
brand/              ملفات الهوية الأصلية
```

## قاعدة البيانات

ملفات `supabase/migrations/` تتشغّل بالترتيب (من الأقدم للأحدث) من
**Supabase → SQL Editor**: افتح كل ملف، انسخ محتواه، الصقه، واضغط Run.

ترقية حساب إلى أدمن (بعد إنشائه من Authentication → Users):

```sql
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'admin@example.com');
```

## ملاحظات

- Next.js 16: ملف `middleware.ts` أصبح اسمه `proxy.ts`، و`cookies()`/`params` أصبحت async فقط.
- على Windows: أوامر `npx shadcn` تعمل من PowerShell (من Git Bash يفشل تثبيت الحزم).
- صور `public/placeholders/` مؤقتة وتُستبدل بصور المنتجات الحقيقية.
