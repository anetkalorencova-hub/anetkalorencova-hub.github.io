/*========================================================
  SCRIPT.JS – interaktivita webu
--------------------------------------------------------
  HERO VIDEO – plynulé přepínání klid <-> "pssst".

  Jak to funguje (varianta bez kousání):
    - OBĚ videa běží ve smyčce od začátku, pořád.
    - Vidět je vždy jen jedno (řeší CSS přes opacity).
    - Při najetí se jen PROLNE z klidového na "pssst".
    - Nic se nepřetáčí ani nerozjíždí → žádné kousnutí.
========================================================*/

document.addEventListener("DOMContentLoaded", function () {

    // dvě videa
    const idleVideo  = document.querySelector(".hero-video-idle");
    const shushVideo = document.querySelector(".hero-video-shush");

    // pokud videa nejsou, nic neděláme
    if (!idleVideo || !shushVideo) {
        return;
    }

    /*----------------------------------------------------
      OBĚ VIDEA ROZJEDEME A NECHÁME BĚŽET VE SMYČCE
      "pssst" video poběží pořád skryté pod klidovým –
      při najetí se jen odkryje (přes CSS), takže gesto
      naskočí okamžitě a plynule, bez rozjíždění.
    ----------------------------------------------------*/

    // obě videa poběží ve smyčce (i "pssst")
    shushVideo.loop = true;
    idleVideo.loop = true;

    // pokusíme se obě spustit (prohlížeč to u tichých videí dovolí)
    function spustit(video) {
        const p = video.play();
        if (p !== undefined) {
            p.catch(function () { /* tiše ignorujeme, když prohlížeč blokuje */ });
        }
    }

    spustit(idleVideo);
    spustit(shushVideo);

    // Přepínání VIDĚT/NEVIDĚT dělá už jen CSS (opacity + :hover).
    // JavaScript se o přepínání starat nemusí – proto tu žádné
    // mouseenter/mouseleave není. Tím mizí kousání.

});


/*========================================================
  VÍŘÍCÍ MLHA (canvas)
--------------------------------------------------------
  Kreslí tmavou vířící mlhu přes video.
  - nejhustší KOLEM krajů, uprostřed řídká (postava vidět)
  - několik "chuchvalců" kouře, co se pomalu převalují

  JAK DOLADIT (hodnoty najdeš níže označené // LADĚNÍ):
    - hustota mlhy    → POCET_CHUCHVALCU (víc = hustší)
    - jak tmavá       → MLHA_BARVA (0,0,0 = černá) a alfa v kresbě
    - jak velký průzor→ STRED_CISTY (větší = větší čistý střed)
    - rychlost víření → RYCHLOST (menší = pomalejší)
========================================================*/

document.addEventListener("DOMContentLoaded", function () {

    const canvas = document.querySelector(".hero-fog-canvas");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    // --- LADĚNÍ ---
    const POCET_CHUCHVALCU = 60;      // hustota mlhy (víc = hustší)
    const MLHA_BARVA = "0,0,0";       // barva mlhy (RGB) – černá
    const STRED_CISTY = 0.32;         // jak velký čistý průzor uprostřed (0–1)
    const RYCHLOST = 1.0;             // rychlost víření (menší = pomalejší)
    const MAX_HUSTOTA = 1.0;          // max neprůhlednost chuchvalce (0–1)
    // --------------

    let w = 0, h = 0;
    let chuchvalce = [];

    // přizpůsobení velikosti plátna rozměru videa
    function resize() {
        const r = canvas.getBoundingClientRect();
        w = canvas.width = Math.max(1, Math.floor(r.width));
        h = canvas.height = Math.max(1, Math.floor(r.height));
    }

    // jeden "chuchvalec" mlhy = kruh s náhodnou pozicí a pohybem
    function vytvorChuchvalec() {
        // úhel a vzdálenost od středu – chceme je HLAVNĚ u krajů
        const uhel = Math.random() * Math.PI * 2;
        // odmocnina posune body víc k okraji (hustší kraje)
        const vzdal = 0.35 + Math.sqrt(Math.random()) * 0.75;
        return {
            uhel: uhel,
            vzdal: vzdal,
            // velikost chuchvalce vzhledem k plátnu
            r: 0.18 + Math.random() * 0.22,
            // rychlost pomalého obíhání (výrazně rychlejší víření)
            drift: (Math.random() - 0.5) * 0.004 * RYCHLOST,
            // fáze pro jemné "dýchání" velikosti
            faze: Math.random() * Math.PI * 2,
            fazeRych: 0.006 + Math.random() * 0.008
        };
    }

    function init() {
        resize();
        chuchvalce = [];
        for (let i = 0; i < POCET_CHUCHVALCU; i++) {
            chuchvalce.push(vytvorChuchvalec());
        }
    }

    // jedno vykreslení snímku
    function kresli() {
        ctx.clearRect(0, 0, w, h);

        const cx = w / 2;
        const cy = h / 2;
        const maxR = Math.max(w, h) * 0.6;

        for (const ch of chuchvalce) {
            // pomalu obíhá kolem středu
            ch.uhel += ch.drift;
            ch.faze += ch.fazeRych;

            // pozice chuchvalce
            const x = cx + Math.cos(ch.uhel) * ch.vzdal * (w * 0.5);
            const y = cy + Math.sin(ch.uhel) * ch.vzdal * (h * 0.5);

            // velikost s jemným dýcháním
            const r = (ch.r + Math.sin(ch.faze) * 0.03) * maxR;

            // jak daleko je od středu (0 = střed, 1 = kraj)
            const distStred = Math.min(1, ch.vzdal);

            // uprostřed průhledná, u kraje hustá
            let alfa = 0;
            if (distStred > STRED_CISTY) {
                alfa = (distStred - STRED_CISTY) / (1 - STRED_CISTY);
                alfa = Math.min(1, alfa) * MAX_HUSTOTA;   // max hustota chuchvalce
            }

            if (alfa <= 0.01) continue;

            // měkký kruh mlhy (radiální přechod = rozostřené okraje)
            const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
            grad.addColorStop(0, "rgba(" + MLHA_BARVA + "," + alfa + ")");
            grad.addColorStop(1, "rgba(" + MLHA_BARVA + ",0)");

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }

        requestAnimationFrame(kresli);
    }

    init();
    kresli();

    // při změně velikosti okna přepočítáme
    window.addEventListener("resize", init);

});
