import { uz } from './uz';

/**
 * Russian (Cyrillic) CORE fragment. Typed against the CORE Uzbek keys only
 * (`Record<keyof typeof uz, string>`) so this file needs exactly the core keys —
 * module fragments live under ./modules. Global uz⇄ru parity across all fragments
 * is asserted in ./index.ts. Brand lines are kept verbatim.
 */
export const ru: Record<keyof typeof uz, string> = {
  // ---- Common / shared actions ---------------------------------------------
  'common.appName': 'EASY GAS',
  'common.brandTagline': 'Safety Technology',
  'common.loading': 'Загрузка…',
  'common.back': 'Назад',
  'common.cancel': 'Отмена',
  'common.save': 'Сохранить',
  'common.confirm': 'Подтвердить',
  'common.retry': 'Повторить',
  'common.reload': 'Обновить',
  'common.close': 'Закрыть',
  'common.logout': 'Выйти',

  // ---- Language selector ----------------------------------------------------
  'lang.label': 'Язык',
  'lang.uz': 'Узбекский',
  'lang.ru': 'Русский',
  'lang.uzShort': 'UZ',
  'lang.ruShort': 'RU',

  // ---- Auth shell -----------------------------------------------------------
  'auth.tagline': 'Безопасная установка. Проверенная работа. Надёжный сервис.',
  'auth.support': 'Нужна помощь?',

  // ---- Shared auth fields / validation --------------------------------------
  'auth.field.phone': 'Номер телефона',
  'auth.field.phonePlaceholder': '90 123 45 67',
  'auth.field.password': 'Пароль',
  'auth.field.passwordPlaceholder': 'Ваш пароль',
  'valid.phoneRequired': 'Введите номер телефона',
  'valid.phoneInvalid': 'Номер телефона неполный',
  'valid.passwordRequired': 'Введите пароль',
  'valid.firstNameRequired': 'Введите имя',
  'valid.lastNameRequired': 'Введите фамилию',
  'valid.min2': 'Минимум 2 буквы',
  'valid.regionRequired': 'Выберите регион',
  'valid.branchRequired': 'Выберите сервисный филиал',
  'valid.commentTooLong': 'Комментарий слишком длинный',
  'valid.passwordMin8': 'Минимум 8 символов',
  'valid.confirmRequired': 'Повторите пароль',
  'valid.passwordsMismatch': 'Пароли не совпадают',
  'valid.newPasswordRequired': 'Введите новый пароль',
  'valid.passwordMustDiffer': 'Новый пароль должен отличаться от текущего',
  'valid.currentPasswordRequired': 'Введите текущий пароль',
  'valid.tempPasswordRequired': 'Введите временный пароль',

  // ---- Login ----------------------------------------------------------------
  'login.title': 'Вход в систему',
  'login.subtitle': 'Введите номер телефона и пароль',
  'login.rememberMe': 'Запомнить меня',
  'login.forgot': 'Забыли пароль?',
  'login.submit': 'Войти',
  'login.noAccount': 'Нет аккаунта?',
  'login.registerLink': 'Регистрация',

  // ---- Register -------------------------------------------------------------
  'register.title': 'Регистрация',
  'register.subtitle': 'Ваша заявка будет рассмотрена и подтверждена администратором',
  'register.firstName': 'Имя',
  'register.firstNamePlaceholder': 'Ваше имя',
  'register.lastName': 'Фамилия',
  'register.lastNamePlaceholder': 'Ваша фамилия',
  'register.region': 'Регион',
  'register.regionPlaceholder': 'Выберите регион',
  'register.branch': 'Сервисный филиал',
  'register.branchPlaceholder': 'Выберите филиал',
  'register.branchLoading': 'Загрузка…',
  'register.branchError': 'Не удалось загрузить список филиалов. Обновите страницу.',
  'register.comment': 'Комментарий (необязательно)',
  'register.commentPlaceholder': 'Например: мастер с 5-летним опытом',
  'register.passwordPlaceholder': 'Минимум 8 символов',
  'register.confirmPassword': 'Подтвердите пароль',
  'register.confirmPlaceholder': 'Повторите пароль',
  'register.infoNote': 'После отправки заявки аккаунт активируется после подтверждения администратором.',
  'register.submit': 'Отправить заявку',
  'register.haveAccount': 'Уже есть аккаунт?',
  'register.loginLink': 'Войти',
  'register.successTitle': 'Заявка принята',
  'register.successBody':
    'Ваша заявка будет рассмотрена администратором. После подтверждения вы сможете войти с этим номером телефона и паролем.',
  'register.backToLogin': 'Вернуться на страницу входа',

  // ---- Forgot password (manual recovery) ------------------------------------
  'forgot.title': 'Восстановление пароля',
  'forgot.intro': 'Для восстановления пароля обратитесь к администратору через Telegram.',
  'forgot.introStrong': 'Укажите имя и фамилию, филиал и рабочий номер телефона.',
  'forgot.warning': 'Никому не отправляйте свой действующий пароль — администратор его никогда не спрашивает.',
  'forgot.button': 'Обратиться через Telegram',
  'forgot.note':
    'Ваши обращения проверяются администратором вручную. После проверки вам выдадут временный пароль — вы смените его при первом входе.',
  'forgot.backToLogin': 'Вернуться на страницу входа',

  // ---- Change password ------------------------------------------------------
  'changePw.forcedTitle': 'Установите новый пароль',
  'changePw.voluntaryTitle': 'Смена пароля',
  'changePw.forcedSubtitle': 'Это временный пароль. Чтобы продолжить работу, смените его.',
  'changePw.voluntarySubtitle': 'Подтвердите текущий пароль и выберите новый.',
  'changePw.tempLabel': 'Временный пароль',
  'changePw.currentLabel': 'Текущий пароль',
  'changePw.tempPlaceholder': 'Пароль, выданный администратором',
  'changePw.currentPlaceholder': 'Ваш текущий пароль',
  'changePw.newLabel': 'Новый пароль',
  'changePw.newPlaceholder': 'Минимум 8 символов',
  'changePw.confirmLabel': 'Подтвердите новый пароль',
  'changePw.confirmPlaceholder': 'Повторите пароль',
  'changePw.sessionNote':
    'В целях безопасности при смене пароля все сеансы на других устройствах завершатся — в системе останется только это устройство.',
  'changePw.submit': 'Установить пароль',
  'changePw.toastSuccess': 'Пароль изменён',
  'changePw.cancel': 'Отмена',

  // ---- Not found / route error ----------------------------------------------
  'notFound.title': 'Страница не найдена',
  'notFound.body': 'Страница, которую вы ищете, не существует или была перемещена.',
  'notFound.home': 'Вернуться на главную',
  'routeError.chunkTitle': 'Доступна новая версия',
  'routeError.chunkBody': 'Приложение обновлено. Перезагрузите страницу, чтобы продолжить.',
  'routeError.genericTitle': 'Что-то пошло не так',
  'routeError.genericBody': 'При отображении этого раздела произошла ошибка. Повторите попытку.',

  // ---- Navigation (sidebar) -------------------------------------------------
  'nav.aria': 'Основная навигация',
  'nav.homeAria': 'EASY GAS — главная',
  'nav.menu': 'Меню',
  'nav.menuClose': 'Закрыть меню',
  'nav.drawerAria': 'Навигация',
  'nav.group.work': 'Работа',
  'nav.group.staff': 'Сотрудники',
  'nav.group.operations': 'Операции',
  'nav.group.catalog': 'Каталог',
  'nav.group.safety': 'Безопасность',
  'nav.home': 'Главная',
  'nav.myJobs': 'Мои работы',
  'nav.jobs': 'Работы',
  'nav.completedJobs': 'Завершённые работы',
  'nav.staff': 'Сотрудники',
  'nav.requests': 'Заявки',
  'nav.customers': 'Клиенты',
  'nav.vehicles': 'Автомобили',
  'nav.branches': 'Филиалы',
  'nav.templates': 'Шаблоны',
  'nav.priceBase': 'База цен',
  'nav.references': 'Справочники',
  'nav.riskPolicy': 'Политика рисков',
  'nav.profile': 'Мой профиль',

  // ---- Account menu ---------------------------------------------------------
  'account.menuAria': 'Меню аккаунта',
  'account.profile': 'Мой профиль',
  'account.logout': 'Выйти',

  // ---- Role display labels (codes are stable; only labels localize) ---------
  'role.USTA': 'Мастер сервиса',
  'role.MASTER': 'Старший мастер',
  'role.RAHBAR': 'Руководитель сервиса',
  'role.SIFAT': 'Контроль качества',
  'role.ADMIN': 'Администратор',

  // ---- Home (workspace landing) ---------------------------------------------
  'home.welcome': 'Добро пожаловать, {name}',
  'home.empty': 'Чтобы начать работу, выберите раздел в меню выше.',
  'home.desc.myJobs': 'Назначенные вам работы и чек-листы.',
  'home.desc.jobs': 'Просматривайте работы филиала или создайте новую.',
  'home.desc.users': 'Управление сотрудниками — профиль, редактирование, сброс пароля.',
  'home.desc.requests': 'Рассматривайте заявки на регистрацию.',
  'home.desc.customers': 'Данные клиентов.',
  'home.desc.vehicles': 'Реестр автомобилей.',
  'home.desc.branches': 'Управление филиалами.',
  'home.desc.templates': 'Шаблоны и версии чек-листов.',
  'home.desc.riskPolicy': 'Версии матрицы рисков.',

  // ---- Shared UI ------------------------------------------------------------
  'ui.password.show': 'Показать пароль',
  'ui.password.hide': 'Скрыть пароль',
  'ui.pagination.rowsPerPage': 'Строк на странице',
  'ui.pagination.prev': 'Предыдущая страница',
  'ui.pagination.next': 'Следующая страница',
  'ui.pagination.summary': '{from}–{to} из {total}',

  // ---- API error messages (mapped from stable server codes) -----------------
  'error.INVALID_CREDENTIALS': 'Неверный номер телефона или пароль',
  'error.INVALID_CURRENT_PASSWORD': 'Текущий пароль неверный',
  'error.PASSWORD_REUSE': 'Новый пароль должен отличаться от предыдущего',
  'error.TEMP_PASSWORD_EXPIRED': 'Срок действия временного пароля истёк. Запросите новый у администратора.',
  'error.INVALID_BRANCH': 'Выбранный сервисный филиал не существует',
  'error.VALIDATION_ERROR': 'Проверьте введённые данные',
  'error.TOO_MANY_REQUESTS': 'Слишком много попыток. Повторите чуть позже.',
  'error.NETWORK_ERROR': 'Нет связи с сервером. Проверьте интернет.',
  'error.NOT_FOUND': 'Не найдено',
  'error.FORBIDDEN': 'У вас нет прав на это действие',
  'error.DUPLICATE': 'Такая запись уже существует',
  'error.CONFLICT_RETRY': 'Данные изменились. Повторите попытку.',
  'error.STEP_STATE_CHANGED': 'Состояние шага изменилось. Обновите страницу.',
  'error.JOB_STATE_CHANGED': 'Состояние работы изменилось. Обновите страницу.',
  'error.STORAGE_UNAVAILABLE': 'Хранилище файлов временно недоступно. Повторите попытку.',
  'error.CRITICAL_RISK_UNRESOLVED': 'Критический риск не устранён',
  'error.REQUIRED_PHOTOS_MISSING': 'Не загружены обязательные фото',
  'error.CUSTOMER_SIGNATURE_REQUIRED': 'Требуется подпись клиента',
  'error.CHECKLIST_INCOMPLETE': 'Чек-лист заполнен не полностью',
  'error.STOP_APPROVAL_PENDING': 'Ожидается подтверждение STOP',
  'error.STOP_REJECTED': 'STOP отклонён',
  'error.RISK_POLICY_NOT_APPROVED': 'Политика рисков не утверждена',
  'error.TEMPLATE_HAS_HISTORY': 'Опубликованный шаблон нельзя удалить',
  'error.fallback': 'Произошла непредвиденная ошибка. Повторите попытку.',
};
