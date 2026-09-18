# SprintQuest — Plan Maestro (Master Plan)

## Resumen Ejecutivo

**SprintQuest** es una plataforma gamificada de ceremonias Agile que convierte Sprint Reviews y Retrospectives en experiencias de juego con XP, quests, badges, niveles y progresión de equipo.

**Posicionamiento:** "Continuous Improvement as a game." — No es otra herramienta de retros, es un "Duolingo/Kahoot para equipos Scrum."

**Problema central:** El 44% de las acciones de retro nunca se completan (ResearchGate 2025), solo el 35% de los equipos completan acciones consistentemente (Scrum Alliance 2023), y los stakeholders no asisten a las Sprint Reviews. Los equipos pierden la confianza cuando las ideas se expresan pero nunca se actúan.

**Solución:** Cada sprint es una temporada/missión. Los equipos ganan Team XP, suben de nivel, desbloquean badges y quests. El loop: Sprint Planning → Daily → Review → Retro → Quests → Next Sprint → Level Up.

---

## 1. PRODUCTO

### 1.1 Definición
Plataforma web (PWA) que gamifica las ceremonias Agile. MVP = Retrospective gamificada. Post-MVP = ciclo completo de Scrum.

### 1.2 Lo que NO es
- No es un tablero de retrospectivas
- No es un tracker de productividad individual
- No es una herramienta de project management
- No tiene leaderboards individuales
- No es un sistema de monitoreo/surveillance

### 1.3 Lo que SÍ es
- Juego de equipo donde cada sprint es una temporada
- XP acumulativo para el equipo (nunca individual)
- Quests que convierten action items en tareas rastreables
- Progresión persistente de equipo (niveles, badges, streaks)
- IA como Game Master que facilita, sugiere, detecta patrones

---

## 2. PROBLEMA Y EVIDENCIA

### 2.1 Problemas verificados
| Problema | Evidencia |
|----------|-----------|
| 44% de action items nunca se completan | ResearchGate 2025 |
| Solo 35% de equipos completan acciones consistentemente | Scrum Alliance 2023 |
| 40-50% de completion rate de retro actions | Easy Agile TeamRhythm |
| Stakeholders no asisten a Sprint Reviews | Scrum.org documentado |
| Solo ~19% de equipos usan datos objetivos en retros | arXiv 2025 (19 practitioners) |
| Los equipos repiten los mismos problemas sprint tras sprint | Múltiples fuentes |

### 2.2 Costo del problema
Equipos top 20% en engagement: 41% menos absenteeism, 59% menos turnover (Gallup). Malas retros = equipos desmotivados = rotación.

### 2.3 Tamaño del mercado
- Mercado Agile tools: $5.7B (2020) → $9.2B (2024) → $15.6B (2035, CAGR 13.5%)
- Enterprise Agile transformation: $41.2B (2024) → $48.75B (2025) → $96.28B (2029, CAGR 18.5%)
- 71% de organizaciones usan Agile, 63% usan Scrum (State of Agile 2025)

---

## 3. USUARIO

### 3.1 Usuario principal
**Scrum Master / Agile Coach** — organiza ceremonias, facilita retros, busca engagement.

### 3.2 Usuarios secundarios
- **Product Owner** — quiere feedback significativo de stakeholders en Sprint Reviews
- **Developer/QA** — quiere que las reuniones valgan la pena, acciones claras, progreso visible
- **Stakeholder** — quiere participar activamente, ver progreso real, no presentations pasivas

### 3.3 Quién paga
- **Inicialmente:** Scrum Master/Agile Coach como campeón dentro del equipo
- **Luego:** Engineering Manager/CTO (empresa) o Agile Coach (multi-cliente)
- **Enterprise:** VP Engineering, CIO

### 3.4 Buyer personas
| Persona | Motivación | Objectión |
|---------|-----------|-----------|
| Scrum Master | Quiere retros productivos | "Mi equipo ya usa Jira/Miro" |
| Agile Coach | Escalar engagement a múltiples equipos | "Parece demasiado game-y" |
| Engineering Manager | Quiere métricas de engagement del equipo | "¿Cómo garantizan privacidad?" |
| Startup founder | Team morale y productividad | "Presupuesto limitado" |

