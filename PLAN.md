# TryME v1: Locked Solo-Founder Plan From Zero to Launch

## Summary

- Build `TryME` as a global, English-first mobile app for students that turns uploaded notes into `study packs`, `flashcards`, `quizzes`, and a flagship `AI oral exam call`.
- Keep the current codebase only as a technical bootstrap. Treat the existing UI as disposable and redesign the product from scratch.
- Launch `iOS + Android` together in a lean `4-5 month` window, optimized for the first `1,000 users`, `lean budget`, and `balanced voice quality/cost`.
- Product position: `upload your own notes, then get examined by AI as if you were already in the oral exam`.
- Brand direction: `warm mascot-led`, `smart companion`, `hybrid descriptive name`, `light gamification`, `strictly document-based AI`.

## Locked Decisions

- Audience: students, broad all-subject scope.
- Platforms: iOS and Android together.
- Team reality: solo founder.
- Funnel: signup after first value moment.
- Auth: Apple, Google, and email.
- Languages: English UI; users may upload multi-language documents.
- Content inputs: file upload plus pasted text only.
- Editing: light editing of generated study content.
- Privacy: private-only content; no sharing in v1.
- AI behavior: strictly grounded in user documents.
- Premium hook: unlimited AI calls.
- Call retention: save summary only, not raw audio or full transcript.
- Gamification: light only.
- Web: no product web companion in v1; only minimal legal/support surfaces if needed.
- Pricing structure: monthly + annual subscription.
- Price band: mid-market.
- GTM: organic content first.
- Brand state today: no final name/domain/assets yet.
- Store accounts today: Apple Developer and Google Play accounts not yet set up.

## Typography Lock (Mandatory)

- Do not introduce new font families unless explicitly requested by the user.
- Always use the same typography system as the first app screen:
- `Sora_700Bold` for major headings.
- `Sora_600SemiBold` for subheadings and button emphasis.
- `Manrope_400Regular` for body text.
- `Manrope_600SemiBold` for stronger body labels.
- `LilitaOne_400Regular` only for wordmark/brand moments.
- The local mascot font source is locked to `font/Lilita_One/LilitaOne-Regular.ttf`.

## V1 Product Scope

- `Onboarding`: value prop, permission education, first upload prompt, first generated output.
- `Library`: upload `PDF`, `DOCX`, `TXT`, and pasted text.
- `Processing`: extraction, cleanup, language detection, chunking, study-pack generation.
- `Study Pack`: summary, key concepts, likely oral-exam questions, weak-topic suggestions.
- `Flashcards`: AI-generated deck with light edit/delete/regenerate controls.
- `Quiz`: MCQ, fill-in, short answer, score + weak-area feedback.
- `AI Call`: realtime oral exam simulation with interruption handling, listening states, speaking states, and post-call summary.
- `Progress`: streaks, completed sessions, weak topics, recommended next step.
- `Subscription`: free tier with usage limits, premium with unlimited calls.
- `Support/Legal`: privacy policy, terms, account deletion, support email, AI disclosure.
- `Analytics/Monitoring`: product analytics, crash reporting, performance monitoring.

## Not In V1

- Collaboration.
- Public sharing or share links.
- Web study product.
- Cloud imports from Drive/Dropbox/Notion.
- Raw audio history.
- General tutoring outside uploaded materials.
- Full custom flashcard builder.
- Teacher dashboard or B2B school features.

## Roadmap

### Phase 1: Product, Name, Brand, and Scope Lock (Weeks 1-2)

- Write a one-page product brief: problem, ICP, promise, v1 scope, non-goals, pricing hypothesis, north-star metric.
- Run a naming sprint with `30` candidates.
- Filter names by pronunciation, memorability, App Store/Play fit, domain availability, trademark risk, and relevance to voice/exam/study.
- Shortlist `5`, test them with target users, choose `1`.
- Create brand direction board with `smart companion` energy: warm, competent, lightly playful, not childish.
- Design logo system: app icon, wordmark, monochrome, micro-size test.
- Define mascot concept: AI study companion, not cartoon animal by default, more “guide/coach” than “toy”.
- Lock visual principles before UI work: color palette, motion rules, sound cues, typography mood, icon style.

