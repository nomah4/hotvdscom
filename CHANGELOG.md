# Changelog

All notable changes to this project are documented in this file.

## 2026-08-15

### Changed

**Прод догнал `main`.** С 12 августа витрина в бою жила с ветки `feat/rename-servers`, выкаченной
руками, и отставала на два PR. Один из них — `X-Idempotency-Key` на действиях с машиной; без него
биллинг отвечал `400` на включение, перезагрузку, удаление и восстановление. Пока у клиентов не
было машин, это ничего не ломало. С 15 августа машины есть, и кнопки в кабинете работают на
настоящем железе.

**Отозванная услуга не показывается в кабинете.** Список от биллинга рисовался целиком, без
разбора статуса, и отозванная подписка осталась бы карточкой с кнопками, ни одна из которых не
сработает — клиент читает такое как поломку, а не как запись в истории. Фильтр стоит в кабинете, а
не в биллинге: список от биллинга честен, история принадлежит ему, а «мои серверы» — решение
витрины. `expired` остаётся видимой намеренно: истёкшую услугу продлевают, и спрятать её значило
бы убрать ту самую кнопку, ради которой человек пришёл.

### Fixed

**Пятнадцать подписок, оплаченных тестовой кассой, отозваны.** Все они висели `active` со сроками
до ноября, а машин за ними не было и не могло быть: до 11 августа адаптер провижининга был
заглушкой и отчитывался успехом впустую. Разделение оказалось чистым — всё, что оплачено боевой
кассой, машину получило; всё, что тестовой, осталось без неё. Отзыв, а не удаление: строки связаны
со счетами и платежами, и стирать записи о деньгах, даже тестовых, значит терять след того, что
происходило.

## 2026-08-12

### Added

**Консоль к серверу — кнопка на карточке.** Экран машины прямо в браузере: то, чем пользуются,
когда сломались и сеть, и `sshd`, и обычные кнопки уже бесполезны. Открывается в новой вкладке на
отдельном домене `console.hotvds.com`.

Отдельный домен — не косметика. Страница консоли это полный терминал к машине, и на своём origin
она не делит куки ни с кабинетом, ни с биллингом: её компрометация не даёт биллинговой сессии.
Оттуда же жёсткий CSP и noVNC, лежащий в образе, а не приезжающий с чужого CDN.

**Ссылка одноразовая и живёт минуту** до открытия. Она попадает в адресную строку и в историю
браузера — к моменту, когда её кто-то найдёт, она уже недействительна. Перезагрузка вкладки её не
воскрешает, и страница говорит об этом прямо, а не показывает чёрный экран.

**В браузер не уходит ничего от гипервизора** — ни адрес, ни токен Proxmox, ни тикет VNC. Цена
этого выяснилась при первом подключении: Proxmox отдаёт консоль под VNC-аутентификацией, где
паролем служит как раз тикет. Пароль теперь вводит прокси, браузеру он показывает сервер без
пароля.

**Каждое открытие записывается**: кто попросил, к какой машине, когда. Консоль обходит и пароль, и
SSH-ключи, поэтому бесследной быть не должна. Выдача ограничена пятью пропусками в минуту на
машину — кнопка, нажатая скриптом, иначе разложит по журналу сотню живых ссылок.

**Консоль получает язык кабинета.** Она живёт на своём домене и о нашем выборе ничего не знает;
сама догадалась бы по `Accept-Language`, а это язык системы, который у человека вполне может
отличаться от выбранного у нас.

### Fixed

**Кнопка сообщала о заблокированном окне при открытой вкладке.** `window.open` с флагом `noopener`
по спецификации возвращает `null` — ссылки на вкладку нет, подставить адрес некуда, и код честно
решал, что окно заблокировали. Связь с кабинетом рвётся присваиванием `opener = null` после
открытия: то же самое, но ссылка остаётся.

**Вкладка не уйдёт по ссылке, которая не `https`.** До перехода она несёт наш origin, и адрес
вида `javascript:` исполнился бы в нём. Ссылку строит наш же движок — проверка стоит одну строку,
а доверие здесь не нужно ни на грамм.

**Ошибки движка доходят до клиента словами.** Биллинг ретранслирует их как есть, голой строкой
кода, а разбор ответа ждал конверта `{"error": {...}}` — и любая ошибка машины превращалась в
«попробуйте ещё раз». Теперь заблокированное окно и превышенный предел выдачи названы прямо: обе
причины исправляет клиент, а общее «попробуйте ещё раз» отправило бы его нажимать ту же кнопку.

