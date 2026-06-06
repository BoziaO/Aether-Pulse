# Podręcznik Wdrożenia Aether-Pulse na Maszynie Wirtualnej (VM)

Ten dokument zawiera instrukcję krok po kroku, jak wdrożyć zoptymalizowaną produkcyjnie aplikację **Aether-Pulse** na
maszynie wirtualnej (np. VPS z systemem Ubuntu/Debian).

Nasza konfiguracja opiera się na **kontenerach Docker**, co zapewnia pełną izolację, wysokie bezpieczeństwo,
ograniczenie zużycia zasobów (RAM/CPU) oraz odporność na awarie.

---

## 1. Wymagania Wstępne na Maszynie VM

Przed rozpoczęciem wdrożenia upewnij się, że na maszynie wirtualnej zainstalowane są:

1. **Docker** (wersja 20.10 lub nowsza)
2. **Docker Compose** (wersja v2 lub nowsza)
3. **Node.js** (wersja 22) oraz **pnpm** (wersja 11.5.0) — wymagane na hoście tylko do pierwszej instalacji i
   inicjalizacji bazy danych.

### Szybka instalacja Docker i Compose na Ubuntu:

```bash
# Aktualizacja pakietów
sudo apt update && sudo apt upgrade -y

# Instalacja Dockera
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Dodanie obecnego użytkownika do grupy docker (opcjonalnie, by nie pisać sudo)
sudo usermod -aG docker $USER
newgrp docker
```

---

## 2. Przygotowanie Kodu i Środowiska

1. Sklonuj repozytorium na swoją maszynę wirtualną:

   ```bash
   git clone <URL_REPOZYTORIUM> /app/aether-pulse
   cd /app/aether-pulse
   ```

2. Utwórz plik produkcyjny `.env` w głównym katalogu aplikacji:

   ```bash
   cp .env.example .env
   ```

3. Wyedytuj plik `.env` za pomocą edytora (np. `nano .env`) i uzupełnij klucze produkcyjne:

   ```env
   # Baza danych
   DATABASE_URL=sqlite.db

   # Konfiguracja Serwera
   PORT=3000
   NODE_ENV=production

   # Wygeneruj silne, losowe klucze (np. poleceniem `openssl rand -base64 32`)
   SESSION_SECRET=ZMIEN_MNIE_NA_SUPER_TAJNY_MINIMUM_32_ZNAKOWY_KLUCZ
   JWT_SECRET=ZMIEN_MNIE_NA_INNY_LOSOWY_I_BEZPIECZNY_KLUCZ

   # Konfiguracja Klienta
   CLIENT_PORT=5174
   BASE_PATH=/

   # Adres url Twojej domeny lub IP serwera (np. http://twoja-domena.pl lub http://123.45.67.89)
   CLIENT_URL=http://localhost
   ```

---

## 3. Inicjalizacja Bazy Danych (Jednorazowo)

Ponieważ produkcyjna baza danych SQLite rezyduje w trwałym, bezpiecznym wolumenie Docker, przed pierwszym uruchomieniem
kontenerów należy jednorazowo zainicjalizować bazę danych i wgrać strukturę tabel:

1. Zainstaluj zależności na serwerze (hoście):

   ```bash
   pnpm install --frozen-lockfile
   ```

2. Skopiuj plik środowiskowy i wygeneruj strukturę bazy danych SQLite:

   ```bash
   # Skopiowanie konfiguracji do modułu db
   node -e "require('fs').copyFileSync('.env', 'shared/db/.env')"

   # Wepchnięcie schematu tabel do sqlite.db
   pnpm db:push
   ```

To polecenie utworzy plik `sqlite.db` z kompletną strukturą tabel i indeksami. Podczas pierwszego uruchomienia Docker
Compose, ten plik bazy danych zostanie zamontowany do trwałego wolumenu kontenera.

---

## 4. Uruchomienie Aplikacji za pomocą Docker Compose

