import type { catalogUz } from './catalog.uz';

/** Russian catalogue fragment — catalog (key parity with catalogUz enforced). */
export const catalogRu: Record<keyof typeof catalogUz, string> = {
  // ---- Price base shell / tabs ---------------------------------------------
  'cat.priceBase.title': 'База цен',
  'cat.tab.products': 'Товары',
  'cat.tab.services': 'Услуги',

  // ---- Generic field / column labels ---------------------------------------
  'cat.field.code': 'Код',
  'cat.field.name': 'Название',
  'cat.field.price': 'Цена',
  'cat.field.status': 'Статус',
  'cat.field.company': 'Компания',
  'cat.field.category': 'Категория',
  'cat.field.brand': 'Бренд',
  'cat.field.unit': 'Единица измерения',
  'cat.field.source': 'Источник',
  'cat.field.priceHistory': 'История цен',
  'cat.field.priceBasis': 'Основа цены',
  'cat.field.duration': 'Длительность',
  'cat.field.taxRate': 'Ставка налога',
  'cat.field.priceInclusive': 'Цена с налогом',

  // ---- Status display labels (codes stay stable) ---------------------------
  'cat.status.active': 'Активный',
  'cat.status.archived': 'Архивирован',

  // ---- Actions -------------------------------------------------------------
  'cat.action.edit': 'Редактировать',
  'cat.action.delete': 'Удалить',
  'cat.action.details': 'Подробнее',
  'cat.action.archive': 'Архивировать',
  'cat.action.activate': 'Активировать',
  'cat.action.create': 'Создать',
  'cat.action.clear': 'Очистить',

  // ---- Source display labels -----------------------------------------------
  'cat.source.import': 'Импорт (требует подтверждения)',
  'cat.source.manual': 'Вручную',
  'cat.source.importShort': 'Импорт',

  // ---- Price basis display labels ------------------------------------------
  'cat.priceBasis.net': 'Без налога (NET)',
  'cat.priceBasis.gross': 'С налогом (GROSS)',
  'cat.priceBasis.unknown': 'Неизвестно',

  // ---- Search / filters / sort ---------------------------------------------
  'cat.search.aria': 'Поиск',
  'cat.search.placeholder': 'Код или название…',
  'cat.filter.company.aria': 'Фильтр по компании',
  'cat.filter.company.all': 'Все компании',
  'cat.filter.category.aria': 'Фильтр по категории',
  'cat.filter.category.all': 'Все категории',
  'cat.filter.status.aria': 'Фильтр по статусу',
  'cat.filter.status.all': 'Все статусы',
  'cat.sort.label': 'Сортировка:',
  'cat.sort.field.aria': 'Поле сортировки',
  'cat.sort.order.aria': 'Порядок сортировки',
  'cat.sort.byName': 'По названию',
  'cat.sort.updated': 'Обновлено',
  'cat.sort.asc': 'По возрастанию',
  'cat.sort.desc': 'По убыванию',

  // ---- Table headers -------------------------------------------------------
  'cat.th.product': 'Товар',
  'cat.th.service': 'Услуга',
  'cat.th.actions': 'Действия',

  // ---- Row actions ---------------------------------------------------------
  'cat.rowActions.aria': '{name} — действия',

  // ---- Empty states / hints ------------------------------------------------
  'cat.empty.hint': 'Измените поисковый запрос или фильтры.',
  'cat.products.empty.title': 'Товары не найдены',
  'cat.services.empty.title': 'Услуги не найдены',

  // ---- Panel descriptions --------------------------------------------------
  'cat.products.desc': 'База цен товаров. Импортированные цены являются предварительными — их нужно подтвердить; для каждой цены указывается источник.',
  'cat.services.desc': 'База цен услуг. Основа цены (без налога/с налогом) указывается явно.',

  // ---- New-entity buttons --------------------------------------------------
  'cat.product.new': 'Новый товар',
  'cat.service.new': 'Новая услуга',

  // ---- Duration display ----------------------------------------------------
  'cat.duration.minShort': '{min} мин',
  'cat.duration.minutes': '{min} минут',

  // ---- Product toasts ------------------------------------------------------
  'cat.product.toast.archived': 'Товар архивирован',
  'cat.product.toast.activated': 'Товар активирован',
  'cat.product.toast.deleted': 'Товар удалён',
  'cat.product.toast.created': 'Товар создан',
  'cat.product.toast.updated': 'Товар обновлён',

  // ---- Service toasts ------------------------------------------------------
  'cat.service.toast.archived': 'Услуга архивирована',
  'cat.service.toast.activated': 'Услуга активирована',
  'cat.service.toast.deleted': 'Услуга удалена',
  'cat.service.toast.created': 'Услуга создана',
  'cat.service.toast.updated': 'Услуга обновлена',

  // ---- Shared status toast -------------------------------------------------
  'cat.toast.statusUpdated': 'Статус обновлён',

  // ---- Delete confirmations ------------------------------------------------
  'cat.product.delete.title': 'Удаление товара',
  'cat.product.delete.body': 'будет удалён навсегда. Это действие необратимо. Если он может понадобиться позже, архивируйте его.',
  'cat.product.deleteDetail.body': 'будет удалён навсегда. Если он может понадобиться, архивируйте его.',
  'cat.service.delete.title': 'Удаление услуги',
  'cat.service.delete.body': 'будет удалена навсегда. Это действие необратимо.',
  'cat.service.deleteDetail.body': 'будет удалена навсегда.',

  // ---- Detail pages --------------------------------------------------------
  'cat.detail.back': 'Вернуться к базе цен',

  // ---- Price history -------------------------------------------------------
  'cat.priceHistory.empty': 'Цена ещё не менялась',
  'cat.priceHistory.emptyDetail': 'Цена ещё не менялась.',
  'cat.priceHistory.reasonLabel': 'Причина',

  // ---- Reference combobox --------------------------------------------------
  'cat.combobox.select': 'Выберите',
  'cat.combobox.searchPlaceholder': 'Поиск…',
  'cat.combobox.notFound': 'Не найдено',
  'cat.combobox.archived': '(архивирован)',
  'cat.combobox.loadMore': 'Показать ещё ({count}/{total})',

  // ---- Form labels / placeholders ------------------------------------------
  'cat.form.codeSku': 'Код (SKU)',
  'cat.form.brandOptional': 'Бренд (необязательно)',
  'cat.form.unitOptional': 'Единица измерения (необязательно)',
  'cat.form.priceProduct': 'Цена (сум) — оставьте пустым, если неизвестно',
  'cat.form.pricePlaceholder': 'Например: 1500000',
  'cat.form.priceReasonLabel': 'Причина изменения цены (необязательно)',
  'cat.form.priceReasonPlaceholder': 'Если цена изменится, сохранится в истории',
  'cat.form.durationLabel': 'Длительность (минуты, необязательно)',
  'cat.form.priceService': 'Цена (сум) — пусто = неизвестно',
  'cat.form.taxRateLabel': 'Ставка налога (%, необязательно)',
  'cat.form.taxPlaceholder': 'Например: 12',
  'cat.form.priceInclusiveLabel': 'Цена с налогом (сум, необязательно)',
  'cat.form.taxNote': 'Налоговая политика не универсальна — указывайте, только если точно известно.',

  // ---- Modal titles --------------------------------------------------------
  'cat.product.edit.title': 'Редактирование товара',
  'cat.service.edit.title': 'Редактирование услуги',

  // ---- Validation messages (stored as keys, resolved at render) ------------
  'cat.valid.codeRequired': 'Введите код',
  'cat.valid.nameRequired': 'Введите название',
  'cat.valid.priceNonNegative': 'Цена должна быть неотрицательным числом',
  'cat.valid.priceNotNegative': 'Цена не должна быть отрицательной',
  'cat.valid.companyRequired': 'Выберите компанию',
  'cat.valid.categoryRequired': 'Выберите категорию',
};
