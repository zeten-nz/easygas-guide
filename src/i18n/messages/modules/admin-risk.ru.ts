import type { adminRiskUz } from './admin-risk.uz';

/**
 * Russian catalogue fragment — admin-risk (key parity with adminRiskUz enforced).
 * Risk-level, status and source CODES are stable and never translated — only their
 * display labels are localized. Technical terms kept verbatim: STOP, provisional,
 * lifecycle, fail-closed, severity, likelihood, retire, §.
 */
export const adminRiskRu: Record<keyof typeof adminRiskUz, string> = {
  // ---- Risk-level display labels (CODES stay stable) ------------------------
  'rp.level.LOW': 'Низкий',
  'rp.level.MEDIUM': 'Средний',
  'rp.level.HIGH': 'Высокий',
  'rp.level.CRITICAL': 'Критический',

  // ---- Version status display labels (CODES stay stable) --------------------
  'rp.status.DRAFT': 'Черновик (не утверждён)',
  'rp.status.ACTIVE': 'Активный (утверждён)',
  'rp.status.RETIRED': 'Выведен (архивный)',

  // ---- Risk-source display labels (CODES stay stable) ----------------------
  'rp.source.MANUAL': 'Введено вручную',
  'rp.source.STOP_REJECTED': 'STOP отклонён',
  'rp.source.MEASUREMENT_OUT_OF_RANGE': 'Измерение вне диапазона',
  'rp.source.CHECKLIST_FLAG': 'Отметка чек-листа',

  // ---- Shared bits ----------------------------------------------------------
  'rp.unknown': 'неизвестно',
  'rp.userNumber': 'Пользователь #{id}',
  'rp.score': 'балл',
  'rp.blocking': 'Блокирующий',
  'rp.loadingAria': 'Загрузка',

  // ---- Page header / top-level states ---------------------------------------
  'rp.title': 'Политика рисков',
  'rp.subtitle': 'Понимание, просмотр и утверждение матрицы рисков (§21)',
  'rp.noActive.strong': 'Нет активной утверждённой политики рисков.',
  'rp.noActive.body':
    'Операции безопасности (начало работы, завершение, контроль качества) приостановлены. Черновик ниже должен утвердить ответственный специалист.',
  'rp.noVersions': 'Пока нет версий матрицы рисков.',
  'rp.versionLabel': 'Версия:',
  'rp.detailLoadError': 'Не удалось загрузить данные версии',

  // ---- Policy explainer -----------------------------------------------------
  'rp.explainer.title': 'Что такое политика рисков?',
  'rp.explainer.p1': 'Каждое событие риска относится к конкретной работе.',
  'rp.explainer.matrixTerm': 'Матрица рисков',
  'rp.explainer.matrixDesc': ' — правило для классификации рисков. Оно опирается на два измерения:',
  'rp.explainer.severityTerm': 'Тяжесть (severity)',
  'rp.explainer.severityDesc': ' — насколько серьёзными могут быть последствия.',
  'rp.explainer.likelihoodTerm': 'Вероятность (likelihood)',
  'rp.explainer.likelihoodDesc': ' — вероятность того, что эта ситуация произойдёт.',
  'rp.explainer.blockingTerm': 'Блокирующие уровни',
  'rp.explainer.blockingDesc': ' не позволяют завершить соответствующую работу и подтвердить качество, пока риск не устранён.',
  'rp.explainer.approvedTerm': 'Утверждённая (активная) политика',
  'rp.explainer.approvedDesc':
    ' — обязательное условие текущего процесса безопасности: без активной политики начало и завершение работы приостанавливаются.',
  'rp.explainer.disclaimer':
    'Эта страница не является юридическим сертификатом или доказательством безопасности работы; примеры не дают реальной оценки безопасности. Подробнее: документация проекта §21.',

  // ---- Calculation-rule card ------------------------------------------------
  'rp.calc.title': 'Правило расчёта',
  'rp.calc.formula': 'Балл = тяжесть × вероятность. Уровни (сверху вниз, первое совпадение):',
  'rp.calc.scoreGte': 'балл ≥ {min}',

  // ---- Blocking & special-rules card ----------------------------------------
  'rp.rules.title': 'Блокирующие и особые правила',
  'rp.rules.blockingLevels': 'Блокирующие уровни:',
  'rp.rules.sev4Prefix': 'Тяжесть 4 — не ниже уровня ',
  'rp.rules.sev4Suffix': '.',
  'rp.rules.sourceOverrides': 'Приоритет по источнику:',
  'rp.rules.blockedOps': 'Блокирующий риск не позволяет выполнить: {ops}.',

  // ---- Lifecycle action buttons ---------------------------------------------
  'rp.activateBtn': 'Активировать эту версию',
  'rp.retireBtn': 'Вывести (retire)',

  // ---- Provenance card ------------------------------------------------------
  'rp.prov.title': 'Происхождение и утверждение',
  'rp.prov.provisionalPrefix': 'Происхождение определения: ',
  'rp.prov.provisionalTerm': 'предварительное (provisional)',
  'rp.prov.provisionalSuffix':
    ' — выбрано изначально при разработке. Это отдельно от статуса жизненного цикла (утверждения): утверждённая версия не означает «неутверждённая».',
  'rp.prov.approvedBy': 'Утвердил: ',
  'rp.prov.retired': 'Эта версия выведена (архивная). Создана: {date}',
  'rp.prov.draft': 'Ещё не утверждена (черновик). Создана: {date}',
  'rp.prov.rationale': 'Основание/ссылка: {text}',

  // ---- Illustrative preview -------------------------------------------------
  'rp.preview.title': 'Пробная оценка',
  'rp.preview.desc': 'Это пример по матрице {version} — не сохранённая оценка, не создаёт ни одного события риска.',
  'rp.preview.descProd': ' Оценка в реальной работе всё равно требует АКТИВНОЙ политики.',
  'rp.preview.severity': 'Тяжесть',
  'rp.preview.likelihood': 'Вероятность',
  'rp.preview.source': 'Источник',
  'rp.preview.result': 'Результат (пример):',

  // ---- Version history ------------------------------------------------------
  'rp.history.title': 'История версий',
  'rp.history.approvedLine': 'Утвердил: {who} · {date}',
  'rp.history.createdLine': 'Создана: {date}',

  // ---- Compare --------------------------------------------------------------
  'rp.compare.label': 'Сравнение:',
  'rp.compare.selectAria': 'Версия для сравнения',
  'rp.compare.pick': 'Выберите версию',
  'rp.compare.status': 'Статус',
  'rp.compare.blockingLevels': 'Блокирующие уровни',
  'rp.compare.thresholds': 'Пороги',
  'rp.compare.sourceOverrides': 'Приоритет источника',
  'rp.compare.sev4Min': 'Тяжесть 4 мин',
  'rp.compare.diff': '(отличие)',

  // ---- Activate modal -------------------------------------------------------
  'rp.activate.title': 'Активация политики рисков',
  'rp.activate.bodyPrefix': 'Версия ',
  'rp.activate.bodySuffix': ' станет АКТИВНОЙ (утверждённой) политикой.',
  'rp.activate.point1': 'Применяется ко всем новым оценкам рисков в реальной работе.',
  'rp.activate.point2Prefix': 'Текущая активная ',
  'rp.activate.point2Suffix': ' будет автоматически выведена.',
  'rp.activate.point3': 'Риск блокирующего уровня не позволяет завершить работу и подтвердить качество.',
  'rp.activate.errorSuffix': '. Статус обновлён — попробуйте ещё раз.',
  'rp.activate.rationaleLabel': 'Основание утверждения / ссылка (обязательно)',
  'rp.activate.rationalePlaceholder': 'Например: подтверждение специалиста по безопасности, документ #...',
  'rp.activate.submit': 'Активировать {version}',
  'rp.activate.toastSuccess': '{version} активирована',

  // ---- Retire modal ---------------------------------------------------------
  'rp.retire.title': 'Вывод версии',
  'rp.retire.bodyPrefix': 'Версия ',
  'rp.retire.bodySuffix': ' будет выведена (перейдёт в архивное состояние).',
  'rp.retire.onlyActiveWarn':
    'Это единственная активная политика. Если вы её выведете, активной политики не останется — начало и завершение работы прекратятся (fail-closed).',
  'rp.retire.confirm': 'Подтвердить вывод',
  'rp.retire.toastSuccess': '{version} выведена',

  // ---- Matrix table (RiskMatrixTable) ---------------------------------------
  'rp.matrix.caption': 'Матрица рисков: уровень по тяжести (строки) × вероятности (столбцы)',
  'rp.matrix.axisHeader': 'Тяжесть ↓ / Вероятность →',
  'rp.matrix.cellAria': 'Тяжесть {severity}, вероятность {likelihood}: {level}',
  'rp.matrix.cellAriaBlocking': 'Тяжесть {severity}, вероятность {likelihood}: {level}, блокирующий',
};