---

## 4. GAMIFICACIÓN

### 4.1 Sistema de XP
| Acción | XP |
|--------|-----|
| Participar en ceremonia | +10 |
| Completar acción de retro | +50-200 |
| Sprint Review challenge | +100 |
| Identificar problema recurrente | +30 |
| Completar quest | +300 |
| Streak bonus | +50/sprint |
| Stakeholder participa en review | +20/voto-comentario |

- **Quién recibe XP:** El equipo colectivamente. NUNCA individuos.
- **Se puede perder XP:** No. XP es acumulativo. Pero streaks se rompen.

### 4.2 Progresión
- **Niveles:** Team Level 1 → Level 50+
- **Subir de nivel:** Acumulando Team XP (cada nivel requiere más XP)
- **Al subir de nivel:** Desbloquea nuevos game modes, temas, avatares, badge types, challenges especiales

### 4.3 Badges y Achievements
- Improvement Machine, Bug Hunters, Collaboration, Continuous Delivery, Goal Keepers
- First Quest Completed, 10 Actions in a Sprint, 50-sprint milestone, etc.

### 4.4 Quests
- Action items convertidos en quests con: título, descricripción, owner, fecha límite, estado, XP value, tracking de progreso
- Quest incompleta → se arrastra al siguiente sprint con explicación requerida
- 3 sprints sin completar → flagged como stalled

### 4.5 Streaks
- **Improvement Streak:** Consecutive sprints con action items completados
- Si el equipo no completa acciones 2 sprints → notificación de re-engagement

### 4.6 Game Modes
- 🔥 Boss Battle — identificar y derrotar el mayor problema
- 🏝️ Sailboat — viento en velas (qué empuja), ancla (qué frena)
- 🚀 Mission Control — misión basada
- 🕵️ Detective — investigar qué pasó
- ⚔️ Team Battle — equipo vs equipo (opcional)

### 4.7 Reglas de oro de gamificación
- ✅ Team XP solo (nunca individual)
- ✅ Cooperativa, no competitiva entre individuos
- ✅ Anonymity options para participación
- ✅ Scrum Master puede desactivar gamificación
- ✅ Equipo puede elegir entre modos
- ❌ NO leaderboards individuales
- ❌ NO "Top developer", "Most commits"
- ❌ NO incentivar volumen sobre valor

---

## 5. CICLO DE PRODUCTO POR CEREMONIA

### 5.1 Retrospective (MVP — V1)
**Flujo:** 4-5 rounds
1. **Icebreaker** (2 min): Pregunta sorpresa generada por IA
2. **Data Gathering** (15 min): Escribir lo que funcionó, qué no, qué sorprendió
3. **Detection** (15 min): Votar, IA agrupa temas, detectar patrones recurrentes
4. **Decision** (10 min): Seleccionar el problema principal (Boss Fight)
5. **Quest** (10 min): Convertir el problema en quest con owner y fecha

**Resultado:** Team XP + badge unlock + next quest

### 5.2 Sprint Review (V2)
- Stakeholders se unen vía link sin necesidad de cuenta
- Demos + Challenges (quizzes sobre features)
- Stakeholders votan y dan feedback
- Feedback se convierte en backlog items (Jira/GitHub)
- Stakeholder participation registra: votes, comments, questions

### 5.3 Sprint Planning (V3)
- Quests tied to Jira tickets
- Cada story/ticket tiene un valor de XP implícito
- Team elige "misiones" para el sprint

### 5.4 Daily (V3, opt-in)
- XP opcional por participación
- No incentivar cantidad de mensajes

### 5.5 Backlog Refinement (V3)
- "Quest Preparation" event
- Preparar el terreno para el próximo sprint

---

## 6. IA (Game Master)

