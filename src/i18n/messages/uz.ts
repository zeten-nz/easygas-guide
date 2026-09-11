/**
 * Uzbek (Latin) — the DEFAULT locale and the SOURCE OF TRUTH for translation keys.
 * `ru.ts` is typed as `Record<keyof typeof uz, string>`, so every key here must
 * have a Russian counterpart (compile-time parity). Keys are flat dot-paths;
 * `{name}`-style placeholders are interpolated by the `t()` function.
 *
 * Scope (Phase: localization foundation): authentication, public/error screens,
 * shared UI, navigation and roles. The authenticated app body (admin/jobs/catalog)
 * is localized in follow-up increments and is intentionally not covered yet.
 *
 * Brand lines ("EASY GAS", "Safety Technology") are kept verbatim in both locales
 * as brand identity, not translated.
 */
export const uz = {
  // ---- Common / shared actions ---------------------------------------------
  'common.appName': 'EASY GAS',
  'common.brandTagline': 'Safety Technology',
  'common.loading': 'Yuklanmoqda…',
  'common.back': 'Orqaga',
  'common.cancel': 'Bekor qilish',
  'common.save': 'Saqlash',
  'common.confirm': 'Tasdiqlash',
  'common.retry': 'Qayta urinish',
  'common.reload': 'Qayta yuklash',
  'common.close': 'Yopish',
  'common.logout': 'Chiqish',

  // ---- Language selector ----------------------------------------------------
  'lang.label': 'Til',
  'lang.uz': "O'zbekcha",
  'lang.ru': 'Ruscha',
  'lang.uzShort': 'UZ',
  'lang.ruShort': 'RU',

  // ---- Auth shell -----------------------------------------------------------
  'auth.tagline': "Xavfsiz o'rnatish. Tekshirilgan ish. Ishonchli xizmat.",
  'auth.support': 'Yordam kerakmi?',

  // ---- Shared auth fields / validation --------------------------------------
  'auth.field.phone': 'Telefon raqam',
  'auth.field.phonePlaceholder': '90 123 45 67',
  'auth.field.password': 'Parol',
  'auth.field.passwordPlaceholder': 'Parolingiz',
  'valid.phoneRequired': 'Telefon raqam kiritilishi shart',
  'valid.phoneInvalid': "Telefon raqam to'liq emas",
  'valid.passwordRequired': 'Parol kiritilishi shart',
  'valid.firstNameRequired': 'Ism kiritilishi shart',
  'valid.lastNameRequired': 'Familiya kiritilishi shart',
  'valid.min2': 'Kamida 2 ta harf',
  'valid.regionRequired': 'Viloyat tanlanishi shart',
  'valid.branchRequired': 'Servis filiali tanlanishi shart',
  'valid.commentTooLong': 'Izoh juda uzun',
  'valid.passwordMin8': 'Kamida 8 ta belgi',
  'valid.confirmRequired': 'Parolni qayta kiriting',
  'valid.passwordsMismatch': 'Parollar mos kelmadi',
  'valid.newPasswordRequired': 'Yangi parol kiritilishi shart',
  'valid.passwordMustDiffer': 'Yangi parol joriy paroldan farq qilishi kerak',
  'valid.currentPasswordRequired': 'Joriy parolni kiriting',
  'valid.tempPasswordRequired': 'Vaqtinchalik parolni kiriting',

  // ---- Login ----------------------------------------------------------------
  'login.title': 'Tizimga kirish',
  'login.subtitle': 'Telefon raqamingiz va parolingizni kiriting',
  'login.rememberMe': 'Meni eslab qol',
  'login.forgot': 'Parolni unutdingizmi?',
  'login.submit': 'Kirish',
  'login.noAccount': "Hisobingiz yo'qmi?",
  'login.registerLink': "Ro'yxatdan o'tish",

  // ---- Register -------------------------------------------------------------
  'register.title': "Ro'yxatdan o'tish",
  'register.subtitle': "So'rovingiz administrator tomonidan ko'rib chiqiladi va tasdiqlanadi",
  'register.firstName': 'Ism',
  'register.firstNamePlaceholder': 'Ismingiz',
  'register.lastName': 'Familiya',
  'register.lastNamePlaceholder': 'Familiyangiz',
  'register.region': 'Viloyat',
  'register.regionPlaceholder': 'Viloyatni tanlang',
  'register.branch': 'Servis filiali',
  'register.branchPlaceholder': 'Filialni tanlang',
  'register.branchLoading': 'Yuklanmoqda…',
  'register.branchError': "Filiallar ro'yxatini yuklab bo'lmadi. Sahifani yangilang.",
  'register.comment': 'Izoh (ixtiyoriy)',
  'register.commentPlaceholder': 'Masalan: 5 yillik tajribaga ega ustaman',
  'register.passwordPlaceholder': 'Kamida 8 belgi',
  'register.confirmPassword': 'Parolni tasdiqlang',
  'register.confirmPlaceholder': 'Parolni qayta kiriting',
  'register.infoNote': "So'rov yuborilgach, hisobingiz administrator tasdig'idan so'ng faollashadi.",
  'register.submit': "So'rov yuborish",
  'register.haveAccount': 'Hisobingiz bormi?',
  'register.loginLink': 'Kirish',
  'register.successTitle': "So'rovingiz qabul qilindi",
  'register.successBody':
    "So'rovingiz administrator tomonidan ko'rib chiqiladi. Tasdiqlangandan so'ng ushbu telefon raqam va parol bilan tizimga kirishingiz mumkin bo'ladi.",
  'register.backToLogin': 'Kirish sahifasiga qaytish',

  // ---- Forgot password (manual recovery) ------------------------------------
  'forgot.title': 'Parolni tiklash',
  'forgot.intro': 'Parolni tiklash uchun administratorga Telegram orqali murojaat qiling.',
  'forgot.introStrong': 'Ism-familiyangiz, filialingiz va ish telefon raqamingizni yozing.',
  'forgot.warning': 'Amaldagi parolingizni hech kimga yubormang — administrator uni hech qachon so’ramaydi.',
  'forgot.button': 'Telegram orqali murojaat',
  'forgot.note':
    "So'rovlaringiz administrator tomonidan qo'lda ko'rib chiqiladi. Tekshiruvdan so'ng sizga vaqtinchalik parol beriladi — uni birinchi kirishda almashtirasiz.",
  'forgot.backToLogin': 'Kirish sahifasiga qaytish',

  // ---- Change password ------------------------------------------------------
  'changePw.forcedTitle': "Yangi parol o'rnating",
  'changePw.voluntaryTitle': "Parolni o'zgartirish",
  'changePw.forcedSubtitle': 'Bu vaqtinchalik parol. Ishni davom ettirish uchun uni almashtiring.',
  'changePw.voluntarySubtitle': 'Joriy parolingizni tasdiqlang va yangi parol tanlang.',
  'changePw.tempLabel': 'Vaqtinchalik parol',
  'changePw.currentLabel': 'Joriy parol',
  'changePw.tempPlaceholder': 'Administrator bergan parol',
  'changePw.currentPlaceholder': 'Joriy parolingiz',
  'changePw.newLabel': 'Yangi parol',
  'changePw.newPlaceholder': 'Kamida 8 belgi',
  'changePw.confirmLabel': 'Yangi parolni tasdiqlang',
  'changePw.confirmPlaceholder': 'Parolni qayta kiriting',
  'changePw.sessionNote':
    "Xavfsizlik uchun parolni o'zgartirsangiz, boshqa qurilmalardagi barcha seanslaringiz tugatiladi — faqat shu qurilma tizimda qoladi.",
  'changePw.submit': "Parolni o'rnatish",
  'changePw.toastSuccess': "Parol o'zgartirildi",
  'changePw.cancel': 'Bekor qilish',

  // ---- Not found / route error ----------------------------------------------
  'notFound.title': 'Sahifa topilmadi',
  'notFound.body': "Siz izlagan sahifa mavjud emas yoki ko’chirilgan bo’lishi mumkin.",
  'notFound.home': 'Bosh sahifaga qaytish',
  'routeError.chunkTitle': 'Yangi versiya mavjud',
  'routeError.chunkBody': 'Ilova yangilangan. Sahifani qayta yuklab, davom eting.',
  'routeError.genericTitle': "Nimadir noto’g’ri ketdi",
  'routeError.genericBody': "Ushbu bo’limni ko’rsatishda xatolik yuz berdi. Qayta urinib ko’ring.",

  // ---- Navigation (sidebar) -------------------------------------------------
  'nav.aria': 'Asosiy navigatsiya',
  'nav.homeAria': 'EASY GAS — bosh sahifa',
  'nav.menu': 'Menyu',
  'nav.menuClose': 'Menyuni yopish',
  'nav.drawerAria': 'Navigatsiya',
  'nav.group.work': 'Ish',
  'nav.group.staff': 'Xodimlar',
  'nav.group.operations': 'Amaliyot',
  'nav.group.catalog': 'Katalog',
  'nav.group.safety': 'Xavfsizlik',
  'nav.home': 'Bosh sahifa',
  'nav.myJobs': 'Mening ishlarim',
  'nav.jobs': 'Ishlar',
  'nav.completedJobs': 'Tugallangan ishlar',
  'nav.staff': 'Xodimlar',
  'nav.requests': "So'rovlar",
  'nav.customers': 'Mijozlar',
  'nav.vehicles': 'Avtomobillar',
  'nav.branches': 'Filiallar',
  'nav.templates': 'Shablonlar',
  'nav.priceBase': 'Narx bazasi',
  'nav.references': "Ma'lumotnomalar",
  'nav.riskPolicy': 'Xavf siyosati',
  'nav.profile': 'Mening profilim',

  // ---- Account menu ---------------------------------------------------------
  'account.menuAria': 'Hisob menyusi',
  'account.profile': 'Mening profilim',
  'account.logout': 'Chiqish',

  // ---- Home (workspace landing) ---------------------------------------------
  'home.welcome': 'Xush kelibsiz, {name}',
  'home.empty': "Ishni boshlash uchun yuqoridagi menyudan bo'lim tanlang.",
  'home.desc.myJobs': 'Sizga biriktirilgan ishlar va checklistlar.',
  'home.desc.jobs': "Filial ishlarini ko'ring yoki yangi ish oching.",
  'home.desc.users': 'Xodimlarni boshqaring — profil, tahrirlash, parol tiklash.',
  'home.desc.requests': "Ro'yxatdan o'tish so'rovlarini ko'rib chiqing.",
  'home.desc.customers': "Mijozlar ma'lumotlari.",
  'home.desc.vehicles': 'Avtomobillar reyestri.',
  'home.desc.branches': 'Filiallarni boshqaring.',
  'home.desc.templates': 'Checklist shablonlari va versiyalari.',
  'home.desc.riskPolicy': 'Xavf matritsasi versiyalari.',

  // ---- Shared UI ------------------------------------------------------------
  'ui.password.show': "Parolni ko'rsatish",
  'ui.password.hide': 'Parolni yashirish',
  'ui.pagination.rowsPerPage': 'Sahifadagi qatorlar soni',
  'ui.pagination.prev': 'Oldingi sahifa',
  'ui.pagination.next': 'Keyingi sahifa',
  'ui.pagination.summary': '{total} tadan {from}–{to}',

  // ---- API error messages (mapped from stable server codes) -----------------
  'error.INVALID_CREDENTIALS': "Telefon raqam yoki parol noto'g'ri",
  'error.INVALID_CURRENT_PASSWORD': "Joriy parol noto'g'ri",
  'error.PASSWORD_REUSE': 'Yangi parol avvalgisidan farq qilishi kerak',
  'error.TEMP_PASSWORD_EXPIRED': "Vaqtinchalik parol muddati tugagan. Administratordan yangisini so'rang.",
  'error.INVALID_BRANCH': 'Tanlangan servis filiali mavjud emas',
  'error.VALIDATION_ERROR': "Kiritilgan ma'lumotlarni tekshiring",
  'error.TOO_MANY_REQUESTS': "Juda ko'p urinish. Birozdan so'ng qayta urinib ko'ring.",
  'error.NETWORK_ERROR': "Server bilan aloqa yo'q. Internetni tekshiring.",
  'error.NOT_FOUND': 'Topilmadi',
  'error.fallback': "Kutilmagan xatolik yuz berdi. Qayta urinib ko'ring.",
} as const;
