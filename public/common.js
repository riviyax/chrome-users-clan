const hidePre = () => document.documentElement.classList.add("ready");
setTimeout(hidePre, 12000); // failsafe if the API hangs
const $ = (s) => document.querySelector(s);
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const fmt = (n) => (n ?? 0).toLocaleString();
const ROLE = {
  leader: "Leader",
  coLeader: "Co-leader",
  admin: "Elder",
  member: "Member",
};
const COLORS = ["--red", "--yellow", "--green", "--blue"];
const parseCoc = (t) =>
  t
    ? new Date(
        t.replace(
          /(\d{4})(\d\d)(\d\d)T(\d\d)(\d\d)(\d\d).*/,
          "$1-$2-$3T$4:$5:$6Z",
        ),
      )
    : null;
const deepLink = (tag) =>
  "https://link.clashofclans.com/en?action=OpenClanProfile&tag=" + tag;
const A = "https://assets.clashk.ing/";
const PETS = [
  "lassi",
  "l.a.s.s.i",
  "electro owl",
  "mighty yak",
  "unicorn",
  "frosty",
  "diggy",
  "poison lizard",
  "phoenix",
  "spirit fox",
  "angry jelly",
  "sneezy",
];
const slug = (s) =>
  String(s)
    .toLowerCase()
    .replace(/ /g, "_")
    .replace(/[.?]/g, "")
    .replace(/['’]/g, "");
const nm = (n) => n.replace(/[_-]/g, " ");

/* image with a fallback chain; the global error handler walks the chain, then shows a letter */
const im = (chain, alt, px, cls = "") =>
  `<img class="im ${cls}" src="${A + chain[0]}" data-f="${chain.slice(1).join("|")}" data-n="${esc(alt)}" alt="${esc(alt)}" width="${px}" height="${px}" loading="lazy">`;
const bld = (n, l, px, cls) => {
  l = Math.max(1, Math.min(+l || 1, 18));
  return im(
    Array.from(
      { length: l },
      (_, i) => `buildings/home-village/${n}/level_${l - i}.webp`,
    ),
    nm(n),
    px,
    cls,
  );
};
const unitImg = (name, px, first) => {
  const s = slug(name);
  const all = {
    troops: `troops/${s}/icon.webp`,
    heroes: `heroes/${s}/icon.webp`,
    pets: `pets/${s}/icon.webp`,
    spells: `spells/${s}.webp`,
    equipment: `equipment/${s}.webp`,
  };
  if (PETS.includes(name.toLowerCase())) first = "pets";
  return im(
    [
      all[first],
      ...Object.keys(all)
        .filter((k) => k !== first)
        .map((k) => all[k]),
    ],
    name,
    px,
  );
};
document.addEventListener(
  "error",
  (e) => {
    const i = e.target;
    if (i.tagName !== "IMG" || !i.classList.contains("im")) return;
    const f = i.dataset.f ? i.dataset.f.split("|") : [];
    if (f.length) {
      i.src = A + f.shift();
      i.dataset.f = f.join("|");
      return;
    }
    const sp = document.createElement("span");
    sp.className = "fb";
    sp.style.cssText = `width:${i.getAttribute("width")}px;height:${i.getAttribute("height")}px`;
    sp.textContent = (i.dataset.n || i.alt || "?")[0].toUpperCase();
    i.replaceWith(sp);
  },
  true,
);

/* live polling */
function live(cb, onErr) {
  const go = async () => {
    try {
      const r = await fetch("/api/clan"),
        d = await r.json();
      if (!r.ok) throw new Error(d.error || "Request failed");
      cb(d);
      $("#dot").className = "dot";
    } catch (e) {
      $("#dot").className = "dot err";
      onErr && onErr(e);
    } finally {
      hidePre();
    }
  };
  go();
  setInterval(go, (CFG.refreshSeconds || 30) * 1000);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) go();
  });
  return go;
}

