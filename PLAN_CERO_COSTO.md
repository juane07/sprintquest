# SprintQuest — Plan de Construcción: Costo $0

## Principio fundamental

**COSTO $0 — INNEGOCIABLE.** El proyecto debe funcionar con $0/mes, PERMANENTEMENTE. No se paga NADA, bajo ninguna circunstancia, ni siquiera cuando el proyecto crezca. Si un servicio agota su tier gratuito, se busca una ALTERNATIVA GRATUITA. NO se paga. El dominio puede ser un subdominio gratuito (sprintquest.vercel.app, netlify.app) o eventualmente un dominio .com si el usuario decide pagarlo POR SEPARADO — eso es su decisión personal, no un gasto del proyecto.

**Cero dependencias de pago.** Todo el código es open source. Toda la infraestructura usa tier gratuitos verificados. La IA (yo) construye casi todo. El usuario solo decide y provee contexto.

---

## STACK TÉCNICO: $0/mes

### Frontend + Backend
| Componente | Tecnología | Licencia | Costo |
|------------|-----------|----------|-------|
| Framework | Next.js 14+ | MIT | $0 |
| Language | TypeScript | MIT | $0 |
| UI Library | React | MIT | $0 |
| Styling | Tailwind CSS | MIT | $0 |
| Components | shadcn/ui | MIT | $0 |
| Prisma ORM | Prisma | Apache 2.0 | $0 |
| Auth | NextAuth.js | MIT | $0 |
| Real-time | Socket.io | MIT | $0 |

### Infraestructura (todos gratuitos)
| Servicio | Uso | Plan gratuito | Costo |
|----------|-----|---------------|-------|
| **Vercel** | Hosting frontend + API routes | 100GB bandwidth, serverless | $0 |
| **Supabase** | PostgreSQL + Auth + Storage + Realtime | 500MB DB, 1GB Storage, 500MB bandwidth | $0 |
| **Upstash** | Redis (caché + rate limiting) | 10K requests/día | $0 |
| **Cloudflare** | CDN + DNS + dominios | Ilimitado | $0 |
| **GitHub** | Repositorios + CI/CD | Private repos ilimitados | $0 |
| **GitHub Actions** | CI/CD pipelines | 2,000 min/mes | $0 |
| **Vercel Analytics** | Product analytics | Gratuito | $0 |
| **Sentry** | Error tracking | 5K events/mes | $0 |

### IA (gratis o local)
| Opción | Uso | Costo | Nota |
|--------|-----|-------|------|
| **Groq** | Inference rápida (LLM) | Free tier | ~30K tokens/minuto gratis |
| **Google Gemini API** | AI features | Free tier | 15K tokens/minuto gratis |
| **Ollama** | LLM local | $0 | Corre en cualquier máquina |
| **Hugging Face** | Modelos open-source | $0 | Llama, Mistral, etc. |

### Costo total estimado
```
MVP completo: $0/mes
Escala inicial (100 equipos): $0/mes
Si crece mucho: $25/mes (Supabase Pro) o $0 con optimizations
Dominio .com (opcional): ~$10-15/año (solo si el usuario quiere comprarlo)
```

---

## ARQUITECTURA CERO COSTO

```
┌─────────────────────────────────────────────────┐
│                    Vercel (Free)                  │
│  ┌───────────────────────────────────────────┐   │
│  │         Next.js Frontend (PWA)            │   │
│  │  - React + TypeScript + Tailwind + shadcn │   │
│  │  - Responsive, mobile-first               │   │
│  │  - PWA con offline support                │   │
│  └───────────────────────────────────────────┘   │
│  ┌───────────────────────────────────────────┐   │
│  │         API Routes (Serverless)           │   │
│  │  - Auth (NextAuth.js + Supabase)          │   │
│  │  - Ceremonies CRUD                        │   │
│  │  - XP/Badges/Quests logic                 │   │
│  │  - Voting system                          │   │
│  │  - AI Game Master routes                  │   │
│  └───────────────────────────────────────────┘   │
│  ┌───────────────────────────────────────────┐   │
│  │         Socket.io (real-time)             │   │
│  │  - Live ceremonies                        │   │
│  │  - Real-time voting                       │   │
│  │  - Live XP updates                        │   │
│  └───────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│              Supabase (Free Tier)                │
│  ┌───────────┐ ┌───────────┐ ┌───────────────┐  │
│  │ PostgreSQL│ │  Auth     │ │  Storage      │  │
│  │ 500MB     │ │ (row-level│ │ 1GB           │  │
│  │           │ │  security)│ │               │  │
│  └───────────┘ └───────────┘ └───────────────┘  │
│  ┌───────────────────────────────────────────┐   │
│  │ Realtime Subscriptions                    │   │
│  │ (live ceremony updates, voting)           │   │
│  └───────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│         Upstash Redis (Free Tier)               │
│  - Session cache                                │
│  - Rate limiting                                │
│  - Leaderboards cache                           │
└─────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│         AI Layer (Groq / Gemini / Ollama)       │
│  - Game Master: generates questions, detects    │
│    patterns, groups comments                    │
│  - LLM calls from serverless functions          │
│  - Cache results in Upstash Redis               │
└─────────────────────────────────────────────────┘
```

