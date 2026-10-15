# PropFlow Web — ملف التقدم (PROGRESS)

> **اقرأ هذا الملف أولاً في كل مرة تكمل فيها الشغل، وحدّثه قبل ما توقف.**
> آخر تحديث: **المشروع مكتمل وجاهز للتسليم** (tsc نظيف، build ينجح، 54 اختبار ناجح، فحص بصري ar/en × فاتح/داكن × ديسكتوب/موبايل). المتبقي فقط: تجربة على الـ backend الحقيقي. (نص قديم تحته:) كل الصفحات + App.tsx + main.tsx مكتوبة. `tsc` نظيف و`vite build` ينجح. mock adapter مكتوب (`src/mocks`). الخطوة الحالية: الفحص البصري بلقطات (بند 11) ثم الاختبارات (بند 10) ثم README+zip.

## 0. القواعد غير القابلة للتفاوض (لا تنساها)
1. **المشروع ثنائي اللغة: عربي (الافتراضي، RTL) + إنجليزي (LTR).** كل نص ظاهر للمستخدم يمر من `t('key')`. أي مفتاح جديد يُضاف في `src/i18n/en.ts` **و** `src/i18n/ar.ts` معاً (نفس الهيكل بالضبط).
2. **Dark mode + Light mode** عبر متغيرات CSS في `src/styles/index.css` (class `dark` على `<html>`). لا ألوان ثابتة (hex) داخل المكونات إلا للأسطح الثابتة مثل الـ CTA الكحلي. استخدم tokens: `bg-surface`, `text-ink`, `text-muted`, `border-line`, `bg-accent`...
3. **RTL-safe**: استخدم خصائص منطقية فقط (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`, `text-start`, `border-s`). الأسهم/الشيفرون تُقلب بـ `rtl:rotate-180`. الأرقام/الإيميل/الهاتف: `dir="ltr"` + `.num`/`.ltr`.
4. **عدم تقسيم النص العربي حرفياً** في أي أنيميشن (يفصل الحروف). التقسيم بالكلمات فقط.
5. الأنيميشن بـ **GSAP** (و**Lenis** للسكرول في الصفحات العامة فقط)، ويحترم `prefers-reduced-motion`.
6. "ما يبدو من AI": نصوص طبيعية، بلا حشو تسويقي، بلا إيموجي، بلا أرقام/إحصاءات مختلقة، بلا تدرجات بنفسجية. الهوية: كحلي + زعفران، خط Readex Pro (عربي/لاتيني) + Bricolage Grotesque (عناوين لاتينية).

## 1. المصادر
- **الـ Spec**: `/mnt/user-data/uploads/PropFlow-Frontend-Spec.md` (المرجع الأساسي لكل endpoint وقاعدة عمل). أعد قراءة القسم المعني قبل كتابة أي صفحة.
- **الـ API docs**: `https://prop-flow-black.vercel.app/api/docs` — **غير قابلة للوصول من الـ sandbox** (النطاق محجوب لـ bash، و Swagger UI لا يُقرأ بـ web_fetch). الاعتماد على الـ Spec.
- **المكتبات المطلوبة (من المستخدم)**: GSAP (مثبّتة npm `gsap@3`), Lenis (`lenis`), React Bits (منسوخ `Magnet` و `SpotlightCard` إلى `src/components/reactbits/`). المستودعات الأصلية مستنسخة في `/home/claude/libs/` (قد تُمسح بين المهام).
- المخرج النهائي: مجلد `/home/claude/propflow-web` ثم zip في `/mnt/user-data/outputs/` + `present_files`.

## 2. الـ Stack
Vite 5 + React 18 + TypeScript (strict) + Tailwind CSS **v4** (`@tailwindcss/vite`) + React Router 6 + TanStack Query 5 + Axios + react-hook-form + zod + Radix (dialog, dropdown, tabs, switch) + lucide-react + GSAP/@gsap/react + Lenis + fontsource (Readex Pro, Bricolage Grotesque). Tests: Vitest + Testing Library + jsdom.
ملاحظة تثبيت: `vite@5` مع `@vitejs/plugin-react@4` و `vitest@2` (النسخ الأحدث تعارضت peer deps).

## 3. أوامر مهمة (sandbox)
- الـ shell هو `sh` وليس bash: **لا تستخدم brace expansion** `{a,b}` في `mkdir`. استخدم حلقة for.
- `cd /home/claude/propflow-web && npx tsc -b --noEmit` (typecheck) · `npx vitest run` · `npx vite build`.
- الـ build الإنتاجي يستخدم `.env.production` (`VITE_API_BASE_URL=https://prop-flow-black.vercel.app/api/v1`). في التطوير: `/api/v1` + proxy.
- `VITE_MOCK=true` (dev فقط) يشغّل backend وهمي داخل الذاكرة `src/mocks/adapter.ts` — **لم يُكتب بعد** (انظر المتبقي).

## 4. الهيكل (`src/`)
```
api/        client.ts (axios + refresh صامت + progress) · auth/users/properties/units/rentalRequests/leases/renewals/maintenance/notifications/auditLogs/analytics.ts
types/      enums.ts (حرفياً من الـ Spec) · models.ts · api.ts
lib/        env, utils(cn), errors(normalizeError, mapDetailsToFields), dates(YYYY-MM-DD فقط), format, schemas(zod + useSchemas), useApiError, queryClient, motion(GSAP+Lenis)
i18n/       index.tsx (I18nProvider, useI18n, useEnumLabel) · en.ts · ar.ts
hooks/      useAuth (boot refresh, token في الذاكرة فقط) · useTheme · useToast · useListParams (الفلاتر في الـ URL) · useDebounce · queries (useProperty/useUnit/usePendingRequestMap/useInvalidate)
components/ui/      Button, Field(Input/Select/Textarea/DateField), Misc(Card/Banner/Avatar/DescriptionList), StatusBadge, Dialog/ConfirmDialog, Toaster, States(Empty/Error/Skeleton), DataTable, FilterBar, Pagination, ImageUploader, UserPicker, Tabs, Switch, CountUp, PageHeader, RoleGate
components/layout/  AppShell(PageTransition GSAP), Sidebar(NavList + unread), Header(breadcrumbs, bell, user menu, drawer), PublicLayout, Logo, Toggles(theme/lang), nav.ts
components/reactbits/ Magnet, SpotlightCard
routes/     paths.ts (ROLE_HOME) · guards.tsx (RequireAuth, PublicOnly, RequireSessionOnly, RequireRole, Splash)
features/   auth, landing(BuildingScene = العنصر المميز), dashboard, properties, units, rental-requests, leases, renewals(RenewalDialogs فقط حتى الآن), ...
```

## 5. قرارات تصميم/منتج مهمة
- **العنصر المميز**: `BuildingScene` — عمارة SVG نوافذها = وحدات تتلون بحالة الوحدة (أخضر متاحة / أزرق مؤجرة / كهرماني صيانة) وتتغير ببطء. موجودة في الهبوط وفي جانب صفحات المصادقة.
- Access token في متغير module فقط. Refresh مشترك (dedupe) وعند 429 ينتظر 1.5ث ويعيد مرة ولا يخرج المستخدم.
- كل الأخطاء تمر عبر `normalizeError` ثم `useApiError` (يختار النص بـ `code` من `err.<CODE>` وليس من نص السيرفر).
- التواريخ strings `YYYY-MM-DD` فقط (حقول `<input type="date">` أصلية).
- الفلاتر/الترتيب/الصفحة في الـ URL (`useListParams`).
- **قيد Backend**: الـ Lease لا يحمل اسم المستأجر (فقط `tenantId`) فنعرض `#tenantId` مختصراً في الجدول مع فلترة بالنقر. المالك يختار المستأجر بالاسم عبر `UserPicker` (`/users/directory`).
- مالك غير موثّق: بانر في `/dashboard` و`/properties` و`/units` فقط (داخل AppShell).
- تأكيد (ConfirmDialog) مطلوب فقط للإجراءات المحددة في الـ Spec §7.5.
- أرقام لاتينية في العربية (`ar-EG-u-nu-latn`) لتجنب خلط الاتجاهات.

## 6. حالة الإنجاز
### تم ✅
- الإعدادات: vite/ts/tailwind/vercel.json/_redirects/.env*، الثيم (فاتح/داكن) والخطوط.
- i18n كامل (ar/en) للمجموعات: common, nav, enums, landing, auth, validation, layout, dashboard, properties, units, rr, leases, lrr, mnt, notif, profile, users, audit, legal, err, uploader.
- طبقة الـ API كاملة + Axios interceptor + أنواع.
- مكونات الـ UI والـ layout وحراس المسارات.
- صفحات: Landing، Login، Register، VerifyEmail، ForgotPassword، ResetPassword، ChooseRole، Dashboard، Properties (list/detail/form)، Units (list/detail/form)، RentalRequests (list/new/detail)، Leases (list/new/edit/detail)، RenewalDialogs.

### تم أيضاً ✅ (الجولة الثانية)
- Renewals (inbox+detail)، Maintenance (list/new/detail+timeline+assign/complete)، Notifications، Profile، Users admin، Audit logs، StatusPages(404/403)، LegalPage، App.tsx (lazy + guards)، main.tsx، test/setup.ts.

### المتبقي ⏳ (بالترتيب) — البنود 1–7 أدناه **منجزة**، ابدأ من 8
1. `features/renewals/RenewalsPage.tsx` (inbox، الافتراضي `status=PENDING`) + `RenewalDetailPage.tsx`.
2. `features/maintenance/`: قائمة، new (ImageUploader deferred ≤5 + اختيار الوحدة من عقود ACTIVE)، تفاصيل مع Action bar حسب الدور والحالة + timeline من `/history` + assign(UserPicker MAINTENANCE_STAFF)/start/complete(صور إنجاز)/close/cancel(تأكيد). تذكير: start/complete للفني المكلّف فقط.
3. `features/notifications/NotificationsPage.tsx` (deep links حسب `relatedEntityType`، read optimistic، read-all، OWNER_VERIFICATION_CHANGED → invalidate `['users','me']` وفتح `/profile`).
4. `features/profile/ProfilePage.tsx` (بيانات، avatar immediate maxFiles=1، تغيير كلمة المرور، شارة توثيق المالك، اللغة والثيم).
5. `features/users/UsersPage.tsx` (ADMIN: activate/deactivate بتأكيد، تغيير الدور، توثيق المالك) و`features/audit-logs/AuditLogsPage.tsx` (صفوف قابلة للتوسع بـ metadata).
6. `features/misc/`: NotFound, Forbidden(403), Terms, Privacy (نص placeholder واضح).
7. `src/App.tsx` (الراوتر مع lazy + RequireRole) و`src/main.tsx` (providers: Theme, I18n, QueryClient, Auth, Toaster) و`src/test/setup.ts`.
8. ~~mock adapter~~ ✅ (`src/mocks/adapter.ts`+`data.ts`). حسابات تجريبية بكلمة مرور `demo12345`: admin@/owner@/owner2@(غير موثّق)/tenant@/tenant2@/staff@ + `demo.com`. OTP التجريبي `123456`. تشغيل: `VITE_MOCK=true npx vite`.
9. ~~tsc + build~~ ✅
10. ~~اختبارات~~ ✅ (10 ملفات/54 اختبار): normalizeError, mapDetailsToFields, schemas, validateImages, StatusBadge, formatters/dates, i18n key parity (ar == en), DataTable, RoleGate.
11. ~~فحص بصري~~ ✅ بلقطات شاشة (Playwright موجودة في Python) للعربي/الإنجليزي × فاتح/داكن، desktop + mobile.
12. ~~README~~ ✅ + zip: للمشروع (تشغيل، env، CORS/FRONTEND_URL للـ backend، النشر على Vercel، قيود معروفة) ثم zip وتسليم.

## 7. فخاخ تعلمتها (لا تكررها)
- **لا تستخدم `unicode-bidi: plaintext` على عناصر block** (يحاذي الأرقام لليسار داخل RTL). `.num` = tabular-nums فقط.
- الـ mock: الـ IDs يجب أن تكون ثابتة (وإلا تضيع الجلسة بعد reload)، والـ refresh يمر بـ axios خام فيجب مطابقة URL بعد إزالة `/api/v1`.
- الـ dev server يموت بين استدعاءات الأدوات: شغّله وصوّر وأوقفه في نفس الأمر عبر `/tmp/run.sh` (يُعاد إنشاؤه إن اختفى؛ يستخدم Playwright في `/tmp/shoot.py`).
- لا `tailwind` breakpoint اسمه `xs`.
- Dialog يُوسَّط بـ `left-1/2 top-1/2` + `translate(-50%,-50%)` (متماثل في RTL). Switch thumb بـ `start-*` منطقي.
- `PasswordField` زر العين موضعه `top-[2rem]` (يفترض وجود label فوق الحقل).
- `top-level await` مستخدم في `api/client.ts` لاستيراد الـ mock (dev فقط) — الهدف ES2022 فقط.
- الصور في `ImageUploader` وضع deferred تُرفع بعد إنشاء الكيان؛ فشل الرفع لا يلغي الإنشاء.
- الـ approve لطلب الإيجار يعيد `leaseId`؛ نذهب لصفحة العقد.

## 8. تحديث 1 (بعد التسليم الأول)
- **زرار الصعود للأعلى** `components/ui/ScrollToTop.tsx` (حلقة تقدّم، GSAP، يحترم reduced-motion، مركّب عالمياً في `main.tsx`). التوست انتقل لجهة `start` على الشاشات الكبيرة كي لا يتداخل معه.
- **بيانات السيستيم تتبع اللغة**: `LangRefetch` يعيد جلب البيانات (وبيانات المستخدم الحالي) عند تبديل اللغة. الـ mock صار إنجليزي أصلاً + قاموس عربي `AR` في `mocks/data.ts` يُطبَّق وقت الاستجابة (`localize`).
- **ما لا يمكن ترجمته تلقائياً**: النصوص التي يكتبها المستخدمون في الـ backend الحقيقي (أسماء عقارات/عناوين/أوصاف) تبقى كما كُتبت. للحصول على نسختين يجب أن يخزّنها الـ backend بلغتين أو يترجمها.
- إشعارات: بالعربي نعرض جملة مترجمة حسب نوع الإشعار (`notifText.*`)، وبالإنجليزي نص السيرفر. عناوين الكيانات في سجل المراجعة مترجمة (`entity.*`).
- `VITE_DEFAULT_LANG` لتغيير لغة أول زيارة (ar/en).
- فخ: `qc.setQueryData` بدون queryFn لا يمكن عمل `refetchQueries` له؛ اجلب صراحةً.


## 9. v4 pass (visual redesign)
- Home: `features/home/` split into HomeHero (greeting by time of day, real totals from `meta.total`, photo collage), FeaturedUnits, HomeWidgets, RoleViews, HomePage. `hooks/discover.ts` supplies catalogue totals and per-type counts. DiscoverSection keeps its URL state; `showCounts` enables the tile counts (off in tests).
- Landing: LandingHeader (fixed, mobile menu sheet), LandingExtras (Benefits, ProductTour with illustrative screens), richer PublicFooter, hash scrolling.
- Dashboard: equal-height grid, clickable KPI tiles, lease split, maintenance overview.
- Shared: PageHeader (icon/CountBadge), SuccessState, skeleton variants `stats`/`list`, Gallery with arrows, PropertyCard/UnitCard with Photo fallback, `TYPE_PHOTO`, `.rise`/`.hero-navy` CSS utilities, router v7 future flags.
- Pitfall: a card with `h-full` content inside needs `flex flex-col` + `flex-1`, otherwise inner links overflow the card.
- Browser runs: dev server dies between tool calls in this sandbox; start it with `setsid nohup` and keep each Playwright run under ~200 s.
