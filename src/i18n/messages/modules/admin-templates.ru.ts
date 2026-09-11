import type { adminTemplatesUz } from './admin-templates.uz';

/** Russian catalogue fragment — admin-templates (key parity with adminTemplatesUz enforced). */
export const adminTemplatesRu: Record<keyof typeof adminTemplatesUz, string> = {
  // ---- Version / template lifecycle status labels ---------------------------
  'tpl.status.draft': 'Черновик',
  'tpl.status.published': 'Активен',
  'tpl.status.archived': 'Архивирован',

  // ---- Templates list page --------------------------------------------------
  'tpl.page.title': 'Шаблоны чек-листов',
  'tpl.page.subtitle':
    'Новые работы используют активную (опубликованную) версию. Прежние работы сохраняют свою версию.',
  'tpl.new': 'Новый шаблон',
  'tpl.filter.aria': 'Фильтр по статусу',
  'tpl.filter.all': 'Все статусы',
  'tpl.empty.filtered': 'Нет шаблонов с этим статусом',
  'tpl.empty.none': 'Пока нет шаблонов',
  'tpl.row.actionsAria': '{name} — действия',
  'tpl.row.deleteBlocked': 'Опубликованный или архивированный шаблон удалить нельзя — он сохраняет историю.',

  // ---- Shared actions -------------------------------------------------------
  'tpl.action.open': 'Открыть',
  'tpl.action.delete': 'Удалить',
  'tpl.action.add': 'Добавить',
  'tpl.action.publish': 'Опубликовать',
  'tpl.action.archive': 'Архивировать',

  // ---- Create template modal ------------------------------------------------
  'tpl.create.title': 'Новый шаблон чек-листа',
  'tpl.create.namePlaceholder': 'Например: чек-лист установки LPG',
  'tpl.create.descPlaceholder': 'Краткое описание',
  'tpl.create.submit': 'Создать',
  'tpl.field.name': 'Название шаблона',
  'tpl.field.descriptionOptional': 'Описание (необязательно)',
  'tpl.valid.nameRequired': 'Введите название шаблона',
  'tpl.valid.min3': 'Минимум 3 символа',
  'tpl.toast.created': 'Шаблон создан (черновик v1 готов)',

  // ---- Template detail page -------------------------------------------------
  'tpl.templates': 'Шаблоны',
  'tpl.notFound': 'Шаблон не найден',
  'tpl.newVersion': 'Новая версия',
  'tpl.deleteTemplate': 'Удалить шаблон',
  'tpl.detail.notDeletableNote':
    'У этого шаблона есть опубликованная или архивированная версия — его нельзя удалить (защита исторических работ). Чтобы исключить из будущего выбора, архивируйте активную версию.',
  'tpl.detail.stepCount': 'Шагов: {n}',
  'tpl.detail.readonlySuffix': ' · изменить нельзя (защита исторических работ)',
  'tpl.detail.noSteps': 'В этой версии пока нет шагов',
  'tpl.step.add': 'Шаг',
  'tpl.aria.moveUp': 'Вверх',
  'tpl.aria.moveDown': 'Вниз',
  'tpl.aria.edit': 'Редактировать',

  // ---- Confirm dialogs (detail page) ----------------------------------------
  'tpl.publish.title': 'Опубликовать версию',
  'tpl.publish.body':
    'будет опубликована и станет активной версией, назначаемой новым работам. После публикации эту версию нельзя изменить. Предыдущая активная версия будет архивирована (прежние работы сохраняют свою версию).',
  'tpl.archive.title': 'Архивировать версию',
  'tpl.archive.body':
    'будет архивирована и не будет назначаться новым работам. На существующие работы это не повлияет.',
  'tpl.deleteStep.title': 'Удалить шаг',
  'tpl.deleteStep.body': 'Шаг «{name}» будет удалён из черновика.',

  // ---- Detail page toasts ---------------------------------------------------
  'tpl.toast.published': 'Версия опубликована — теперь назначается новым работам',
  'tpl.toast.archived': 'Версия архивирована',
  'tpl.toast.versionCreated': 'Создана новая версия-черновик (шаги скопированы)',
  'tpl.toast.stepDeleted': 'Шаг удалён',

  // ---- Step form modal ------------------------------------------------------
  'tpl.step.editTitle': 'Редактировать шаг',
  'tpl.step.newTitle': 'Новый шаг',
  'tpl.step.nameLabel': 'Название шага',
  'tpl.step.namePlaceholder': 'Например: установка и настройка редуктора',
  'tpl.step.descPlaceholder': 'Описание шага',
  'tpl.step.requirementsLabel': 'Требования (необязательно)',
  'tpl.step.requirementsPlaceholder': 'Технические требования',
  'tpl.step.riskWeightLabel': 'Вес риска (0–100)',
  'tpl.step.requiredPhotosLabel': 'Количество обязательных фото',
  'tpl.step.stopLabel': 'STOP-контроль (требуется подтверждение мастера — активируется на следующем шаге)',
  'tpl.step.measurementsHeading': 'Измерения (§16 — с границами min/max)',
  'tpl.step.addMeasurement': 'Измерение',
  'tpl.step.measureNamePlaceholder': 'Рабочее давление',
  'tpl.step.unitLabel': 'Единица',
  'tpl.step.unitPlaceholder': 'бар',
  'tpl.step.minLabel': 'Мин',
  'tpl.step.maxLabel': 'Макс',
  'tpl.step.expectedLabel': 'Ожидаемое',
  'tpl.step.removeMeasurement': 'Удалить измерение',
  'tpl.field.nameShort': 'Название',
  'tpl.field.required': 'Обязательный',
  'tpl.valid.stepNameRequired': 'Введите название шага',
  'tpl.valid.invalidValue': 'Неверное значение',
  'tpl.valid.measureNameRequired': 'Введите название измерения',
  'tpl.valid.unitRequired': 'Укажите единицу',
  'tpl.valid.min2chars': 'Минимум 2 символа',
  'tpl.toast.stepUpdated': 'Шаг обновлён',
  'tpl.toast.stepAdded': 'Шаг добавлен',

  // ---- Delete template dialog -----------------------------------------------
  'tpl.toast.templateDeleted': '«{name}» удалён',
  'tpl.deleteTemplate.warning': 'будет полностью удалён. Это действие нельзя отменить.',
  'tpl.deleteTemplate.explainA':
    'Удалить можно только черновик, который никогда не публиковался. Опубликованный или назначенный работам шаблон ',
  'tpl.deleteTemplate.explainBold': 'удалить нельзя',
  'tpl.deleteTemplate.explainB': ' — его история сохраняется; вместо этого архивируйте версию.',
};