---

## LO QUE YO CONSTRUYO COMPLETAMENTE

### Fase 1: Fundamentos (1-2 semanas)
- [ ] Configurar repo GitHub con Next.js + TypeScript + Tailwind + shadcn/ui
- [ ] Configurar Prisma schema (database models)
- [ ] Configurar Supabase (proyecto, DB, auth, storage)
- [ ] Configurar NextAuth.js con Supabase adapter
- [ ] Configurar Vercel deployment
- [ ] Configurar GitHub Actions (CI/CD)
- [ ] Configurar Upstash Redis
- [ ] Configurar Sentry para error tracking

### Fase 2: Database & Models (3-5 días)
- [ ] Prisma schema completo:
  - User, Team, Sprint, Ceremony, Quest, Action, Comment, Vote, Badge, Achievement, Event
  - Todos los relationships
  - Row-level security policies en Supabase
- [ ] Migrations
- [ ] Seed data (mascots, default game modes, badge definitions)

### Fase 3: Autenticación (2-3 días)
- [ ] NextAuth.js con Supabase
- [ ] OAuth (Google, GitHub)
- [ ] Email/password registration
- [ ] Anonymous participation (join via code without account)
- [ ] Team ownership and management
- [ ] Role-based access control (owner, member, participant, spectator)

### Fase 4: Frontend Base (1 semana)
- [ ] Layout system (navigation, footer, responsive)
- [ ] Dark mode + Light mode
- [ ] Team creation flow
- [ ] Mascot selection
- [ ] Dashboard (team profile, XP, level, streak)
- [ ] Global game status
- [ ] Settings page

