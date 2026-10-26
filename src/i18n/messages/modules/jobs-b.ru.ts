import type { jobsBUz } from './jobs-b.uz';

/** Russian catalogue fragment — jobs-b (key parity with jobsBUz enforced). */
export const jobsBRu: Record<keyof typeof jobsBUz, string> = {
  // ---- Shared within module -------------------------------------------------
  'jb.reasonLine': 'Причина: {reason}',
  'jb.optionalSuffix': '(необязательно)',
  'jb.noteOptional': 'Комментарий (необязательно)',
  'jb.count': '{count} шт.',
  'jb.none': 'нет',
  'jb.overrideReason': 'Причина override (обязательно)',

  // ---- Checklist section ----------------------------------------------------
  'jb.checklist.notAssigned': 'Чек-лист ещё не назначен',
  'jb.checklist.progressDone': '{completed} / {total} выполнено',
  'jb.checklist.finished': 'Чек-лист завершён',
  'jb.checklist.stopSubmittedInfo':
    'Контрольная точка STOP отправлена — ожидается подтверждение старшего мастера. До подтверждения следующие шаги закрыты.',
  'jb.checklist.stopRejectedInfo':
    'STOP отклонён — процесс заблокирован. Начните исправление, повторите шаг и отправьте на подтверждение старшего мастера.',
  'jb.checklist.startFirst': 'Чтобы выполнять шаги, сначала начните работу (кнопка «Начать работу»).',

  // ---- Assign checklist -----------------------------------------------------
  'jb.assign.assignedToast': 'Чек-лист назначен',
  'jb.assign.title': 'Назначить чек-лист',
  'jb.assign.desc':
    'Выберите чек-лист для работы — применяется текущая активная версия, и она не меняется в ходе работы.',
  'jb.assign.noTemplates': 'Пока нет активных шаблонов — администратор должен опубликовать шаблон.',
  'jb.assign.selectAria': 'Выбор шаблона',
  'jb.assign.selectPlaceholder': 'Выберите шаблон',
  'jb.assign.submit': 'Назначить',

  // ---- Step card ------------------------------------------------------------
  'jb.step.sentToMasterToast': '«{name}» отправлен на подтверждение старшего мастера',
  'jb.step.doneToast': '«{name}» выполнен',
  'jb.step.waitingApproval': 'STOP — ожидается подтверждение',
  'jb.step.stopApproved': 'STOP подтверждён',
  'jb.step.stopRejected': 'STOP отклонён',
  'jb.step.attemptN': 'попытка {n}',
  'jb.step.requirements': 'Требования: {req}',
  'jb.step.normParen': '(норма: {min}–{max} {unit})',
  'jb.step.normRange': 'норма: {min}–{max} {unit}',
  'jb.step.noteLine': 'Комментарий: {note}',
  'jb.step.notePlaceholder': 'Дополнительный комментарий',
  'jb.step.morePhotos': 'Чтобы завершить шаг, нужно загрузить ещё {n} фото ({have}/{need}).',
  'jb.step.stopInfo':
    'Это контрольная точка STOP: после выполнения она отправляется на подтверждение старшего мастера, и до подтверждения следующие шаги не открываются.',
  'jb.step.sendToMaster': 'Отправить на подтверждение старшего мастера',
  'jb.step.markDone': 'Отметить выполненным',

  // ---- Photo gallery (within a step) ----------------------------------------
  'jb.photo.attemptPhotos': 'Фото попытки {n}',

  // ---- Photo uploader -------------------------------------------------------
  'jb.upload.successToast': 'Фото загружено',
  'jb.upload.retryDesc': 'Файл не сохранён — можно отправить повторно.',
  'jb.upload.needed': 'Необходимые фото: {have}/{need}',
  'jb.upload.button': 'Загрузить фото',
  'jb.upload.hint': 'JPEG/PNG/WebP, максимум 10 МБ. Фото сохраняются как доказательство и не удаляются.',

  // ---- Redo step ------------------------------------------------------------
  'jb.redo.reopenedToast': '«{name}» снова открыт для исправления',
  'jb.redo.button': 'Повторить шаг',
  'jb.redo.title': 'Повторное выполнение шага',
  'jb.redo.confirm': 'Открыть заново',
  'jb.redo.body':
    '«{name}» будет открыт заново как новая попытка: потребуются новые измерения и фото{stop}. Прежние результаты сохраняются в истории.',
  'jb.redo.stopClause': ', так как это STOP, снова потребуется подтверждение старшего мастера',

  // ---- Rework (rejected STOP) -----------------------------------------------
  'jb.rework.startedToast': 'Исправление начато — выполните шаг заново',
  'jb.rework.start': 'Начать исправление',
  'jb.rework.confirm': 'Начать',
  'jb.rework.body':
    '«{name}» будет открыт заново: вы исправите работу и отправите её повторно с новыми фото. Повторная отправка также требует подтверждения старшего мастера. Результаты прежней попытки сохраняются в истории.',

  // ---- STOP decision panel --------------------------------------------------
  'jb.stop.approvedToast': 'STOP подтверждён — работу можно продолжить',
  'jb.stop.rejectedToast': 'STOP отклонён',
  'jb.stop.masterRequired': 'Требуется подтверждение старшего мастера — отправлено пользователем {name}.',
  'jb.stop.tech': 'мастер',
  'jb.stop.decisionRequired': 'Требуется решение старшего мастера',
  'jb.stop.submittedBy': '{plate} · отправил {name}',
  'jb.stop.approveButton': 'Подтвердить STOP',
  'jb.stop.rejectButton': 'Отклонить',
  'jb.stop.approveBody':
    'Контрольная точка STOP «{name}» будет подтверждена, и работу можно будет продолжить. Решение записывается в журнал аудита.',
  'jb.stop.rejectTitle': 'Отклонить STOP',
  'jb.stop.rejectBodyBefore': '«{name}» будет отклонён: работа перейдёт в статус ',
  'jb.stop.rejectedState': 'Отклонено',
  'jb.stop.rejectBodyAfter': ' и процесс будет заблокирован. Причина обязательна.',
  'jb.stop.rejectReasonLabel': 'Причина отклонения (обязательно)',
  'jb.stop.rejectReasonPlaceholder': 'Например: рабочее давление не соответствует норме, нужна перенастройка',
  'jb.stop.back': 'Назад',
  'jb.stop.rejectConfirm': 'Подтвердить отклонение',

  // ---- Installation card ----------------------------------------------------
  'jb.inst.title': 'Данные установки',
  'jb.inst.add': 'Ввести',
  'jb.inst.edit': 'Редактировать',
  'jb.inst.savedToast': 'Данные установки сохранены',
  'jb.inst.empty': 'Данные установки ещё не введены.',
  'jb.inst.gasType': 'Тип газа',
  'jb.inst.kit': 'Комплект',
  'jb.inst.ecu': 'ECU',
  'jb.inst.cylinder': 'Баллон',
  'jb.inst.note': 'Комментарий',
  'jb.inst.kitPlaceholder': 'Например: Tomasetto Alaska',
  'jb.inst.ecuPlaceholder': 'Например: Stag 4 QBox',
  'jb.inst.cylinderPlaceholder': 'Например: 60L тороидальный',
  'jb.inst.notePlaceholder': 'Нужные технические данные',

  // ---- Risk panel: level / status / source display labels -------------------
  'jb.risk.levelLow': 'Низкий',
  'jb.risk.levelMedium': 'Средний',
  'jb.risk.levelHigh': 'Высокий',
  'jb.risk.levelCritical': 'КРИТИЧЕСКИЙ',
  'jb.risk.statusOpen': 'Открыт',
  'jb.risk.statusMitigation': 'Принимаются меры',
  'jb.risk.statusResolved': 'Устранён',
  'jb.risk.statusRejected': 'Отменён (переоценён)',
  'jb.risk.sourceManual': 'Введён вручную',
  'jb.risk.sourceStopRejected': 'Отклонённый STOP',
  'jb.risk.sourceChecklist': 'Чек-лист',

  // ---- Risk panel: register -------------------------------------------------
  'jb.risk.register': 'Реестр рисков',
  'jb.risk.add': 'Добавить риск',
  'jb.risk.blockingCount': 'Неустранённых блокирующих рисков: {count}.',
  'jb.risk.blockingTail': 'Работа не будет завершена, пока они не устранены или по ним не сделан override.',
  'jb.risk.currentCycle': 'Текущий цикл (#{cycle})',
  'jb.risk.noneThisCycle': 'В этом цикле нет зарегистрированных рисков.',
  'jb.risk.prevCycles': 'Предыдущие циклы ({count})',
  'jb.risk.blocking': 'Блокирует',
  'jb.risk.notBlocking': 'Не блокирует',
  'jb.risk.stepLink': 'Шаг #{id}',
  'jb.risk.source': 'Источник: {src}',
  'jb.risk.matrix': 'Матрица: {v}',
  'jb.risk.resolve': 'Устранить',
  'jb.risk.override': 'Override',

  // ---- Risk: create modal ---------------------------------------------------
  'jb.risk.createDesc':
    'Укажите тяжесть и вероятность — уровень, балл и статус блокировки вычисляет сервер.',
  'jb.risk.hazardType': 'Тип риска',
  'jb.risk.descLabel': 'Описание',
  'jb.risk.severity': 'Тяжесть (1–4)',
  'jb.risk.likelihood': 'Вероятность (1–4)',
  'jb.risk.addSubmit': 'Добавить',
  'jb.risk.createdToast': 'Риск зарегистрирован',

  // ---- Risk: resolve modal --------------------------------------------------
  'jb.risk.resolveTitle': 'Устранение риска',
  'jb.risk.resolveQuestion': '— какие меры приняты?',
  'jb.risk.resolveNoteLabel': 'Комментарий (обязательно)',
  'jb.risk.resolveMitigationLabel': 'Принятые меры (необязательно)',
  'jb.risk.resolveConfirm': 'Устранено',
  'jb.risk.resolvedToast': 'Риск устранён',

  // ---- Risk: override modal -------------------------------------------------
  'jb.risk.overrideTitle': 'Override риска',
  'jb.risk.overrideWarn':
    'Override блокирующего риска закрывает его без устранения. Это действие записывается в журнал аудита и должно применяться только в обоснованных случаях.',
  'jb.risk.overrideConfirm': 'Сделать override',
  'jb.risk.overrideToast': 'Для риска сделан override',

  // ---- Completion: readiness conditions -------------------------------------
  'jb.cond.checklist': 'Шаги чек-листа выполнены',
  'jb.cond.stops': 'Все контрольные точки STOP подтверждены',
  'jb.cond.measurements': 'Измерения в пределах нормы',
  'jb.cond.photos': 'Необходимые фотодоказательства есть',
  'jb.cond.risks': 'Нет неустранённых блокирующих рисков',
  'jb.cond.signature': 'Подпись клиента получена',
  'jb.cond.ok': 'OK',
  'jb.cond.needed': 'нужно',

  // ---- Completion section ---------------------------------------------------
  'jb.completion.closedToast': 'Работа успешно завершена',
  'jb.completion.reSignToast': 'Детали работы изменились — клиент должен подписать заново',
  'jb.completion.doneTitle': 'Работа завершена',
  'jb.completion.closedBy': 'Закрыл: {name}',
  'jb.completion.previouslyReopened': 'Ранее открывалась заново: {name} · причина: {reason}',
  'jb.completion.customerSignature': 'Подпись клиента',
  'jb.completion.errorGeneric': 'Ошибка',
  'jb.completion.finish': 'Завершить работу',
  'jb.completion.sendToQuality': 'Отправить на контроль качества',
  'jb.completion.reopenedInfo':
    'Работа открыта заново контролем качества ({name}). Причина: {reason}. После исправления работа снова отправляется на контроль качества.',
  'jb.completion.confirmContinue': 'Да, продолжить',
  'jb.completion.confirmBody':
    '— по {plate} {tail} Сервер повторно проверит все условия, и решение будет записано в журнал аудита.',
  'jb.completion.confirmTailReopened': 'исправленная работа отправляется на контроль качества. После подтверждения качества работа завершается.',
  'jb.completion.confirmTailNormal': 'работа завершается.',
  'jb.completion.summaryLoadError': 'Не удалось загрузить сводку',
  'jb.completion.staleReSignToast':
    'Детали работы изменились — покажите обновлённую сводку и получите подпись заново',
  'jb.completion.signatureBound': 'Подпись привязана к цифровому отпечатку сводки выше.',

  // ---- Completion snapshot --------------------------------------------------
  'jb.snapshot.none': 'Для этой работы нет запечатанного снимка (возможно, она завершена в старой системе).',
  'jb.snapshot.title': 'Запечатанный итоговый снимок (цикл #{cycle})',
  'jb.snapshot.status': 'Статус',
  'jb.snapshot.schemaVersion': 'Версия схемы',
  'jb.snapshot.technicianId': 'Ответственный техник (ID)',
  'jb.snapshot.signatureDigest': 'Digest, к которому привязана подпись',
  'jb.snapshot.risks': 'Риски ({count})',
  'jb.snapshot.blocking': 'блокирующий',
  'jb.snapshot.matrix': 'матрица {v}',
  'jb.snapshot.digest': 'Digest снимка (неизменяемый)',

  // ---- Reopen panel ---------------------------------------------------------
  'jb.reopen.doneToast': 'Работа открыта заново — начат процесс исправления',
  'jb.reopen.button': 'Открыть работу заново',
  'jb.reopen.body':
    '— завершённая работа по {plate} будет открыта заново и вернётся к исправлению. Исходное завершение, подпись и все исторические данные сохраняются. Причина обязательна.',
  'jb.reopen.reasonLabel': 'Причина повторного открытия (обязательно)',
  'jb.reopen.reasonPlaceholder': 'Например: настройка редуктора не соответствует норме',
  'jb.reopen.confirm': 'Подтвердить повторное открытие',

  // ---- Quality review panel -------------------------------------------------
  'jb.quality.confirmedToast': 'Контроль качества подтверждён — работа завершена',
  'jb.quality.title': 'На контроле качества',
  'jb.quality.awaiting': 'Исправленная работа ожидает подтверждения контроля качества.',
  'jb.quality.reopenReason': 'Причина повторного открытия: {reason}',
  'jb.quality.passButton': 'Пропустить контроль качества',
  'jb.quality.confirmTitle': 'Подтвердить контроль качества',
  'jb.quality.confirmLabel': 'Подтвердить — завершить работу',
  'jb.quality.confirmBody':
    '— исправленная работа по {plate} будет принята и завершена. Сервер повторно проверит условия завершения.',

  // ---- Signature pad --------------------------------------------------------
  'jb.sign.savedToast': 'Подпись клиента сохранена',
  'jb.sign.retryDesc': 'Подпись не сохранена — можно попробовать снова.',
  'jb.sign.title': 'Подтверждение и подпись клиента',
  'jb.sign.desc': 'Клиент знакомится со сводкой выше и ставит подпись ниже. После сохранения подпись изменить нельзя.',
  'jb.sign.clear': 'Очистить',
  'jb.sign.save': 'Сохранить подпись',

  // ---- Signable summary card ------------------------------------------------
  'jb.summary.gasLpg': 'LPG (пропан-бутан)',
  'jb.summary.gasCng': 'CNG (метан)',
  'jb.summary.aria': 'Сводка для подписи',
  'jb.summary.title': 'Итоговая сводка (для подтверждения клиентом)',
  'jb.summary.customer': 'Клиент',
  'jb.summary.phone': 'Телефон',
  'jb.summary.vehicle': 'Автомобиль',
  'jb.summary.kit': 'Комплект',
  'jb.summary.checklistVersion': 'Версия чек-листа',
  'jb.summary.steps': 'Шаги',
  'jb.summary.stops': 'Точки STOP',
  'jb.summary.openBlockingRisk': 'Неустранённый блокирующий риск',
  'jb.summary.cycle': 'Цикл',
  'jb.summary.digestLabel': 'Цифровой отпечаток сводки (digest)',

  // ---- Start job modal ------------------------------------------------------
  'jb.start.gpsCapturedToast': 'GPS зафиксирован',
  'jb.start.gpsOverrideToast': 'Override GPS зафиксирован',
  'jb.start.startedToast': 'Работа начата',
  'jb.start.title': 'Начать работу',
  'jb.start.intro': '— работа по {plate} будет начата. Статус изменится на «В процессе».',
  'jb.start.gpsCaptured': 'Место установки зафиксировано.',
  'jb.start.gpsOverridden': 'Override GPS зафиксирован.',
  'jb.start.overrideOpen': 'GPS недоступен — записать override',
  'jb.start.overrideSave': 'Сохранить override',

  // ---- Photo viewer (lightbox) ----------------------------------------------
  'jb.viewer.dialogAria': 'Фото {n} / {total} — {step}',
  'jb.viewer.zoomOut': 'Уменьшить',
  'jb.viewer.zoomIn': 'Увеличить',
  'jb.viewer.reset': 'Сбросить масштаб',
  'jb.viewer.loadError': 'Не удалось загрузить фото. Файл может быть временно недоступен.',
  'jb.viewer.imgAlt': '{step} — {uploader}, попытка {attempt}',
  'jb.viewer.prev': 'Предыдущее фото',
  'jb.viewer.next': 'Следующее фото',

  // ---- Evidence gallery -----------------------------------------------------
  'jb.gallery.title': 'Фото',
  'jb.gallery.total': 'Всего {total} шт.',
  'jb.gallery.loadError': 'Не удалось загрузить фото',
  'jb.gallery.empty': 'Для этой работы нет фотодоказательств.',
  'jb.gallery.loadMore': 'Загрузить ещё ({have} / {total})',
  'jb.gallery.notViewable': 'Нельзя посмотреть: {role}',
  'jb.gallery.openPhoto': 'Открыть фото — {step}, попытка {attempt}',
  'jb.gallery.tileAlt': '{step} — попытка {attempt}',
  'jb.gallery.currentGroup': 'Текущие и другие доказательства',
  'jb.gallery.currentGroupSub': 'текущий цикл / устаревшие попытки',
  'jb.gallery.cycleCompleted': 'Цикл {cycle} (завершён)',
  'jb.gallery.cycleOneOf': 'один из {total} циклов',

  // ---- Evidence role labels (role CODES stay stable; only labels localise) --
  'jb.role.completedCycle': 'Завершённый цикл',
  'jb.role.current': 'Текущий',
  'jb.role.superseded': 'Устаревшая попытка',
  'jb.role.historical': 'Историческое (не определено)',
  'jb.role.pending': 'Загрузка',
  'jb.role.unverified': 'Не проверено (старое)',
  'jb.role.failed': 'Неудачно',

  // ---- Evidence meta line ---------------------------------------------------
  'jb.evidence.noData': 'Нет данных',
  'jb.evidence.uploadedBy': 'Загрузил: {name}',
  'jb.evidence.attempt': 'Попытка {n}',
  'jb.evidence.cyclesMulti': 'циклы {list}',
  'jb.evidence.cycleOne': 'цикл {n}',
  'jb.evidence.cycleUnknown': 'Цикл: текущий/не определён',

  // ---- Risk form validation (client-side UX; server never derives from these) --
  'jb.riskform.hazardMin': 'Укажите тип риска (минимум 2 символа)',
  'jb.riskform.descriptionMin': 'Укажите описание (минимум 3 символа)',
  'jb.riskform.severityRange': 'Тяжесть должна быть в диапазоне 1–4',
  'jb.riskform.likelihoodRange': 'Вероятность должна быть в диапазоне 1–4',

  // ---- GPS capture errors (§20) ----------------------------------------------
  'jb.gps.unsupported': 'Это устройство не поддерживает определение местоположения.',
  'jb.gps.permissionDenied': 'Доступ к местоположению не предоставлен. Разрешите доступ в настройках браузера и повторите попытку.',
  'jb.gps.timeout': 'Время определения местоположения истекло. Повторите попытку на открытом месте.',
  'jb.gps.unavailable': 'Не удалось определить местоположение. Повторите попытку.',

  // ---- Completion blockers (§22 legacy readiness panel data) ----------------
  'jb.blocker.checklist': 'Все шаги выполнены',
  'jb.blocker.stops': 'Все STOP подтверждены',
  'jb.blocker.photos': 'Нужные фото загружены',
  'jb.blocker.measurements': 'Измерения верны',
  'jb.blocker.risks': 'Нет неустранённого критического риска',
};
