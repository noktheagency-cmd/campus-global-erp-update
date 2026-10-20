# Campus Global ERP — mərhələli QA jurnalı

Son yenilənmə: 2026-09-26

## Qayda və əhatə

- Hər mərhələdə plan, nəticə, problem, düzəliş və təkrar yoxlama saxlanılır. Açıq problem qaldıqca növbəti mərhələyə keçilmir.
- Test hesabları: `ceo.test@campus-global.example.com` (CEO), `agent.test@campus-global.example.com` (agent), `student.test@campus-global.example.com` (agentə bağlı tələbə). Parollar burada saxlanmır.
- Mühit: `localhost:3000`, mövcud inkişaf Supabase layihəsi. Bütün ödəniş və sənədlər sintetik QA məlumatıdır; real pul hərəkəti olmayıb.
- Bu mərhələ agentə bağlı tələbə üçündür. Agentsiz fərdi tələbə axını sonrakı mərhələdə yoxlanacaq.

## Mərhələ 1 — CEO → agent → tələbə → komissiya → maliyyə

| ID | Yoxlama | Vəziyyət | Faktiki nəticə |
| --- | --- | --- | --- |
| C-01 | Üç rolla giriş/çıxış | KEÇDİ | Hər rol öz panelinə daxil oldu. Yeni çıxış düyməsi sessiyanı bağladı; agentdən CEO-ya keçid yenidən yoxlandı. |
| C-02 | Ümumi şərtlər | KEÇDİ | `QA test şərtləri — hüquqi qüvvəsi yoxdur` v99.0 yaradıldı və aktiv göründü. |
| C-03 | Paket | KEÇDİ | `QA 2026-2027 Agent Komissiya Testi` aktivdir: Istanbul Aydin University, altı təhsil qaydası, burs yoxdur; BACHELOR üçün USD 100 sabit agent payı. |
| C-04 | Agent razılığı | KEÇDİ | Agent paketi və şərti gördü; `CG-PKG-260926-75D3` müqaviləsini göndərdi. |
| C-04b | Başqa agentə məxsus məlumatın ayrılması | GÖZLƏYİR | İkinci agent hesabı ilə mənfi test aparılmayıb. |
| C-05 | CEO təsdiqi | KEÇDİ | İlkin xəta düzəldildi; müqavilə `APPROVED` oldu və agent panelində təsdiqlənmiş göründü. |
| C-06 | Agent tələbə profili və müraciəti | KEÇDİ | Agent bağlı tələbənin telefonunu yenilədi, audit yazıldı. `APP-20260926-2EBAA0` müraciətini yaratdı, dörd sintetik sənəd yüklədi, `SUBMITTED` etdi. CEO `ACCEPTED` etdi. |
| C-07 | Tələbə görünüşü və səlahiyyət | KEÇDİ | Tələbə panelində qəbul edilmiş müraciət və bağlı agent göründü. `/commissions` tələbəni panelə qaytardı. |
| C-08 | Paket üzrə hesab | KEÇDİ | USD 4,500 sintetik ödəniş, 1.7 məzənnə, BACHELOR sıra #1 → `COM-260925-30CB7B`, agent payı USD 100 / AZN 170. Sonrakı ödənişdə agent payı təkrar yaranmır; eyni referanslı dublikat rədd edilir. |
| C-09 | Maliyyə əlaqəsi | KEÇDİ | Yeni modeldə hər hesab üzrə universitetdən USD 300 debitor, agentə USD 100 kreditor yaranır. `COM-260925-D605CD` və `COM-260925-283369` üzrə daxilolma və çıxış virtual hesabla bağlandı; hər iki debitor/kreditor `PAID`, şirkət payı hər hesabda USD 200 / AZN 340. İlk cəhdin aralıq xətası QA-008/QA-013-də izlənir. |
| C-10 | Faiz, hissəvi ödəniş, burs, sərhəd halları | QİSMƏN | 10% universitet ümumi komissiyası canlı yoxlandı: USD 4,500 → USD 450 ümumi, USD 100 agent, USD 350 şirkət. Debitor USD 200+250, kreditor USD 50+50 kimi hissəvi bağlandı; aralıqda hər üç status `PARTIALLY_PAID`, sonda `PAID`. Eyni müraciətin ikinci USD 500 təhsil ödənişi ayrıca POST edildi: USD 300 ümumi/şirkət, USD 0 agent, yalnız debitor yaradıldı; eyni referanslı təkrar rədd edildi. Eyni tarix/aralıqlı ümumi müqavilə və agent payından aşağı USD 50 ümumi komissiya bloklandı. Burs həddi və pilləli agent faizi canlı DB axınında qalıb; altı hədəfli funksiya sınağı keçib. |
| C-11 | Mobil/desktop görünüş | QİSMƏN | 390×844 mobil və normal desktop ölçüdə komissiya icmalı, universitet müqaviləsi formu/siyahısı və hesablama kartları vizual yoxlandı; kəsilmə görünmədi. Mobil paket müqaviləsinin pending qərar düyməsi ayrıca canlı test gözləyir. |
| C-12 | Universitet ümumi komissiyası → paket agent payı | KEÇDİ | CEO `UNI-260925-18D826` müqaviləsini USD 300 sabit ümumi komissiya ilə yaratdı. BACHELOR qaydasında agent USD 100, şirkət USD 200 aldı. İki yeni hesablama, CEO təsdiqi və hər iki maliyyə bağlanışı canlı brauzerdə yoxlandı. |
| C-13 | Rol üzrə görünüş | KEÇDİ | CEO ümumi/şirkət/agent payını görür; agent panelində yalnız öz USD 100 payı və `PAID` statusu görünür. Tələbə bağlı agentini və qəbul edilmiş müraciətini görür, komissiya modulundan dashboard-a yönləndirilir. |