**Серверу можно дать своё имя.** У клиента с восемью машинами в кабинете восемь раз написано
«Индивидуальный VDS», и отличить базу от продового API было нельзя. Теперь по карандашу рядом с
названием открывается поле; Enter сохраняет, Escape отменяет.

**Название тарифа при этом не пропадает** — оно уходит второй строкой. И, что важнее, окно
подтверждения оплаты показывает обе строки: «prod-api-01» не отвечает на вопрос, за какой тариф
списывают деньги, поэтому тариф там остаётся всегда.

**Имя появляется на экране только после ответа сервера.** Без оптимистичного обновления
намеренно: заголовок, оставшийся после неудачного сохранения, — это имя, которого у сервера нет,
и клиент потом ищет по нему сервер.

**Карандаша нет, пока биллинг не умеет переименование.** Витрина определяет это по наличию ключа
`display_name` в ответе, а не по версии или настройке. Пока ключа нет, карточка выглядит ровно
как раньше — ни кнопки, ни объяснения, потому что объяснять клиенту тут нечего.

### Changed

**Конфиг nginx со шлюза вернулся в репозиторий.** `admin-proxy.conf` — файл, обслуживающий `bl`,
`po`, `pr`, `chat`, `pv` и теперь `console`, — не хранился здесь вовсе, а `stream.conf` отставал
на три записи. Запись, разошедшаяся с хостом, хуже отсутствующей: по ней делают выводы.

**Цепочка выбора названия переехала в один модуль.** Она была написана дважды — в карточке и на
странице кабинета — и в обоих местах стоял комментарий, что копии не должны разойтись. Имя
клиента добавляет к цепочке третье правило, а третье правило в двух копиях расходится втрое
охотнее.

## 2026-08-11

### Added

**Кнопки управления сервером заработали.** До сих пор они показывали «Управление сервером ещё не
подключено», и это было правдой: `bl` не проксировал действия движка. Теперь проксирует — цепочка
витрина → `bl` → `pr` → движок замкнулась, — и кнопки делают то, что написано на них: включить,
выключить, перезагрузить, показать пароль, удалить, восстановить.

Добавились две, которых не было: **показ пароля** и **восстановление**.

**Пароль не рендерится на карточку сам.** Его показывают только по нажатию: открытая на экране
панель не должна быть открытым на экране паролем.

**Удаление требует двух нажатий.** Это единственное действие на карточке, которое клиент не может
отменить сам, и случайный клик не должен стоить столько же, сколько намеренный. После пометки
карточка меняет форму: остаётся одна кнопка «Восстановить» и объяснение, что данные держатся до
подтверждения оператором. Остальные кнопки убраны — просить машину, которая наполовину удалена,
перезагрузиться не имеет смысла.

**Кнопка питания читает желание клиента, а не состояние машины.** Это разные вещи, и движок держит
их отдельно (`power_intent` против `machine.status`). У приостановленной за неоплату услуги машина
лежит, а желание клиента — «включена»; кнопка «Включить» там была бы кнопкой, которая не может
сработать, потому что держит машину услуга, а не желание.

**У сервера, которого ещё нет, кнопок нет.** Вместо ряда элементов управления, способных только
отказать, — строка о том, что сервер не развёрнут.

**«Пароля нет» — это ответ, а не ошибка.** Машины, заведённые руками до появления движка, пароля в
нём не имеют. Такой ответ показывается спокойным текстом: клиент пользуется тем доступом, который у
него уже есть, и ничего не сломано.

## 2026-08-10

### Added

**Карточка сервера показывает состояние машины, адрес и загрузку.** Раньше на ней был один статус —
`Active` — и он про **услугу**, а не про машину. Клиент, чей сервер лежит, прочитал бы «Active» и
решил, что всё в порядке. Теперь состояние машины отдельной строкой, рядом IP и загрузка CPU.

Данные приходят от движка провижининга через Billing: у подписки появилось необязательное поле
`server` (`src/api/subscriptions.ts`). Пока Billing его не отдаёт, все значения остаются прочерками
— это честный ответ, а не заглушка: выдуманный адрес или выдуманная загрузка это ложь о чужой
машине. Что нужно от Billing, описано в `../provisioning-engine/docs/billing-integration.md`.

`running` в этом блоке намеренно отделён от `machine.status`: первое — что *должно* быть по оплате
и желанию клиента, второе — что гипервизор сообщает на самом деле.

### Changed

**Плашки CPU/RAM/SSD стали светлыми.** Три тёмных блока подряд на каждой карточке, на списке из
пяти серверов, читались громче статуса и кнопок — при том что несут справочные цифры. Светлая
заливка с рамкой оставляет их читаемыми и возвращает вес туда, где он нужен. Подпись (`CPU`) теперь
тише значения: она повторяется на каждой карточке, а «2 vCPU» — нет.

