# AetherPulse

**Darmowa, otwartoźródłowa platforma do rozmów głosowych, wideorozmów i współpracy — na każdą platformę.**

AetherPulse łączy w sobie najlepsze cechy Discorda, Zoom i Slacka, dając Ci pełną kontrolę nad Twoją komunikacją. Prywatne pokoje głosowe, czat w czasie rzeczywistym, streaming ekranu, wideorozmowy w jakości HD — wszystko w jednym miejscu, bez subskrypcji i bez ograniczeń.

> 🌐 **Wypróbuj online**: [aetherpulse-beta.app](aether-pulse-beta.vercel.app)  
> 💻 **Pobierz na Windows / Linux / Android** → [Aether-Pulse/releases](https://github.com/BoziaO/Aether-Pulse/releases)

---

## ✨ Dlaczego AetherPulse?

| Co zyskujesz     | Szczegóły                                                              |
| ---------------- | ---------------------------------------------------------------------- |
| **Prywatność**   | Kod open source — hostuj samodzielnie lub korzystaj z naszej instancji |
| **Zero opłat**   | Żadnych subskrypcji, żadnych limitów, żadnego premium                  |
| **Wszędzie**     | Web, Windows, Linux, Android — to samo konto, to samo doświadczenie    |
| **Nowoczesność** | WebRTC, Socket.io, Vue 3 — technologia, która działa                   |

## 🚀 Możliwości

- **Pokoje głosowe** — twórz prywatne i publiczne pokoje z kontrolą dostępu, zapraszaj znajomych kodem
- **Czat w czasie rzeczywistym** — szybkie wiadomości, reakcje, @wzmianki, edycja i usuwanie
- **Wideorozmowy i streaming** — kamera HD, udostępnianie ekranu, Picture-in-Picture
- **Krystaliczny dźwięk** — redukcja szumów, dźwięk przestrzenny, niska latencja
- **System znajomych** — dodawaj, obserwuj status, wysyłaj zaproszenia do pokoi
- **Profile i personalizacja** — avatar, status, badge'y, ustawienia dostępności
- **Bezpieczeństwo** — E2E szyfrowanie, JWT autentykacja, ochrona przed nadużyciami
- **Developer mode** — debug panel, podgląd WebRTC, logi Socket.io

## 🛠 Tech Stack

| Obszar      | Technologia                                                   |
| ----------- | ------------------------------------------------------------- |
| Frontend    | Vue 3, Vite, Pinia, Vue Router, Tailwind CSS, lucide-vue-next |
| Realtime    | Socket.io, WebRTC, simple-peer                                |
| Backend     | Node.js, Express 5, Socket.io, Helmet, rate limiting, Pino    |
| Baza danych | MongoDB, Mongoose                                             |
| Desktop     | Electron, electron-builder                                    |
| Mobile      | Capacitor Android                                             |
| Język       | TypeScript (typowanie wszędzie)                               |
| Narzędzia   | pnpm workspaces, Turborepo, Vitest                            |

## 📁 Struktura projektu

```text
Aether-Pulse/
├── client/                 # Aplikacja Vue + Electron + Android
│   ├── src/
│   │   ├── app/            # Router i layout
│   │   ├── components/     # UI, czat, pokoje, profile, rozmowy
│   │   ├── services/       # API, Socket.io, WebRTC
│   │   ├── stores/         # Stan aplikacji (Pinia)
│   │   ├── styles/         # Motyw i globalne style
│   │   └── views/          # Strony aplikacji
│   ├── electron/           # Skrypty Electrona
│   └── android/            # Aplikacja Capacitor
├── server/                 # API Express + Socket.io
│   └── src/
│       ├── routes/         # Endpointy REST
│       ├── middleware/     # Autoryzacja
│       └── utils/          # Pomocniki
├── shared/                 # Wspólne pakiety
│   ├── db/                 # Mongoose schemas
│   ├── api-zod/            # Walidacja Zod
│   └── api-client-react/   # Generowany klient API
├── docker/                 # Docker Compose na produkcję
└── docs/                   # Dokumentacja techniczna
```

## 🏁 Szybki start

**Wymagania:** Node.js 22+, pnpm 11+, MongoDB

```bash
# 1. Sklonuj repozytorium
git clone https://github.com/BoziaO/Aether-Pulse.git
cd Aether-Pulse

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

## ✅ Skrypty

| Komenda               | Opis                         |
| --------------------- | ---------------------------- |
| `pnpm dev`            | Uruchom wszystko (Turborepo) |
| `pnpm build`          | Zbuduj wszystkie pakiety     |
| `pnpm typecheck`      | Sprawdź typy TypeScript      |
| `pnpm lint`           | Sprawdź kod linterem         |
| `pnpm start:client`   | Tylko klient Vite            |
| `pnpm start:server`   | Tylko serwer Express         |
| `pnpm electron:dev`   | Desktop (dev)                |
| `pnpm electron:build` | Desktop (Windows)            |
| `pnpm android:sync`   | Sync do Capacitor            |
| `pnpm docker:up`      | Stack produkcyjny            |

## 🐳 Docker

```bash
pnpm docker:build
pnpm docker:up
```

Stack uruchamia: klient (port 80), serwer (3000), MongoDB (27017), Redis (6379).

## 📦 Deploy

Repozytorium zawiera gotowe konfiguracje dla:

- **Vercel** (frontend) — `vercel.json` w katalogu `client/`
- **Render** (backend) — `render.yaml` w katalogu głównym

### W skrócie

1. Wdróż serwer na Render → ustaw `DATABASE_URL`, `JWT_SECRET`, `CLIENT_URL`
2. Wdróż klienta na Vercel → ustaw `VITE_API_URL` na adres serwera
3. Skonfiguruj automatyczny deploy z GitHub → `git push origin main`

> 📖 Pełny poradnik deploy: [docs/DEPLOY.md](docs/DEPLOY.md)

## 🧪 Testy

```bash
pnpm typecheck    # TypeScript
pnpm lint         # ESLint
pnpm --filter aetherpulse-client test   # Testy klienta
pnpm --filter aetherpulse-server test   # Testy serwera
```

## 📄 Licencja

MIT — możesz używać, modyfikować i rozpowszechniać bez ograniczeń. Szczegóły w [LICENSE](LICENSE).

---

**AetherPulse** — rozmawiaj, streamuj, współtwórz. 🚀