/* roster rows (ext adds XP + balance for the stats page) */
function roster(S, sort, q, ext) {
  const ratio = (m) =>
    m.donationsReceived ? m.donations / m.donationsReceived : m.donations;
  const key = {
    rank: (a, b) => a.clanRank - b.clanRank,
    trophies: (a, b) => b.trophies - a.trophies,
    donations: (a, b) => b.donations - a.donations,
    received: (a, b) => b.donationsReceived - a.donationsReceived,
    ratio: (a, b) => ratio(b) - ratio(a),
    th: (a, b) => b.townHallLevel - a.townHallLevel || b.trophies - a.trophies,
    level: (a, b) => b.expLevel - a.expLevel,
  }[sort];
  const l = S.clan.memberList
    .filter((m) => m.name.toLowerCase().includes(q.toLowerCase()))
    .sort(key);
  return (
    l
      .map((m) => {
        const bal = m.donations - m.donationsReceived;
        return `<div class="r"><span class="rk">${m.clanRank}</span><button class="plink" data-tag="${esc(m.tag)}">${esc(m.name)}</button><span class="role ${esc(m.role)}">${ROLE[m.role] || esc(m.role)}</span><span class="th">${bld("town_hall", m.townHallLevel, 28)}${m.townHallLevel}</span><div class="st">${ext ? `<span class="n" data-l="XP level">${m.expLevel}</span>` : ""}<span class="n" data-l="Trophies">${fmt(m.trophies)}</span><span class="n" data-l="Donated">${fmt(m.donations)}</span><span class="n" data-l="Received">${fmt(m.donationsReceived)}</span>${ext ? `<span class="n ${bal >= 0 ? "pos" : "neg"}" data-l="Balance">${bal > 0 ? "+" : ""}${fmt(bal)}</span>` : ""}</div></div>`;
      })
      .join("") || '<div class="msg">No members match that search.</div>'
  );
}
const rosterHead = (ext) =>
  `<div class="r h"><span>#</span><span>Player</span><span>Role</span><span>TH</span>${ext ? "<span>XP</span>" : ""}<span>Trophies</span><span>Donated</span><span>Received</span>${ext ? "<span>Balance</span>" : ""}</div>`;

/* war card; writes the status line into `sub` if given */
function warHTML(w, sub) {
  if (!w)
    return '<div class="msg">War details unavailable. The war log may be private.</div>';
  if (w.state === "notInWar")
    return '<div class="msg">No war right now. Join and be ready for the next one.</div>';
  const label =
    {
      preparation: "Preparation day",
      inWar: "Battle day",
      warEnded: "War ended",
    }[w.state] || w.state;
  const end =
    w.state === "preparation" ? parseCoc(w.startTime) : parseCoc(w.endTime);
  const ms = end ? Math.max(0, end - Date.now()) : 0,
    h = Math.floor(ms / 36e5),
    m = Math.floor((ms % 36e5) / 6e4);
  const line = `${label}${w.state !== "warEnded" ? `, ${h}h ${m}m ${w.state === "preparation" ? "until battle" : "left"}` : ""}, ${w.teamSize}v${w.teamSize}`;
  if (sub) sub.textContent = line;
  const side = (x) =>
    `<div><h3>${esc(x.name)}</h3><div class="big">${x.stars ?? 0}★</div><small>${(x.destructionPercentage ?? 0).toFixed(1)}% destroyed</small><small>${x.attacks ?? 0} attacks used</small></div>`;
  return `${sub ? "" : `<p style="text-align:center;color:var(--sub);margin:0 0 14px">${line}</p>`}<div class="${sub ? "war" : 'war" style="border:0;box-shadow:none;padding:0;background:none'}">${side(w.clan)}<div class="vs">VS</div>${side(w.opponent)}</div>`;
}

/* player sheet */
document.body.insertAdjacentHTML(
  "beforeend",
  '<dialog id="dlg" aria-label="Player details"><div class="dh"><button id="close" aria-label="Close">×</button></div><div id="pc"></div></dialog>',
);
const unit = (n, l, max, k) =>
  `<div class="unit ${l >= max ? "max" : ""}">${unitImg(n, 44, k)}<div class="ub"><div class="uh"><span>${esc(n)}</span><b>${l}<i>/${max}</i></b></div><div class="pb"><u style="width:${Math.min(100, (l / max) * 100)}%"></u></div></div></div>`;
const group = (t, arr, note, k) =>
  arr?.length
    ? `<h3>${t}</h3>${note ? `<p style="color:var(--sub);font-size:13px;margin:-4px 0 10px">${note}</p>` : ""}<div class="units">${arr.map((u) => unit(u.name, u.level, u.maxLevel, k)).join("")}</div>`
    : "";