### Note

Кнопки управления сервером по-прежнему показывают «Управление сервером ещё не подключено», и это
правда: витрина ходит только в `bl`, а он пока не проксирует действия движка. Это граница, а не
недоделка — браузер не должен уметь обращаться к тому, что распоряжается железом. Со стороны движка
готовы все шесть действий: питание, перезагрузка, удаление, возврат, доступы, состояние пачкой.

## 2026-08-10

### Changed

**Signing in from the storefront lands in the account.** The header's "Log in" button (and the same
entry in the mobile menu) now passes `/:lang/dashboard` as `returnTo` instead of defaulting to
whichever marketing page the visitor happened to be reading. Coming back to the pricing page after
authenticating leaves someone one more click from the thing they signed in for. The other sign-in
entry points are unchanged and still return where they started: `RequireAuth` sends you to the route
you were denied, the prompt modal to the link you clicked, and checkout back to the order you were
confirming — there the current page *is* the destination.

**The storefront header says who you are.** A signed-in visitor was greeted by a "Log in" button on
the homepage while the dashboard knew their name — the site looked logged out on the side most
people land on first. The dashboard's welcome text, admin badge and avatar moved into a shared
`UserChip` (`src/components/ui/UserChip.tsx`) that both top bars render, so the two cannot drift
apart, and in the header the chip links to the dashboard: the name is the obvious thing to click
when you want your servers. It renders nothing without a session, and stays visible below the laptop
breakpoint, where the nav collapses into the hamburger and it is otherwise the only sign on the
storefront that there is a session at all. The dashboard's own top bar is unchanged apart from the
language switcher now sitting to the right of the avatar rather than inside the name group.

## 2026-08-09

### Added

**Live chat is on.** Chatwoot runs on its own VM at `chat.hotvds.com`; the two constants in
`src/support/chatwoot.ts` are filled in, so the widget now appears on the marketing pages and in the
account's Support section. Set up through the Rails console rather than the browser onboarding, so
the result is reproducible: account `hotvds.com`, one administrator, one website inbox. SMTP is not
configured at first, so the administrator was confirmed explicitly — otherwise the account would
have been created and immediately unusable, with no email able to rescue it. SMTP was wired to
SMTP2GO the same day, sending as `noreply@ytnp.xyz`, and confirmed by an actual delivered message
rather than by the config looking right; invitations, notifications and password recovery work.

Only the website token is in the repo, and it is public by design: it names an inbox the way
`BILLING_API_BASE` names a catalogue. The inbox's HMAC key stays in Chatwoot — it is what would
verify a claimed identity, and everything in that file ships to every visitor's browser.
`chatwoot.test.ts` guards against a second secret-shaped constant appearing beside the token. The
chat is still anonymous, for the reason recorded in `TODO.md`.

**A chat inbox per language.** An English visitor was being greeted «Чем помочь?». The widget's own
chrome already followed the site language via `chatwootSettings.locale`, but the greeting is a fixed
string stored on the inbox, so one inbox greets everyone in whichever language it was written in.
`ru` and `en` now have separate inboxes and separate website tokens. That is the better shape
regardless: an agent sees a conversation's language before opening it, and the two can be routed and
staffed differently. Switching language mid-session re-locales the widget but keeps the conversation
where it started — `run()` binds the token once, and moving a live conversation between inboxes
would strand it away from the agent already reading it.

**Conversations say which surface they came from.** `hotvds_source` is `website` or `dashboard`, set
by whichever surface mounted the widget, so an agent can tell a pre-sales question from an existing
customer's problem before reading a word. Conversation attributes need no HMAC — nothing here claims
*who* the visitor is, only where they were.

Alongside it, `hotvds_identity: 'unverified'`, which matters more. `dashboard` means the widget was
mounted behind `RequireAuth` and nothing else; the browser sets both attributes, so anyone can forge
them from the console. The risk is conversational rather than technical — an agent who reads
"dashboard" as proof of identity may disclose one customer's account to another — so the caveat sits
in the sidebar where the agent is actually looking. It flips to `verified` only once `setUser` can
carry a valid `identifier_hash`.

### Security

**The chat widget accepted any identity claimed from a visitor's console.** `hmac_mandatory` was
`false` on the inbox, so `window.$chatwoot.setUser('anyone@example.com')` typed into the console on
hotvds.com would have been taken at face value, dropping the caller into that contact's conversation
history. The storefront never called `setUser` — that protected nothing, because the widget's API is
public regardless of what our code does.