## Tapıntılar və düzəlişlər

| ID | Təsir | Vəziyyət | Tapıntı → düzəliş / təkrar yoxlama |
| --- | --- | --- | --- |
| QA-001 | Orta | BAĞLANDI | Çıxış yox idi → server action və mobil/desktop düymə əlavə edildi; sessiya bağlanması yoxlandı. |
| QA-002 | Bloklayıcı | BAĞLANDI | Prisma `void` qaytaran advisory lock sorğusunu qəbul etmirdi → `select 1 as locked from pg_advisory_xact_lock(...)`; CEO təsdiqi və agent statusu yoxlandı. Eyni düzəliş hesablama axınına tətbiq edildi. |
| QA-003 | Yüksək | BAĞLANDI | Agent menyusunda komissiya keçidi yox idi → əlavə edildi; tələbənin yanlış keçidi çıxarıldı. |
| QA-004 | Yüksək | BAĞLANDI | Agent bağlı tələbənin profilini yeniləyə bilmirdi → icazə, agentə görə DB scope, forma və audit əlavə edildi; telefon yenilənməsi yoxlandı. |
| QA-005 | Mobil UX | QİSMƏN | Müqavilə qərarı geniş cədvəldə gizlənirdi → mobil kartlar əlavə edildi; təsdiqlənmiş status görünür. Pending qərar düyməsi ayrıca təkrar yoxlanmalıdır. |
| QA-006 | Bloklayıcı | BAĞLANDI | Boş seçimli imtahan tarixi draftı rədd edirdi → boş dəyər `undefined` qəbul edildi; draft yaradıldı. |
| QA-007 | Yüksək | BAĞLANDI | Sənəd saxlanır, amma redirect `catch` daxilində tutulduğu üçün xəta göstərilirdi → redirect `try` xaricinə çıxarıldı; sonrakı sənədlər uğurla yükləndi. |
| QA-008 | Maliyyə etibarlılığı | DÜZƏLDİLDİ, İZLƏNİR | Agentə virtual ödənişin ilk POST cəhdi `transaction-create-failed` verdi, ledger dəyişmədi. Tranzaksiyadakı paralel DB sorğuları ardıcıl icraya keçirildi və vaxt limiti 30 saniyəyə artırıldı. Son iki agent ödənişi və iki universitet daxilolması ilk cəhddə keçdi; ilkin xətanın dəqiq stack-i olmadığına görə təkrarlanmama müşahidəsi davam edir. |
| QA-009 | İcmal doğruluğu | BAĞLANDI | Təsdiqlənmiş paketə baxmayaraq aktiv müqavilə 0 idi → paket müqavilələri sayılır, keçid göstərilir, köhnə müqavilə siyahısı fərqləndirilir; CEO və agentdə 1 göründü. |
| QA-010 | Maliyyə modeli | BAĞLANDI | Universitet ümumi komissiya müqaviləsi ayrıca model, RLS-li SQL miqrasiya, CEO formu və hesablama mənbəyi ilə əlavə edildi. Ümumi USD 300 − agent USD 100 = şirkət USD 200; debitor USD 300, kreditor USD 100. Sintetik USD 4,500 təhsil ödənişi gəlir kimi yazılmadı. Köhnə `COM-260925-30CB7B` hesabının USD 0 şirkət payı tarixi snapshot olaraq dəyişmir. |
| QA-011 | Pillə uyğunlaşdırması | DÜZƏLDİLDİ, CANLI TEST QALIR | `Ön Lisans` və `Hazırlıq` normallaşdırıldı. Hədəfli yoxlama `Yüksek Lisans`ın yanlışlıqla BACHELOR seçildiyini aşkarladı; MASTER aliası əvvəl yoxlanacaq şəkildə düzəldildi. Yeddi ad üzrə funksiya testi keçdi; həmin pillələr üzrə canlı hesab aparılmayıb. |
| QA-012 | Agent əhatəsi | DÜZƏLDİLDİ, CANLI TEST QALIR | Agentin draft təqdim etməsi yalnız `application.agentId` ilə məhdud idi; agentə bağlı tələbənin özü yaratdığı müraciətdə bu sütun boş ola bilər. Təqdimetmə scope-u `student.agentId` ilə də yoxlanır və status yeniləməsi atomikdir. Bu variasiya canlı hesabla hələ yoxlanmayıb. |
| QA-013 | Komissiya POST etibarlılığı | DÜZƏLDİLDİ, İZLƏNİR | `QA-APP-20260926-MARGIN` üzrə ilk ödəniş cəhdi ümumi `payment-create-failed` verdi; eyni referansla ikinci cəhd keçdi, dublikat yaranmadı. Tranzaksiya audit yazıları ardıcıl icraya keçirildi, 30 saniyə timeout və düzgün catch blokuna server diaqnostikası əlavə edildi. `QA-APP-20260926-RETRY` və `QA-INSTALLMENT-20260926-001` ilk cəhddə uğurla POST edildi. İlk xətanın stack-i saxlanmadığı üçün səbəb ehtimal kimi qeyd olunur. |
| QA-014 | Agent məlumat əhatəsi | BAĞLANDI | Agent detal pəncərəsində universitetin USD 300 ümumi və şirkətin USD 200 payı görünürdü. Bu sahələr agentə verilən server datasından çıxarıldı və detal UI-də gizlədildi; agent yenidən girişlə yalnız USD 100 öz payını gördü. |
| QA-015 | CEO təsdiq etibarlılığı | DÜZƏLDİLDİ, İZLƏNİR | `COM-260925-0A2C71` ilk təsdiq cəhdi `approval-failed` verdi, maliyyə yazısı yaranmadı. Təsdiq tranzaksiyasındakı paralel DB əməliyyatları ardıcıl icraya keçirildi, timeout artırıldı və gözlənilməz xətaya server logu əlavə edildi; ikinci cəhd debitor/kreditoru düzgün yaratdı. İlk xətanın stack-i saxlanmadığına görə səbəb ehtimaldır. |
| QA-016 | Hissəvi təhsil ödənişi | BAĞLANDI | Sabit agent komissiyası ilk dəfə qazanıldıqdan sonra ikinci tələbə ödənişi bütövlükdə rədd edilirdi. İkinci ödəniş üçün agent payı sıfır, universitet payı müqavilə üzrə hesablanır; təsdiqdə yalnız universitet debitoru açılır. DB məhdudiyyəti uyğunlaşdırıldı. `COM-260925-91367E` canlı test: USD 500 ödəniş → USD 300 şirkət, USD 0 agent, agent kreditoru yoxdur; debitor virtual hesabda daxilolma ilə `PAID` oldu. UI bu hesabı “Agent payı yoxdur” göstərir. Referans dublikatı bloklandı. |

