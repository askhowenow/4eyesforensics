(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* toast */
  var toast = $("#toast"), toastTimer;
  function flash(msg) {
    toast.textContent = msg;
    toast.classList.add("on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove("on"); }, 2600);
  }

  /* smooth jumps */
  $$("[data-jump]").forEach(function (b) {
    b.addEventListener("click", function () {
      closeAuth();
      var el = document.getElementById(b.getAttribute("data-jump"));
      if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.pageYOffset - 76, behavior: "smooth" });
    });
  });
  $$("[data-quote]").forEach(function (b) {
    b.addEventListener("click", function () { flash("Quote request logged, a scoped, fixed price comes back within one business day"); });
  });
  $$("[data-pack]").forEach(function (b) {
    b.addEventListener("click", function () { closePack(); flash("Sample pack on its way, five documents, encrypted if you asked"); });
  });
  var closeSec = $("#bookform") ? $("#bookform").closest(".close") : null, BOOK_KEY = "fe_book_request";
  function paintBook(at) {
    var d = new Date(at);
    $("#bookwhen").textContent = isNaN(d) ? "REQUEST LOGGED" : "LOGGED " +
      d.toLocaleDateString(undefined, { day: "numeric", month: "short" }).toUpperCase() + " · " +
      d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    if (closeSec) closeSec.classList.add("sent");
  }
  try {
    var savedBook = localStorage.getItem(BOOK_KEY);
    if (savedBook) paintBook(Number(savedBook));
  } catch (e) {}
  $$("[data-book]").forEach(function (b) {
    b.addEventListener("click", function () {
      var el = $("#bk-mail"), v = (el.value || "").trim(), warn = $("#bookwarn");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) {
        el.classList.add("bad"); warn.classList.add("bad");
        warn.textContent = "ENTER A WORK EMAIL SO WE CAN REPLY";
        el.focus();
        return;
      }
      el.classList.remove("bad"); warn.classList.remove("bad");
      var at = Date.now();
      try { localStorage.setItem(BOOK_KEY, String(at)); } catch (e) {}
      paintBook(at);
      flash("Review request received, an engineer replies within one business day");
    });
  });
  $$("[data-book-reset]").forEach(function (b) {
    b.addEventListener("click", function () {
      try { localStorage.removeItem(BOOK_KEY); } catch (e) {}
      if (closeSec) closeSec.classList.remove("sent");
    });
  });

  /* hero terminal */
  var LINES = [
    ["$ nmap -sV -Pn --top-ports 1000 -oA recon/bx-2291 203.0.113.0/24", "dim"],
    ["Nmap done: 256 IP addresses (38 hosts up) scanned in 91.42 seconds", ""],
    ["$ nuclei -l targets.txt -t http/exposures -severity critical,high", "dim"],
    ["[api-tenant-idor] [http] [critical] https://app.example.com/api/v2/exports?org=8841", "hit"],
    ["[dns-subdomain-takeover] [http] [high] https://staging.example.com (no auth)", "warn"],
    ["$ echo | openssl s_client -connect mail.example.com:443 2>/dev/null \\", "dim"],
    ["    | openssl x509 -noout -enddate", "dim"],
    ["notAfter=Sep  4 09:14:22 2026 GMT   # 13 days", "warn"],
    ["$ restic -r s3:s3.eu-west-2.amazonaws.com/4e-vault snapshots --latest 1", "dim"],
    ["a7f3c1d9  2026-08-22 04:06:11  files-01  /srv/data  4.214 TiB", ""],
    ["$ aws s3api get-object-lock-configuration --bucket 4e-vault", "dim"],
    ['{"ObjectLockEnabled":"Enabled","Rule":{"Mode":"COMPLIANCE","Years":7}}', "ok"],
    ["$ restic restore a7f3c1d9 --target /mnt/dr --verify", "dim"],
    ["restored 4.214 TiB in 34m08s   verify: 0 errors", "ok"]
  ];
  var STAGE = [
    [0, "RECON", "Mapping every host the internet can reach in the authorized range."],
    [2, "EXPLOIT", "Testing what those hosts actually expose, access control first."],
    [5, "HYGIENE", "Checking certificate expiry before it takes mail down on a Friday."],
    [8, "VAULT", "Confirming the newest immutable copy exists and its lock is real."],
    [12, "RESTORE", "Recovering it for real and verifying every block came back."]
  ];
  function stageFor(n) {
    var s = STAGE[0];
    for (var i = 0; i < STAGE.length; i++) if (n >= STAGE[i][0]) s = STAGE[i];
    return s;
  }
  var stageEl = $("#term-stage"), whatEl = $("#term-what");
  var termBox = $("#term"), li = 0, ch = 0, hold = 0;
  function esc(s) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function paint() {
    var html = "";
    for (var i = 0; i < li; i++) html += '<div class="termline ' + LINES[i][1] + '">' + esc(LINES[i][0]) + "</div>";
    if (li < LINES.length) html += '<div class="termline ' + LINES[li][1] + '">' + esc(LINES[li][0].slice(0, ch)) + "</div>";
    termBox.innerHTML = html;
    var st = stageFor(Math.min(li, LINES.length - 1));
    if (stageEl.textContent !== st[1]) { stageEl.textContent = st[1]; whatEl.textContent = st[2]; }
  }
  paint();
  setInterval(function () {
    if (li >= LINES.length) {
      if (hold++ > 60) { li = 0; ch = 0; hold = 0; paint(); }
      return;
    }
    if (ch < LINES[li][0].length) { ch += 2; }
    else if (hold < 6) { hold++; return; }
    else { li++; ch = 0; hold = 0; }
    paint();
  }, 28);

  /* pricing: environment size → recommended column */
  var NOTES = [
    "TYPICAL QUOTE RETURNED IN UNDER 24 H",
    "MOST AT THIS SIZE TAKE FORTIFY",
    "PRICED AS A PROGRAM, WITH CREDITS"
  ];
  var RECO = [0, 1, 2];
  function setSize(i) {
    var col = RECO[i];
    $("#sizenote").textContent = NOTES[i];
    $$("[data-col]").forEach(function (cell) {
      cell.classList.toggle("hi", cell.getAttribute("data-col") === String(col));
    });
    $$(".reco").forEach(function (tag, n) { tag.classList.toggle("show", n === col); });
  }
  $$('#sizeseg input').forEach(function (r) {
    r.addEventListener("change", function () { setSize(parseInt(r.value, 10)); });
  });
  setSize(1);

  /* testimonial carousel */
  var track = $("#revtrack"), slides = $$(".quotecard", track), dotsBox = $("#revdots"), idx = 0, auto;
  slides.forEach(function (_, i) {
    var d = document.createElement("button");
    d.type = "button";
    d.className = "dot";
    d.setAttribute("aria-label", "Testimonial " + (i + 1));
    d.addEventListener("click", function () { go(i, true); });
    dotsBox.appendChild(d);
  });
  function go(n, stop) {
    idx = (n + slides.length) % slides.length;
    track.style.transform = "translateX(calc(" + (-idx) + " * (100% + 24px)))";
    $$(".dot", dotsBox).forEach(function (d, i) { d.setAttribute("aria-current", i === idx ? "true" : "false"); });
    if (stop) { clearInterval(auto); auto = null; }
  }
  $("#revprev").addEventListener("click", function () { go(idx - 1, true); });
  $("#revnext").addEventListener("click", function () { go(idx + 1, true); });
  go(0);
  auto = setInterval(function () { if (!document.hidden) go(idx + 1); }, 7500);

  /* generated motion backdrop, drifting survey grid, sweep line, telemetry nodes */
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var scenes = $$(".steelcanvas canvas").map(function (c) {
    return { c: c, ctx: c.getContext("2d"), nodes: [], w: 0, h: 0 };
  });
  function sizeScene(s) {
    var r = s.c.parentNode.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    s.w = Math.max(1, Math.round(r.width)); s.h = Math.max(1, Math.round(r.height));
    s.c.width = s.w * dpr; s.c.height = s.h * dpr;
    s.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!s.nodes.length) {
      for (var i = 0; i < 26; i++) {
        s.nodes.push({ x: Math.random(), y: Math.random(), r: 0.6 + Math.random() * 1.6, p: Math.random() * 6.28, sp: 0.4 + Math.random() * 1.1 });
      }
    }
  }
  function drawScene(s, t) {
    var g = s.ctx, w = s.w, h = s.h;
    g.clearRect(0, 0, w, h);
    g.fillStyle = "#16232f"; g.fillRect(0, 0, w, h);
    var step = 64, off = (t * 9) % step;
    g.lineWidth = 1;
    g.strokeStyle = "rgba(148,188,227,0.13)";
    g.beginPath();
    for (var x = -step + off; x < w + step; x += step) { g.moveTo(x, 0); g.lineTo(x + 40, h); }
    for (var y = -step + off * 0.5; y < h + step; y += step) { g.moveTo(0, y); g.lineTo(w, y); }
    g.stroke();
    var sweep = ((t * 0.11) % 1.35) * h - h * 0.18;
    var grad = g.createLinearGradient(0, sweep - h * 0.22, 0, sweep);
    grad.addColorStop(0, "rgba(89,128,166,0)");
    grad.addColorStop(1, "rgba(148,188,227,0.20)");
    g.fillStyle = grad; g.fillRect(0, sweep - h * 0.22, w, h * 0.22);
    g.strokeStyle = "rgba(181,217,253,0.30)";
    g.beginPath(); g.moveTo(0, sweep); g.lineTo(w, sweep); g.stroke();
    s.nodes.forEach(function (n) {
      var a = 0.18 + 0.34 * (0.5 + 0.5 * Math.sin(t * n.sp + n.p));
      var nx = ((n.x + t * 0.004 * n.sp) % 1) * w, ny = n.y * h;
      g.fillStyle = "rgba(181,217,253," + a.toFixed(3) + ")";
      g.fillRect(nx - n.r, ny - n.r, n.r * 2, n.r * 2);
      g.strokeStyle = "rgba(181,217,253," + (a * 0.4).toFixed(3) + ")";
      g.strokeRect(nx - n.r * 3.5, ny - n.r * 3.5, n.r * 7, n.r * 7);
    });
  }
  var motionOn = false, rafId = 0;
  function frame(ms) {
    if (!motionOn) return;
    var t = ms / 1000;
    scenes.forEach(function (s) { if (s.w) drawScene(s, t); });
    rafId = requestAnimationFrame(frame);
  }
  function setMotion(on) {
    motionOn = on && !reduce;
    cancelAnimationFrame(rafId);
    if (on) { scenes.forEach(sizeScene); if (motionOn) rafId = requestAnimationFrame(frame); else scenes.forEach(function (s) { drawScene(s, 0); }); }
  }
  window.addEventListener("resize", function () { if (motionOn) scenes.forEach(sizeScene); });
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) { cancelAnimationFrame(rafId); }
    else if (motionOn) { rafId = requestAnimationFrame(frame); }
  });

  /* brand mark: hover plays the animation, click opens it large */
  var logoBack = $("#logoback"), logoStage = $(".logostage"), GIF = (document.getElementById("gifsrc") || {}).src || "/static/website/assets/4eyes-animation-loop.gif";

  // a GIF only restarts when a fresh element decodes it, so swap in a new <img> each time
  function playInto(host, cls) {
    var old = host.querySelector("[data-anim]");
    var img = document.createElement("img");
    img.setAttribute("data-anim", "");
    img.alt = "";
    if (cls) img.className = cls;
    img.src = GIF;
    if (old) old.replaceWith(img); else host.appendChild(img);
    return img;
  }
  function stopIn(host) {
    var old = host.querySelector("[data-anim]");
    if (old) old.removeAttribute("src");
  }

  function openLogo() {
    var img = playInto(logoStage, "");
    img.alt = "Two dashed routes tracing separate paths through one maze and meeting at a single verification point";
    logoBack.classList.add("open");
  }
  function closeLogo() { logoBack.classList.remove("open"); stopIn(logoStage); }
  $$("[data-logo-close]").forEach(function (b) { b.addEventListener("click", closeLogo); });
  logoBack.addEventListener("click", function (e) { if (e.target === logoBack) closeLogo(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeLogo(); });

  $$(".markplay").forEach(function (m) {
    var pop = null;
    function play() {
      stop();
      pop = document.createElement("span");
      pop.className = "markpop";
      var i = document.createElement("img");
      i.src = GIF; i.alt = "";
      var cap = document.createElement("b");
      cap.textContent = "Two pairs of eyes · one verdict";
      pop.appendChild(i); pop.appendChild(cap);
      m.appendChild(pop);
      // flip above the mark when there is no room below
      var r = m.getBoundingClientRect();
      if (r.bottom + 210 > window.innerHeight) pop.classList.add("above");
    }
    function stop() { if (pop) { pop.remove(); pop = null; } }
    m.addEventListener("mouseenter", play);
    m.addEventListener("mouseleave", stop);
    m.addEventListener("focus", play);
    m.addEventListener("blur", stop);
    m.addEventListener("click", function (ev) { ev.preventDefault(); stop(); openLogo(); });
  });

  /* sample pack modal */
  var packBack = $("#packback");
  function openPack(e) { if (e) e.preventDefault(); packBack.classList.add("open"); }
  function closePack() { packBack.classList.remove("open"); }
  $$("[data-pack-open]").forEach(function (b) { b.addEventListener("click", openPack); });
  $$("[data-pack-close]").forEach(function (b) { b.addEventListener("click", closePack); });
  packBack.addEventListener("click", function (e) { if (e.target === packBack) closePack(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closePack(); });

  /* evidence tabs */
  var evPanels = $$(".evpanel");
  $$('.evtabs input').forEach(function (r) {
    r.addEventListener("change", function () {
      var n = parseInt(r.value, 10);
      evPanels.forEach(function (p, i) { p.classList.toggle("on", i === n); });
    });
  });

  /* copy the PGP fingerprint */
  var fpBtn = $("#copyfp");
  if (fpBtn) {
    fpBtn.addEventListener("click", function () {
      var fp = $("#pgpfp").textContent.trim();
      if (navigator.clipboard) {
        navigator.clipboard.writeText(fp).then(function () { flash("Fingerprint copied. Verify it out of band before you trust it."); },
          function () { flash("Copy blocked by the browser, select the fingerprint by hand"); });
      } else { flash("Copy unavailable here, select the fingerprint by hand"); }
    });
  }

  /* perimeter trace on framed cells */
  $$(".svc, .tile").forEach(function (el) {
    var t = document.createElement("span");
    t.className = "trace";
    t.setAttribute("aria-hidden", "true");
    t.innerHTML = "<i></i><i></i><i></i><i></i>";
    el.appendChild(t);
  });

  /* ambient motif: strands of ones and zeros drifting across the page */
  var bitsC = $("#bits"), motifSel = $("#motifmode");
  var motif = "bits", bitsRaf = 0, bits = [], bctx = bitsC.getContext("2d");
  var CH = 12, ROWH = 40;
  function sizeBits() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    bitsC.width = window.innerWidth * dpr; bitsC.height = window.innerHeight * dpr;
    bctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    bits = [];
    var rows = Math.max(6, Math.floor(window.innerHeight / ROWH));
    for (var r = 0; r < rows; r++) {
      if (Math.random() > 0.34) continue;
      var len = 10 + Math.floor(Math.random() * 16);
      bits.push({
        y: r * ROWH + 18,
        x: -Math.random() * window.innerWidth * 1.4,
        sp: 14 + Math.random() * 26,
        g: Array.from({ length: len }, function () { return Math.random() > 0.5 ? "1" : "0"; })
      });
    }
  }
  var lastT = 0;
  function drawBits(ms) {
    if (motif !== "bits") return;
    var dt = lastT ? Math.min((ms - lastT) / 1000, 0.05) : 0; lastT = ms;
    var W = window.innerWidth, H = window.innerHeight;
    bctx.clearRect(0, 0, W, H);
    bctx.font = "11px ui-monospace, Menlo, monospace";
    bctx.textBaseline = "middle";
    for (var i = 0; i < bits.length; i++) {
      var b = bits[i];
      b.x += b.sp * dt;
      var span = b.g.length * CH;
      if (b.x > W + span) { b.x = -span - Math.random() * 400; }
      var probeX = Math.min(Math.max(b.x + span * 0.5, 2), W - 2);
      var over = document.elementFromPoint(probeX, b.y);
      var dark = !!(over && over.closest && over.closest(".steel"));
      for (var k = 0; k < b.g.length; k++) {
        var x = b.x + k * CH;
        if (x < -CH || x > W) continue;
        var head = k / b.g.length;
        var a = (dark ? 0.20 : 0.075) * Math.pow(head, 2.1) + (dark ? 0.015 : 0.006);
        bctx.fillStyle = dark ? "rgba(181,217,253," + a.toFixed(3) + ")" : "rgba(29,31,32," + a.toFixed(3) + ")";
        bctx.fillText(b.g[k], x, b.y);
      }
      if (Math.random() > 0.988) b.g[Math.floor(Math.random() * b.g.length)] = Math.random() > 0.5 ? "1" : "0";
    }
    bitsRaf = requestAnimationFrame(drawBits);
  }
  function setMotif(m, persist) {
    motif = m;
    bitsC.classList.toggle("on", m === "bits");
    cancelAnimationFrame(bitsRaf); lastT = 0;
    if (m === "bits" && !reduce) { sizeBits(); bitsRaf = requestAnimationFrame(drawBits); }
    if (persist) { try { localStorage.setItem("bastion-motif", m); } catch (e) {} }
  }
  var sm = null;
  try { sm = localStorage.getItem("bastion-motif"); } catch (e) {}
  motifSel.value = (sm === "off") ? "off" : "bits";
  setMotif(motifSel.value, false);
  motifSel.addEventListener("change", function () { setMotif(motifSel.value, true); });
  window.addEventListener("resize", function () { if (motif === "bits") sizeBits(); });
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) cancelAnimationFrame(bitsRaf);
    else if (motif === "bits" && !reduce) { lastT = 0; bitsRaf = requestAnimationFrame(drawBits); }
  });

  /* figures settle: digits scramble once as each stat enters view */
  if (!reduce && "IntersectionObserver" in window) {
    var GLYPH = "0123456789";
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting || en.target.dataset.settled) return;
        en.target.dataset.settled = "1";
        var el = en.target, final = el.textContent, steps = 7, i = 0;
        var t = setInterval(function () {
          i++;
          el.textContent = i >= steps ? final : final.replace(/[0-9]/g, function () {
            return GLYPH[Math.floor(Math.random() * 10)];
          });
          if (i >= steps) clearInterval(t);
        }, 45);
      });
    }, { threshold: 0.6 });
    $$(".statnum, .hero .meta b, .storystat b, .bospec div b").forEach(function (el) { io.observe(el); });
  }

  /* service breakouts */
  var SVC = {
    pentest: { theme: "#7d3b41", tag: "Service 01 · security", title: "Penetration testing", spec: [["5–15 days","Typical engagement"],["Free","Retest until closed"],["AI + human","How we test"]],
      lede: "Scoped to what your business actually needs tested, then run as a pair: AI does the breadth (enumerating the environment, reading whole codebases, generating and triaging candidate attack paths at a speed no team can match) and a human operator does the judgement, chaining what chains and proving impact. Neither half works alone.",
      scope: ["Scoping driven by your risk, not a fixed checklist","AI-assisted enumeration and code-path analysis at breadth","Human exploitation of web, API and external hosts","Authenticated multi-tenant access-control testing","Chaining: low findings combined into a real breach path"],
      deliver: ["Findings with reproduction steps and business impact","A fix written for the engineer, not the auditor","Failing regression tests you can drop into CI","Executive brief for the board, one page"],
      runs: ["Scope, targets and rules of engagement signed first","Every AI-surfaced candidate verified by hand before it is reported","Criticals phoned through the hour we confirm them","Debrief call with the operators who did the work","Retest booked before the report lands"] },
    red: { theme: "#5f3a63", tag: "Service 03 · security", title: "Red team & phishing", spec: [["2–8 weeks","Operation length"],["Objective-led","Not a checklist"],["Purple","Debrief format"]],
      lede: "Objective-led adversary emulation measured against your detection team rather than a control list. Initial access, persistence, lateral movement, exfil, then we sit down with your defenders and replay every step.",
      scope: ["Adversary emulation against an agreed objective","Phishing, vishing and physical pretext under rules","Persistence and lateral movement to the crown jewels","Detection-evasion tracked against what you actually saw"],
      deliver: ["Attack narrative with timestamps against your alerts","Detection gaps ranked by what closes the most paths","Awareness pack built from your own campaign results","Second run to measure the delta, not just assert it"],
      runs: ["Rules of engagement and a named trusted agent","Stop conditions written before we start","Purple debrief with defenders in the room","Repeat run quarterly or annually as agreed"] },
    backup: { theme: "#1f6b6b", tag: "Service 04 · backup", title: "Continuous backup", spec: [["15 min","Recovery point objective"],["Unlimited","Version history"],["Afternoon","Typical rollout"]],
      lede: "Veeam is what we build on by default, because it is what we run best and what our restore numbers are measured on. If you have already invested in Rubrik, Cohesity, Commvault or Acronis, we will run that instead rather than sell you a migration you do not need. Either way we design it, operate it and prove it, so you get enterprise backup without hiring anyone to run it. Block-level change capture every fifteen minutes across servers, laptops, SaaS and databases. No backup window, no overnight job that quietly failed on Thursday and nobody noticed until March.",
      scope: ["Veeam agents on Windows, macOS and Linux, or your incumbent platform","Microsoft 365, Google Workspace and Salesforce","Postgres, MySQL, SQL Server with log shipping","VMware, Hyper-V, Proxmox and cloud volumes, agentless"],
      deliver: ["A copy of every protected workload, current to 15 minutes","Self-service restore console for your own team","Daily coverage report naming anything not protected","Alert when a device stops reporting, not a silent gap"],
      runs: ["Agents pushed from your MDM in an afternoon","First full copy seeds over the wire or on an appliance","Incrementals every quarter hour, bandwidth capped","Coverage reconciled against your asset register monthly"] },
    vault: { theme: "#3f6b4a", tag: "Service 05 · backup", title: "Immutable ransomware vault", spec: [["7 years","Object-lock retention"],["2 regions","Synchronous copies"],["COMPLIANCE","Lock mode"]],
      lede: "A hardened repository plus object-lock cloud storage in a tenancy nobody can reach into: not us, not your administrators, not an attacker holding your credentials. Retention runs out or it does not; there is no early delete.",
      scope: ["Write-once object lock in COMPLIANCE mode, not governance","Keys held in a separate custody domain from the data","Two geographic regions kept in sync","Append-only audit line for every read and every access"],
      deliver: ["A copy that survives full domain compromise","Proof of seal state you can hand to an auditor","Access log naming every human who touched it","Second-approver control before any deletion request"],
      runs: ["Retention and residency agreed in the contract","Seal state verified daily and reported","No 4Eyes operator can shorten retention","Exit: your data exported in an open format, no fee"] },
    harden: { theme: "#4a6b3f", tag: "Service 07 · security", title: "Linux hardening & custom scripting", spec: [["CIS / STIG","Benchmarks applied"],["Before / after","Scored both ways"],["Yours to keep","Automation handed over"]],
      lede: "We write the tooling as well as the policy. Most Linux fleets are one default away from a bad afternoon: password SSH left on, sudo without logging, a kernel parameter nobody set, auditd installed and never configured. We harden them to CIS benchmark or DISA STIG, prove the score moved, and hand you the automation so the next host you build comes up hardened instead of drifting back.",
      scope: ["CIS benchmark or STIG assessment of the current fleet","Kernel and sysctl, SSH, PAM, sudo and file integrity","SELinux or AppArmor moved from permissive to enforcing","Patch policy, package pinning and unattended upgrades","Container and Kubernetes node baselines where you run them","Custom scripting: onboarding, log shipping, backup pre and post jobs, evidence collection"],
      deliver: ["A scored benchmark report, before and after, per host class","Bash, Python and Ansible written for your fleet, yours to keep","Documented exceptions with the business reason recorded","Scheduled drift checks that mail or ticket when a host changes"],
      runs: ["Assess first, on a copy, so nothing in production moves blind","Changes staged, reviewed by a second engineer, then applied","Rollback written before each change, not after","Re-benchmarked quarterly, or on every image rebuild"] },
    dfir: { theme: "#3f4a7a", tag: "Service 02 · forensics", title: "Digital forensics & incident response", spec: [["< 4 min","Incident line answer"],["Two examiners","On every finding"],["Court-ready","Report standard"]],
      lede: "The one service you hope never to buy. We contain first, preserve second and explain third: an account of what was accessed, what left, and what did not, built from evidence handled so that an insurer, a regulator or opposing counsel cannot pick it apart.",
      scope: ["Containment and eradication alongside your team","Forensic imaging with hashes and chain of custody","Memory, disk, cloud audit log and identity timeline analysis","Scoping what was exfiltrated versus merely accessed"],
      deliver: ["A defensible timeline of the intrusion, hour by hour","Indicators of compromise handed to whoever runs your monitoring","Findings written for insurers, regulators and counsel","Notification support for state breach laws, HIPAA and the Jamaica DPA"],
      runs: ["Emergency engagement inside four hours, retainer or not","Every finding reviewed by a second examiner before it ships","Evidence retained under your instruction, released on request","Post-incident hardening plan handed to the engineers who own it"] },
    training: { theme: "#6b5a2f", tag: "Service 08 · people", title: "Security awareness training", spec: [["Quarterly","Or on every hire"],["Your own data","Not stock scenarios"],["Click rate","Measured before and after"]],
      lede: "Most awareness training teaches people to fear a generic email nobody sent them. Ours is written from the pretexts that got through your door and the findings our testers walked in with, so staff recognise the specific trick aimed at their role, and you get a number that moves rather than a completion certificate.",
      scope: ["Baseline phishing simulation before any teaching","Sessions built from your real findings and campaigns","Role-specific tracks for finance, IT, reception and leadership","Tabletop exercise for the people who make the call in an incident"],
      deliver: ["Click and report rates by department, before and after","Short sessions staff will actually finish, live or recorded","Reporting habits that feed our examiners a usable alert","Board summary showing where human risk actually sits"],
      runs: ["Baseline first, so the improvement is measurable","New starters trained in their first two weeks, automatically","Repeat simulation each quarter with fresh pretexts","No naming and shaming: reporting is rewarded, clicking is taught"] },
    dr: { theme: "#416180", tag: "Service 06 · backup", title: "Disaster recovery & compliance", spec: [["From 20 min","Recovery time objective"],["Monthly","Verified restore test"],["Quarterly","Evidence pack"]],
      lede: "Runbooks that boot your systems in dependency order into standby compute, rehearsed monthly and timed. The plan is a fact with a number on it, not a document somebody wrote in 2021.",
      scope: ["Dependency mapping and boot-order runbooks","Standby compute reserved for orchestrated failover","Monthly restore test on real workloads, timed","Evidence generated from what actually happened"],
      deliver: ["A contractual RTO you can defend to a regulator","Timed restore results, pass or fail, every month","Evidence packs mapped to SOC 2, ISO 27001, HIPAA and PCI DSS","Board-ready summary of exposure and recovery posture"],
      runs: ["One button, ordered start-up, live clock on the recovery","Failed test is our incident to close, not yours to find","Drills your own team can run without us present","Named incident commander on the top tier"] }
  };
  var boBox = $("#breakout"), boCards = $$(".svc"), boOpen = null, boGrid = $(".svcgrid");
  function fillList(id, items) {
    var ul = $(id); ul.innerHTML = "";
    items.forEach(function (t) { var li = document.createElement("li"); li.textContent = t; ul.appendChild(li); });
  }
  function showBreakout(key, card) {
    var d = SVC[key];
    if (!d) return;
    boCards.forEach(function (c) { c.setAttribute("aria-expanded", c === card ? "true" : "false"); });
    $("#bo-tag").textContent = d.tag;
    $("#bo-title").textContent = d.title;
    $("#bo-lede").textContent = d.lede;
    fillList("#bo-scope", d.scope);
    fillList("#bo-deliver", d.deliver);
    fillList("#bo-runs", d.runs);
    var sp = $("#bo-spec"); sp.innerHTML = "";
    d.spec.forEach(function (pair) {
      var w = document.createElement("div");
      w.innerHTML = "<b></b><span></span>";
      w.querySelector("b").textContent = pair[0];
      w.querySelector("span").textContent = pair[1];
      sp.appendChild(w);
    });
    boBox.style.setProperty("--svc", d.theme || "var(--color-accent)");
    // drop the panel into the grid directly beneath the card that was clicked,
    // so the remaining services move aside instead of sitting above it
    // measure the natural grid with the panel out of flow, so the row is the real row
    boBox.classList.remove("on");
    var top = card.offsetTop;
    var row = boCards.filter(function (c) { return Math.abs(c.offsetTop - top) < 8; });
    var last = row[row.length - 1];
    // the panel goes under the whole row: the cards beside it stay put and fade
    if (last.nextSibling !== boBox) boGrid.insertBefore(boBox, last.nextSibling);
    boCards.forEach(function (c) { c.classList.toggle("peer", c !== card && row.indexOf(c) > -1); });
    boBox.classList.add("on");
    boGrid.classList.add("focus");
    boOpen = key;
    requestAnimationFrame(function () {
      var r = boBox.getBoundingClientRect();
      var pad = 96;
      if (r.bottom > innerHeight) {
        window.scrollBy({ top: Math.min(r.top - pad, r.bottom - innerHeight + 24), behavior: "smooth" });
      } else if (r.top < pad) {
        window.scrollBy({ top: r.top - pad, behavior: "smooth" });
      }
    });
  }
  function hideBreakout() {
    boBox.classList.remove("on");
    boGrid.classList.remove("focus");
    boCards.forEach(function (c) { c.classList.remove("peer"); });
    boCards.forEach(function (c) { c.setAttribute("aria-expanded", "false"); });
    boOpen = null;
  }
  boCards.forEach(function (card) {
    var key = card.getAttribute("data-svc");
    function toggle() {
      if (boOpen === key) { hideBreakout(); card.focus(); }
      else { showBreakout(key, card); }
    }
    card.addEventListener("click", toggle);
    card.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
    });
  });
  $("#bo-close").addEventListener("click", function () { hideBreakout(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && boOpen) hideBreakout(); });

  $$(".chip").forEach(function (c) {
    c.addEventListener("click", function () {
      var on = c.getAttribute("aria-pressed") === "true";
      c.setAttribute("aria-pressed", on ? "false" : "true");
    });
  });
  var scopeWrap = $(".scopewrap"), SCOPE_KEY = "fe_scope_request";
  function paintScope(rec) {
    $("#scoperef").textContent = rec.ref;
    var d = new Date(rec.at);
    $("#scopewhen").textContent = isNaN(d) ? "just now" :
      d.toLocaleDateString(undefined, { day: "numeric", month: "short" }) + " · " +
      d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    scopeWrap.classList.add("sent");
    openScope(false);
  }
  try {
    var saved = localStorage.getItem(SCOPE_KEY);
    if (saved) paintScope(JSON.parse(saved));
  } catch (e) {}
  function openScope(focus) {
    $("#scopegate").classList.add("gone");
    $("#scopewrap").classList.add("open");
    if (focus) { var f = $("#sc-co"); if (f) f.focus(); }
  }
  $$("[data-scope-open]").forEach(function (b) {
    b.addEventListener("click", function () { openScope(true); });
  });
  $$("[data-scope-close]").forEach(function (b) {
    b.addEventListener("click", function () { $("#scopewrap").classList.remove("open"); $("#scopegate").classList.remove("gone"); });
  });
  function validScope() {
    var need = [["#sc-co", "text"], ["#sc-name", "text"], ["#sc-mail", "email"], ["#sc-tel", "text"]];
    var bad = [];
    need.forEach(function (pair) {
      var el = $(pair[0]), v = (el.value || "").trim();
      var ok = pair[1] === "email" ? /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) : v.length > 1;
      el.classList.toggle("bad", !ok);
      if (el.closest(".field")) el.closest(".field").classList.toggle("bad", !ok);
      if (!ok) bad.push(el);
    });
    var svcPicked = $$(".fgrid .chiprow")[0].querySelectorAll('[aria-pressed="true"]').length > 0;
    var warn = $("#scopewarn");
    if (bad.length || !svcPicked) {
      warn.classList.add("bad");
      warn.textContent = bad.length
        ? "COMPANY, NAME, WORK EMAIL AND A DIRECT PHONE ARE NEEDED"
        : "PICK AT LEAST ONE SERVICE, OR NOT SURE YET";
      if (bad.length) bad[0].focus();
      return false;
    }
    warn.classList.remove("bad");
    warn.textContent = "REPLY INSIDE THE HOUR · NO SALES SEQUENCE";
    return true;
  }
  $$("[data-scope]").forEach(function (b) {
    b.addEventListener("click", function () {
      if (!validScope()) return;
      var rec = { ref: "4EF-SCOPE-" + String(Math.floor(1000 + Math.random() * 8999)), at: Date.now() };
      try { localStorage.setItem(SCOPE_KEY, JSON.stringify(rec)); } catch (e) {}
      paintScope(rec);
      flash("Request received. We will call the number you gave to open the encrypted session");
    });
  });
  $$("[data-scope-reset]").forEach(function (b) {
    b.addEventListener("click", function () {
      try { localStorage.setItem(SCOPE_KEY, ""); localStorage.removeItem(SCOPE_KEY); } catch (e) {}
      scopeWrap.classList.remove("sent");
      $("#scopewrap").classList.remove("open");
      $("#scopegate").classList.remove("gone");
    });
  });

  /* client portal modal */
  var back = $("#authback");
  var LABELS = {
    creds: ["Step 1 of 2 · credentials", "Sign in"],
    "2fa": ["Step 2 of 2 · second factor", "Verify it's you"],
    signup: ["Activation · new account", "Activate your access"],
    pending: ["Activation pending", "One call away"],
    done: ["Session open", "You're in"]
  };
  function step(name) {
    $$(".authstep", back).forEach(function (s) { s.classList.toggle("on", s.getAttribute("data-step") === name); });
    $("#authlabel").textContent = LABELS[name][0];
    $("#authtitle").textContent = LABELS[name][1];
  }
  function openAuth() { back.classList.add("open"); step("creds"); }
  function closeAuth() { back.classList.remove("open"); }
  $$("[data-auth-open]").forEach(function (b) { b.addEventListener("click", openAuth); });
  $$("[data-auth-close]").forEach(function (b) { b.addEventListener("click", closeAuth); });
  $$("[data-auth-next]").forEach(function (b) {
    b.addEventListener("click", function (e) { e.preventDefault(); step(b.getAttribute("data-auth-next")); });
  });
  $$("[data-auth-signup]").forEach(function (b) {
    b.addEventListener("click", function () {
      var need = [["#su-ref", "text"], ["#su-mail", "email"], ["#su-name", "text"], ["#su-tel", "text"]];
      var bad = [];
      need.forEach(function (p) {
        var el = $(p[0]), v = (el.value || "").trim();
        var ok = p[1] === "email" ? /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) : v.length > 1;
        el.classList.toggle("bad", !ok);
        if (!ok) bad.push(el);
      });
      var warn = $("#suwarn"), terms = $("#su-terms").checked;
      if (bad.length || !terms) {
        warn.classList.add("bad");
        warn.textContent = bad.length ? "REFERENCE, EMAIL, NAME AND PHONE ARE ALL NEEDED" : "CONFIRM YOU ARE AUTHORIZED TO RECEIVE FINDINGS";
        if (bad.length) bad[0].focus();
        return;
      }
      warn.classList.remove("bad");
      warn.textContent = "WE CALL TO VERIFY BEFORE ANY ACCOUNT OPENS";
      step("pending");
      flash("Activation requested. We verify against the engagement record and call you");
    });
  });
  back.addEventListener("click", function (e) { if (e.target === back) closeAuth(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeAuth(); });

  var clock = 27, clockEl = $("#authclock");
  setInterval(function () { clock = clock > 0 ? clock - 1 : 30; clockEl.textContent = String(clock).padStart(2, "0"); }, 1000);

  /* 2FA code boxes: auto-advance */
  var boxes = $$(".codegrid input");
  boxes.forEach(function (b, i) {
    b.addEventListener("input", function () {
      if (b.value && i < boxes.length - 1) boxes[i + 1].focus();
    });
    b.addEventListener("keydown", function (e) {
      if (e.key === "Backspace" && !b.value && i > 0) boxes[i - 1].focus();
    });
  });
})();
