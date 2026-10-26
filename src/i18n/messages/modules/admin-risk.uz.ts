/**
 * Uzbek catalogue fragment — admin-risk (risk-policy screen + matrix). Source of
 * truth for this module's keys. Uzbek is the DEFAULT locale, so these values are
 * kept BYTE-IDENTICAL to the original hardcoded screen text (e2e/evidence-policy
 * asserts exact Uzbek). Risk-level, status and source CODES are stable and never
 * translated — only their display labels live here.
 */
export const adminRiskUz = {
  // ---- Risk-level display labels (CODES stay stable) ------------------------
  'rp.level.LOW': 'Past',
  'rp.level.MEDIUM': "O'rta",
  'rp.level.HIGH': 'Yuqori',
  'rp.level.CRITICAL': 'Kritik',

  // ---- Version status display labels (CODES stay stable) --------------------
  'rp.status.DRAFT': 'Qoralama (tasdiqlanmagan)',
  'rp.status.ACTIVE': 'Faol (tasdiqlangan)',
  'rp.status.RETIRED': 'Chiqarilgan (tarixiy)',

  // ---- Risk-source display labels (CODES stay stable) ----------------------
  'rp.source.MANUAL': "Qo'lda kiritilgan",
  'rp.source.STOP_REJECTED': 'STOP rad etilgan',
  'rp.source.MEASUREMENT_OUT_OF_RANGE': "O'lchov chegaradan tashqari",
  'rp.source.CHECKLIST_FLAG': 'Checklist belgisi',

  // ---- Shared bits ----------------------------------------------------------
  'rp.unknown': "noma'lum",
  'rp.userNumber': 'Foydalanuvchi #{id}',
  'rp.score': 'ball',
  'rp.blocking': 'Bloklovchi',
  'rp.loadingAria': 'Yuklanmoqda',

  // ---- Page header / top-level states ---------------------------------------
  'rp.title': 'Xavf siyosati',
  'rp.subtitle': "Xavf matritsasini tushunish, ko'rish va tasdiqlash (§21)",
  'rp.noActive.strong': "Faol tasdiqlangan xavf siyosati yo'q.",
  'rp.noActive.body':
    "Xavfsizlik amaliyotlari (ish boshlash, yakunlash, sifat tasdiqlash) to'xtatilgan. Quyidagi qoralamani mas'ul mutaxassis tasdiqlashi kerak.",
  'rp.noVersions': 'Hozircha xavf matritsasi versiyalari mavjud emas.',
  'rp.versionLabel': 'Versiya:',
  'rp.detailLoadError': "Versiya ma'lumotini yuklab bo'lmadi",

  // ---- Policy explainer -----------------------------------------------------
  'rp.explainer.title': 'Xavf siyosati nima?',
  'rp.explainer.p1': "Har bir xavf hodisasi aniq bir ishga tegishli bo'ladi.",
  'rp.explainer.matrixTerm': 'Xavf matritsasi',
  'rp.explainer.matrixDesc': " — xavflarni tasniflash uchun ishlatiladigan qoida. U ikki o'lchamga tayanadi:",
  'rp.explainer.severityTerm': "Og'irlik (severity)",
  'rp.explainer.severityDesc': " — oqibat qanchalik jiddiy bo'lishi mumkinligi.",
  'rp.explainer.likelihoodTerm': 'Ehtimollik (likelihood)',
  'rp.explainer.likelihoodDesc': ' — bu holat yuz berish ehtimoli.',
  'rp.explainer.blockingTerm': 'Bloklovchi darajalar',
  'rp.explainer.blockingDesc': " tegishli ishni yakunlash va sifat tasdiqlashni xavf hal etilmaguncha to'sadi.",
  'rp.explainer.approvedTerm': 'Tasdiqlangan (faol) siyosat',
  'rp.explainer.approvedDesc':
    ' — mavjud xavfsizlik jarayoni talab qiladigan shart: faol siyosatsiz ish boshlash va yakunlash to\'xtatiladi.',
  'rp.explainer.disclaimer':
    'Bu sahifa yuridik sertifikat yoki ishning xavfsizligining isboti emas; namunalar haqiqiy xavfsizlik bahosini bermaydi. Batafsil: loyiha hujjatlari §21.',

  // ---- Calculation-rule card ------------------------------------------------
  'rp.calc.title': 'Hisoblash qoidasi',
  'rp.calc.formula': "Ball = og'irlik × ehtimollik. Darajalar (yuqoridan pastga birinchi mos keladi):",
  'rp.calc.scoreGte': 'ball ≥ {min}',

  // ---- Blocking & special-rules card ----------------------------------------
  'rp.rules.title': 'Bloklovchi va maxsus qoidalar',
  'rp.rules.blockingLevels': 'Bloklovchi darajalar:',
  'rp.rules.sev4Prefix': "Og'irlik 4 kamida ",
  'rp.rules.sev4Suffix': ' darajasida.',
  'rp.rules.sourceOverrides': "Manba bo'yicha ustuvorlik:",
  'rp.rules.blockedOps': "Bloklovchi xavf quyidagilarni to'sadi: {ops}.",

  // ---- Lifecycle action buttons ---------------------------------------------
  'rp.activateBtn': 'Bu versiyani faollashtirish',
  'rp.retireBtn': 'Chiqarish (retire)',

  // ---- Provenance card ------------------------------------------------------
  'rp.prov.title': 'Kelib chiqishi va tasdiq',
  'rp.prov.provisionalPrefix': "Ta'rif kelib chiqishi: ",
  'rp.prov.provisionalTerm': 'vaqtinchalik (provisional)',
  'rp.prov.provisionalSuffix':
    ' — dastlab ishlab chiqishda tanlangan. Bu lifecycle (tasdiq) holatidan alohida: tasdiqlangan versiya "tasdiqlanmagan" degani emas.',
  'rp.prov.approvedBy': 'Tasdiqladi: ',
  'rp.prov.retired': 'Bu versiya chiqarilgan (tarixiy). Yaratilgan: {date}',
  'rp.prov.draft': 'Hali tasdiqlanmagan (qoralama). Yaratilgan: {date}',
  'rp.prov.rationale': 'Asos/havola: {text}',

  // ---- Illustrative preview -------------------------------------------------
  'rp.preview.title': 'Namuna baholash',
  'rp.preview.desc': "Bu {version} matritsasi bo'yicha namuna — saqlangan baho emas, hech qanday xavf hodisasi yaratmaydi.",
  'rp.preview.descProd': ' Ishlab chiqarish bahosi hamon FAOL siyosatni talab qiladi.',
  'rp.preview.severity': "Og'irlik",
  'rp.preview.likelihood': 'Ehtimollik',
  'rp.preview.source': 'Manba',
  'rp.preview.result': 'Natija (namuna):',

  // ---- Version history ------------------------------------------------------
  'rp.history.title': 'Versiyalar tarixi',
  'rp.history.approvedLine': 'Tasdiqladi: {who} · {date}',
  'rp.history.createdLine': 'Yaratilgan: {date}',

  // ---- Compare --------------------------------------------------------------
  'rp.compare.label': 'Taqqoslash:',
  'rp.compare.selectAria': 'Taqqoslash versiyasi',
  'rp.compare.pick': 'Versiya tanlang',
  'rp.compare.status': 'Holat',
  'rp.compare.blockingLevels': 'Bloklovchi darajalar',
  'rp.compare.thresholds': 'Chegaralar',
  'rp.compare.sourceOverrides': 'Manba ustuvorligi',
  'rp.compare.sev4Min': "Og'irlik 4 min",
  'rp.compare.diff': '(farq)',

  // ---- Activate modal -------------------------------------------------------
  'rp.activate.title': 'Xavf siyosatini faollashtirish',
  'rp.activate.bodyPrefix': '',
  'rp.activate.bodySuffix': ' versiyasi FAOL (tasdiqlangan) siyosatga aylanadi.',
  'rp.activate.point1': "Bu ishlab chiqarishdagi barcha yangi xavf baholariga qo'llaniladi.",
  'rp.activate.point2Prefix': 'Joriy faol ',
  'rp.activate.point2Suffix': ' avtomatik chiqariladi.',
  'rp.activate.point3': "Bloklovchi darajadagi xavf ish yakunlash va sifat tasdiqlashni to'sadi.",
  'rp.activate.errorSuffix': ". Holat yangilandi — qayta ko'ring.",
  'rp.activate.rationaleLabel': 'Tasdiqlash asosi / havola (majburiy)',
  'rp.activate.rationalePlaceholder': "Masalan: xavfsizlik mutaxassisi tasdig'i, hujjat #...",
  'rp.activate.submit': '{version}ni faollashtirish',
  'rp.activate.toastSuccess': '{version} faollashtirildi',

  // ---- Retire modal ---------------------------------------------------------
  'rp.retire.title': 'Versiyani chiqarish',
  'rp.retire.bodyPrefix': '',
  'rp.retire.bodySuffix': " versiyasi chiqariladi (tarixiy holatga o'tadi).",
  'rp.retire.onlyActiveWarn':
    "Bu yagona faol siyosat. Uni chiqarsangiz, faol siyosat qolmaydi — ish boshlash va yakunlash to'xtaydi (fail-closed).",
  'rp.retire.confirm': 'Chiqarishni tasdiqlash',
  'rp.retire.toastSuccess': '{version} chiqarildi',

  // ---- Matrix table (RiskMatrixTable) ---------------------------------------
  'rp.matrix.caption': "Xavf matritsasi: og'irlik (qatorlar) × ehtimollik (ustunlar) bo'yicha daraja",
  'rp.matrix.axisHeader': "Og'irlik ↓ / Ehtimollik →",
  'rp.matrix.cellAria': "Og'irlik {severity}, ehtimollik {likelihood}: {level}",
  'rp.matrix.cellAriaBlocking': "Og'irlik {severity}, ehtimollik {likelihood}: {level}, bloklovchi",
} as const;
