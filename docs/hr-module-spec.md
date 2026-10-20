# Campus Global ERP — HR modulu

## Məqsəd

HR modulu əməkdaş məlumatlarını, gündəlik davamiyyəti, məzuniyyət təsdiqlərini, işə qəbul pipeline-ını, performans qiymətləndirmələrini və aylıq əmək haqqı prosesini bir ekran ailəsində birləşdirir.

## Rol və səlahiyyətlər

- `hr:read`: HR məlumatlarını oxumaq.
- `hr:manage`: əməkdaş, vakansiya, namizəd və performans məlumatlarını yaratmaq/dəyişmək.
- `hr:attendance`: gündəlik davamiyyəti qeyd etmək.
- `hr:leave:approve`: məzuniyyət sorğularını təsdiqləmək və rədd etmək.
- `hr:payroll`: məxfi əmək haqqı məlumatlarını görmək və payroll dövrünü idarə etmək.

`SUPER_ADMIN` bütün hüquqlara malikdir. `HR` bütün HR hüquqlarını, `MANAGER` oxu/davamiyyət/məzuniyyət təsdiqini, `FINANCE` isə oxu və payroll hüququnu alır. Digər rollarda payroll məbləğləri göstərilmir.

## Əsas iş axınları

1. Əməkdaş reyestri: filtr, axtarış, 360° profil, yeni əməkdaş, status və iş rejimi.
2. Davamiyyət: tarix üzrə gündəlik qeyd, giriş/çıxış vaxtı, gecikmə, uzaqdan iş, yoxluq.
3. Məzuniyyət: sorğu yaratmaq, gözləyənləri təsdiqləmək/rədd etmək, illik balansı hesablamaq.
4. İşə qəbul: vakansiya açmaq, namizəd əlavə etmək və mərhələlər arasında hərəkət etdirmək.
5. Performans: qiymətləndirmə dövrü, 0–5 bal, güclü tərəflər, inkişaf sahələri və məqsədlər.
6. Əmək haqqı: aktiv əməkdaşlardan aylıq payroll yaratmaq, bonus/tutulmalarla net məbləği hesablamaq, təsdiqləmək və ödənilmiş kimi işarələmək.
7. Hesabat: əməkdaş reyestrini CSV formatında ixrac etmək.

## Dizayn sistemi

- Fon: `#f6f9ff`; səth: `#ffffff`; əsas mətn: `#0b1f44`; ikinci mətn: `#63749a`.
- Əsas rəng: `#0b66ff`; yaşıl: `#12b76a`; narıncı: `#f79009`; qırmızı: `#f04438`.
- Sərhəd: `#dce5f0`; panel radiusu 18–22px; düymə radiusu 12px.
- Cədvəl məlumat yönümlüdür; mobil görünüşdə sətrlər məqsədli siyahıya çevrilir.
- Konseptlər: `output/hr/hr-overview-concept.png`, `output/hr/hr-employees-concept.png`, `output/hr/hr-mobile-concept.png`.

## Təhlükəsizlik

Bütün HR cədvəllərində RLS aktivdir. `anon` və `authenticated` rollarının birbaşa Data API girişi bağlanır; sorğular yalnız server tərəfində Prisma vasitəsilə və tətbiqin permission yoxlamasından sonra icra olunur. Əmək haqqı ayrıca `hr:payroll` hüququ ilə qorunur.

## Production rollout

1. Railway runtime dəyişənlərində ayrıca, yüksək entropiyalı `AUTH_SECRET`,
   `DATABASE_URL`, `DATABASE_POOLER_MODE=session` və uyğun pool limitlərini
   konfiqurasiya edin.
2. `supabase/migrations/20260805000900_add_hr_module.sql` migration-ını Supabase
   admin/migration rolu ilə tətbiq edin. Tətbiq istifadəçisi migration history
   cədvəlinə yazmaq üçün istifadə edilməməlidir.
3. Migration-dan sonra Supabase security və performance advisor-larını işlədin,
   sonra `npm run db:validate`, `npm run typecheck`, `npm run lint` və
   `npm run build` yoxlamalarını keçirin.
4. Railway health check ünvanını `/api/health` olaraq təyin edin. Cavab `200`
   və `database: reachable` olmalıdır.
5. `/hr`, əməkdaş yaratma, davamiyyət, məzuniyyət təsdiqi, namizəd pipeline-ı,
   performans və payroll status keçidlərini production səlahiyyətləri ilə smoke
   test edin.

Production-da verilənlər bazası əlçatan olmadıqda modul demo məlumat göstərmir;
aydın xəta ekranı verir və server logunda təhlükəsiz xəta kodu saxlayır.

## Performans sərhədləri

- İlk açılış yalnız aktiv tabın məlumatını gətirir; digər tablar, dialoglar və
  Recharts ayrıca chunk-lardır.
- Əməkdaş reyestri 50 sətrlik server pagination istifadə edir. Dropdown üçün
  əməkdaş seçimləri 500, registrlər 200, payroll item-ları isə 1000 sətirlə
  sərhədlənir.
- CSV export client payload-a daxil edilmir; serverdən 500 sətrlik cursor
  batch-ləri ilə stream olunur.
- Payroll-da yalnız seçilmiş dövrün item-ları yüklənir və bonus/tutulma
  yenilənəndə cəmlər PostgreSQL aggregate ilə hesablanır.