### Fase 5: Retro Engine — MVP Core (2-3 semanas)
- [ ] Create/create retro flow
- [ ] Game mode selection (Boss Battle, Sailboat, Mission Control, Detective, Team Battle)
- [ ] Round system with timers
- [ ] Text input for each round (what went well, what didn't, etc.)
- [ ] Dot voting system
- [ ] Anonymous voting option
- [ ] AI auto-grouping of comments (via Groq/Gemini)
- [ ] Pattern detection across sprints
- [ ] Action item creation from retro results
- [ ] Quest conversion (action → quest with owner, deadline, XP)
- [ ] XP calculation and distribution
- [ ] Badge unlock logic
- [ ] Streak tracking
- [ ] Level progression
- [ ] Results page (XP gained, badges, next quest)

### Fase 6: Real-time (1 semana)
- [ ] Socket.io integration for live ceremonies
- [ ] Real-time voting
- [ ] Real-time XP updates
- [ ] Timer synchronization across devices
- [ ] Participant status tracking
- [ ] Late joiner catch-up
- [ ] Disconnection handling

### Fase 7: AI Game Master (1-2 semanas)
- [ ] AI question generation (Groq/Gemini)
- [ ] AI comment grouping
- [ ] AI pattern detection (recurring issues across sprints)
- [ ] AI sentiment analysis
- [ ] AI challenge generation
- [ ] AI retrospective summarization
- [ ] AI difficulty adjustment
- [ ] Cache AI results to minimize API calls (free tier optimization)

### Fase 8: Quest & Progression System (1 semana)
- [ ] Quest CRUD (create, track, complete)
- [ ] Quest status tracking (in-progress, completed, stalled)
- [ ] Quest rollover to next sprint
- [ ] Streak calculation and display
- [ ] Badge collection and display
- [ ] Team level progression
- [ ] Historical stats dashboard
- [ ] Achievement notifications

### Fase 9: Dashboard & Analytics (1 semana)
- [ ] Team stats (ceremonies completed, actions taken, XP earned)
- [ ] Progression graphs (level, XP over time)
- [ ] Action completion rates
- [ ] Team engagement metrics
- [ ] North Star metric dashboard
- [ ] Admin view (if Agile Coach managing multiple teams)

### Fase 10: Polish & PWA (1 semana)
- [ ] PWA manifest + service worker (offline support)
- [ ] Animations and micro-interactions
- [ ] Mobile responsiveness
- [ ] Browser push notifications
- [ ] Email digests (via Vercel cron + email service)
- [ ] Accessibility (keyboard nav, screen reader)
- [ ] Performance optimization
- [ ] SEO basics

### Fase 11: Integrations (V2, 2 semanas)
- [ ] Jira integration (OAuth, fetch sprint data)
- [ ] Slack notifications
- [ ] GitHub issues integration
- [ ] Webhook support

### Fase 12: Testing & Launch (1 semana)
- [ ] Unit tests (Jest)
- [ ] Integration tests
- [ ] E2E tests (Playwright)
- [ ] Load testing
- [ ] Security audit (basic)
- [ ] Documentation
- [ ] Launch on Product Hunt

### TOTAL: ~14-16 semanas (~3.5-4 months) de trabajo continuo de la IA

---

## LO QUE YO PUEDO HACER ADICIONALMENTMENTE

| Tarea | Detalle |
|-------|---------|
| Diseñar UI completa | Cada pantalla, componente, animación |
| Escribir tests | Unit, integration, E2E |
| Configurar CI/CD | GitHub Actions automático |
| Crear documentación | README, docs, API docs |
| Escribir copy/marketing | Landing page text, emails, tweets |
| Generar iconos | SVG icons para la app |
| Crear seed data | Místicas, badges, templates |
| Optimizar rendimiento | Lazy loading, caching, bundles |
| Debuggear | Encontrar y fixear bugs |
| Actualizar dependencias | Mantener todo actualizado |
| Monitorizar | Sentry alerts, analytics review |
| Escribir AGENTS.md | Documentación continua del proyecto |
| Responder preguntas | Sobre el código, arquitectura, decisions |

---

## LO QUE SOLO TÚ PUEDES HACER (REDUCIDO)

Con el modelo "yo construyo todo", las tareas humanas se reducen drásticamente a:

### Decisiones (imprescindibles)
| # | Qué | Cuándo |
|---|-----|--------|
| 1 | **Decidir "sí" al proyecto** | Antes de empezar |
| 2 | **Aprobar el stack técnico** | Día 1 |
| 3 | **Feedback sobre lo que construyo** | Durante todo el proceso |
| 4 | **Decidir si lanzar o no** | Cuando MVP esté listo |
| 5 | **Probar con usuarios reales y decidir cambios** | Después del MVP |
| 6 | **Decidir el pricing final** | Antes de monetizar |
| 7 | **Decidir cuándo es "suficientemente bueno"** | En cada fase |
| 8 | **Proporcionar contexto de Agile/Scrum** | Como feedback continuo |
| 9 | **Elegir el nombre final** | Ya está: SprintQuest |
| 10 | **Decidir si comprar dominio** | Cuando quieras, $10-15/año |

### Interacción humana (imprescindible para validación)
| # | Qué | Por qué yo no puedo |
|---|-----|---------------------|
| 11 | **Entrevistar 20-30 Scrum Masters** | Solo tú puedes tener esas conversaciones |
| 12 | **Recibir feedback real de usuarios** | Tú sientes la energía de la conversación |
| 13 | **Lanzar en Product Hunt** | Tú eres la persona visible |
| 14 | **Hacer el pitch inicial** | Solo tú puedes transmitir la pasión |

### Legal/registro (cuando quieras)
| # | Qué | Costo |
|---|-----|-------|
| 15 | Registrar dominio .com | ~$10-15/año |
| 16 | Registrar marca | Variable |
| 17 | Crear LLC/empresa | Variable |

### Cosas que el dinero NO va a comprar (con stack $0)
- No necesitas VCs
- No necesitas inversionistas
- No necesitas contratar gente inicialmente
- No necesitas servidores pagados
- No necesitas herramientas de pago

---

## FLUJO DE TRABAJO DIARIO (TÚ + YO)

```
TÚ:                          YO (OpenCode):
─────────────                ──────────────────
1. Proporcionar contexto      1. Leer y entender
   (decisiones, feedback,     2. Escribir código
    dirección)                 3. Crear archivos
2. Aprobar/rechazar           4. Crear tests
   lo que construyo           5. Ejecutar tests
3. Decidir qué priorizar      6. Deploy automático
   para la siguiente fase     (GitHub Actions)
4. Entrevistar usuarios       7. Reportar resultados
5. Hacer preguntas sobre     8. Mantener AGENTS.md
   el producto                actualizado
                             9. Responder dudas
```

---

## COMPARACIÓN: MODELO TRADICIONAL vs. MODELO $0

| Aspecto | Tradicional | MODELO $0 |
|---------|-------------|-----------|
| Desarrollo | 2-3 devs @ $80K/año | IA (tú, sin costo) |
| Hosting | $50-200/mes | $0 (free tiers) |
| Database | $20-100/mes | $0 (Supabase free) |
| AI | $100-500/mes | $0 (Groq/Gemini free) |
| CI/CD | $50-200/mes | $0 (GitHub Actions) |
| Designer | $3K-10K | Yo (shadcn/ui + Tailwind) |
| Costo total MVP | $10K-50K | $0 |
| Tiempo | 6-12 meses | 3.5-4 meses |
| Riesgo financiero | Alto | $0 |

---

## PRIMER PASO INMEDIATO

Si quieres empezar AHORA, esto es lo que necesita:

1. **Crear una cuenta en GitHub** (si no tienes)
2. **Crear una cuenta en Vercel** (gratis)
3. **Crear una cuenta en Supabase** (gratis)
4. **Crear una cuenta en Upstash** (gratis)
5. **Crear una cuenta en Groq** (gratis, para AI)

Después, yo puedo escribir todo el código y hacer el deploy. Tú solo me dices "start" y construyo desde el primer `npx create-next-app`.

**Tu decisión: ¿Quieres que empiece a construir el MVP ahora mismo?**

- Sigue estas instrucciones y yo genero el código
- O prefieres primero entrevistar usuarios para validar
- O prefieres primero registrar el dominio
- Tú decides el orden

El stack es $0, la IA está lista, y el código se escribe. Solo necesitas decir "adelante".