Now `true` on both inboxes: Chatwoot rejects every unsigned identity claim. Anonymous chat is
unaffected, which was verified rather than assumed. The consequence is that no customer can be
identified at all until the signing endpoint specified in `TODO.md` exists, and that is the intended
state — an identity nobody checked is worse than none.

Exposure was small only because the inbox was hours old and held almost no history. Found while
answering a question about whether we sign chat messages, not by looking for it.

### Fixed

**Ordering a second identical server now creates a second server.** It did not: the idempotency key
sent to Billing was scoped to package/currency/configuration with nothing per purchase, and was
retired only when `CheckoutReturnPage` saw the invoice settle. Billing replays the original response
for a repeated key — correctly — so a customer buying the same server again in the same tab was
handed the first invoice back and no second server appeared. Reproduced on dev 2026-08-08; no data
was lost.

The key is now retired the moment Billing accepts the purchase, before anything that can throw. That
closes all three situations which used to leave it alive: payment outlasting the return page's 30s
poll, the customer never reaching that page at all, and `payment_url` coming back missing — which
threw after the key was minted but before it was tied to an invoice, orphaning it for the tab's
lifetime with nothing able to find it again.

- Applied to all three purchase paths, including renewal. Renewal was never exposed to the bug —
  its key is scoped to one subscription and Billing returns an existing unpaid renewal rather than
  duplicating — but one rule across all three beats an exception someone has to remember.
- **The trade, accepted deliberately:** backing out of the gateway and confirming again now opens a
  second invoice instead of replaying the first. The unpaid one expires, and the confirm button
  disabling while in flight remains the double-submit guard. Two orders must always produce two
  servers; that requirement outranks the convenience the old behaviour bought.
- `src/api/useCheckout.test.tsx` tests the key's *lifetime* rather than how it is built, since the
  latter would have passed throughout. Verified by removing the fix and watching four of five fail —
  including a second identical order receiving the same key.

**Correction, same day: this was not the cause of the reported symptom.** Billing's own database
shows the two same-package purchases on 9 August created two *distinct* invoice rows, and a replayed
key creates no new row — so no replay ever occurred, before the fix or after. The idempotency defect
was real and worth fixing; it simply was not what stopped a customer buying a second server.

What does: **paid invoices are not becoming subscriptions.** Three invoices paid on 9 August produced
zero new subscriptions, and 17 paid invoices across the database have none, on every package, going
back to 20 July. That is Billing's payment-capture path, not this repo. Recorded in `TODO.md` with
the queries behind it.

Worth stating plainly because it changed how the first diagnosis should be read: it came from
reading code, which established that the defect *existed*, and was then attributed to a symptom it
did not cause. The database settled it; the code could not have.

**A second correction, later the same day.** That finding was first written up with the note "X1 has
no application logs" — checked via `journalctl` and a search of `/opt`, `/srv`, `/home`. The logs
were in `/var/www/bl/shared/logs/` all along: access, error, worker and beat, with `error.log` in
structured JSON carrying `request_id` and `correlation_id`. Reading them produced a far better lead
than the database alone: `billing.reconcile_recent_final_payments` reports `issue: 7` with
`auto_recovered: 0`, and the count rose by exactly the three purchases made that morning. Billing
detects the mismatch every fifteen minutes and does nothing about it.

**A second fix the same day:** the key retirement above only helped purchases made from then on.
Keys already stranded in customers' `sessionStorage` kept replaying their first invoice until the tab
was closed, so "fixed" was untrue for exactly the people who had hit the bug. Any key present when
the app boots is now cleared — a key can no longer legitimately survive a page load, so anything left
is stranded by definition.

### Added

**Technical support in the account, and live chat on the marketing pages.** A "Поддержка" sidebar
entry opens `/dashboard/support`; the Chatwoot widget mounts on the marketing layout and on that
page. Chatwoot was chosen knowing what it is — an omnichannel *conversation* inbox, not a ticket
system: there are no ticket numbers, no SLA timers and no customer-facing list of past requests. For
conversational support that is the right shape, and it is self-hostable, which suits a hosting
company. If tickets turn out to be the requirement, that is either a UI built on Chatwoot's API or a
move to Zammad.

- **Both are dormant until configured.** `src/support/chatwoot.ts` holds two empty constants; fill
  in the base URL and website token and the widget appears with no code change. Leave either blank
  and no third-party script loads at all — verified on the deployed site, not assumed. Neither value
  is a secret: the website token identifies an inbox, the way `BILLING_API_BASE` identifies a
  catalogue.
- The support page has two states, and the difference is the point. Configured, it opens the chat.
  Unconfigured, it says so and routes to the contact details — someone opening this page usually has
  something broken *right now*, and "coming soon" is the least useful thing to tell them. It also
  lists what to include (which server, what you did, the full error text), which saves a round trip
  per conversation.
