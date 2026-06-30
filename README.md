<p align="center">
  <img src="client/public/icons/logo.png" alt="Nicori" width="100" />
</p>

<h1 align="center">Nicori</h1>

<p align="center">
  <strong>Darmowa, otwartoźródłowa platforma do rozmów głosowych, wideorozmów i współpracy — na każdą platformę.</strong>
</p>

<p align="center">
  <a href="https://nicari-beta.vercel.app">🌐 Wypróbuj online</a> ·
  <a href="https://github.com/BoziaO/Nicari/releases">💻 Pobierz</a> ·
  <a href="https://github.com/BoziaO/Nicari/issues">🐛 Zgłoś problem</a> ·
  <a href="https://github.com/BoziaO/Nicari/tree/main/.github/Assets">📷 Zrzuty ekranu</a>
</p>

---

## ✨ Dlaczego Nicori?

> Nie kolejny klon Discorda — coś zupełnie nowego.

|                      Prywatność                      |            Zero opłat            |               Wszędzie               |        Nowoczesność         |
| :--------------------------------------------------: | :------------------------------: | :----------------------------------: | :-------------------------: |
|                  🔓 Kod open source                  |      💸 Żadnych subskrypcji      |   🌍 Web, Windows, Linux, Android    | ⚡ WebRTC, Socket.io, Vue 3 |
| Hostuj samodzielnie lub korzystaj z naszej instancji | Żadnych limitów, żadnego premium | To samo konto, to samo doświadczenie |  Technologia, która działa  |

---

## 🚀 Możliwości

| Feature                           | Opis                                                                            |
| --------------------------------- | ------------------------------------------------------------------------------- |
| 🎙️ **Pokoje głosowe**             | Twórz prywatne i publiczne pokoje z kontrolą dostępu, zapraszaj znajomych kodem |
| 💬 **Czat w czasie rzeczywistym** | Szybkie wiadomości, reakcje, @wzmianki, edycja i usuwanie                       |
| 📺 **Wideorozmowy i streaming**   | Kamera HD, udostępnianie ekranu, Picture-in-Picture                             |
| 🔊 **Krystaliczny dźwięk**        | Redukcja szumów, dźwięk przestrzenny, niska latencja                            |
| 👥 **System znajomych**           | Dodawaj, obserwuj status, wysyłaj zaproszenia do pokoi                          |
| 🎨 **Profile i personalizacja**   | Avatar, status, badge'y, 4 motywy kolorystyczne                                 |
| 🔒 **Bezpieczeństwo**             | JWT autentykacja, ochrona przed nadużyciami, szyfrowanie                        |
| 🛠 **Developer mode**             | Debug panel, podgląd WebRTC, logi Socket.io                                     |

---

## 🎨 Motywy

|     Midnight Lavender      |      Candlelight      |              Aurora              |         Sakura Night         |
| :------------------------: | :-------------------: | :------------------------------: | :--------------------------: |
|   `#0F1018` · `#B7A7FF`    | `#1A1513` · `#FFC78E` |      `#09111D` · `#79F2FF`       |    `#14121C` · `#FFB7D5`     |
| Cicha noc, pastelowy cyber |  Ciepły blask świec   | Zorza północna i neon minimalizm | Delikatny, pastelowy wieczór |

---

## 🛠 Tech Stack

| Obszar          | Technologia                                                     |
| --------------- | --------------------------------------------------------------- |
| **Frontend**    | Vue 3, Vite, Pinia, Vue Router, Tailwind CSS 4, lucide-vue-next |
| **Realtime**    | Socket.io, WebRTC, simple-peer                                  |
| **Backend**     | Node.js, Express 5, Socket.io, Helmet, rate limiting, Pino      |
| **Baza danych** | MongoDB, Mongoose                                               |
| **Desktop**     | Electron, electron-builder                                      |
| **Mobile**      | Capacitor Android                                               |
| **Język**       | TypeScript (typowanie wszędzie)                                 |
| **Narzędzia**   | pnpm workspaces, Turborepo, Vitest                              |
| **Czat**        | markdown-it, highlight.js, DOMPurify (Markdown + embedy)        |
| **Wydajność**   | Code splitting, virtual scrolling, gzip/brotli, service worker  |

---

## ⚡ Wydajność

Nicori jest zoptymalizowany pod kątem szybkości i lekkości:

| Technika                       | Opis                                                              |
| ------------------------------ | ----------------------------------------------------------------- |
| **Route-based code splitting** | 13 lazy-loaded route chunks — żaden komponent nie blokuje startu  |
| **Component-level splitting**  | 9 `defineAsyncComponent` w ciężkich widokach (RoomView, HomeView) |
| **Vendor chunking**            | 5 niezależnych chunków (vue, socket, webrtc, lucide, vueuse)      |
| **Virtual scrolling**          | `vue-virtual-scroller` dla listy wiadomości (chat + DM)           |
| **`v-memo` optimization**      | Memoizacja komponentów wiadomości zapobiega re-renderom           |
| **Selective imports**          | `highlight.js/lib/core` zamiast pełnego pakietu (~300KB → ~50KB)  |
| **CSS: LightningCSS**          | Ultra-szybka transformacja CSS zamiast PostCSS                    |
| **CSS: content-visibility**    | Off-screen sections pomijane podczas renderowania                 |
| **Non-blocking fonts**         | Google Fonts z `preload` + `onload` pattern                       |
| **Compression**                | gzip + brotli w build output                                      |
| **Service Worker**             | Cache-first dla static assets, network-first dla API              |
| **`shallowRef`**               | Maps i Streams bez deep reactivity overhead                       |

