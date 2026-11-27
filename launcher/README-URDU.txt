# God's Eye View — portable ZIP

Yeh folder **God's Eye View** ka poora source code hai, ek hi click se chalane wale
launcher ke saath. Internet sirf pehli baar install ke liye chahiye.

---

## Windows par kaise chalayein (aasan tareeqa)

1. ZIP file ko extract karein (right-click → **Extract All**). ZIP ke andar se
   seedha chalane ki koshish na karein — pehle extract karna zaroori hai.
2. **START-GODS-EYE-VIEW.bat** par double-click karein.
3. Pehli baar: dependencies install hongi (2–5 minute, yeh window khud khul jayegi).
4. Phir browser khud khul jayega — `http://127.0.0.1:4173/`
5. Band karne ke liye: black window mein **Ctrl + C** dabayein, ya window close kar dein.

Wohi `.bat` file dobara double-click karne se app phir chal jayega — dobara install
nahi hoga.

### Agar Node.js install nahi hai

`.bat` file khud bata degi aur https://nodejs.org/ khol degi.
**LTS (24.x ya us se naya)** version install karein, phir `.bat` dobara chalayein.
Yeh app Node 24.14 se purane version par nahi chalti — launcher saaf message de kar ruk jata hai.

### macOS / Linux

```bash
unzip gods-eye-view-portable.zip && cd gods-eye-view-portable
./start-gods-eye-view.sh
```

---

## API keys (optional, app bina in ke bhi khulti hai)

Keys ke baghair globe keyless Esri imagery par chalta hai, lekin aircraft/ships,
Google 3D tiles, Street View aur voice control band rehte hain.

Keys daalne ke 2 tareeqe:

- **App ke andar**: bottom-right **POWER UP** chip → Provider Settings → keys paste
  karein → app khud `.env` likh kar server restart karti hai. (Sab se aasan.)
- **Manual**: `.env.example` ko copy kar ke `.env` bana dein aur values bharein.

Keys sirf aap ke PC par rehti hain, kahin upload nahi hoti.

---

## Kya kya andar hai

| Cheez | Kaam |
| --- | --- |
| `START-GODS-EYE-VIEW.bat` | Windows: install + run + browser, sab ek click |
| `start-gods-eye-view.sh` | macOS / Linux ke liye wohi kaam |
| `launcher/gev-launch.mjs` | Asli launcher: Node check, install, free port, browser |
| `launcher/launch.log` | Pichli baar ka log (masla hone par yahan dekhein) |
| `src/`, `server/`, `build/`, `public/`, `config/` | App ka source code |
| `docs/` | Documentation |

`node_modules` ZIP mein shamil nahi hai — pehli run par launcher khud install karta hai.

## Aam masail

| Masla | Hal |
| --- | --- |
| "Node.js was not found" | https://nodejs.org/ se LTS install karein |
| "Node ... is too old" | Node 24.14+ install karein (purana version uninstall karein) |
| Install fail / proxy error | Company firewall ya VPN off kar ke dobara chalayein |
| Port busy | Launcher khud 4173 ke baad agla free port le leta hai |
| Window foran band ho jati hai | `launcher\launch.log` kholein — wajah wahan likhi hoti hai |
| Browser nahi khula | Manually `http://127.0.0.1:4173/` (ya console mein likha port) kholein |

## Zaroori baatein

- Server sirf `127.0.0.1` par chalta hai — aap ke local network par koi doosra
  shakhs ise access nahi kar sakta.
- Yeh unofficial/self-hosted copy hai. Asli project:
  https://github.com/bilawalsidhu/gods-eye-view — MIT license.
- `.bat` ke `pause` / `Ctrl+C` ke baghair server chalata rehta hai; band karne se
  pehle window close zaroor karein.