### 6.1 Rol
- **Durante ceremonias:** Facilitador — genera preguntas, gestiona timers, agrupa ideas
- **Entre ceremonias:** Game Master — detecta patrones, sugiere challenges, agrupa comentarios, detecta problemas recurrentes

### 6.2 Capacidades
- Generar preguntas dinámicas basadas en contexto del equipo
- Resumir discusiones post-ceremonia
- Agrupar comentarios automáticamente
- Detectar problemas recurrentes ("este deployment problem apareció 7 veces en 10 sprints")
- Detectar acciones repetidas ("ya intentaron esto 3 veces")
- Analizar sentimiento (frustración, emoción, preocupación)
- Sugerir challenges basados en patrones detectados
- Personalizar retro según perfil del equipo
- Analizar historial de rendimiento y tendencias de mejora

### 6.3 Lo que la IA NUNCA debe decidir
- ❌ Composición del equipo
- ❌ Asignar culpa individual
- ❌ Decisiones sobre despidos o promoción de personas
- ❌ Calificaciones de rendimiento individual
- ❌ Revelar datos individuales sin consentimiento del equipo
- ❌ Tomar decisiones sobre el backlog del producto

### 6.4 Datos que procesa
- Datos de ceremonias a nivel de equipo
- Patrones de participación anonimizados
- Tasas de completación de acciones agregadas
- Temas de retro, patrones de votación
- Datos de progresión del equipo

### 6.5 Datos que NO procesa
- Métricas de productividad individual
- Rendimiento individual
- Contenido de comunicaciones privadas (sin consentimiento)
- Datos personales más allá de lo necesario para el juego

### 6.6 Modelo
- LLM-based. Inicialmente OpenAI/GPT API
- V2+: permitir que el cliente use su propio proveedor (Anthropic, local LLMs)
- Todo procesamiento es efímero — NO se usa para entrenar modelos

---

## 7. ARQUITECTURA TÉCNICA

### 7.1 Stack
| Componente | Tecnología |
|------------|-----------|
| Frontend | Next.js (React/TypeScript), Tailwind CSS, shadcn/ui |
| Backend | Node.js/NestJS o Python/FastAPI |
| Database | PostgreSQL (relacional) + Redis (caching/sessions) |
| Real-time | WebSockets (Socket.io) |
| AI | OpenAI API (GPT-4), con fallback opciones |
| Auth | NextAuth.js (OAuth Google/GitHub + email/password) |
| Hosting | Vercel (frontend), Railway/Render (backend) |
| Storage | Vercel Blob o S3 |
| Queue | BullMQ (Redis-based) para jobs background |
| Analytics | PostHog o Mixpanel |
| CI/CD | GitHub Actions |
| Testing | Jest (unit), Playwright (E2E) |

### 7.2 Escalabilidad
- **100 equipos:** Arquitectura actual maneja esto fácilmente
- **10,000 equipos:** Read replicas, CDN, caching layers, load balancers
- **100,000 equipos:** Microservices, distributed systems, advanced caching

### 7.3 Infraestructura
- **MVP:** $200-500/month
- **100 equipos:** $2,000-5,000/month
- **Costo objetivo:** < $500/month para 100 equipos iniciales

### 7.4 Plataforma
- **Primary:** Web PWA (responsive, mobile-first)
- **Mobile:** Responsive PWA primero, apps nativas V2+
- **Browsers:** Chrome, Firefox, Safari, Edge (últimas 2 versiones)
- **Real-time:** WebSockets para ceremonias en vivo

---

## 8. SEGURIDAD Y PRIVACIDAD

### 8.1 Principios de privacidad
- **LOCAL FIRST** donde sea posible
- **MINIMIZE PERSONAL DATA**
- **NO TRANSMIT LEARNER DATA** sin requerimiento explícito
- **Equipo es dueño de sus datos** — SprintQuest es processor, no controller
- **Los managers NO pueden usar datos contra empleados**

### 8.2 Modelo de datos
| Nivel | Ve |
|-------|-----|
| Team members | Todo de su equipo (discusiones, votaciones, acciones) |
| Team owner/admin | Todos los datos del equipo |
| Manager (con consentimiento) | Aggregados del equipo: XP, streaks, badges, completion rate |
| Stakeholder | Solo su participación |

