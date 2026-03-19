# Harmsun Pyöräily

Henkilökohtainen pyöräilykilometrien seurantasovellus. Kirjaa päivittäiset ajot, seuraa tilastoja ja aseta vuositavoitteita.

**Tuotanto:** https://harmsun-pyoraily.netlify.app

---

## Tekniikka

| Osa | Teknologia |
|-----|-----------|
| Frontend | React + Vite + Tailwind CSS |
| Backend | Node.js + Express |
| Tietokanta | PostgreSQL (Neon) |
| Auth | JWT, yksikäyttäjä |
| PWA | vite-plugin-pwa |
| Frontend deploy | Netlify |
| Backend deploy | Render |

---

## Ominaisuudet

- **Kalenterinäkymä** — kuukausinäkymä, klikkaa päivää lisätäksesi/muokataksesi ajoja
- **Pikanappulat** — Kauppa (1.1 km / Prisma) ja Uimahalli (3.4 km) yhdellä painalluksella
- **Tilastot** — tänään / viikko / kuukausi / vuosi / kaikkiaan, ajopäivät, keskiarvot
- **Heatmap** — GitHub-tyylinen vuosikalenteri, väri valkoisesta tummaan vihreään
- **Pylväskaavio** — kuukausittaiset kilometrit
- **Ennätykset** — pisin ajo, paras viikko/kuukausi/vuosi, suoritusputki
- **Vuositavoite** — aseta km-tavoite ja seuraa edistymistä
- **CSV-tuonti** — tuo vanhoja ajoja CSV-tiedostosta
- **Salasanan vaihto** — asetuksista

---

## Paikallinen kehitys

### Vaatimukset
- Node.js 22+
- Neon- tai muu PostgreSQL-tietokanta

### Backend

```bash
cd server
cp .env.example .env   # täytä muuttujat
npm install
npm run dev
```

`.env` muuttujat:

```
DATABASE_URL=postgresql://...
ADMIN_USERNAME=admin
ADMIN_PASSWORD=salasana
JWT_SECRET=salainen-avain
CLIENT_URL=http://localhost:5173
PORT=3001
```

### Frontend

```bash
cd client
cp .env.example .env.local   # täytä muuttujat
npm install
npm run dev
```

`.env.local` muuttujat:

```
VITE_API_URL=http://localhost:3001/api
```

---

## Deploy

### Backend (Render)

1. Luo uusi **Web Service** Renderissä, yhdistä GitHub-repo
2. Build command: `npm install`
3. Start command: `node index.js`
4. Root directory: `server`
5. Lisää ympäristömuuttujat Renderin dashboardissa:
   - `DATABASE_URL` — Neon connection string
   - `ADMIN_USERNAME`
   - `ADMIN_PASSWORD`
   - `JWT_SECRET`
   - `CLIENT_URL` — Netlify-osoite

### Frontend (Netlify)

```bash
cd client
npx netlify deploy --prod
```

Tai yhdistä repo Netlifyyn. Aseta ympäristömuuttuja:
- `VITE_API_URL` — Render-palvelun osoite + `/api`

---

## Tietokantarakenne

```sql
rides  (id, date, km, bike, route, created_at, updated_at)
goals  (year, goal_km)
config (key, value)   -- kirjautumistiedot
```

---

## CSV-tuonti

Tuettavat sarakkeet:

| Sarake | Vaihtoehtoiset nimet |
|--------|---------------------|
| Päivämäärä | `pvm`, `date`, `päivämäärä` |
| Kilometrit | `km`, `matka`, `distance` |
| Pyörä | `pyörä`, `bike` |
| Reitti | `reitti`, `route`, `kuvaus` |

Päivämääräformaatti: `YYYY-MM-DD`