### Phase 2: UX Architecture and Design System (Weeks 2-4)

- Redesign the IA from scratch around the real flow: `upload -> generate -> review -> test -> call -> summary -> return`.
- Create wireflows for:
- first-time user,
- returning user,
- free-limit user,
- premium user,
- failed upload user,
- failed microphone-permission user,
- failed network user.
- Design the first-value journey so users see generated value before signup.
- Recommended funnel:
- open app,
- brief value proposition,
- upload or paste notes,
- generate mini study pack,
- preview flashcards or first question,
- prompt signup,
- let them continue into quiz/call,
- show premium boundary only after clear value.
- Build a design system with reusable patterns for cards, tabs, chips, modals, permission prompts, paywall, loading, and failure states.
- Define the AI call state machine visually: `connecting`, `assistant speaking`, `user interrupt detected`, `listening`, `thinking`, `responding`, `call ended`, `fallback mode`.

### Phase 3: Technical Foundation and Infra Setup (Weeks 3-5)

- Keep `Expo + TypeScript + Expo Router`, but move the app onto production-oriented custom development builds.
- Standardize environments: `dev`, `staging`, `prod`.
- Add CI for lint, typecheck, test, build validation.
- Use managed services to stay solo-founder efficient:
- `Supabase` for auth, Postgres, storage.
- `Fastify + TypeScript` backend for secure AI orchestration and business logic.
- `RevenueCat` for subscription logic.
- `PostHog` for analytics and feature flags.
- `Sentry` for crash/performance monitoring.
- Move all AI calls server-side. No OpenAI key or privileged AI logic may remain in the mobile client.
- Create a basic admin console or SQL-backed operator view for support, stuck jobs, and manual retries.

### Phase 4: Data Model and Core Interfaces (Weeks 4-5)

- Define these core entities:
- `User`
- `Profile`
- `SourceDocument`
- `ProcessingJob`
- `StudyPack`
- `Flashcard`
- `FlashcardReview`
- `QuizSession`
- `QuizQuestion`
- `CallSession`
- `CallTurnEvent`
- `CallSummary`
- `Subscription`
- `Entitlement`
- `AnalyticsEvent`
- `NotificationPreference`
- `SupportRequest`
- Recommended API surface:
- `POST /auth/start`
- `POST /documents/upload`
- `GET /documents/:id/status`
- `GET /study-packs/:id`
- `POST /flashcards/:id/regenerate`
- `POST /quizzes/start`
- `POST /quizzes/:id/submit`
- `POST /calls/session`
- `POST /calls/:id/end`
- `GET /progress/home`
- `POST /billing/webhook/revenuecat`
- `POST /account/delete`
- Add ownership checks, soft delete, audit fields, and usage counters to every user-owned resource.

### Phase 4.5 Onboarding UX Addendum

The onboarding should be Gizmo-like in flow, but not visually identical.

The flow should begin with a welcome screen that asks the user:

- I have an account
- I don’t have an account

If the user already has an account, they should be taken into the sign-in flow.
If the user does not have an account, they should be taken into a guided onboarding flow with sequential steps and a progress bar.

**Desired First-Time User Flow**

**Welcome**

- A short greeting.
- CTA: `Get started`
- Secondary CTA: `I already have an account`

**Language Selection**

- The user first chooses the language the app will use.

**Age**

- After language selection, the user is asked how old they are.

**First Name**

- Then they enter their first name.

**Notifications Recommendation**

- A recommendation to enable notifications is shown.
- This should be a soft recommendation, not an aggressive hard block.

**How It Works / Import Education**

- Briefly show how the app works.
- The focus is on helping the user understand that they need to upload a document or learning material.

**Document Import**

- The user adds a document directly from onboarding.
- Import should be document-first.
- It is desirable to have multiple import methods, but primarily:
- `PDF / DOCX / TXT`
- `Paste notes`

**Processing State**

- After import, there should be a clear loading / processing screen.

**Direct Landing Into Document Workspace**

- As soon as the document is added, the user should be taken directly to the part of the app where that document is opened as the active study source.
- This must not end on a generic home screen without context.

**Document Action Hub**

- On that screen, the user should immediately choose what they want to do with that document:
- `Quiz`
- `Flashcards`
- `Notes / Study Script`
- `AI Call`