### 8.3 Seguridad
- TLS/HTTPS para todas las comunicaciones
- AES-256 encryption at rest
- Bcrypt para contraseñas
- RBAC (Role-Based Access Control)
- GDPR/CCPA compliant
- Daily backups encrypted, geographic redundancy
- RTO < 1 hour, RPO < 24 hours

### 8.4 Cumplimiento
- GDPR: Sí (borrado, portabilidad, consentimiento)
- CCPA: Sí
- SOC 2: Target V3+
- ISO 27001: Target enterprise tier
- Minores: 16+ para crear equipo, COPPA compliance

---

## 9. MODELO DE NEGOCIO

### 9.1 Estructura de precios
| Plan | Precio | Incluye |
|------|--------|---------|
| **Free** | $0/month | 1 equipo, 5 ceremonias/mes, formatos básicos, XP/badges |
| **Pro** | $8-12/team/mes | Todos los game modes, AI, integraciones (Jira, Slack), analytics, unlimited ceremonies |
| **Team** | $6-10/team/mes | Todo + priority support, volume discount |
| **Enterprise** | Custom | SSO/SAML, SCIM, audit logs, data residency, dedicated support, API |
| **Agile Coach** | $15-20/mes | Múltiples equipos, workspace management |

### 9.2 Modelo de negocio
- **SaaS** con modelo **freemium**
- **Trial:** 14 días gratis, sin tarjeta de crédito
- **Pago:** Mensual o anual (20% descuento anual)
- **Descuentos:** Startups (50% primer semestre), Education (gratis), Enterprise (volumen)

### 9.3 Métricas financieras objetivo
- **Gross margin:** 80%+ a escala
- **CAC:** <$50/team (self-service), <$200 (sales-assisted), <$500 (enterprise)
- **LTV:** >$300/team/año
- **LTV:CAC ratio:** > 3:1

---

## 10. INTEGRACIONES

### 10.1 Roadmap de integraciones
| Versión | Integraciones |
|---------|---------------|
| **MVP (V1)** | Ninguna (datos manuales) |
| **V2** | Jira, Slack |
| **V3** | GitHub, Linear, Azure DevOps |
| **V4** | GitLab, Microsoft Teams |
| **V5** | Google Workspace, Notion, Confluence |

### 10.2 Datos integrados
- **Importar:** Sprint data (stories, points, status), tickets/actions de sprints previos
- **Exportar:** Action items a project management tools, retro summaries, analytics

### 10.3 Protocolos
- OAuth 2.0 para todas las integraciones
- Webhooks para actualizaciones en tiempo real
- API pública en V3+
- SCIM para enterprise user provisioning (V3+)

---

## 11. ROADMAP

### 11.1 Cronología estimada
| Fase | Contenido | Duración |
|------|-----------|----------|
| **V0 (Pre-MVP)** | Research, interviews, prototype, validation | 4-6 semanas |
| **V1 (MVP)** | Gamified Retro: team creation, game modes, voting, quests, XP, badges | 8-12 semanas |
| **V2** | Sprint Review (gamificado), Jira/Slack integrations, AI suggestions, analytics | 8-12 semanas |
| **V3** | Sprint Planning, Daily, Backlog Refinement, AI Game Master, enterprise features | 8-12 semanas |
| **V4** | Multiple teams/workspace, advanced AI, public API, marketplace | 8-12 semanas |
| **V5+** | Enterprise features, mobile apps, international expansion | Continuo |

### 11.2 MVP Flow
```
Create Team → Choose Mascot → Choose Game Mode → Run Retro (4 rounds) → Vote → Convert Actions to Quests → See Team XP + Badge → Next Sprint: Review Quests
```

---

## 12. GO-TO-MARKET