- The widget stays off checkout and the payment return: a bubble overlapping the confirm button
  while someone is deciding to pay is worse than no chat.

**The chat is anonymous on purpose, and stays that way until there is somewhere to sign.** Chatwoot
only *validates* an identity when `setUser` carries an `identifier_hash` — an HMAC of the identifier
signed with the inbox key. That key cannot be in the browser, and this storefront is a pure SPA with
no backend of its own. Calling `setUser` without the hash is not a lesser version of the same thing:
Chatwoot would accept whatever email the page claims, so a customer could claim someone else's
address from the console and land in that person's conversation history in the agent inbox.
`identifyInChat` is an explicitly `null` export carrying that reasoning, so the next person meets it
before writing the insecure version. Tracked in `TODO.md`, along with the 152-ФЗ point: transcripts
are personal data and the terms covering that are still a placeholder.

Adding the route also produced the first real catch by `src/nginxRoutes.test.ts`: `dashboard/support`
went into `routePaths` without the nginx snippet, which would have shipped a page that renders
perfectly in a browser and answers 404 to crawlers. Snippet updated and applied to both hosts.

## 2026-08-08

### Added

**Customers can renew a server they already own.** The dashboard had no way to pay for an existing
server: buying the plan again hands the customer a *second* one, because the purchase policy is
`separate`. A per-card Renew button now drives Billing's `POST /api/v1/subscriptions/<id>/renewals`,
which creates the `SubscriptionRenewal` link the capture path needs, so the payment extends that
exact subscription rather than starting another.

- Billing locks the row, returns an existing unpaid renewal instead of duplicating it, and continues
  the term from the current `valid_until` rather than from today — so renewing early loses no paid
  time. Idempotency is scoped per subscription, so renewing server A never replays server B.
- One invoice per subscription, not one bill for all of them. Billing's capture path reads exactly
  one invoice line (`services.py:1106` `.get()`), so a combined "pay for all 10" invoice would be a
  change to the money path; renewing per server is not.
- **Configurable servers renew too.** The button was first gated to catalogue tariffs, because
  Billing could not price a configurable renewal at all — which excluded the customers who actually
  have servers, since every legacy-imported subscription is `VDS_CUSTOM_MONTHLY`. Billing can now
  (`create_renewal_quote`), so the gate is off. The price comes from the new read-only
  `GET /api/v1/subscriptions/{id}/renewal-preview`: the amount is not knowable client-side —
  `GET /subscriptions` returns no money data by design, and a Custom VDS has no catalogue price,
  only a pricing rule applied to the configuration it recorded. Billing still prices the invoice
  itself, so the previewed figure never decides what is charged.
- The remaining condition is Billing's own: active subscriptions only, since it answers
  `subscription_not_renewable` for anything else.

Two caveats worth keeping in view. This does not make real payment possible — YooKassa is still in
test mode on this install. And the renewal path ships with **no tests of its own**; the suite that
passes around it does not exercise it, so its correctness rests on review and on Billing's
guarantees rather than on CI.

**Every footer link now leads to a real page.** Nine of the eleven rendered as `to="#"`; the footer
is the site map, so those were pages nobody could reach. New routes: `/datacenters`, `/status`,
`/knowledge-base`, `/api`, `/about`, `/blog`, `/partners`, `/contacts`. "Контакты" and "Связаться с
нами" are two entrances to one `/contacts` page — a second route would be a second copy of the
contact details, and the two would drift.

- `/datacenters` and `/status` are real: both read `src/data/datacenters.ts`, the same array the
  home page and the configurator use, and the group counts are derived from it rather than typed
  into the copy. `/knowledge-base` gathers the FAQ answers already published on `/` and `/pricing`,
  so it makes no new claim.
- `/status` deliberately reports no uptime figure, no "all systems operational" and no incident
  history: there is no monitoring backend, and a percentage on a status page is a number customers
  hold you to. It states that it measures nothing, shows location readiness and the serving build.
  `StatusPage.test.tsx` fails if a percentage ever appears.
- The remaining pages ship structure with `__ТЕКСТ_ОТ_VICTOR__` placeholders, following
  `TermsPage`: the legal entity, its details, contact addresses and partner terms are commitments,
  not copy, and an invented support address is worse than a marked gap — someone would write to it.

**A localized not-found page.** `/:lang` had no fallback of its own, so a mistyped `/ru/datacentres`
fell through to the global catch-all and redirected to `/en`, discarding both the address and the
visitor's language. A splat inside the marketing layout now catches it with the header and footer
intact. It does not echo the requested address. Note this stays a *soft* 404 — nginx answers 200
with the SPA shell for any path.

