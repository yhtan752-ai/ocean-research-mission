/* ==========================================================================
   ocean-fx.js  —  Shared immersive atmosphere engine
   Injects a fixed, full-screen underwater atmosphere (god rays, marine snow,
   rising bubbles, caustic shimmer, depth vignette) on every page, and brings
   the 3D Ocean Protector to life (entrance, idle bob, camera sway, talk-pulse).
   Purely additive — it never touches the IDs/classes script.js depends on.
   ========================================================================== */
(function () {
  "use strict";

  /* ----------------------------------------------------------------------
     1. ATMOSPHERE LAYER  (fixed, behind the UI, above the wildlife)
     ---------------------------------------------------------------------- */
  function buildAtmosphere() {
    if (document.querySelector(".fx-atmosphere")) return;

    const atmo = document.createElement("div");
    atmo.className = "fx-atmosphere";

    // Volumetric god rays streaming down from the surface
    const rays = document.createElement("div");
    rays.className = "fx-godrays";
    for (let i = 0; i < 7; i++) {
      const ray = document.createElement("span");
      ray.className = "ray";
      ray.style.left = (4 + i * 14 + (Math.random() * 6 - 3)) + "%";
      ray.style.animationDelay = (-Math.random() * 12).toFixed(2) + "s";
      ray.style.animationDuration = (11 + Math.random() * 8).toFixed(2) + "s";
      ray.style.opacity = (0.05 + Math.random() * 0.09).toFixed(3);
      rays.appendChild(ray);
    }
    atmo.appendChild(rays);

    // Shifting caustic light shimmer
    const caustics = document.createElement("div");
    caustics.className = "fx-caustics";
    atmo.appendChild(caustics);

    // Marine snow — slow drifting particulate for a sense of depth & scale
    const snow = document.createElement("div");
    snow.className = "fx-particles";
    for (let i = 0; i < 70; i++) {
      const p = document.createElement("span");
      p.className = "particle";
      const size = (1 + Math.random() * 3).toFixed(2);
      p.style.width = size + "px";
      p.style.height = size + "px";
      p.style.left = (Math.random() * 100).toFixed(2) + "%";
      p.style.top = (Math.random() * 100).toFixed(2) + "%";
      p.style.opacity = (0.1 + Math.random() * 0.5).toFixed(2);
      p.style.animationDuration = (14 + Math.random() * 26).toFixed(2) + "s";
      p.style.animationDelay = (-Math.random() * 30).toFixed(2) + "s";
      snow.appendChild(p);
    }
    atmo.appendChild(snow);

    // Rising bubbles
    const bubbles = document.createElement("div");
    bubbles.className = "fx-bubbles";
    for (let i = 0; i < 22; i++) {
      const b = document.createElement("span");
      b.className = "bubble";
      const size = (4 + Math.random() * 16).toFixed(2);
      b.style.width = size + "px";
      b.style.height = size + "px";
      b.style.left = (Math.random() * 100).toFixed(2) + "%";
      b.style.animationDuration = (8 + Math.random() * 12).toFixed(2) + "s";
      b.style.animationDelay = (-Math.random() * 18).toFixed(2) + "s";
      bubbles.appendChild(b);
    }
    atmo.appendChild(bubbles);

    // Depth vignette to frame the exhibit like a submersible viewport
    const vignette = document.createElement("div");
    vignette.className = "fx-vignette";
    atmo.appendChild(vignette);

    document.body.appendChild(atmo);
  }

  /* ----------------------------------------------------------------------
     2. 3D PROTECTOR — bring the model-viewer to life
        Only one Mixamo clip is baked in, so we layer on a slow cinematic
        camera sway, a floating entrance, and a subtle glow pulse whenever
        the narrator is speaking, so he never feels like a static prop.
     ---------------------------------------------------------------------- */
  function animateProtector() {
    const model = document.querySelector("model-viewer.protector-model") || document.querySelector("model-viewer");
    if (!model || !model.classList.contains("protector-model")) return;

    try {
      model.setAttribute("autoplay", "");
      if (!model.getAttribute("environment-image")) {
        model.setAttribute("environment-image", "neutral");
      }
    } catch (e) {}

    const basePhi = 90;   // level eye-line
    const swingT = 9;     // horizontal swing amplitude (deg)
    const swingP = 2.5;   // vertical swing amplitude (deg)

    // Frame him explicitly from his real geometry, then sway around that.
    var framed = false;
    function frameAndSway() {
      if (framed) return;
      framed = true;
      var radiusStr = "auto";
      try {
        var fit = model.getCameraOrbit().radius;      
        var c = model.getBoundingBoxCenter();         
        // Aim at chest height rather than the bbox centre so the head has room
        var size = model.getDimensions();
        var targetY = c.y + size.y * 0.20;            
        model.cameraTarget = c.x + "m " + targetY + "m " + c.z + "m";
        // Smaller factor = camera closer = BIGGER protector.
        // index.html (the intro) gets a tighter, bigger framing than the other pages.
        var isIntro = !!document.getElementById("mission-screen");
        var factor = isIntro ? 1.0 : 1.2;
        radiusStr = (fit * factor).toFixed(3) + "m";
      } catch (e) {
        radiusStr = "auto";
      }

      var t = Math.random() * 1000;
      function loop() {
        t += 0.006;
        var theta = Math.sin(t) * swingT;
        var phi = basePhi + Math.cos(t * 0.7) * swingP;
        model.setAttribute("camera-orbit", theta.toFixed(2) + "deg " + phi.toFixed(2) + "deg " + radiusStr);
        requestAnimationFrame(loop);
      }
      loop();
    }

    // On index.html only: wave twice, then switch into the looping Talking clip.
    var isIntroPage = !!document.getElementById("mission-screen");
    var WAVES = 2;
    var switched = false;
    function limitWave() {
      if (switched || !isIntroPage) return;
      // Make sure he starts on the Wave clip
      try { if (model.availableAnimations && model.availableAnimations.indexOf("Wave") !== -1) model.animationName = "Wave"; } catch (e) {}
      var dur = model.duration;               // length of the waving clip (s)
      if (!dur || dur <= 0) { setTimeout(limitWave, 300); return; }
      switched = true;
      setTimeout(function () {
        try {
          model.animationName = "Talking4";    // intro conversation clip (loops until Idle)
          model.currentTime = 0;
          if (typeof model.play === "function") model.play();
        } catch (e) {}
      }, dur * WAVES * 1000);
    }

    function onReady() {
      frameAndSway();
      limitWave();
    }

    if (model.loaded) {
      onReady();
    } else {
      model.addEventListener("load", onReady, { once: true });
      // Safety net in case the load event was missed
      setTimeout(function () { if (model.loaded) onReady(); }, 1500);
    }

    // --- Fin liveliness: glow while speaking, settle when he's done ---
    const stage = model.closest(".protector-stage") || model.parentElement;
    var hasSpoken = false, silentSince = null, resting = false;

    // His "gesture" clip = the animation-name attribute, else the first
    // non-Idle clip in the model. Computed lazily so it works after load.
    function getGesture() {
      // A page can force a specific clip (e.g. the quiz cheer/disappointed reaction)
      if (window.__finGestureOverride) return window.__finGestureOverride;
      var attr = model.getAttribute("animation-name");
      if (attr) return attr;
      try {
        var list = model.availableAnimations || [];
        for (var i = 0; i < list.length; i++) { if (list[i] !== "Idle") return list[i]; }
      } catch (e) {}
      return "";
    }
    function isFinSpeaking() {
      return window.__finSpeaking ||
             (window.speechSynthesis && window.speechSynthesis.speaking);
    }
    function hasClip(name) {
      try { return model.availableAnimations && model.availableAnimations.indexOf(name) !== -1; }
      catch (e) { return false; }
    }
    function playGesture() {
      try {
        var g = getGesture();
        if (g && hasClip(g)) model.animationName = g;
        if (typeof model.play === "function") model.play();
      } catch (e) {}
    }
    function settle() {
      // Prefer a gentle idle clip; if none exists yet, freeze on the current pose
      try {
        if (hasClip("Idle")) { model.animationName = "Idle"; if (model.play) model.play(); }
        else if (hasClip("Breathing Idle")) { model.animationName = "Breathing Idle"; if (model.play) model.play(); }
        else if (typeof model.pause === "function") { model.pause(); }
      } catch (e) {}
    }

    setInterval(function () {
      var speaking = isFinSpeaking();

      // Glow whenever Fin is talking (recorded clip OR fallback voice)
      if (stage) stage.classList.toggle("is-speaking", !!speaking);

      // The intro runs its own wave -> talk sequence; leave it alone
      if (isIntroPage) return;

      if (speaking) {
        hasSpoken = true;
        silentSince = null;
        if (resting) { resting = false; playGesture(); }   // spoke again -> resume gesture
      } else if (hasSpoken) {
        if (silentSince === null) silentSince = Date.now();
        // ~1.5s after he goes quiet, stop looping the gesture
        if (!resting && Date.now() - silentSince > 1500) {
          resting = true;
          settle();
        }
      }
    }, 200);
  }

  /* ----------------------------------------------------------------------
     3. AMBIENT OCEAN SOUNDSCAPE + TOP-RIGHT MUTE TOGGLE
        Generated live with the Web Audio API (no audio file required), so
        it runs fully offline on a museum kiosk. The on/off choice is
        remembered across pages via localStorage.
     ---------------------------------------------------------------------- */
  function buildAudio() {
    if (document.querySelector(".fx-audio-toggle")) return;

    var TARGET = 0.2;
    var muted = false;
    try { muted = localStorage.getItem("oceanx-muted") === "1"; } catch (e) {}

    var ctx = null, master = null, started = false, bubbleTimer = null, musicTimer = null;

    function startEngine() {
      if (started) return;
      started = true;
      try {
        var AC = window.AudioContext || window.webkitAudioContext;
        ctx = new AC();
        master = ctx.createGain();
        master.gain.value = 0;
        master.connect(ctx.destination);

        // Deep underwater rumble: brown noise through a low-pass filter
        var size = 2 * ctx.sampleRate;
        var buf = ctx.createBuffer(1, size, ctx.sampleRate);
        var data = buf.getChannelData(0);
        var last = 0;
        for (var i = 0; i < size; i++) {
          var white = Math.random() * 2 - 1;
          last = (last + 0.02 * white) / 1.02;
          data[i] = last * 3.2;
        }
        var noise = ctx.createBufferSource();
        noise.buffer = buf; noise.loop = true;

        var lp = ctx.createBiquadFilter();
        lp.type = "lowpass"; lp.frequency.value = 480; lp.Q.value = 0.6;

        // Slow drift on the filter so the hum "breathes"
        var lfo = ctx.createOscillator();
        var lfoGain = ctx.createGain();
        lfo.frequency.value = 0.07; lfoGain.gain.value = 180;
        lfo.connect(lfoGain); lfoGain.connect(lp.frequency);

        var humGain = ctx.createGain(); humGain.gain.value = 0.55;   // keep the hum subtle
        noise.connect(lp); lp.connect(humGain); humGain.connect(master);
        noise.start(0); lfo.start(0);

        // Occasional bubble blips
        bubbleTimer = setInterval(function () {
          if (!ctx || master.gain.value < 0.001) return;
          if (Math.random() < 0.55) spawnBubble();
        }, 900);

        // --- Gentle melodic music bed (A-minor pentatonic, dreamy/underwater) ---
        var musicGain = ctx.createGain(); musicGain.gain.value = 0.55; musicGain.connect(master);
        // Shimmering echo
        var delay = ctx.createDelay(); delay.delayTime.value = 0.38;
        var fb = ctx.createGain(); fb.gain.value = 0.3;
        delay.connect(fb); fb.connect(delay); delay.connect(musicGain);
        // Soft sustained pad chord (A2, C3, E3)
        var padFilter = ctx.createBiquadFilter();
        padFilter.type = "lowpass"; padFilter.frequency.value = 900; padFilter.Q.value = 0.4;
        var padGain = ctx.createGain(); padGain.gain.value = 0.16;
        padFilter.connect(padGain); padGain.connect(musicGain);
        [110.0, 130.81, 164.81].forEach(function (f) {
          var a = ctx.createOscillator(); a.type = "triangle"; a.frequency.value = f;
          var b2 = ctx.createOscillator(); b2.type = "sine"; b2.frequency.value = f * 1.005; // detune for warmth
          a.connect(padFilter); b2.connect(padFilter); a.start(0); b2.start(0);
        });
        // Slow tremolo so the pad "breathes"
        var trem = ctx.createOscillator(); var tremG = ctx.createGain();
        trem.frequency.value = 0.1; tremG.gain.value = 0.05;
        trem.connect(tremG); tremG.connect(padGain.gain); trem.start(0);
        // Gentle looping arpeggio (calm, sparse)
        var arpNotes = [440.0, 523.25, 659.25, 587.33, 783.99]; var arpI = 0;
        musicTimer = setInterval(function () {
          if (!ctx || master.gain.value < 0.001) return;
          var t = ctx.currentTime;
          var f = arpNotes[arpI % arpNotes.length]; arpI++;
          var o = ctx.createOscillator(); o.type = "sine"; o.frequency.setValueAtTime(f, t);
          var g = ctx.createGain();
          g.gain.setValueAtTime(0.0001, t);
          g.gain.exponentialRampToValueAtTime(0.13, t + 0.05);
          g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
          o.connect(g); g.connect(delay); g.connect(musicGain);
          o.start(t); o.stop(t + 1.7);
        }, 1300);
      } catch (e) {}
    }

    function spawnBubble() {
      try {
        var o = ctx.createOscillator();
        var g = ctx.createGain();
        var t = ctx.currentTime;
        var f0 = 300 + Math.random() * 500;
        o.type = "sine";
        o.frequency.setValueAtTime(f0, t);
        o.frequency.exponentialRampToValueAtTime(f0 * 2.2, t + 0.12);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.05, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
        o.connect(g); g.connect(master);
        o.start(t); o.stop(t + 0.2);
      } catch (e) {}
    }

    function setLevel(v) {
      if (!ctx || !master) return;
      try {
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.linearRampToValueAtTime(v, ctx.currentTime + 0.6);
      } catch (e) {}
    }

    function ensureRunning() {
      startEngine();
      if (ctx && ctx.state === "suspended") { try { ctx.resume(); } catch (e) {} }
      setLevel(muted ? 0 : TARGET);
    }

    // Build the button
    var btn = document.createElement("button");
    btn.className = "fx-audio-toggle";
    btn.setAttribute("aria-label", "Toggle sound");
    function icon() {
      btn.innerHTML = muted
        ? '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M4 9v6h4l5 5V4L8 9H4z"/><path d="M16 8l5 5m0-5l-5 5" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>'
        : '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M4 9v6h4l5 5V4L8 9H4z"/><path d="M16 8.5a4 4 0 0 1 0 7M18.5 6a7 7 0 0 1 0 12" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>';
      btn.classList.toggle("is-muted", muted);
    }
    icon();
    var introPage = !!document.getElementById("start-btn");

    btn.addEventListener("click", function () {
      muted = !muted;
      try { localStorage.setItem("oceanx-muted", muted ? "1" : "0"); } catch (e) {}
      icon();
      // Before diving in, the mute button controls only the landing track
      if (introPage && !window.__dived) {
        var lm = window.__landingMusic;
        if (lm) { if (muted) { try { lm.pause(); } catch (e) {} } else { lm.play().catch(function () {}); } }
      } else {
        ensureRunning();
      }
    });
    document.body.appendChild(btn);

    // Let the intro page bring the ocean audio in only after "Let's Go" is pressed
    window.__startOceanAudio = function () { ensureRunning(); };

    if (!introPage) {
      // Non-intro pages: start on load (kiosk flag) or the first interaction
      if (!muted) ensureRunning();
      var gestureEvents = ["pointerdown", "touchstart", "keydown", "click", "mousedown"];
      function firstGesture() {
        ensureRunning();
        gestureEvents.forEach(function (ev) { window.removeEventListener(ev, firstGesture); });
      }
      gestureEvents.forEach(function (ev) {
        window.addEventListener(ev, firstGesture, { once: true, passive: true });
      });
    }
  }

  /* ----------------------------------------------------------------------
     4. BOOT
     ---------------------------------------------------------------------- */
  function init() {
    buildAtmosphere();
    animateProtector();
    buildAudio();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