### 12.1 Estrategia de adquisición
| Etapa | Estrategia |
|-------|-----------|
| **First 10 teams** | Reddit (r/agile, r/scrum), personal outreach, LinkedIn, Product Hunt |
| **First 100 teams** | + Partnerships with Agile coaches, conference speaking, referral program |
| **First 1000 teams** | + Word-of-mouth viral loop, paid ads (LinkedIn, Google), enterprise sales |

### 12.2 Canal primario
- **Inicialmente:** Content marketing + communities + Product Hunt
- **Escalando:** Word-of-mouth + partnerships + platform partnerships

### 12.3 Growth Loop
```
Team creates retro → invites team → team completes retro → earns XP/level → shares achievement → others see → sign up → create team → repeat
```

### 12.4 Messaging
- **Core message:** "Make your Agile ceremonies something your team looks forward to."
- **Alternative:** "Turn every sprint into a mission."
- **10 seconds:** "It's Kahoot for your Agile ceremonies — teams earn XP, complete quests, and level up every sprint."

---

## 13. EQUIPO Y OPERACIONES

### 13.1 Equipo fundador requerido
- **Agile/Scrum expert:** Practitioner o coach con experiencia profunda
- **Full-stack developer:** Next.js/Node.js o Python/FastAPI
- **UX/Product designer:** Para diseño de la experiencia gamificada
- **(Luego) Marketing:** Content marketing, SEO, community management
- **(Luego) DevOps:** Infraestructura, CI/CD, monitoreo

### 13.2 Presupuesto inicial
- **Desarrollo MVP:** $20,000-50,000 (si se contrata) o inversión de tiempo personal
- **Mes 1-3:** $5,000-15,000/mes (development) + $1,000-3,000/mes (infra + marketing)
- **Runway objetivo:** 12-18 meses
- **Punto de pivot:** Si <10 equipos activos después de 3 meses del MVP

### 13.3 Legal
- Entity: LLC (US) o equivalente
- Trademark: "SprintQuest" — verificar disponibilidad
- IP: La entidad posee todo el código y branding
- Legal costs: $2,000-5,000 (terms, privacy policy)

---

## 14. MÉTRICAS CLAVE

### 14.1 North Star Metric
**Número de improvement actions completadas por equipos activos por mes.**

Mide directamente si el producto está impulsando continuous improvement — el valor core.

### 14.2 Métricas a tracking
| Métrica | Objetivo |
|---------|----------|
| Teams creadas | 70% de signups crean al menos un retro |
| Ceremonies completadas | 90% de las iniciadas terminadas |
| Retorno de equipo | 60% regresa para el siguiente sprint |
| Actions por retro | 3-5 por retro |
| Completion rate de acciones | >80% |
| Participación activa | 80%+ de miembros participan |
| Churn | <20% mensual |
| NPS | >40 después de 3 meses |
| LTV:CAC | >3:1 |

### 14.3 Métricas engañosas (NO usar)
- Número de ceremonias iniciadas (no mide calidad)
- Total XP ganado (puede ser manipulado)
- Número de usuarios registrados (no mide engagement)
- Número de badges ganados (vanity metric)

---

## 15. VALIDACIÓN

### 15.1 Hipótesis a validar
- H1: Los equipos adoptarán retros gamificadas
- H2: La completion rate de action items mejora con mecánicas de juego
- H3: Los stakeholders participan más en reviews gamificadas
- H4: Los equipos quieren progresión persistente entre sprints

### 15.2 Evidencia para continuar
- >50% de equipos piloto usan por 3+ sprints consecutivos
- >60% completion rate de acciones
- NPS >40
- Willingness to pay expresado

### 15.3 Evidencia para abandonar
- <20% retención después de 2 sprints
- Feedback negativo sobre el concepto core
- No willingness to pay después de interviews
- Infeasibilidad técnica de features core

### 15.4 Validar antes de programar
- Problem-solution fit (20-30 interviews)
- Willingness to pay (landing page test)
- Prototype usability (Figma test con 5-10 usuarios)

---

## 16. COMPETENCIA