Zoptymalizowany pod kątem wdrożenia produkcyjnego plik `docker-compose.yml` znajduje się w folderze `docker/`.

1. Przejdź do katalogu `docker/`:

   ```bash
   cd docker
   ```

2. Zbuduj i uruchom kontenery w tle:
   ```bash
   docker compose up -d --build
   ```

Docker automatycznie pobierze wymagane obrazy bazowe, skompiluje frontend w Nginx oraz uruchomi produkcyjny serwer Node
zintegrowany z brokerem Redis.

3. Sprawdź status uruchomionych kontenerów:
   ```bash
   docker compose ps
   ```

Oczekiwany wynik powinien pokazywać trzy kontenery w stanie `running` i ze statusem `healthy`.

---

## 5. Przydatne Polecenia Administracyjne

Wszystkie poniższe polecenia należy wykonywać w katalogu `docker/`:

### Podgląd logów w czasie rzeczywistym:

```bash
# Logi wszystkich usług
docker compose logs -f

# Logi samego serwera backendowego
docker compose logs -f server
```

### Zatrzymanie aplikacji:

```bash
docker compose down
```

### Restart aplikacji:

```bash
docker compose restart
```

### Aktualizacja aplikacji po nowym commicie (Redeployment):

Gdy wdrożysz nowe zmiany na gałąź główną, zaktualizuj aplikację na maszynie VM w następujący sposób:

```bash
cd /app/aether-pulse
git pull

# Jeśli zmieniła się struktura bazy danych, zsynchronizuj ją:
pnpm install --frozen-lockfile
node -e "require('fs').copyFileSync('.env', 'shared/db/.env')"
pnpm db:push

# Przebuduj i zrestartuj kontenery
cd docker
docker compose up -d --build
```

---

## 6. Architektura Bezpieczeństwa i Wydajności w Dockerze

Zastosowaliśmy zaawansowane mechanizmy optymalizacyjne, które gwarantują doskonałą kulturę pracy aplikacji na maszynie
wirtualnej:

- **Szybki Frontend i Proxy (Nginx)**: Kontener `client` używa serwera Nginx do gzippowania plików (HTML, JS, CSS, JSON)
  w locie oraz agresywnego cache'owania statycznych assetów na 1 rok. Dodatkowo działa jako bezpieczny Reverse Proxy
  przekazujący zapytania API i WebSocket do backendu.
- **Wielopoziomowa izolacja sieciowa**: Jedynym kontenerem wystawiającym publiczny port na świat jest Nginx (`80`).
  Backend (`3000`) oraz Redis (`6379`) komunikują się wyłącznie wewnątrz bezpiecznej sieci Docker i są niewidoczne z
  poziomu publicznego internetu.
- **Klastrowanie Socket.io (Redis)**: Serwer Socket.io automatycznie komunikuje się poprzez adapter Redis. Pozwala to na
  pełną bezstanowość backendu i swobodne skalowanie do wielu instancji Node.js w przyszłości.
- **Ograniczenia zasobów (Resource Limits)**: Kontenery mają przydzielone limity zasobów, dzięki czemu aplikacja nie
  przeciąży całej maszyny VM:
  - Serwer Node: max 512MB RAM, 1.0 CPU
  - Serwer Nginx: max 128MB RAM, 0.5 CPU
  - Redis: max 128MB RAM, 0.5 CPU (dodatkowo skonfigurowana czystka pamięci LRU przy 128MB).
- **Trwałość wolumenów (Data Persistence)**: Baza SQLite oraz wysyłane przez użytkowników awatary są bezpiecznie
  zapisywane w wolumenach Docker na hoście (odpowiednio `aetherpulse_db_data` i `aetherpulse_uploads_data`), dzięki
  czemu redeployment lub restart kontenera nie kasuje żadnych danych!
- **Rotacja Logów**: Docker ogranicza rozmiar logów każdego kontenera do maksymalnie 10MB na plik (maksymalnie 3 pliki
  historyczne), co zapobiega powolnemu zapychaniu się dysku twardego maszyny wirtualnej.