**Product Constraint**

- The onboarding must be document-first, not dashboard-first.
- The first real aha moment should be: “I added a document and I can immediately study from it.”

**UX Intent**

- The goal is not to copy Gizmo visually.
- The goal is to capture the same feeling of a guided, lightweight, step-by-step entry into the product.

### Phase 5: Document Ingestion and Study-Pack Generation (Weeks 5-7)

napravi da kada se selektira dodaj biljeske/sadrzaj da se onda otvori modal di gore imamo title, ispod toga calendar di mozemo selektirati kada je provjera i isopod toga onda opcija za kliknuti i ubaciti taj sadrzaj i kliknuti dole save. nakon toga u folders se nalazi taj umetnuti sadrzaj sa imenom koji smo dali npr "Raskoljnikov esej". i kada osoba klikne na taj folder ima opciju napraviti flashcardove,kvizove,ai poziv ili uciti zajedno. u pozadini ce ai analizirati dokumente i napraviti analizu sta je najvaznije za znati iz toga dokumenta i implementirati kratku skirptu po kojoj osoba moze uciti ako selektira "uciti zajedno", ako selektira kviz onda se dalje otvori novi modal koji biras tezinu i broj pitanja (10,20,30). i onda se ide jedno po jedno pitanje kao na kvizu tko zeli biti miijunas sa opcijama za nazovi frenda, 50/50 ili pitaj publiku. AI kada dobije neki dokument ce prvo analizirati ga da zna o cemu se radi pa ce onda na osnovu dokumenata stvoriti sva pitanja potrebna da neka osoba dobije peticu iz tog sadrzaja. naravno ako je skirpta jako kratka onda ce biti manje pitanja itd... vazno je samo da ai nikada ne izmislja odgovore nego su oni iskljucivo iz prilozenih dokumenata i nicega drugog. I vazno je da prepozna koje su stvari vazne, da ne pita npr tko je bio polubrat sporednog lika u knjizi koji se spomenuo jednom u 300 stranica nego da zaista po vaznosti prode prvo glavna pitanja/ i prvo naravno na pocetku neka laksa pitanja pa s vremenom i na osnovu odgovora usera idu teza pitanja. Kviz ima 3 zivota, ako pogrijesi tri puta onda ga vrati na pocetak kviza i izbacuje neku poruku kao youre not ready yet, try again ili tak onesto. treca opcija flashcards neka bude normalno imamo set kartica i na njima pise npr definicija i ja kao korisnik moram u sebi ili naglas reci sta znam o tome... to se nigdje ne upisuje, a kada kliknem na karticu se iza nalazi definicija iz prilozenog dokumenta, ili npr ako je knjiga prednje pise neko pitanje za lektiru a iza odgovor. ispod tih kartica su strelice pa ako se zelim vratiti na prethodne flashcardove ili sljedece to je isto moguce. zadnje je ai poziv.

- Support `PDF`, `DOCX`, `TXT`, and pasted text only.
- Flow:
- validate file,
- upload to storage,
- extract text,
- OCR fallback for image-heavy PDFs if needed,
- detect language,
- clean text,
- chunk text,
- generate study pack,
- store structured outputs.
- Generate these assets from each document:
- concise overview,
- key concepts,
- likely oral-exam prompts,
- flashcard candidates,
- quiz bank candidates,
- retrieval snippets for call mode.
- Add quality scoring for processed documents.
- If extraction quality is poor, show a repair path: re-upload, paste text, or trim scanned pages.

### Phase 6: Flashcards, Quiz, and Progress (Weeks 6-8)

- Flashcards:
- generate an initial deck from the study pack,
- allow light edit, delete, and regenerate,
- add simple spaced-repetition scheduling,
- show next review recommendations.
- Quiz:
- start from AI-generated question bank,
- support MCQ, fill-in, and short answer,
- show per-question correctness and concept feedback,
- finish with weak-topic summary and next recommended action.
- Progress:
- show streak, sessions completed, last studied document, weak areas, and recommended next session.
- Keep gamification light: streaks, progress rings, completion nudges, no heavy pressure loops.

### Phase 7: AI Call System (Weeks 8-11)