### 16.1 Competidores directos
| Herramienta | Precio | Qué hacen | Su gap |
|-------------|--------|-----------|--------|
| EasyRetro | $5-15/user/mo | Templates, voting, collaboration | No gamificación completa |
| GoRetro | Custom | Retros + metrics + health checks | No es "videojuego" |
| TeamRetro | $7-12/user/mo | Recurring ceremonies, health checks | No progresión entre sprints |
| TeleRetro | — | Fun, dynamic retros | No full gamification |
| Spreo/Metro | $8-15/user/mo | Visual workshops | No game loop |
| RetroTeam | Free+paid | AI-powered retros | No game mechanics |

### 16.2 Diferenciación
**Ninguna herramienta gamifica el CICLO COMPLETO de Scrum como un videojuego.** Todas hacen "mejores retros" pero ninguna convierte Scrum en un juego persistente con progresión entre sprints.

### 16.3 Moat defensibles
- Network effects (teams invite teams)
- Accumulated team history/progression (difícil de replicar rápido)
- AI Game Master (proprietary learning from data)
- Community of teams
- Pattern recognition from millions of retros

---

## 17. ACCESIBILIDAD E INTERNACIONALIZACIÓN

### 17.1 Accesibilidad
- WCAG 2.1 AA compliance (V2+)
- Navegación completa por teclado
- Compatible con screen readers (JAWS, NVDA, VoiceOver)
- Contraste AA para todos los elementos
- Animaciones reducibles/desactivables
- Gamification reducible para usuarios que lo prefieran

### 17.2 Internacionalización
- **Inicial:** English + Spanish
- **V2:** Portuguese (Brazil)
- **V3:** German, French, Japanese
- AI genera contenido en el idioma del usuario
- Dinámicas adaptadas culturalmente
- Traducciones profesionales + community

---

## 18. NOTIFICACIONES Y RETENCIÓN

### 18.1 Canales de notificación
- **Slack:** Ceremonies upcoming, action items due, achievements
- **Email:** Weekly digests, ceremony reminders, streak alerts
- **Push:** Browser/mobile for real-time events

### 18.2 Factores de retención
- Quests pendientes que llevan al siguiente sprint
- Streak maintenance (miedo de romper racha)
- Nuevos game modes desbloqueables
- Eventos estacionales y limited-time challenges
- Compromiso social (el equipo depende de la participación)

---

## 19. RIESGOS PRINCIPALES

| Riesgo | Mitigación |
|--------|-----------|
| Los equipos no adoptan gamificación | Validar con 20-30 interviews antes de construir |
| Gamificación percibida como surveillance | Team XP solo, no individual, opt-in, privacy-first |
| Demasiado complejo al inicio | MVP simple: solo retro gamificada |
| IA no funciona bien | Empezar sin IA en MVP, añadir en V2 |
| Competidores copian features | Network effects, team history, AI learning |
| Retención baja después de V1 | Anti-fatigue design: new modes, seasons, events |
| Costos de IA elevados | Escalar cuidadosamente, optimizar prompts |

---

## 20. DEFINICIÓN DE ÉXITO

**Para decir que SprintQuest cambió realmente el Continuous Improvement:**
- Los equipos reportan que las retrospectivas son las reuniones más productivas a las que asisten
- La completion rate de action items supera el 80% consistentemente
- Los equipos solicitan más ceremonias porque están comprometidos, no porque se les requiere
- Los Agile Coaches reportan mejora medible en equipos a lo largo de su portafolio de clientes
- La frase "Let's check SprintQuest" se convierte en sinónimo de "Let's have a retro"

---

*Este plan maestro se basa en ~750 preguntas respondidas a través de 52 dominios, con todas las afirmaciones factuales verificadas mediante búsqueda web y todas las decisiones fundamentadas en los principios declarados del proyecto (Team XP only, privacy-first, AI as facilitator, low-friction onboarding).*

*Fuentes de investigación: State of Agile 2025, Scrum.org, Gallup, ResearchGate (arXiv 2025), Easy Agile data, Kaizenko, PMC/Scrum Alliance, Business Research Company, StarAgile.*