async function openPlayer(tag) {
  $("#pc").innerHTML =
    '<div class="msg" style="border:0">Loading player…</div>';
  if (!$("#dlg").open) $("#dlg").showModal();
  try {
    const r = await fetch("/api/player?tag=" + encodeURIComponent(tag)),
      d = await r.json();
    if (!r.ok) throw new Error(d.error || "Request failed");
    showPlayer(d);
  } catch (e) {
    $("#pc").innerHTML =
      `<div class="msg err" style="border:0">Couldn't load this player: ${esc(e.message)}</div>`;
  }
}
function showPlayer(p) {
  const home = (a) => (a || []).filter((u) => u.village === "home");
  const near = (p.achievements || [])
    .filter((a) => a.village === "home" && a.stars < 3 && a.target > 0)
    .sort((a, b) => b.value / b.target - a.value / a.target)
    .slice(0, 6);
  const league = p.leagueTier?.name || p.league?.name || "Unranked";
  const tiles = [
    ["Trophies", fmt(p.trophies), "Best " + fmt(p.bestTrophies)],
    ["War stars", fmt(p.warStars), ""],
    ["Attacks won", fmt(p.attackWins), "Defenses won " + fmt(p.defenseWins)],
    ["Donated", fmt(p.donations), "Received " + fmt(p.donationsReceived)],
    ["Capital gold given", fmt(p.clanCapitalContributions), ""],
    [
      "Builder Hall " + (p.builderHallLevel ?? "–"),
      fmt(p.builderBaseTrophies),
      "Builder trophies",
    ],
  ];
  $("#pc").innerHTML = `
    <section class="pcard"><div class="thb"><b>${bld("town_hall", p.townHallLevel, 62)}</b></div>
      <div><h2>${esc(p.name)}</h2><p>${esc(p.tag)}, level ${p.expLevel}, ${esc(league)}</p><p>${p.clan ? `${ROLE[p.role] || esc(p.role || "Member")} in ${esc(p.clan.name)}` : "Not in a clan"}</p></div></section>
    <section class="tiles">${tiles.map((t, i) => `<div class="tile" style="--c:var(${COLORS[i % 4]})"><span>${t[0]}</span><b>${t[1]}</b>${t[2] ? `<small>${t[2]}</small>` : ""}</div>`).join("")}</section>
    <section class="psec">
      ${group("Heroes", home(p.heroes), "Progress toward the max level for Town Hall " + p.townHallLevel, "heroes")}
      ${group("Hero equipment", p.heroEquipment, "", "equipment")}
      ${group("Troops, siege and pets", home(p.troops), "", "troops")}
      ${group("Spells", home(p.spells), "", "spells")}
      ${near.length ? `<h3>Closest achievements</h3><div class="units">${near.map((a) => `<div class="unit"><div class="ub"><div class="uh"><span>${esc(a.name)}</span><b style="color:var(--yellow)">${"★".repeat(a.stars)}${"☆".repeat(3 - a.stars)}</b></div><div class="pb"><u style="width:${Math.min(100, (a.value / a.target) * 100)}%"></u></div><small style="color:var(--sub)">${esc(a.info)}: ${fmt(a.value)} of ${fmt(a.target)}</small></div></div>`).join("")}</div>` : ""}
    </section>`;
}
$("#close").onclick = () => $("#dlg").close();
$("#dlg").addEventListener("click", (e) => {
  if (e.target === e.currentTarget) e.currentTarget.close();
});
document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-tag]");
  if (t) openPlayer(t.dataset.tag);
});
document.addEventListener("keydown", (e) => {
  if ((e.key === "Enter" || e.key === " ") && e.target.matches(".pod")) {
    e.preventDefault();
    openPlayer(e.target.dataset.tag);
  }
});

/* config.json drives all editable content */
let CFG = {};
const pick = (o, path) => path.split(".").reduce((a, k) => a?.[k], o);
async function loadConfig() {
  try {
    const r = await fetch("config.json", { cache: "no-cache" });
    if (!r.ok) throw new Error("HTTP " + r.status);
    CFG = await r.json();
    CFG.tag = String(CFG.clanTag || "")
      .replace(/^#/, "")
      .toUpperCase();
  } catch (e) {
    document.body.innerHTML = `<div class="msg err" style="margin:20px">Couldn't load config.json: ${esc(e.message)}. Check the file exists and is valid JSON.</div>`;
    throw e;
  }
  ["red", "yellow", "green", "blue"].forEach(
    (k) =>
      CFG.theme?.[k] &&
      document.documentElement.style.setProperty("--" + k, CFG.theme[k]),
  );
  if (!savedMode() && (CFG.mode === "dark" || CFG.mode === "light"))
    applyMode(CFG.mode);
  document.querySelectorAll("[data-t]").forEach((el) => {
    const v = pick(CFG, el.dataset.t);
    if (v != null) el.textContent = v;
  });
  document.querySelectorAll(".deeplink").forEach((a) => {
    a.href = deepLink(CFG.tag);
    a.target = "_blank";
    a.rel = "noopener";
  });
  return CFG;
}

/* day / night toggle (saved per visitor; config "mode" is the default) */
const MODE_KEY = "clan-mode";
const savedMode = () => {
  try {
    return localStorage.getItem(MODE_KEY);
  } catch {
    return null;
  }
};
function applyMode(m) {
  document.documentElement.dataset.theme = m;
  document
    .querySelector("meta[name=theme-color]")
    ?.setAttribute("content", m === "dark" ? "#12142b" : "#8fd0ff");
}
applyMode(document.documentElement.dataset.theme || "light");
$("#mode")?.addEventListener("click", () => {
  const m =
    document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  applyMode(m);
  try {
    localStorage.setItem(MODE_KEY, m);
  } catch {}
});
