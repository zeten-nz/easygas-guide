/** Uzbek catalogue fragment — catalog. Source of truth for this module's keys. */
export const catalogUz = {
  // ---- Price base shell / tabs ---------------------------------------------
  'cat.priceBase.title': 'Narx bazasi',
  'cat.tab.products': 'Mahsulotlar',
  'cat.tab.services': 'Xizmatlar',

  // ---- Generic field / column labels ---------------------------------------
  'cat.field.code': 'Kod',
  'cat.field.name': 'Nomi',
  'cat.field.price': 'Narx',
  'cat.field.status': 'Holat',
  'cat.field.company': 'Kompaniya',
  'cat.field.category': 'Kategoriya',
  'cat.field.brand': 'Brend',
  'cat.field.unit': "O'lchov birligi",
  'cat.field.source': 'Manba',
  'cat.field.priceHistory': 'Narx tarixi',
  'cat.field.priceBasis': 'Narx asosi',
  'cat.field.duration': 'Davomiyligi',
  'cat.field.taxRate': 'Soliq stavkasi',
  'cat.field.priceInclusive': 'Soliq bilan narx',

  // ---- Status display labels (codes stay stable) ---------------------------
  'cat.status.active': 'Faol',
  'cat.status.archived': 'Arxivlangan',

  // ---- Actions -------------------------------------------------------------
  'cat.action.edit': 'Tahrirlash',
  'cat.action.delete': "O'chirish",
  'cat.action.details': 'Batafsil',
  'cat.action.archive': 'Arxivlash',
  'cat.action.activate': 'Faollashtirish',
  'cat.action.create': 'Yaratish',
  'cat.action.clear': 'Tozalash',

  // ---- Source display labels -----------------------------------------------
  'cat.source.import': 'Import (tasdiqlanishi kerak)',
  'cat.source.manual': "Qo'lda",
  'cat.source.importShort': 'Import',

  // ---- Price basis display labels ------------------------------------------
  'cat.priceBasis.net': 'Soliqsiz (NET)',
  'cat.priceBasis.gross': 'Soliq bilan (GROSS)',
  'cat.priceBasis.unknown': "Noma'lum",

  // ---- Search / filters / sort ---------------------------------------------
  'cat.search.aria': 'Qidiruv',
  'cat.search.placeholder': 'Kod yoki nom…',
  'cat.filter.company.aria': "Kompaniya bo'yicha filtr",
  'cat.filter.company.all': 'Barcha kompaniyalar',
  'cat.filter.category.aria': "Kategoriya bo'yicha filtr",
  'cat.filter.category.all': 'Barcha kategoriyalar',
  'cat.filter.status.aria': "Holat bo'yicha filtr",
  'cat.filter.status.all': 'Barcha holatlar',
  'cat.sort.label': 'Saralash:',
  'cat.sort.field.aria': 'Saralash maydoni',
  'cat.sort.order.aria': 'Saralash tartibi',
  'cat.sort.byName': "Nom bo'yicha",
  'cat.sort.updated': 'Yangilangan',
  'cat.sort.asc': "O'sish",
  'cat.sort.desc': 'Kamayish',

  // ---- Table headers -------------------------------------------------------
  'cat.th.product': 'Mahsulot',
  'cat.th.service': 'Xizmat',
  'cat.th.actions': 'Amallar',

  // ---- Row actions ---------------------------------------------------------
  'cat.rowActions.aria': '{name} — amallar',

  // ---- Empty states / hints ------------------------------------------------
  'cat.empty.hint': "Qidiruv yoki filtrlarni o'zgartirib ko'ring.",
  'cat.products.empty.title': 'Mahsulot topilmadi',
  'cat.services.empty.title': 'Xizmat topilmadi',

  // ---- Panel descriptions --------------------------------------------------
  'cat.products.desc': "Mahsulotlar narx bazasi. Import qilingan narxlar boshlang'ich — tasdiqlanishi kerak; har bir narxning manbasi ko'rsatiladi.",
  'cat.services.desc': "Xizmatlar narx bazasi. Narx asosi (soliqsiz/soliq bilan) aniq ko'rsatiladi.",

  // ---- New-entity buttons --------------------------------------------------
  'cat.product.new': 'Yangi mahsulot',
  'cat.service.new': 'Yangi xizmat',

  // ---- Duration display ----------------------------------------------------
  'cat.duration.minShort': '{min} daq',
  'cat.duration.minutes': '{min} daqiqa',

  // ---- Product toasts ------------------------------------------------------
  'cat.product.toast.archived': 'Mahsulot arxivlandi',
  'cat.product.toast.activated': 'Mahsulot faollashtirildi',
  'cat.product.toast.deleted': "Mahsulot o'chirildi",
  'cat.product.toast.created': 'Mahsulot yaratildi',
  'cat.product.toast.updated': 'Mahsulot yangilandi',

  // ---- Service toasts ------------------------------------------------------
  'cat.service.toast.archived': 'Xizmat arxivlandi',
  'cat.service.toast.activated': 'Xizmat faollashtirildi',
  'cat.service.toast.deleted': "Xizmat o'chirildi",
  'cat.service.toast.created': 'Xizmat yaratildi',
  'cat.service.toast.updated': 'Xizmat yangilandi',

  // ---- Shared status toast -------------------------------------------------
  'cat.toast.statusUpdated': 'Holat yangilandi',

  // ---- Delete confirmations ------------------------------------------------
  'cat.product.delete.title': "Mahsulotni o'chirish",
  'cat.product.delete.body': "butunlay o'chiriladi. Bu amalni bekor qilib bo'lmaydi. Agar keyinchalik kerak bo'lishi mumkin bo'lsa, uni arxivlang.",
  'cat.product.deleteDetail.body': "butunlay o'chiriladi. Kerak bo'lishi mumkin bo'lsa, arxivlang.",
  'cat.service.delete.title': "Xizmatni o'chirish",
  'cat.service.delete.body': "butunlay o'chiriladi. Bu amalni bekor qilib bo'lmaydi.",
  'cat.service.deleteDetail.body': "butunlay o'chiriladi.",

  // ---- Detail pages --------------------------------------------------------
  'cat.detail.back': 'Narx bazasiga qaytish',

  // ---- Price history -------------------------------------------------------
  'cat.priceHistory.empty': "Narx hali o'zgartirilmagan",
  'cat.priceHistory.emptyDetail': "Narx hali o'zgartirilmagan.",
  'cat.priceHistory.reasonLabel': 'Sabab',

  // ---- Reference combobox --------------------------------------------------
  'cat.combobox.select': 'Tanlang',
  'cat.combobox.searchPlaceholder': 'Qidiruv…',
  'cat.combobox.notFound': 'Topilmadi',
  'cat.combobox.archived': '(arxivlangan)',
  'cat.combobox.loadMore': 'Yana yuklash ({count}/{total})',

  // ---- Form labels / placeholders ------------------------------------------
  'cat.form.codeSku': 'Kod (SKU)',
  'cat.form.brandOptional': 'Brend (ixtiyoriy)',
  'cat.form.unitOptional': "O'lchov birligi (ixtiyoriy)",
  'cat.form.priceProduct': "Narx (so'm) — bo'sh qoldirilsa noma'lum",
  'cat.form.pricePlaceholder': 'Masalan: 1500000',
  'cat.form.priceReasonLabel': "Narx o'zgarishi sababi (ixtiyoriy)",
  'cat.form.priceReasonPlaceholder': "Narx o'zgarsa, tarixda saqlanadi",
  'cat.form.durationLabel': 'Davomiyligi (daqiqa, ixtiyoriy)',
  'cat.form.priceService': "Narx (so'm) — bo'sh = noma'lum",
  'cat.form.taxRateLabel': 'Soliq stavkasi (%, ixtiyoriy)',
  'cat.form.taxPlaceholder': 'Masalan: 12',
  'cat.form.priceInclusiveLabel': "Soliq bilan narx (so'm, ixtiyoriy)",
  'cat.form.taxNote': "Soliq siyosati universal emas — faqat aniq bo'lsa kiriting.",

  // ---- Modal titles --------------------------------------------------------
  'cat.product.edit.title': 'Mahsulotni tahrirlash',
  'cat.service.edit.title': 'Xizmatni tahrirlash',

  // ---- Validation messages (stored as keys, resolved at render) ------------
  'cat.valid.codeRequired': 'Kod kiritilishi shart',
  'cat.valid.nameRequired': 'Nomi kiritilishi shart',
  'cat.valid.priceNonNegative': "Narx manfiy bo'lmagan son bo'lishi kerak",
  'cat.valid.priceNotNegative': "Narx manfiy bo'lmasin",
  'cat.valid.companyRequired': 'Kompaniya tanlanishi shart',
  'cat.valid.categoryRequired': 'Kategoriya tanlanishi shart',
} as const;
