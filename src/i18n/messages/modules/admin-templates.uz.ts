/** Uzbek catalogue fragment — admin-templates. Source of truth for this module's keys. */
export const adminTemplatesUz = {
  // ---- Version / template lifecycle status labels ---------------------------
  'tpl.status.draft': 'Qoralama',
  'tpl.status.published': 'Faol',
  'tpl.status.archived': 'Arxivlangan',

  // ---- Templates list page --------------------------------------------------
  'tpl.page.title': 'Checklist shablonlari',
  'tpl.page.subtitle':
    "Yangi ishlar faol (nashr qilingan) versiyadan foydalanadi. Eski ishlar o'z versiyasini saqlab qoladi.",
  'tpl.new': 'Yangi shablon',
  'tpl.filter.aria': "Holat bo'yicha filtr",
  'tpl.filter.all': 'Barcha holatlar',
  'tpl.empty.filtered': "Bu holatda shablon yo'q",
  'tpl.empty.none': "Hozircha shablonlar yo'q",
  'tpl.row.actionsAria': '{name} — amallar',
  'tpl.row.deleteBlocked': "Nashr qilingan yoki arxivlangan shablon o'chirilmaydi — tarixni saqlaydi.",

  // ---- Shared actions -------------------------------------------------------
  'tpl.action.open': 'Ochish',
  'tpl.action.delete': "O'chirish",
  'tpl.action.add': "Qo'shish",
  'tpl.action.publish': 'Nashr qilish',
  'tpl.action.archive': 'Arxivlash',

  // ---- Create template modal ------------------------------------------------
  'tpl.create.title': 'Yangi checklist shabloni',
  'tpl.create.namePlaceholder': "Masalan: LPG o'rnatish tekshiruv ro'yxati",
  'tpl.create.descPlaceholder': 'Qisqa tavsif',
  'tpl.create.submit': 'Yaratish',
  'tpl.field.name': 'Shablon nomi',
  'tpl.field.descriptionOptional': 'Tavsif (ixtiyoriy)',
  'tpl.valid.nameRequired': 'Shablon nomi kiritilishi shart',
  'tpl.valid.min3': 'Kamida 3 ta belgi',
  'tpl.toast.created': 'Shablon yaratildi (v1 qoralama tayyor)',

  // ---- Template detail page -------------------------------------------------
  'tpl.templates': 'Shablonlar',
  'tpl.notFound': 'Shablon topilmadi',
  'tpl.newVersion': 'Yangi versiya',
  'tpl.deleteTemplate': "Shablonni o'chirish",
  'tpl.detail.notDeletableNote':
    "Bu shablon nashr qilingan yoki arxivlangan versiyaga ega — uni o'chirib bo'lmaydi (tarixiy ishlar himoyasi). Kelajakdagi tanlovdan chiqarish uchun faol versiyani arxivlang.",
  'tpl.detail.stepCount': '{n} ta bosqich',
  'tpl.detail.readonlySuffix': " · o'zgartirib bo'lmaydi (tarixiy ishlar himoyasi)",
  'tpl.detail.noSteps': "Bu versiyada hali bosqichlar yo'q",
  'tpl.step.add': 'Bosqich',
  'tpl.aria.moveUp': 'Yuqoriga',
  'tpl.aria.moveDown': 'Pastga',
  'tpl.aria.edit': 'Tahrirlash',

  // ---- Confirm dialogs (detail page) ----------------------------------------
  'tpl.publish.title': 'Versiyani nashr qilish',
  'tpl.publish.body':
    "nashr qilinadi va yangi ishlarga biriktiriladigan faol versiya bo'ladi. Nashrdan so'ng bu versiyani o'zgartirib bo'lmaydi. Avvalgi faol versiya arxivlanadi (eski ishlar o'z versiyasini saqlaydi).",
  'tpl.archive.title': 'Versiyani arxivlash',
  'tpl.archive.body': "arxivlanadi va yangi ishlarga biriktirilmaydi. Mavjud ishlarga ta'sir qilmaydi.",
  'tpl.deleteStep.title': "Bosqichni o'chirish",
  'tpl.deleteStep.body': "«{name}» bosqichi qoralamadan o'chiriladi.",

  // ---- Detail page toasts ---------------------------------------------------
  'tpl.toast.published': 'Versiya nashr qilindi — endi yangi ishlarga biriktiriladi',
  'tpl.toast.archived': 'Versiya arxivlandi',
  'tpl.toast.versionCreated': 'Yangi qoralama versiya yaratildi (bosqichlar nusxalandi)',
  'tpl.toast.stepDeleted': "Bosqich o'chirildi",

  // ---- Step form modal ------------------------------------------------------
  'tpl.step.editTitle': 'Bosqichni tahrirlash',
  'tpl.step.newTitle': 'Yangi bosqich',
  'tpl.step.nameLabel': 'Bosqich nomi',
  'tpl.step.namePlaceholder': "Masalan: Reduktor o'rnatish va sozlash",
  'tpl.step.descPlaceholder': 'Bosqich tavsifi',
  'tpl.step.requirementsLabel': 'Talablar (ixtiyoriy)',
  'tpl.step.requirementsPlaceholder': 'Texnik talablar',
  'tpl.step.riskWeightLabel': 'Risk vazni (0–100)',
  'tpl.step.requiredPhotosLabel': 'Majburiy fotolar soni',
  'tpl.step.stopLabel': "STOP checkpoint (Master tasdig'i talab qilinadi — keyingi bosqichda faollashadi)",
  'tpl.step.measurementsHeading': "O'lchovlar (§16 — min/max chegaralari bilan)",
  'tpl.step.addMeasurement': "O'lchov",
  'tpl.step.measureNamePlaceholder': 'Ish bosimi',
  'tpl.step.unitLabel': 'Birlik',
  'tpl.step.unitPlaceholder': 'bar',
  'tpl.step.minLabel': 'Min',
  'tpl.step.maxLabel': 'Max',
  'tpl.step.expectedLabel': 'Kutilgan',
  'tpl.step.removeMeasurement': "O'lchovni o'chirish",
  'tpl.field.nameShort': 'Nomi',
  'tpl.field.required': 'Majburiy',
  'tpl.valid.stepNameRequired': 'Bosqich nomi kiritilishi shart',
  'tpl.valid.invalidValue': "Noto'g'ri qiymat",
  'tpl.valid.measureNameRequired': "O'lchov nomi shart",
  'tpl.valid.unitRequired': 'Birlik shart',
  'tpl.valid.min2chars': 'Kamida 2 belgi',
  'tpl.toast.stepUpdated': 'Bosqich yangilandi',
  'tpl.toast.stepAdded': "Bosqich qo'shildi",

  // ---- Delete template dialog -----------------------------------------------
  'tpl.toast.templateDeleted': '"{name}" o\'chirildi',
  'tpl.deleteTemplate.warning': "butunlay o'chiriladi. Bu amalni ortga qaytarib bo'lmaydi.",
  'tpl.deleteTemplate.explainA':
    "Faqat hech qachon nashr qilinmagan qoralama shablonni o'chirish mumkin. Nashr qilingan yoki ishlarga biriktirilgan shablon ",
  'tpl.deleteTemplate.explainBold': "o'chirilmaydi",
  'tpl.deleteTemplate.explainB': " — uning tarixi saqlanadi; buning o'rniga versiyani arxivlang.",
} as const;
