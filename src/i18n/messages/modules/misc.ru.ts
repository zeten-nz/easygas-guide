import type { miscUz } from './misc.uz';

/** Russian catalogue fragment — misc (key parity with miscUz enforced). */
export const miscRu: Record<keyof typeof miscUz, string> = {
  // ---- Shared actions -------------------------------------------------------
  'm.action.edit': 'Редактировать',
  'm.action.delete': 'Удалить',
  'm.action.add': 'Добавить',
  'm.action.create': 'Создать',
  'm.action.new': 'Новый',
  'm.action.archive': 'Архивировать',
  'm.action.reactivate': 'Активировать',

  // ---- Toasts ---------------------------------------------------------------
  'm.toast.statusUpdated': 'Статус обновлён',
  'm.toast.deleted': 'Удалено',
  'm.toast.updated': 'Обновлено',
  'm.toast.created': 'Создано',

  // ---- Status labels --------------------------------------------------------
  'm.status.active': 'Активный',
  'm.status.archived': 'Архивирован',
  'm.status.blocked': 'Заблокирован',

  // ---- Shared fields / columns ----------------------------------------------
  'm.field.status': 'Статус',
  'm.field.role': 'Роль',
  'm.field.branch': 'Филиал',
  'm.field.region': 'Регион',
  'm.field.commentOptional': 'Комментарий (необязательно)',
  'm.col.actions': 'Действия',
  'm.actionsFor': '{name} — действия',

  // ---- Search / filter ------------------------------------------------------
  'm.search.placeholder': 'Поиск…',
  'm.search.aria': 'Поиск',
  'm.filter.all': 'Все',

  // ---- Inline list pagination (Customers / Vehicles pages) ------------------
  'm.list.pageSummary': 'Всего {total} · страница {page}/{totalPages}',

  // ---- Pagination component (count-agnostic — caller's noun is not used) ----
  'm.pagination.summary': 'Всего: {total} · {from}–{to}',
  'm.pagination.perPage': 'На странице',
  'm.pagination.page': 'Страница {page} / {total}',

  // ---- Customers ------------------------------------------------------------
  'm.customers.title': 'Клиенты',
  'm.customers.subtitle': 'Клиенты и их автомобили',
  'm.customers.new': 'Новый клиент',
  'm.customers.searchPlaceholder': 'Поиск по имени или телефону...',
  'm.customers.searchAria': 'Поиск клиента',
  'm.customers.notFound': 'Клиент не найден',
  'm.customers.empty': 'Пока нет клиентов',

  // ---- Customer detail ------------------------------------------------------
  'm.customerDetail.backToList': 'Вернуться к списку клиентов',
  'm.customerDetail.noVehicles': 'У этого клиента пока нет автомобилей',

  // ---- Vehicles (shared + list page) ----------------------------------------
  'm.vehicles.title': 'Автомобили',
  'm.vehicles.add': 'Добавить автомобиль',
  'm.vehicles.editAria': 'Редактировать {plate}',
  'm.vehicles.subtitle': 'Ищите по гос. номеру, VIN или марке. Новый автомобиль добавляется на странице клиента.',
  'm.vehicles.searchPlaceholder': '01 A 123 BC, VIN или марка...',
  'm.vehicles.searchAria': 'Поиск автомобиля',
  'm.vehicles.notFound': 'Автомобиль не найден',
  'm.vehicles.empty': 'Пока нет автомобилей',

  // ---- Customer form --------------------------------------------------------
  'm.customerForm.editTitle': 'Редактировать клиента',
  'm.customerForm.created': 'Клиент создан',
  'm.customerForm.updated': 'Данные клиента обновлены',
  'm.customerForm.nameLabel': 'Имя',
  'm.customerForm.namePlaceholder': 'Имя клиента',
  'm.customerForm.phoneLabel': 'Номер телефона',

  // ---- Vehicle form ---------------------------------------------------------
  'm.vehicleForm.editTitle': 'Редактировать автомобиль',
  'm.vehicleForm.updated': 'Данные автомобиля обновлены',
  'm.vehicleForm.created': 'Автомобиль добавлен',
  'm.vehicleForm.plate': 'Гос. номер',
  'm.vehicleForm.make': 'Марка',
  'm.vehicleForm.model': 'Модель',
  'm.vehicleForm.year': 'Год (необязательно)',
  'm.vehicleForm.mileage': 'Пробег, км (необязательно)',
  'm.vehicleForm.engine': 'Двигатель (необязательно)',
  'm.vehicleForm.enginePlaceholder': '1.5 бензин',
  'm.vehicleForm.vin': 'VIN (необязательно)',
  'm.vehicleForm.vinPlaceholder': 'VIN из 17 символов',

  // ---- Form validation (stored as keys, resolved at render) -----------------
  'm.valid.nameRequired': 'Введите имя',
  'm.valid.min2Letters': 'Минимум 2 буквы',
  'm.valid.phoneRequired': 'Введите номер телефона',
  'm.valid.phoneIncomplete': 'Номер телефона неполный',
  'm.valid.plateRequired': 'Введите гос. номер',
  'm.valid.plateFormat': 'Неверный формат гос. номера',
  'm.valid.makeRequired': 'Введите марку',
  'm.valid.min2Chars': 'Минимум 2 символа',
  'm.valid.modelRequired': 'Введите модель',
  'm.valid.yearInvalid': 'Неверный год',
  'm.valid.mileageInvalid': 'Неверный пробег',
  'm.valid.tooLong': 'Слишком длинно',
  'm.valid.vinFormat': 'VIN должен состоять из 17 символов (без букв I, O, Q)',
  'm.valid.codeRequired': 'Введите код',
  'm.valid.refNameRequired': 'Введите название',
  'm.valid.designationRequired': 'Введите обозначение',

  // ---- Reference data -------------------------------------------------------
  'm.ref.title': 'Справочники',
  'm.ref.subtitle': 'Общие данные для каталога. Используемые записи не удаляются — архивируются.',
  'm.ref.tab.companies': 'Компании',
  'm.ref.tab.brands': 'Бренды',
  'm.ref.tab.productCat': 'Кат. товаров',
  'm.ref.tab.serviceCat': 'Кат. услуг',
  'm.ref.tab.units': 'Единицы измерения',
  'm.ref.tab.injection': 'Типы инжекторов',
  'm.ref.noRecords': 'Записи не найдены.',
  'm.ref.col.code': 'Код',
  'm.ref.col.name': 'Название',
  'm.ref.col.usage': 'Использование',
  'm.ref.inUseCount': 'Используется: {count}',
  'm.ref.notUsed': 'Не используется',
  'm.ref.deleteInUse': 'Удалить (используется)',
  'm.ref.deleteTitle': 'Удалить запись',
  'm.ref.deleteBody': ' будет удалён навсегда. Используемые записи удалить нельзя — архивируйте их.',
  'm.ref.newRecord': 'Новая запись',

  // ---- Injection reference --------------------------------------------------
  'm.inj.unknown': 'Неизвестно',
  'm.inj.tech.port': 'Портовый (multipoint)',
  'm.inj.tech.direct': 'Прямой (direct)',
  'm.inj.forced.none': 'Нет',
  'm.inj.forced.turbo': 'Турбо',
  'm.inj.forced.supercharged': 'Компрессор',
  'm.inj.info': 'Технология инжектора (портовый/прямой) не связана с турбо/компрессором — это отдельные поля. Значение «Неизвестно» поддерживается.',
  'm.inj.col.designation': 'Обозначение',
  'm.inj.col.technology': 'Технология',
  'm.inj.col.forced': 'Наддув',
  'm.inj.deleteBody': ' будет удалён.',
  'm.inj.editTitle': 'Редактировать тип инжектора',
  'm.inj.newTitle': 'Новый тип инжектора',
  'm.inj.designationLabel': 'Обозначение (например MPI, GDI, FSI)',
  'm.inj.techLabel': 'Технология инжектора',
  'm.inj.forcedLabel': 'Наддув (отдельный атрибут)',

  // ---- Profile --------------------------------------------------------------
  'm.profile.title': 'Мой профиль',
  'm.profile.changePassword': 'Сменить пароль',
  'm.profile.note':
    'Если вы смените пароль, все сеансы на других устройствах будут завершены, и в системе останется только это устройство. Для изменения имени, роли или филиала обратитесь к администратору.',
  'm.profile.phone': 'Телефон',
  'm.profile.registeredAt': 'Дата регистрации',
  'm.profile.lastLogin': 'Последний вход',
  'm.profile.noBranch': 'Филиал не назначен',

  // ---- GPS capture ----------------------------------------------------------
  'm.gps.intro': 'Для подтверждения места установки нужно местоположение устройства. При нажатии кнопки браузер запросит разрешение.',
  'm.gps.capture': 'Получить местоположение',
  'm.gps.captured': 'Местоположение получено · точность ≈ {accuracy} м',
  'm.gps.lowAccuracy': '— точность низкая, повторите попытку',
  'm.gps.detectFailed': 'Не удалось определить местоположение.',

  // ---- Risk policy banner ---------------------------------------------------
  'm.riskBanner.message': 'Нет активной утверждённой политики рисков — операции безопасности приостановлены.',
  'm.riskBanner.approve': 'Подтвердить',

  // ---- Completion readiness panel -------------------------------------------
  'm.completion.aria': 'Готовность к завершению',
  'm.completion.ready': 'Готово к завершению',
  'm.completion.notReady': 'Для завершения необходимо выполнить',
  'm.completion.needed': 'нужно',
  'm.completion.blockers': 'Препятствия',

  // ---- Shared Spinner ---------------------------------------------------------
  'm.spinner.loading': 'Загрузка',
};