**Ordering a server without leaving the account.** A customer with servers had to go back out to the
storefront to buy another. A "Новый сервер" sidebar entry now opens `/dashboard/new`, which renders
the same `PricingSlider` and the same `TariffCard` as `/pricing`, driven by the same order intents
and handing off to the same `/checkout`. Reused rather than reimplemented on purpose: the money path
stays single, so terms acceptance, quoting and the gateway hand-off cannot drift between "bought
from the site" and "bought from the account".

**Server controls and telemetry on the instance card** — power, reboot, delete, plus IP address, CPU
load and network. All placeholders, and honest ones. Billing tracks a subscription, not a machine:
there is no address, no metrics, no power API, and the provisioning adapter that would own them does
not exist, so every subscription sits at `provisioning_status: pending`.

- The buttons are styled as live controls, because that is the card's eventual shape, and pressing
  one says the controls are not connected instead of reporting an action that did not happen. A
  customer who believes a reboot happened waits for a server that never went down; one who believes
  a delete happened keeps paying for a server they think is gone.
- Telemetry shows labelled dashes, never a plausible number — invented load is a lie about the
  customer's own machine. A test fails if a figure ever appears.
- The power button states its state in its colour: mint to start a server that is down, neutral to
  stop one that is up, so a green button in the list means something is not running. `isRunning` is
  inferred from `status === 'active' && provisioning_status === 'succeeded'` because there is no
  power state to read.

**The valid-until date is the renew control.** Clicking it opens the renewal; there is no separate
button. The chip therefore advertises itself — hover hint, pointer cursor, and an accent border that
appears only when it is genuinely clickable — because a date that silently charges money is worse
than an extra button. It renders as a plain span when Billing would refuse (anything but an active
subscription), so no affordance ever appears on something that cannot be clicked.

**A Balance tile on the dashboard**, deliberately empty. Billing exposes no balance endpoint, so the
tile shows a dash and "not connected yet" rather than a number; a plausible figure there is a claim
about the customer's own money. "Всего планов" is now "Всего услуг".

### Changed

**Footer labels and destinations are matched by key, not by array position.** `footerLinkPaths` was
a parallel array indexed against the dictionary's `links`, so inserting a label in the middle
silently re-pointed every link after it — and compiled. `links` is now a keyed object and
`src/components/layout/footerLinks.ts` closes the map with `satisfies Record<FooterLinkKey, string>`:
a label with no destination fails the Record constraint, a destination with no label fails the
excess-property check. Verified by deleting a key and watching `tsc` reject it (TS1360). The
`to="#"` fallback is gone — an inert footer link is no longer expressible.

The footer copyright drops "— дизайн-прототип" / "— design prototype"; the site sells real plans.

### Fixed

**A deploy was invisible to anyone who had already visited.** `index.html` carried no
`Cache-Control` at all, only `ETag`/`Last-Modified`, so browsers cached the shell heuristically and
kept loading the bundle it named — yesterday's app, from a fresh release. Reported as "I don't see
the changes on dev" and confirmed from outside: the new bundle was being served, the old shell was
pointing away from it. The shell is now `no-cache` on both hosts; `/assets/*` keeps `immutable` for
30 days, which is correct — those filenames are content-addressed.

**OS and datacenter were invisible for any package still in the catalogue.** The instance card read
them only in the branch for packages the catalogue no longer lists, so two cards for the same server
described it differently depending on whether its plan was still offered. Note this does not make
them appear for fixed plans: `createInvoice` posts only `package_code`, so those subscriptions carry
no configuration at all. Recorded in `TODO.md`.

**Unknown URLs answer a real 404 instead of 200.** Both vhosts served
`try_files $uri $uri/ /index.html`, so every path — mistyped, retired, invented —
came back 200 with the app shell. To a crawler that is a page that exists and
happens to say "not found", which is what gets a soft 404 indexed. Unknown paths
now return status 404 while still rendering the localized not-found page, so the
visitor keeps a usable page with the site map in its footer and search engines
are told the truth. Applied to dev and production and verified from outside on
both.

- The explicit `error_page 404 =404 /index.html` is load-bearing: the bare form
  serves the shell but relabels the response 200, which is the very bug. Found
  by testing on dev, not by reading the docs.
- Along the way: `/etc/nginx/sites-enabled/dev.hotvds.com` was a regular file
  rather than a symlink into `sites-available`, and the two had drifted — the
  live copy listened on `127.0.0.1:8443` behind the SNI router while the other
  still said `443`. Editing `sites-available` changed nothing served, silently.
  Both hosts are symlinks now.