---

## 📁 Struktura projektu

```text
Nicori/
├── client/                 # Aplikacja Vue + Electron + Android
│   ├── src/
│   │   ├── app/            # Router i layout
│   │   ├── components/     # UI, czat, pokoje, profile, rozmowy
│   │   ├── modules/        # Feature modules (chat z własnym store)
│   │   ├── services/       # API, Socket.io, WebRTC
│   │   ├── stores/         # Stan aplikacji (Pinia)
│   │   ├── composables/    # Reusable logic (useSystemTheme, etc.)
│   │   ├── styles/         # Motyw (4 theme) i globalne style
│   │   └── views/          # Strony aplikacji
│   ├── electron/           # Skrypty Electrona
│   └── android/            # Aplikacja Capacitor
├── server/                 # API Express + Socket.io
│   └── src/
│       ├── routes/         # Endpointy REST
│       ├── repositories/   # Warstwa dostępu do bazy (Mongoose)
│       ├── socket/         # Handler'y Socket.io
│       ├── middleware/     # Autoryzacja, walidacja
│       └── utils/          # Pomocniki
├── shared/                 # Wspólne pakiety
│   ├── db/                 # Mongoose schemas + repozytoria
│   ├── api-zod/            # Walidacja Zod
│   └── api-client-react/   # Generowany klient API
├── docker/                 # Docker Compose na produkcję
└── docs/                   # Dokumentacja techniczna
```

---

## 🏁 Szybki start

**Wymagania:** Node.js 22+, pnpm 11+, MongoDB

```bash
# 1. Sklonuj repozytorium
git clone https://github.com/BoziaO/Nicori.git
cd Nicori

# 2. Zainstaluj zależności
pnpm install

# 3. Skonfiguruj zmienne środowiskowe
cp .env.example .env
# Edytuj .env — ustaw DATABASE_URL, JWT_SECRET, SESSION_SECRET

# 4. Uruchom w trybie developerskim
pnpm dev
```

Aplikacja będzie dostępna pod adresem `http://localhost:5174`.

> 🔧 Szczegółowe opcje konfiguracji znajdziesz w pliku `.env.example` oraz w dokumentacji `docs/`.

---

## ✅ Skrypty

| Komenda               | Opis                         |
| --------------------- | ---------------------------- |
| `pnpm dev`            | Uruchom wszystko (Turborepo) |
| `pnpm build`          | Zbuduj wszystkie pakiety     |
| `pnpm typecheck`      | Sprawdź typy TypeScript      |
| `pnpm lint`           | Sprawdź kod linterem         |
| `pnpm test`           | Uruchom testy (Vitest)       |
| `pnpm start:client`   | Tylko klient Vite            |
| `pnpm start:server`   | Tylko serwer Express         |
| `pnpm electron:dev`   | Desktop (dev)                |
| `pnpm electron:build` | Desktop (Windows/Linux/Mac)  |
| `pnpm android:sync`   | Sync do Capacitor            |
| `pnpm docker:up`      | Stack produkcyjny            |

---

## 🧪 Testy

```bash
pnpm typecheck    # TypeScript
pnpm lint         # ESLint
pnpm --filter nicori-client test   # Testy klienta
pnpm --filter nicori-server test   # Testy serwera
```

### Coverage

| Area               | Status                               |
| ------------------ | ------------------------------------ |
| Client stores      | ✅ auth, settings                    |
| Client components  | ✅ Button                            |
| Client utils       | ✅ markdown, files                   |
| Client composables | ✅ useSystemTheme                    |
| Server utils       | ✅ upload, serialize-user, room-auth |
| Server routes      | ✅ health, auth                      |

---

## 🐳 Docker

```bash
pnpm docker:build
pnpm docker:up
```

Stack uruchamia: klient (port 80), serwer (3000), MongoDB (27017), Redis (6379).

---

## 📦 Deploy

Repozytorium zawiera gotowe konfiguracje dla:

- **Vercel** (frontend) — `vercel.json` w katalogu `client/`
- **Render** (backend) — `render.yaml` w katalogu głównym

### W skrócie

1. Wdróż serwer na Render → ustaw `DATABASE_URL`, `JWT_SECRET`, `CLIENT_URL`
2. Wdróż klienta na Vercel → ustaw `VITE_API_URL` na adres serwera
3. Skonfiguruj automatyczny deploy z GitHub → `git push origin main`

> 📖 Pełny poradnik deploy: [docs/deployment/DOCKER.md](docs/deployment/DOCKER.md)

---

## 📄 Licencja

MIT — możesz używać, modyfikować i rozpowszechniać bez ograniczeń. Szczegóły w [LICENSE](LICENSE).

---

<p align="center">
  <strong>Nicori</strong> — rozmawiaj, streamuj, baw sie.
  <img src="client/public/icons/logo-mono.png" alt="Nicori" width="50" />
</p>