- Build the flagship feature around a realtime voice architecture.
- Use backend-issued ephemeral session auth for the voice service.
- Required behaviors:
- assistant speaks naturally,
- if the user begins talking, assistant stops immediately,
- app switches to listening state,
- app transcribes or streams speech,
- backend evaluates against study pack context,
- assistant asks the next question.
- The AI must stay document-grounded.
- The assistant prompt should enforce:
- only use uploaded material,
- ask one question at a time,
- give brief feedback,
- choose the next question based on user performance,
- never drift into generic tutoring.
- Add fallback mode for bad networks:
- turn-based STT,
- server-side LLM turn,
- TTS reply.
- Post-call output should be `summary only`:
- strengths,
- weak concepts,
- questions missed,
- recommended flashcards,
- recommended next quiz/call.

### Phase 8: Free Tier, Premium, and Usage Controls (Weeks 9-11)

- Free plan:
- limited uploads per month,
- limited AI calls or call minutes,
- full basic study-pack preview,
- flashcards and quiz usable with reasonable limits.
- Premium plan:
- unlimited AI calls,
- higher usage caps elsewhere,
- faster processing priority,
- richer personalization and call continuity over time.
- Initial pricing hypothesis:
- `Monthly: $12.99`
- `Annual: $69.99`
- Keep regional store pricing enabled.
- Use `RevenueCat` with one main entitlement: `premium_access`.
- Do not use free trial in v1.
- Add cost controls:
- max upload size,
- max pages,
- call minute caps on free,
- token/audio usage accounting,
- per-user daily limits,
- retry limits,
- abuse detection.

### Phase 9: Analytics, Monitoring, and Notifications (Weeks 10-12)

- Track the full funnel:
- `app_opened`
- `value_prop_viewed`
- `document_upload_started`
- `document_upload_succeeded`
- `study_pack_generated`
- `signup_started`
- `signup_completed`
- `flashcards_started`
- `quiz_started`
- `quiz_completed`
- `call_started`
- `call_interruption_detected`
- `call_completed`
- `call_summary_viewed`
- `paywall_viewed`
- `subscription_started`
- `subscription_converted`
- `subscription_canceled`
- `push_opened`
- North-star metric:
- weekly active learners who complete at least one study session.
- Core guardrail metrics:
- upload success rate,
- time to first generated output,
- call start success rate,
- call completion rate,
- crash-free sessions,
- free-to-paid conversion,
- 7-day retention.
- Notifications:
- reminder to finish an unfinished study pack,
- flashcard review due,
- streak reminder,
- weak-topic follow-up,
- premium upgrade nudge after real usage,
- win-back message after inactivity.
- Keep copy supportive, not aggressive.

### Phase 10: Legal, Security, and Privacy (Weeks 10-12)

- Publish:
- privacy policy,
- terms of service,
- AI disclosure,
- support contact,
- data deletion process.
- Store only what v1 needs:
- account data,
- document text,
- generated study assets,
- session summaries,
- billing entitlement state.
- Do not store raw audio by default.
- Do not expose user documents to third parties beyond required processing vendors.
- Implement:
- account deletion,
- document deletion,
- summary deletion,
- consent logging,
- secure storage rules,
- secret rotation,
- redacted logs.

### Phase 11: Beta, QA, and Polish (Weeks 12-15)

- Internal alpha first.
- Then `TestFlight` and `Google Play closed testing`.
- QA matrix must cover:
- signup methods,
- document formats,
- large files,
- poor scans,
- multi-language documents,
- denied mic permission,
- Bluetooth audio,
- background/foreground transitions,
- incoming interruptions,
- low network quality,
- stuck processing jobs,
- subscription purchase,
- restore purchase,
- expired premium,
- account deletion.
- Launch gates:
- crash-free sessions above `99.5%`,
- document processing success above `95%`,
- AI call start success above `95%`,
- time to first generated study output under `60s` for normal notes,
- no P0 security/privacy issues.

### Phase 12: Store Prep, ASO, and Launch (Weeks 14-18)