**The nginx configs are in the repo.** `deploy/nginx/` holds copies of what is
actually serving, with `README.md` covering how to apply a change and the
symlink trap above. Nothing deploys them — the production key's forced command
only publishes `dist/` — so they are a record with a history and a diff, which
they did not have while living only on the host. `src/nginxRoutes.test.ts` fails
when the route list in the snippet drifts from `routePaths`, because that drift
produces a page which renders perfectly and answers 404 to crawlers: invisible
in a browser, fatal in search.

## 2026-08-06

### Changed

**Staging and production are now separate environments.** They were not before: the `hotvds.com`
vhost carried `root /var/www/dev.hotvds.com/dist` — the very directory the staging workflow rsyncs
into. Both hostnames served the same files, so every merge to `main` published straight to
customers, `dev.hotvds.com` was only a second hostname with `noindex` headers rather than a place
to check anything, and `rsync --delete` overwrote the live site in place with no previous build
left to fall back to. Confirmed on the host, not inferred: both configs in
`/etc/nginx/sites-available/` held the same `root`, and both hostnames served byte-identical
bundles.

- Production serves `/var/www/hotvds.com/current`, a symlink into timestamped release directories
  (last 10 kept). Staging keeps `/var/www/dev.hotvds.com/dist` and is otherwise untouched. An
  nginx `stream{}` SNI router (`/etc/nginx/stream.d/stream.conf`) still sends both hostnames to
  127.0.0.1:8443, where `server_name` tells the two vhosts apart.
- The cutover seeded the new root with a byte-identical copy of what was already live, so not one
  served byte changed at the switch. Backups of the vhost and `authorized_keys` are on the host at
  `/root/backup-*.20260806055354`.
- `deploy-prod.yml` ships production, and never runs on a push: it triggers on a `v*` tag or a
  manual dispatch, and re-runs lint, types, tests, and build first, because a tag can point at a
  commit no pull request ever saw. `main` still auto-deploys to staging via `deploy-dev.yml`.
- Rollback is a symlink swap rather than a rebuild from an old commit:
  `ssh -i <key> hotvds-deploy@<host> rollback`. `list` shows the releases with the live one marked.
- The production deploy key is pinned to a forced command (`deploy/hotvds-prod-deploy`, installed
  at `/usr/local/bin/`) and runs as the unprivileged `hotvds-deploy` user, so it gets no shell and
  can only deploy, roll back, or list. The build arrives as a tar stream on stdin, is unpacked to a
  staging directory outside `releases/`, and is checked for `index.html` and `assets/` before the
  symlink moves — a truncated upload leaves the running site untouched instead of replacing it
  with a 404. Verified on the host: `id`, `rm -rf /var/www`, and an interactive login are all
  refused; a path-traversal attempt in the release label is sanitised away.
- `hotvds.com` serves a real `robots.txt`. Previously `/robots.txt` fell through `try_files` and
  answered 200 with the SPA shell.
- Still outstanding: the staging deploy key remains `rrsync`-restricted but connects as `root`,
  unlike production's unprivileged user; and `deploy-prod.yml` declares `environment: production`
  but that environment is not configured in repository settings, so no reviewer approval is
  required before a production deploy.

### Added
- Test suite — Vitest + Testing Library + jsdom, `npm test` / `npm run test:watch` — and a `CI`
  workflow running lint, type check, tests, and build on every pull request. Until now the only
  automated check was `tsc --noEmit` inside the deploy workflow, which fires on push to `main`, so
  a branch merged with nothing verified and types were checked on the way to the server rather
  than before the merge. `deploy-dev.yml` now runs the tests before shipping too.
- The tests deliberately target what the type system cannot reach:
  - `Footer` pairs labels to paths **by array index**, and neither array is length-typed, so
    deleting an entry from one silently re-points the remaining links at the wrong pages.
  - The EN dictionaries are `satisfies DeepWiden<typeof ru*>`, which catches a missing key but not
    a missing array *element* — one dropped FAQ item ships a page that says different things per
    language. Compared structurally instead, array lengths included.
  - A guard that no trial or GPU claim reappears in the dictionaries, and that the retired GPU URL
    resolves through the catch-all to the home page.
- Two environment quirks worth knowing before writing more tests, both commented at the assertion
  that depends on them: react-router resolves `to="#"` against the current location, so the
  footer's inert links render with the current path rather than a literal `#`; and jsdom does not
  evaluate media queries, so the desktop nav keeps its mobile-first `display: none` and needs
  `hidden: true` to be queryable.