## Sübut və məlumat izləri

- Paket müqaviləsi `CG-PKG-260926-75D3`; müraciət `APP-20260926-2EBAA0`; hesablama `COM-260925-30CB7B`.
- Sintetik tələbə ödənişi `QA-PAY-20260926-001`: USD 4,500, məzənnə 1.7. Agent komissiyası USD 100 → AZN 170.
- Virtual QA USD kassası: açılış USD 100, agent ödənişi USD 100, son balans USD 0. Agent kreditoru AZN 170 → 0.
- Universitet müqaviləsi `UNI-260925-18D826`; iki əlavə sintetik qəbul fixture-i `QA-APP-20260926-MARGIN` və `QA-APP-20260926-RETRY` birbaşa DB-də əvvəlki qəbul edilmiş müraciətdən klonlandı. Bunlar agentin sənəd təqdimetmə axınını təkrar sübut etmir.
- Yeni hesablar `COM-260925-D605CD` və `COM-260925-283369`: hər biri USD 300 ümumi, USD 200 şirkət, USD 100 agent payı; hər ikisi `PAID`. İkinci virtual kassada iki universitet daxilolması və iki agent çıxışı sonrası USD 500 qalıq var (açılış USD 100 daxil).
- Faizli test müqaviləsi `UNI-260925-D75142` və aşağı məbləğ test müqaviləsi `UNI-260925-1D05E4` sınaqdan sonra `SUSPENDED`; əsas `UNI-260925-18D826` aktiv qaldı. Rədd edilmiş `QA-LOW-20260926-001` referansı ilə ödəniş sayı 0. Faizli `COM-260925-0A2C71` hesabı və hər iki maliyyə öhdəliyi `PAID`; ümumi USD 450, şirkət USD 350, agent USD 100.
- `QA-INSTALLMENT-20260926-001` ikinci təhsil ödənişi `COM-260925-91367E` yaratdı. USD 300 universitet debitoru `RCV-260925-9440A8` virtual daxilolma ilə bağlandı; agentə yeni öhdəlik yaranmadı. Eyni referansla ikinci cəhd `payment-reference-duplicate` ilə rədd edildi. Əvvəlki `QA-DUPLICATE-20260926-001` rəddetməsi düzəlişdən əvvəlki davranışın tarixi qeydidir.
- Yoxlamalar: in-app browser ilə üç rolun əsas axını, sabit/faizli komissiya, hissəvi maliyyə, mənfi müqavilə sınaqları; `npm run db:validate`, `npm run typecheck`, `npm run lint`, `npm run build`, `git diff --check` keçdi. Pillə aliasları üçün yeddi, komissiya hesabı üçün altı hədəfli funksiya sınağı keçdi. Layihədə ümumi avtomatlaşdırılmış test skripti yoxdur.

## Mərhələ qapısı

**Bağlıdır.** QA-008/QA-013/QA-015 üçün sabitlik müşahidəsi, QA-005/QA-011/QA-012 və C-10/C-11 üçün canlı təkrar sınaqlar qalır. Növbəti mərhələyə keçilmir.
