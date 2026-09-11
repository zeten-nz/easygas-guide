/** Uzbek catalogue fragment — misc. Source of truth for this module's keys. */
export const miscUz = {
  // ---- Shared actions -------------------------------------------------------
  'm.action.edit': 'Tahrirlash',
  'm.action.delete': "O'chirish",
  'm.action.add': "Qo'shish",
  'm.action.create': 'Yaratish',
  'm.action.new': 'Yangi',
  'm.action.archive': 'Arxivlash',
  'm.action.reactivate': 'Faollashtirish',

  // ---- Toasts ---------------------------------------------------------------
  'm.toast.statusUpdated': 'Holat yangilandi',
  'm.toast.deleted': "O'chirildi",
  'm.toast.updated': 'Yangilandi',
  'm.toast.created': 'Yaratildi',

  // ---- Status labels --------------------------------------------------------
  'm.status.active': 'Faol',
  'm.status.archived': 'Arxivlangan',
  'm.status.blocked': 'Bloklangan',

  // ---- Shared fields / columns ----------------------------------------------
  'm.field.status': 'Holat',
  'm.field.role': 'Rol',
  'm.field.branch': 'Filial',
  'm.field.region': 'Viloyat',
  'm.field.commentOptional': 'Izoh (ixtiyoriy)',
  'm.col.actions': 'Amallar',
  'm.actionsFor': '{name} — amallar',

  // ---- Search / filter ------------------------------------------------------
  'm.search.placeholder': 'Qidiruv…',
  'm.search.aria': 'Qidiruv',
  'm.filter.all': 'Barchasi',

  // ---- Inline list pagination (Customers / Vehicles pages) ------------------
  'm.list.pageSummary': 'Jami {total} ta · {page}/{totalPages}-sahifa',

  // ---- Pagination component (count-agnostic — caller's noun is not used) ----
  'm.pagination.summary': 'Jami: {total} · {from}–{to}',
  'm.pagination.perPage': 'Sahifada',
  'm.pagination.page': 'Sahifa {page} / {total}',

  // ---- Customers ------------------------------------------------------------
  'm.customers.title': 'Mijozlar',
  'm.customers.subtitle': 'Mijozlar va ularning avtomobillari',
  'm.customers.new': 'Yangi mijoz',
  'm.customers.searchPlaceholder': "Ism yoki telefon bo'yicha qidirish...",
  'm.customers.searchAria': 'Mijoz qidirish',
  'm.customers.notFound': 'Mijoz topilmadi',
  'm.customers.empty': "Hozircha mijozlar yo'q",

  // ---- Customer detail ------------------------------------------------------
  'm.customerDetail.backToList': "Mijozlar ro'yxatiga qaytish",
  'm.customerDetail.noVehicles': "Bu mijozda hali avtomobil yo'q",

  // ---- Vehicles (shared + list page) ----------------------------------------
  'm.vehicles.title': 'Avtomobillar',
  'm.vehicles.add': "Avtomobil qo'shish",
  'm.vehicles.editAria': '{plate}ni tahrirlash',
  'm.vehicles.subtitle': "Davlat raqami, VIN yoki marka bo'yicha qidiring. Yangi avtomobil mijoz sahifasidan qo'shiladi.",
  'm.vehicles.searchPlaceholder': '01 A 123 BC, VIN yoki marka...',
  'm.vehicles.searchAria': 'Avtomobil qidirish',
  'm.vehicles.notFound': 'Avtomobil topilmadi',
  'm.vehicles.empty': "Hozircha avtomobillar yo'q",

  // ---- Customer form --------------------------------------------------------
  'm.customerForm.editTitle': 'Mijozni tahrirlash',
  'm.customerForm.created': 'Mijoz yaratildi',
  'm.customerForm.updated': "Mijoz ma'lumotlari yangilandi",
  'm.customerForm.nameLabel': 'Ism',
  'm.customerForm.namePlaceholder': 'Mijozning ismi',
  'm.customerForm.phoneLabel': 'Telefon raqam',

  // ---- Vehicle form ---------------------------------------------------------
  'm.vehicleForm.editTitle': 'Avtomobilni tahrirlash',
  'm.vehicleForm.updated': "Avtomobil ma'lumotlari yangilandi",
  'm.vehicleForm.created': "Avtomobil qo'shildi",
  'm.vehicleForm.plate': 'Davlat raqami',
  'm.vehicleForm.make': 'Marka',
  'm.vehicleForm.model': 'Model',
  'm.vehicleForm.year': 'Yil (ixtiyoriy)',
  'm.vehicleForm.mileage': 'Probeg, km (ixtiyoriy)',
  'm.vehicleForm.engine': 'Dvigatel (ixtiyoriy)',
  'm.vehicleForm.enginePlaceholder': '1.5 benzin',
  'm.vehicleForm.vin': 'VIN (ixtiyoriy)',
  'm.vehicleForm.vinPlaceholder': '17 belgili VIN',

  // ---- Form validation (stored as keys, resolved at render) -----------------
  'm.valid.nameRequired': 'Ism kiritilishi shart',
  'm.valid.min2Letters': 'Kamida 2 ta harf',
  'm.valid.phoneRequired': 'Telefon raqam kiritilishi shart',
  'm.valid.phoneIncomplete': "Telefon raqam to'liq emas",
  'm.valid.plateRequired': 'Davlat raqami kiritilishi shart',
  'm.valid.plateFormat': "Davlat raqami noto'g'ri formatda",
  'm.valid.makeRequired': 'Marka kiritilishi shart',
  'm.valid.min2Chars': 'Kamida 2 ta belgi',
  'm.valid.modelRequired': 'Model kiritilishi shart',
  'm.valid.yearInvalid': "Yil noto'g'ri",
  'm.valid.mileageInvalid': "Probeg noto'g'ri",
  'm.valid.tooLong': 'Juda uzun',
  'm.valid.vinFormat': "VIN 17 ta belgidan iborat bo'lishi kerak (I, O, Q harflarisiz)",
  'm.valid.codeRequired': 'Kod kiritilishi shart',
  'm.valid.refNameRequired': 'Nomi kiritilishi shart',
  'm.valid.designationRequired': 'Belgilanish kiritilishi shart',

  // ---- Reference data -------------------------------------------------------
  'm.ref.title': "Ma'lumotnomalar",
  'm.ref.subtitle': "Katalog uchun umumiy ma'lumotlar. Ishlatilayotgan yozuvlar o'chirilmaydi — arxivlanadi.",
  'm.ref.tab.companies': 'Kompaniyalar',
  'm.ref.tab.brands': 'Brendlar',
  'm.ref.tab.productCat': 'Mahsulot kat.',
  'm.ref.tab.serviceCat': 'Xizmat kat.',
  'm.ref.tab.units': "O'lchov birliklari",
  'm.ref.tab.injection': 'Injektor turlari',
  'm.ref.noRecords': 'Yozuv topilmadi.',
  'm.ref.col.code': 'Kod',
  'm.ref.col.name': 'Nomi',
  'm.ref.col.usage': 'Ishlatilishi',
  'm.ref.inUseCount': '{count} ta yozuvda',
  'm.ref.notUsed': 'Ishlatilmagan',
  'm.ref.deleteInUse': "O'chirish (ishlatilmoqda)",
  'm.ref.deleteTitle': "Yozuvni o'chirish",
  'm.ref.deleteBody': " butunlay o'chiriladi. Ishlatilayotgan yozuvlarni o'chirib bo'lmaydi — ularni arxivlang.",
  'm.ref.newRecord': 'Yangi yozuv',

  // ---- Injection reference --------------------------------------------------
  'm.inj.unknown': "Noma'lum",
  'm.inj.tech.port': 'Portli (multipoint)',
  'm.inj.tech.direct': "To'g'ridan-to'g'ri (direct)",
  'm.inj.forced.none': "Yo'q",
  'm.inj.forced.turbo': 'Turbo',
  'm.inj.forced.supercharged': 'Kompressor',
  'm.inj.info': "Injektor texnologiyasi (portli/to'g'ridan) turbo/kompressor bilan bog'liq emas — ular alohida maydonlar. Noma'lum qiymat qo'llab-quvvatlanadi.",
  'm.inj.col.designation': 'Belgilanish',
  'm.inj.col.technology': 'Texnologiya',
  'm.inj.col.forced': 'Havo berish',
  'm.inj.deleteBody': " o'chiriladi.",
  'm.inj.editTitle': 'Injektor turini tahrirlash',
  'm.inj.newTitle': 'Yangi injektor turi',
  'm.inj.designationLabel': 'Belgilanish (masalan MPI, GDI, FSI)',
  'm.inj.techLabel': 'Injektor texnologiyasi',
  'm.inj.forcedLabel': 'Havo berish (alohida atribut)',

  // ---- Profile --------------------------------------------------------------
  'm.profile.title': 'Mening profilim',
  'm.profile.changePassword': "Parolni o'zgartirish",
  'm.profile.note':
    "Parolni o'zgartirsangiz, boshqa qurilmalardagi barcha seanslaringiz tugatiladi va faqat shu qurilma tizimda qoladi. Ism, rol yoki filialni o'zgartirish uchun administratorga murojaat qiling.",
  'm.profile.phone': 'Telefon',
  'm.profile.registeredAt': "Ro'yxatdan o'tgan",
  'm.profile.lastLogin': 'Oxirgi kirish',
  'm.profile.noBranch': 'Filial biriktirilmagan',

  // ---- GPS capture ----------------------------------------------------------
  'm.gps.intro': "O'rnatish joyini tasdiqlash uchun qurilma joylashuvi kerak. Tugmani bosganingizda brauzer ruxsat so'raydi.",
  'm.gps.capture': 'Joylashuvni olish',
  'm.gps.captured': 'Joylashuv olindi · aniqlik ≈ {accuracy} m',
  'm.gps.lowAccuracy': "— aniqlik past, qayta urinib ko'ring",
  'm.gps.detectFailed': "Joylashuvni aniqlab bo'lmadi.",

  // ---- Risk policy banner ---------------------------------------------------
  'm.riskBanner.message': "Faol tasdiqlangan xavf siyosati yo'q — xavfsizlik amaliyotlari to'xtatilgan.",
  'm.riskBanner.approve': 'Tasdiqlash',

  // ---- Completion readiness panel -------------------------------------------
  'm.completion.aria': 'Yakunlash tayyorligi',
  'm.completion.ready': 'Yakunlashga tayyor',
  'm.completion.notReady': 'Yakunlash uchun bajarilishi kerak',
  'm.completion.needed': 'kerak',
  'm.completion.blockers': "To'siqlar",

  // ---- Shared Spinner ---------------------------------------------------------
  'm.spinner.loading': 'Yuklanmoqda',
} as const;