### Removed
- GPU server product page (`/:lang/products/gpu-servers`) and everything wiring it up: the route,
  the `product` i18n namespace, the mock `gpuTiers` table, and the header/footer nav entries.
  Nothing GPU-shaped crosses the Billing API — `ApiPackageMetadata` carries only cpu/ram/ssd/traffic
  — so the page advertised NVIDIA T4/L4/A100 plans that could not be bought; both of its
  "Order a GPU server" buttons dropped the visitor into the ordinary VDS configurator. The old URL
  now falls through to the catch-all redirect. Also drops the never-read `gpuAvailable` field from
  `src/data/datacenters.ts`.
- The "first 7 days free, no card required" trial offer, from the home page FAQ and the bottom CTA
  banner. Checkout charges immediately via Billing/YooKassa and no trial exists on the backend, so
  the claim was not deliverable. The banner's button is now "Запустить сервер" / "Launch a server".
  The separate 7-day *refund* answer on the pricing page is unaffected and stays.

## 2026-07-13

### Added
- Initial hotvds.com design prototype: React + TypeScript + styled-components, 4 pages (Home,
  Pricing, GPU product, Dashboard), responsive at 480/768/1024/1280px breakpoints.
- Bright "optimistic" design system (coral accent, indigo headings, mint positive-signal color),
  deliberately distinct from vdsina.com/vultr.com/hetzner.com references.
- Bilingual RU/EN content via `src/i18n`, with `/en` and `/ru` URL-prefixed routing
  (`src/components/layout/LangGate.tsx`, `src/i18n/paths.ts`). `/` redirects to `/en` (default).
- Interactive VPS configurator (CPU/RAM/SSD sliders with live price calculation) on the Pricing page.
- Datacenter status system: Amsterdam is the primary/live location; Moscow, Frankfurt, Istanbul,
  and Singapore are shown grayed out as "coming soon" everywhere a datacenter is listed (home,
  GPU product page, pricing configurator's datacenter select).
- GitHub Actions auto-deploy (`.github/workflows/deploy-dev.yml`): every push to `main` builds the
  app and rsyncs `dist/` to `dev.hotvds.com` over a dedicated, directory-restricted SSH deploy key.
- `dev.hotvds.com` nginx vhost on the deploy server: serves the SPA with `try_files` fallback,
  sends `X-Robots-Tag: noindex, nofollow, noarchive`, and serves a blanket-disallow `robots.txt` —
  so the staging environment stays out of search indexes independent of the app's own build.

### Fixed
- Mobile menu overlay rendered semi-transparent (hero content bled through) because it was nested
  inside a header with `backdrop-filter`, which creates a CSS containing block for its
  `position: fixed` children — moved the mobile nav outside the header.
- Dashboard instance rows overflowed into the balance sidebar under `flex-wrap: nowrap` at narrower
  desktop widths (flex children refusing to shrink below content size) — switched to a wrapping
  layout with `min-width`/`max-width` and ellipsis truncation on the instance name.
- Production build (`tsc -b && vite build`) failed: the `styled-components` v6 theme augmentation
  file wasn't picked up by TypeScript because it shared a basename with `theme.ts` in the same
  directory — renamed to `src/styled.d.ts`. Also removed the conflicting `@types/styled-components`
  (a v5-era package) that shadowed styled-components' own bundled types.
- Bilingual dictionary typing required English strings to literally equal the Russian ones (`as
  const satisfies typeof ruDict` forced identical literal types) — added `DeepWiden<T>`
  (`src/i18n/deepWiden.ts`) so English copy only has to match the Russian dictionary's *shape*.
- Footer column links (Продукт/Компания/Поддержка) were plain `<li>` text with no `href` — now
  real links, wired to `/pricing` and `/products/gpu-servers` where a page exists.
- Ready-made tariff cards (Start/Basic/Pro/Business/Ultra) had prices hardcoded independently of
  the configurator's per-unit rates, so they could silently drift out of sync — both are now
  derived from the same `pricePerUnit` constants in `src/data/tariffs.ts`.
- Datacenter city/country names (and the dashboard's server region) always rendered in Russian
  regardless of the selected language — `DatacenterBadge` now takes the `Datacenter` object and
  picks `city`/`cityEn` itself based on the active language.

### Changed
- Pricing configurator base rate: 1 vCPU / 2 GB RAM / 10 GB NVMe = $10/mo (`pricePerUnit` in
  `src/data/tariffs.ts`); slider minimums adjusted to match (RAM from 2 GB, SSD from 10 GB).
- OS options in the configurator: added Ubuntu 26.04 (now default) and Debian 13 alongside the
  existing Ubuntu 24.04 / Debian 12 / CentOS Stream 9 / Windows Server 2022.
