/** Uzbek catalogue fragment — jobs-b. Source of truth for this module's keys. */
export const jobsBUz = {
  // ---- Shared within module -------------------------------------------------
  'jb.reasonLine': 'Sabab: {reason}',
  'jb.optionalSuffix': '(ixtiyoriy)',
  'jb.noteOptional': 'Izoh (ixtiyoriy)',
  'jb.count': '{count} ta',
  'jb.none': "yo'q",
  'jb.overrideReason': 'Override sababi (majburiy)',

  // ---- Checklist section ----------------------------------------------------
  'jb.checklist.notAssigned': 'Checklist hali biriktirilmagan',
  'jb.checklist.progressDone': '{completed} / {total} bajarildi',
  'jb.checklist.finished': 'Checklist yakunlandi',
  'jb.checklist.stopSubmittedInfo':
    "STOP checkpoint yuborildi — Master tasdig'i kutilmoqda. Tasdiqlangunga qadar keyingi bosqichlar yopiq.",
  'jb.checklist.stopRejectedInfo':
    "STOP rad etilgan — jarayon bloklangan. Tuzatishni boshlab, bosqichni qayta bajarib Master tasdig'iga yuboring.",
  'jb.checklist.startFirst': 'Bosqichlarni bajarish uchun avval ishni boshlang ("Ishni boshlash" tugmasi).',

  // ---- Assign checklist -----------------------------------------------------
  'jb.assign.assignedToast': 'Checklist biriktirildi',
  'jb.assign.title': 'Checklist biriktirish',
  'jb.assign.desc':
    "Ish uchun tekshiruv ro'yxatini tanlang — joriy faol versiya qo'llanadi va ish davomida o'zgarmaydi.",
  'jb.assign.noTemplates': "Hozircha faol shablonlar yo'q — administrator shablon nashr qilishi kerak.",
  'jb.assign.selectAria': 'Shablon tanlash',
  'jb.assign.selectPlaceholder': 'Shablonni tanlang',
  'jb.assign.submit': 'Biriktirish',

  // ---- Step card ------------------------------------------------------------
  'jb.step.sentToMasterToast': '"{name}" Master tasdig\'iga yuborildi',
  'jb.step.doneToast': '"{name}" bajarildi',
  'jb.step.waitingApproval': 'STOP — Tasdiq kutilmoqda',
  'jb.step.stopApproved': 'STOP tasdiqlangan',
  'jb.step.stopRejected': 'STOP rad etilgan',
  'jb.step.attemptN': '{n}-urinish',
  'jb.step.requirements': 'Talablar: {req}',
  'jb.step.normParen': '(norma: {min}–{max} {unit})',
  'jb.step.normRange': 'norma: {min}–{max} {unit}',
  'jb.step.noteLine': 'Izoh: {note}',
  'jb.step.notePlaceholder': "Qo'shimcha izoh",
  'jb.step.morePhotos': 'Bosqichni yakunlash uchun yana {n} ta rasm yuklash kerak ({have}/{need}).',
  'jb.step.stopInfo':
    "Bu STOP checkpoint: bajarilgach Master tasdig'iga yuboriladi va tasdiqlanmaguncha keyingi bosqichlar ochilmaydi.",
  'jb.step.sendToMaster': "Master tasdig'iga yuborish",
  'jb.step.markDone': 'Bajarildi deb belgilash',

  // ---- Photo gallery (within a step) ----------------------------------------
  'jb.photo.attemptPhotos': '{n}-urinish rasmlari',

  // ---- Photo uploader -------------------------------------------------------
  'jb.upload.successToast': 'Rasm yuklandi',
  'jb.upload.retryDesc': 'Fayl saqlanmadi — qaytadan yuborishingiz mumkin.',
  'jb.upload.needed': 'Kerakli rasmlar: {have}/{need}',
  'jb.upload.button': 'Rasm yuklash',
  'jb.upload.hint': "JPEG/PNG/WebP, maksimum 10 MB. Rasmlar dalil sifatida saqlanadi va o'chirilmaydi.",

  // ---- Redo step ------------------------------------------------------------
  'jb.redo.reopenedToast': '"{name}" tuzatish uchun qayta ochildi',
  'jb.redo.button': 'Qayta bajarish',
  'jb.redo.title': 'Bosqichni qayta bajarish',
  'jb.redo.confirm': 'Qayta ochish',
  'jb.redo.body':
    "«{name}» yangi urinish sifatida qayta ochiladi: yangi o'lchov va rasmlar talab qilinadi{stop}. Avvalgi natijalar tarixda saqlanadi.",
  'jb.redo.stopClause': ", STOP bo'lgani uchun yana Master tasdig'i kerak bo'ladi",

  // ---- Rework (rejected STOP) -----------------------------------------------
  'jb.rework.startedToast': 'Tuzatish boshlandi — bosqichni qayta bajaring',
  'jb.rework.start': 'Tuzatishni boshlash',
  'jb.rework.confirm': 'Boshlash',
  'jb.rework.body':
    "«{name}» bosqichi qayta ochiladi: ishni tuzatib, yangi rasmlar bilan qayta yuborasiz. Yangi yuborish ham Master tasdig'ini talab qiladi. Avvalgi urinish natijalari tarixda saqlanib qoladi.",

  // ---- STOP decision panel --------------------------------------------------
  'jb.stop.approvedToast': 'STOP tasdiqlandi — ish davom etishi mumkin',
  'jb.stop.rejectedToast': 'STOP rad etildi',
  'jb.stop.masterRequired': "Master tasdig'i talab qilinadi — {name} tomonidan yuborilgan.",
  'jb.stop.tech': 'usta',
  'jb.stop.decisionRequired': 'Master qarori talab qilinadi',
  'jb.stop.submittedBy': '{plate} · {name} yubordi',
  'jb.stop.approveButton': 'STOPni tasdiqlash',
  'jb.stop.rejectButton': 'Rad etish',
  'jb.stop.approveBody':
    "«{name}» STOP checkpointi tasdiqlanadi va ish davom etishi mumkin bo'ladi. Qaror audit jurnaliga yoziladi.",
  'jb.stop.rejectTitle': 'STOPni rad etish',
  'jb.stop.rejectBodyBefore': '«{name}» rad etiladi: ish ',
  'jb.stop.rejectedState': 'Rad etilgan',
  'jb.stop.rejectBodyAfter': " holatiga o'tadi va jarayon bloklanadi. Sabab majburiy.",
  'jb.stop.rejectReasonLabel': 'Rad etish sababi (majburiy)',
  'jb.stop.rejectReasonPlaceholder': 'Masalan: ish bosimi talabga mos emas, qayta sozlash kerak',
  'jb.stop.back': 'Ortga',
  'jb.stop.rejectConfirm': 'Rad etishni tasdiqlash',

  // ---- Installation card ----------------------------------------------------
  'jb.inst.title': "O'rnatish ma'lumotlari",
  'jb.inst.add': 'Kiritish',
  'jb.inst.edit': 'Tahrirlash',
  'jb.inst.savedToast': "O'rnatish ma'lumotlari saqlandi",
  'jb.inst.empty': "O'rnatish ma'lumotlari hali kiritilmagan.",
  'jb.inst.gasType': 'Gaz turi',
  'jb.inst.kit': 'Kit',
  'jb.inst.ecu': 'ECU',
  'jb.inst.cylinder': 'Ballon',
  'jb.inst.note': 'Izoh',
  'jb.inst.kitPlaceholder': 'Masalan: Tomasetto Alaska',
  'jb.inst.ecuPlaceholder': 'Masalan: Stag 4 QBox',
  'jb.inst.cylinderPlaceholder': 'Masalan: 60L toroid',
  'jb.inst.notePlaceholder': "Kerakli texnik ma'lumotlar",

  // ---- Risk panel: level / status / source display labels -------------------
  'jb.risk.levelLow': 'Past',
  'jb.risk.levelMedium': "O'rta",
  'jb.risk.levelHigh': 'Yuqori',
  'jb.risk.levelCritical': 'KRITIK',
  'jb.risk.statusOpen': 'Ochiq',
  'jb.risk.statusMitigation': "Chora ko'rilmoqda",
  'jb.risk.statusResolved': 'Hal qilingan',
  'jb.risk.statusRejected': 'Bekor qilingan (qayta baholangan)',
  'jb.risk.sourceManual': "Qo'lda kiritilgan",
  'jb.risk.sourceStopRejected': 'Rad etilgan STOP',
  'jb.risk.sourceChecklist': 'Checklist',

  // ---- Risk panel: register -------------------------------------------------
  'jb.risk.register': 'Xavf registri',
  'jb.risk.add': "Xavf qo'shish",
  'jb.risk.blockingCount': '{count} ta hal qilinmagan bloklaydigan xavf.',
  'jb.risk.blockingTail': 'Ular hal qilinmaguncha yoki override qilinmaguncha ish yakunlanmaydi.',
  'jb.risk.currentCycle': 'Joriy sikl (#{cycle})',
  'jb.risk.noneThisCycle': "Bu siklda qayd etilgan xavf yo'q.",
  'jb.risk.prevCycles': 'Oldingi sikllar ({count})',
  'jb.risk.blocking': 'Bloklaydi',
  'jb.risk.notBlocking': 'Bloklamaydi',
  'jb.risk.stepLink': 'Bosqich #{id}',
  'jb.risk.source': 'Manba: {src}',
  'jb.risk.matrix': 'Matritsa: {v}',
  'jb.risk.resolve': 'Hal qilish',
  'jb.risk.override': 'Override',

  // ---- Risk: create modal ---------------------------------------------------
  'jb.risk.createDesc':
    'Jiddiylik va ehtimollikni kiriting — daraja, ball va bloklash holati server tomonidan hisoblanadi.',
  'jb.risk.hazardType': 'Xavf turi',
  'jb.risk.descLabel': 'Tavsif',
  'jb.risk.severity': 'Jiddiylik (1–4)',
  'jb.risk.likelihood': 'Ehtimollik (1–4)',
  'jb.risk.addSubmit': "Qo'shish",
  'jb.risk.createdToast': 'Xavf qayd etildi',

  // ---- Risk: resolve modal --------------------------------------------------
  'jb.risk.resolveTitle': 'Xavfni hal qilish',
  'jb.risk.resolveQuestion': "— qanday chora ko'rildi?",
  'jb.risk.resolveNoteLabel': 'Izoh (majburiy)',
  'jb.risk.resolveMitigationLabel': "Ko'rilgan chora (ixtiyoriy)",
  'jb.risk.resolveConfirm': 'Hal qilindi',
  'jb.risk.resolvedToast': 'Xavf hal qilindi',

  // ---- Risk: override modal -------------------------------------------------
  'jb.risk.overrideTitle': 'Xavfni override qilish',
  'jb.risk.overrideWarn':
    'Bloklaydigan xavfni override qilish uni hal qilmasdan yopadi. Bu amal audit jurnaliga yoziladi va faqat asosli hollarda ishlatilishi kerak.',
  'jb.risk.overrideConfirm': 'Override qilish',
  'jb.risk.overrideToast': 'Xavf override qilindi',

  // ---- Completion: readiness conditions -------------------------------------
  'jb.cond.checklist': 'Checklist bosqichlari bajarildi',
  'jb.cond.stops': 'Barcha STOP checkpointlar tasdiqlangan',
  'jb.cond.measurements': "O'lchovlar talab doirasida",
  'jb.cond.photos': 'Kerakli foto dalillar mavjud',
  'jb.cond.risks': "Hal qilinmagan bloklaydigan xavf yo'q",
  'jb.cond.signature': 'Mijoz imzosi olingan',
  'jb.cond.ok': 'OK',
  'jb.cond.needed': 'kerak',

  // ---- Completion section ---------------------------------------------------
  'jb.completion.closedToast': 'Ish muvaffaqiyatli yakunlandi',
  'jb.completion.reSignToast': "Ish tafsiloti o'zgardi — mijoz qayta imzolashi kerak",
  'jb.completion.doneTitle': 'Ish yakunlangan',
  'jb.completion.closedBy': 'Yopdi: {name}',
  'jb.completion.previouslyReopened': 'Avval qayta ochilgan: {name} · sabab: {reason}',
  'jb.completion.customerSignature': 'Mijoz imzosi',
  'jb.completion.errorGeneric': 'Xatolik',
  'jb.completion.finish': 'Ishni yakunlash',
  'jb.completion.sendToQuality': 'Sifat nazoratiga yuborish',
  'jb.completion.reopenedInfo':
    "Ish sifat nazorati tomonidan qayta ochilgan ({name}). Sabab: {reason}. Tuzatishdan so'ng ish sifat nazoratiga qayta yuboriladi.",
  'jb.completion.confirmContinue': 'Ha, davom etilsin',
  'jb.completion.confirmBody':
    '— {plate} bo\'yicha {tail} Server barcha shartlarni qayta tekshiradi va qaror audit jurnaliga yoziladi.',
  'jb.completion.confirmTailReopened': 'tuzatilgan ish sifat nazoratiga yuboriladi. Sifat tasdiqlagach ish yakunlanadi.',
  'jb.completion.confirmTailNormal': 'ish yakunlanadi.',
  'jb.completion.summaryLoadError': "Xulosani yuklab bo'lmadi",
  'jb.completion.staleReSignToast':
    "Ish tafsiloti o'zgardi — yangilangan xulosani ko'rsatib, qayta imzolatishingiz kerak",
  'jb.completion.signatureBound': "Imzo yuqoridagi xulosa raqamli iziga bog'langan.",

  // ---- Completion snapshot --------------------------------------------------
  'jb.snapshot.none': "Bu ish uchun muhrlangan snapshot yo'q (eski tizimda yakunlangan bo'lishi mumkin).",
  'jb.snapshot.title': 'Muhrlangan yakuniy snapshot (sikl #{cycle})',
  'jb.snapshot.status': 'Holat',
  'jb.snapshot.schemaVersion': 'Sxema versiyasi',
  'jb.snapshot.technicianId': "Mas'ul texnik (ID)",
  'jb.snapshot.signatureDigest': "Imzo bog'langan digest",
  'jb.snapshot.risks': 'Xavflar ({count})',
  'jb.snapshot.blocking': 'bloklovchi',
  'jb.snapshot.matrix': 'matritsa {v}',
  'jb.snapshot.digest': "Snapshot digesti (o'zgarmas)",

  // ---- Reopen panel ---------------------------------------------------------
  'jb.reopen.doneToast': 'Ish qayta ochildi — tuzatish jarayoni boshlandi',
  'jb.reopen.button': 'Ishni qayta ochish',
  'jb.reopen.body':
    "— {plate} bo'yicha yakunlangan ish qayta ochiladi va tuzatish ishlariga qaytadi. Asl yakunlash, imzo va barcha tarixiy ma'lumotlar saqlanib qoladi. Sabab majburiy.",
  'jb.reopen.reasonLabel': 'Qayta ochish sababi (majburiy)',
  'jb.reopen.reasonPlaceholder': 'Masalan: reduktor sozlamasi talabga mos emas',
  'jb.reopen.confirm': 'Qayta ochishni tasdiqlash',

  // ---- Quality review panel -------------------------------------------------
  'jb.quality.confirmedToast': 'Sifat nazorati tasdiqlandi — ish yakunlandi',
  'jb.quality.title': 'Sifat nazoratida',
  'jb.quality.awaiting': "Tuzatilgan ish sifat nazorati tasdig'ini kutmoqda.",
  'jb.quality.reopenReason': 'Qayta ochish sababi: {reason}',
  'jb.quality.passButton': "Sifat nazoratidan o'tkazish",
  'jb.quality.confirmTitle': 'Sifat nazoratini tasdiqlash',
  'jb.quality.confirmLabel': 'Tasdiqlash — ish yakunlansin',
  'jb.quality.confirmBody':
    "— {plate} bo'yicha tuzatilgan ish qabul qilinadi va yakunlanadi. Server yakunlash shartlarini qayta tekshiradi.",

  // ---- Signature pad --------------------------------------------------------
  'jb.sign.savedToast': 'Mijoz imzosi saqlandi',
  'jb.sign.retryDesc': 'Imzo saqlanmadi — qaytadan urinishingiz mumkin.',
  'jb.sign.title': "Mijoz tasdig'i va imzosi",
  'jb.sign.desc': "Mijoz yuqoridagi xulosa bilan tanishib, quyida imzo qo'yadi. Imzo saqlangach o'zgartirib bo'lmaydi.",
  'jb.sign.clear': 'Tozalash',
  'jb.sign.save': 'Imzoni saqlash',

  // ---- Signable summary card ------------------------------------------------
  'jb.summary.gasLpg': 'LPG (propan-butan)',
  'jb.summary.gasCng': 'CNG (metan)',
  'jb.summary.aria': 'Imzolanadigan xulosa',
  'jb.summary.title': "Yakuniy xulosa (mijoz tasdig'i uchun)",
  'jb.summary.customer': 'Mijoz',
  'jb.summary.phone': 'Telefon',
  'jb.summary.vehicle': 'Avtomobil',
  'jb.summary.kit': 'Komplekt',
  'jb.summary.checklistVersion': 'Checklist versiyasi',
  'jb.summary.steps': 'Bosqichlar',
  'jb.summary.stops': 'STOP nuqtalari',
  'jb.summary.openBlockingRisk': 'Hal qilinmagan bloklaydigan xavf',
  'jb.summary.cycle': 'Sikl',
  'jb.summary.digestLabel': 'Xulosa raqamli izi (digest)',

  // ---- Start job modal ------------------------------------------------------
  'jb.start.gpsCapturedToast': 'GPS qayd etildi',
  'jb.start.gpsOverrideToast': 'GPS override qayd etildi',
  'jb.start.startedToast': 'Ish boshlandi',
  'jb.start.title': 'Ishni boshlash',
  'jb.start.intro': '— {plate} bo\'yicha ish boshlanadi. Holat "Jarayonda" ga o\'tadi.',
  'jb.start.gpsCaptured': "O'rnatish joyi qayd etildi.",
  'jb.start.gpsOverridden': 'GPS override qayd etildi.',
  'jb.start.overrideOpen': 'GPS mavjud emas — override qayd etish',
  'jb.start.overrideSave': 'Override saqlash',

  // ---- Photo viewer (lightbox) ----------------------------------------------
  'jb.viewer.dialogAria': 'Foto {n} / {total} — {step}',
  'jb.viewer.zoomOut': 'Kichiklashtirish',
  'jb.viewer.zoomIn': 'Kattalashtirish',
  'jb.viewer.reset': 'Asliga qaytarish',
  'jb.viewer.loadError': "Rasmni yuklab bo'lmadi. Fayl vaqtincha mavjud emas bo'lishi mumkin.",
  'jb.viewer.imgAlt': '{step} — {uploader}, urinish {attempt}',
  'jb.viewer.prev': 'Oldingi rasm',
  'jb.viewer.next': 'Keyingi rasm',

  // ---- Evidence gallery -----------------------------------------------------
  'jb.gallery.title': 'Fotolar',
  'jb.gallery.total': 'Jami {total} ta',
  'jb.gallery.loadError': "Fotolarni yuklab bo'lmadi",
  'jb.gallery.empty': 'Bu ish uchun foto dalillar mavjud emas.',
  'jb.gallery.loadMore': 'Yana yuklash ({have} / {total})',
  'jb.gallery.notViewable': "Ko'rib bo'lmaydi: {role}",
  'jb.gallery.openPhoto': 'Rasmni ochish — {step}, urinish {attempt}',
  'jb.gallery.tileAlt': '{step} — urinish {attempt}',
  'jb.gallery.currentGroup': 'Joriy va boshqa dalillar',
  'jb.gallery.currentGroupSub': 'joriy tsikl / eskirgan urinishlar',
  'jb.gallery.cycleCompleted': '{cycle}-tsikl (yakunlangan)',
  'jb.gallery.cycleOneOf': '{total} tsikldan biri',

  // ---- Evidence role labels (role CODES stay stable; only labels localise) --
  'jb.role.completedCycle': 'Yakunlangan tsikl',
  'jb.role.current': 'Joriy',
  'jb.role.superseded': 'Eskirgan urinish',
  'jb.role.historical': 'Tarixiy (aniqlanmagan)',
  'jb.role.pending': 'Yuklanmoqda',
  'jb.role.unverified': 'Tekshirilmagan (eski)',
  'jb.role.failed': 'Muvaffaqiyatsiz',

  // ---- Evidence meta line ---------------------------------------------------
  'jb.evidence.noData': "Ma'lumot mavjud emas",
  'jb.evidence.uploadedBy': 'Yuklagan: {name}',
  'jb.evidence.attempt': 'Urinish {n}',
  'jb.evidence.cyclesMulti': '{list}-tsikllar',
  'jb.evidence.cycleOne': '{n}-tsikl',
  'jb.evidence.cycleUnknown': 'Tsikl: joriy/aniqlanmagan',

  // ---- Risk form validation (client-side UX; server never derives from these) --
  'jb.riskform.hazardMin': 'Xavf turini kiriting (kamida 2 belgi)',
  'jb.riskform.descriptionMin': 'Tavsif kiriting (kamida 3 belgi)',
  'jb.riskform.severityRange': "Jiddiylik 1–4 oralig'ida bo'lishi kerak",
  'jb.riskform.likelihoodRange': "Ehtimollik 1–4 oralig'ida bo'lishi kerak",

  // ---- GPS capture errors (§20) ----------------------------------------------
  'jb.gps.unsupported': "Bu qurilma joylashuvni qo'llab-quvvatlamaydi.",
  'jb.gps.permissionDenied': "Joylashuvga ruxsat berilmadi. Brauzer sozlamalaridan ruxsat bering va qayta urinib ko'ring.",
  'jb.gps.timeout': "Joylashuvni aniqlash vaqti tugadi. Ochiq joyda qayta urinib ko'ring.",
  'jb.gps.unavailable': "Joylashuvni aniqlab bo'lmadi. Qayta urinib ko'ring.",

  // ---- Completion blockers (§22 legacy readiness panel data) ----------------
  'jb.blocker.checklist': 'Barcha bosqichlar bajarilgan',
  'jb.blocker.stops': 'Barcha STOP tasdiqlangan',
  'jb.blocker.photos': 'Kerakli fotolar yuklangan',
  'jb.blocker.measurements': "O'lchovlar to'g'ri",
  'jb.blocker.risks': "Hal qilinmagan kritik xavf yo'q",
} as const;