- Create Apple Developer and Google Play accounts immediately because lead times can block launch.
- Set up bundle/package IDs, tax/banking, roles, store metadata, privacy/data safety forms, and subscriptions.
- Produce store assets:
- icon,
- screenshots,
- preview/demo video,
- feature graphic,
- app description,
- keyword set,
- support/privacy URLs.
- ASO angle:
- voice study,
- oral exam prep,
- AI flashcards,
- quiz from notes,
- exam practice from documents.
- Screenshot narrative:
- upload notes,
- AI creates study pack,
- answer flashcards,
- take quiz,
- get tested in AI call,
- see summary and weak points.
- Launch marketing plan:
- founder-led organic content,
- build-in-public style clips,
- short demos of the AI call,
- before/after study workflows,
- student problem/solution posts,
- waitlist or interest capture before store release if helpful.
- Public launch sequence:
- closed beta,
- soft launch,
- fix major retention/conversion issues,
- public release,
- 30-day optimization sprint.

## Name, Logo, and Mascot Deliverables

- Naming sprint output:
- `30` raw names,
- `10` filtered names,
- `5` shortlisted names,
- `1` chosen name.
- Name criteria:
- short,
- pronounceable,
- hybrid descriptive,
- not too literal,
- works globally,
- feels modern,
- hints at study/voice/exam/help.
- Logo output:
- app icon,
- wordmark,
- monochrome mark,
- social avatar,
- store-safe small-size versions.
- Mascot output:
- “smart companion” archetype,
- warm but competent,
- can appear in onboarding, empty states, reminders, and social clips,
- never feels childish or silly.

## Implementation Notes for the Current Repo

- Keep the current Expo project structure only as a base layer.
- Replace current prototype screens and flows instead of iterating visually on them.
- Preserve only reusable technical pieces if still useful:
- navigation shell,
- environment setup,
- baseline native permissions,
- any compatible audio/document modules.
- Remove all client-side privileged AI usage before production work.

## Test Scenarios

- First-time user reaches first generated value without signup friction.
- User can upload notes, see a study pack, then is asked to create an account.
- User with poor-quality PDF gets a useful recovery path.
- Free user hits the call limit and understands premium value.
- Premium user can purchase, restore, and continue without entitlement mismatch.
- User interrupts the AI mid-sentence and the assistant immediately stops.
- User ends a call and receives a useful summary with recommended next actions.
- Multi-language document user sees correct extraction and grounded questioning.
- App survives flaky network during call by falling back gracefully.
- User deletes account and all private study content is removed as promised.

## Assumptions and Defaults

- Existing UI work is not a design constraint.
- The product remains mobile-first and mobile-only for v1.
- Minimal legal/support web pages are allowed even though there is no web product.
- Mid-market pricing is a starting hypothesis, not a permanent truth; validate after beta.
- Multi-language documents are supported only where extraction and voice quality are acceptable; UI remains English.
- The first launch targets the first `1,000 users`, not internet-scale traffic.
- Managed services are preferred over custom infra unless they create a blocking cost or policy issue.
- If realtime voice quality is not stable enough in beta, launch with a controlled fallback and keep realtime as the premium signature experience.
- App Store and Play Store timelines may slip if developer account setup, tax/banking, or review feedback is delayed.

## Official Constraints to Follow During Build and Launch

- Use [Expo EAS Build](https://docs.expo.dev/build/introduction/) and [Expo EAS Submit](https://docs.expo.dev/submit/introduction/) for production mobile release flow.
- Use [OpenAI audio and speech guidance](https://platform.openai.com/docs/guides/audio/quickstart) and [text-to-speech guidance](https://platform.openai.com/docs/guides/text-to-speech) for the voice system.
- Use [RevenueCat React Native setup](https://www.revenuecat.com/docs/getting-started/installation/reactnative) for subscription orchestration.
- Follow [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/), [App privacy requirements](https://developer.apple.com/help/app-store-connect/reference/app-privacy), and [screenshot requirements](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications?page_id=111069).
- Follow [Android App Bundle requirements](https://developer.android.com/guide/app-bundle), [Google Play subscription guidance](https://developer.android.com/google/play/billing/subscriptions?hl=EN), [Play app setup](https://support.google.com/googleplay/android-developer/answer/9859152?hl=en), and [Play listing/discoverability guidance](https://support.google.com/googleplay/android-developer/answer/4448378?hl=en).
