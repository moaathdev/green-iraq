/* ==========================================================================
   تشجير العراق — Site interactions
   ========================================================================== */

(() => {
  "use strict";

  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const money = (n) => new Intl.NumberFormat("en-US").format(Math.round(n));

  /* ------------------------------------------------------------------ *
   * Header + scroll progress
   * ------------------------------------------------------------------ */
  const header = qs(".site-header");
  const progress = qs(".scroll-progress");

  const onScroll = () => {
    const y = window.scrollY || 0;
    if (header) header.classList.toggle("is-scrolled", y > 24);
    if (progress) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = `${max > 0 ? Math.min(100, (y / max) * 100) : 0}%`;
    }
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ------------------------------------------------------------------ *
   * Active nav link
   * ------------------------------------------------------------------ */
  const page = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  qsa(".nav a").forEach((a) => {
    const href = (a.getAttribute("href") || "").split("#")[0].toLowerCase();
    if (href && href === page) a.classList.add("is-active");
  });

  /* ------------------------------------------------------------------ *
   * Reveal on scroll
   * ------------------------------------------------------------------ */
  const revealItems = qsa(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealItems.forEach((el) => io.observe(el));
  } else {
    revealItems.forEach((el) => el.classList.add("is-visible"));
  }

  /* ------------------------------------------------------------------ *
   * Animated counters
   * ------------------------------------------------------------------ */
  const animateCount = (el) => {
    const target = Number(el.dataset.count || 0);
    const suffix = el.dataset.suffix || "";
    const duration = 1600;
    const start = performance.now();
    const fmt = (v) => `${money(v)}${suffix}`;

    if (reduceMotion) {
      el.textContent = fmt(target);
      return;
    }

    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(target * eased);
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = fmt(target);
    };
    requestAnimationFrame(tick);
  };

  const counters = qsa("[data-count]");
  if (counters.length) {
    if ("IntersectionObserver" in window) {
      const cio = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              animateCount(entry.target);
              cio.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.5 }
      );
      counters.forEach((el) => cio.observe(el));
    } else {
      counters.forEach(animateCount);
    }
  }

  /* ------------------------------------------------------------------ *
   * Animated subtitle (typewriter)
   * ------------------------------------------------------------------ */
  const rotator = qs("#rotator");
  if (rotator) {
    const phrases = [
      "ازرع اليوم شجرة… تحصد غداً وطناً يتنفّس.",
      "كل شتلة نزرعها هي وعدٌ للأجيال القادمة.",
      "التصحر ليس قدراً… والمعرفة أول خطوة نحو الأرض.",
      "شجرة واحدة تُطفئ حرارة شارعٍ كامل.",
      "بأيدينا نعيد الغطاء الأخضر من الموصل إلى البصرة.",
      "الماء أمانة… والزراعة مسؤولية جماعية.",
    ];

    if (reduceMotion) {
      rotator.textContent = phrases[0];
    } else {
      rotator.innerHTML = '<span class="typed"></span><span class="caret" aria-hidden="true"></span>';
      const typed = qs(".typed", rotator);
      let phrase = 0;
      let char = 0;
      let deleting = false;

      const step = () => {
        const current = phrases[phrase];
        if (!deleting) {
          char += 1;
          typed.textContent = current.slice(0, char);
          if (char === current.length) {
            deleting = true;
            setTimeout(step, 2100);
            return;
          }
          setTimeout(step, 46);
        } else {
          char -= 1;
          typed.textContent = current.slice(0, char);
          if (char === 0) {
            deleting = false;
            phrase = (phrase + 1) % phrases.length;
            setTimeout(step, 420);
            return;
          }
          setTimeout(step, 24);
        }
      };
      setTimeout(step, 700);
    }
  }

  /* ------------------------------------------------------------------ *
   * Ticker duplicate (seamless loop)
   * ------------------------------------------------------------------ */
  const tickerTrack = qs(".ticker-track");
  if (tickerTrack) {
    const set = qs(".ticker-set", tickerTrack);
    if (set) {
      const clone = set.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      tickerTrack.appendChild(clone);
    }
  }

  /* ------------------------------------------------------------------ *
   * Three-dot quick menu
   * ------------------------------------------------------------------ */
  const dots = qs("#quickMenu");
  const dotsBtn = qs(".dots-btn", dots || document);
  const dotsPanel = qs(".dots-panel", dots || document);

  const setDots = (open) => {
    if (!dots) return;
    dots.classList.toggle("is-open", open);
    if (dotsBtn) dotsBtn.setAttribute("aria-expanded", String(open));
  };

  if (dots && dotsBtn) {
    dotsBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      setDots(!dots.classList.contains("is-open"));
    });

    document.addEventListener("click", (e) => {
      if (dots.classList.contains("is-open") && !dots.contains(e.target)) setDots(false);
    });

    qs("[data-close-dots]")?.addEventListener("click", () => setDots(false));
    qsa(".dots-panel a, .dots-panel button[data-open]").forEach((item) => {
      item.addEventListener("click", () => setDots(false));
    });
  }

  /* ------------------------------------------------------------------ *
   * Modals
   * ------------------------------------------------------------------ */
  let lastFocused = null;

  const openModal = (id) => {
    const modal = document.getElementById(id);
    if (!modal) return;
    lastFocused = document.activeElement;

    if (id === "accountModal") {
      const formView = qs("#accountFormView", modal);
      const successView = qs("#accountSuccess", modal);
      if (formView && successView) {
        formView.hidden = false;
        successView.classList.remove("is-shown");
      }
      const note = qs(".form-note", modal);
      if (note) note.classList.remove("is-shown");
      const form = qs("form", modal);
      form?.reset();
    }

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    setTimeout(() => {
      const focusTarget = qs("input, select, textarea, button.modal-close", modal);
      focusTarget?.focus({ preventScroll: true });
    }, 80);
  };

  const closeModal = (modal) => {
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    if (!qs(".modal.is-open")) document.body.style.overflow = "";
    if (lastFocused && typeof lastFocused.focus === "function") {
      lastFocused.focus({ preventScroll: true });
      lastFocused = null;
    }
  };

  qsa("[data-open]").forEach((trigger) => {
    trigger.addEventListener("click", (e) => {
      e.preventDefault();
      openModal(trigger.dataset.open);
    });
  });

  qsa("[data-close]").forEach((btn) => {
    btn.addEventListener("click", () => closeModal(btn.closest(".modal")));
  });

  qsa(".modal").forEach((modal) => {
    modal.addEventListener("mousedown", (e) => {
      if (e.target === modal) closeModal(modal);
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      setDots(false);
      const open = qs(".modal.is-open");
      if (open) closeModal(open);
    }
  });

  /* ------------------------------------------------------------------ *
   * Toast
   * ------------------------------------------------------------------ */
  const toast = qs("#toast");
  let toastTimer = null;
  const toastIconOk =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
  const toastIconErr =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 8v5"/><circle cx="12" cy="16.5" r="0.6" fill="currentColor"/><circle cx="12" cy="12" r="9"/></svg>';

  const showToast = (message, type = "ok") => {
    if (!toast) return;
    toast.innerHTML = `${type === "error" ? toastIconErr : toastIconOk}<span></span>`;
    qs("span", toast).textContent = message;
    toast.classList.toggle("error", type === "error");
    toast.classList.add("is-open");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-open"), 3600);
  };

  /* ------------------------------------------------------------------ *
   * Account creation
   * ------------------------------------------------------------------ */
  const accountForm = qs("#accountForm");
  if (accountForm) {
    accountForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = new FormData(accountForm);
      const name = String(data.get("name") || "").trim();
      const email = String(data.get("email") || "").trim().toLowerCase();
      const password = String(data.get("password") || "");
      const city = String(data.get("city") || "").trim();
      const terms = data.get("terms");
      const note = qs("#accountNote");
      const fail = (msg) => {
        if (note) {
          note.textContent = msg;
          note.classList.add("is-shown");
        }
        showToast(msg, "error");
      };

      if (name.length < 3) return fail("اكتب اسمك الكامل من فضلك.");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return fail("البريد الإلكتروني غير صحيح.");
      if (!city) return fail("اختر محافظتك من فضلك.");
      if (password.length < 6) return fail("كلمة المرور يجب أن تكون 6 أحرف على الأقل.");
      if (!terms) return fail("يرجى الموافقة على شروط المشاركة.");

      let users = [];
      try {
        users = JSON.parse(localStorage.getItem("tiq_users") || "[]");
      } catch {
        users = [];
      }
      if (users.some((u) => u.email === email)) {
        return fail("هذا البريد مسجل بالفعل في الحملة.");
      }

      users.push({ name, email, city, joined: new Date().toISOString() });
      try {
        localStorage.setItem("tiq_users", JSON.stringify(users));
      } catch {
        /* التخزين المحلي قد يكون معطلاً — نتجاهل بأمان */
      }

      const successView = qs("#accountSuccess");
      const formView = qs("#accountFormView");
      const successName = qs("#successName");
      if (successName) successName.textContent = name.split(" ")[0];
      if (note) note.classList.remove("is-shown");
      if (formView) formView.hidden = true;
      successView?.classList.add("is-shown");
      showToast("تم إنشاء حسابك، أهلاً بك في الحملة 🌱");
    });
  }

  /* ------------------------------------------------------------------ *
   * Poster lightbox
   * ------------------------------------------------------------------ */
  const lightbox = qs("#posterLightbox");
  const lightboxBody = qs(".lb-poster", lightbox || document);
  const lightboxTitle = qs(".lb-caption b", lightbox || document);
  const lightboxSub = qs(".lb-caption span", lightbox || document);

  qsa("[data-poster]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!lightbox) return;
      const svg = qs("svg", btn)?.cloneNode(true);
      if (svg) {
        svg.removeAttribute("id");
        lightboxBody.replaceChildren(svg);
      }
      if (lightboxTitle) lightboxTitle.textContent = btn.dataset.title || "بوستر الحملة";
      if (lightboxSub) lightboxSub.textContent = btn.dataset.sub || "تشجير العراق · 2026";
      openModal("posterLightbox");
    });
  });

  /* ------------------------------------------------------------------ *
   * Donation page
   * ------------------------------------------------------------------ */
  const donateForm = qs("#donateForm");
  if (donateForm) {
    const chips = qsa(".chip[data-amount]", donateForm);
    const customAmount = qs("#customAmount");
    const sumAmount = qs("#sumAmount");
    const sumFreq = qs("#sumFreq");
    const sumTrees = qs("#sumTrees");
    const freqInputs = qsa('input[name="freq"]', donateForm);
    const goal = 2_000_000_000;
    let raised = 1_360_000_000;

    const fill = qs("#goalProgress");
    const raisedEl = qs("#raisedAmount");
    const percentEl = qs("#goalPercent");

    const setGoalUI = () => {
      const pct = Math.min(100, (raised / goal) * 100);
      if (fill) requestAnimationFrame(() => (fill.style.width = `${pct}%`));
      if (raisedEl) raisedEl.textContent = money(raised);
      if (percentEl) percentEl.textContent = `${Math.round(pct)}% من الهدف`;
    };

    const animateBreakdown = () => {
      qsa(".break-bar i[data-w]", donateForm.closest(".donate-grid") || document).forEach((bar) => {
        bar.style.width = `${bar.dataset.w}%`;
      });
    };

    if ("IntersectionObserver" in window && fill) {
      const pio = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setGoalUI();
              animateBreakdown();
              pio.disconnect();
            }
          });
        },
        { threshold: 0.3 }
      );
      pio.observe(fill.closest(".progress-card") || fill);
    } else {
      setGoalUI();
      animateBreakdown();
    }

    const readAmount = () => Math.max(0, Number(String(customAmount?.value || "").replace(/[^\d]/g, "")) || 0);

    const syncSummary = () => {
      const amount = readAmount();
      const monthly = qs('input[name="freq"]:checked', donateForm)?.value === "monthly";
      if (sumAmount) sumAmount.textContent = `${money(amount)} د.ع`;
      if (sumFreq) sumFreq.textContent = monthly ? "شهرياً" : "مرة واحدة";
      if (sumTrees) {
        const trees = Math.floor(amount / 5000);
        sumTrees.textContent = trees > 0 ? `≈ ${money(trees)} شتلة` : "اختر مبلغاً لزراعة شتلة";
      }
    };

    chips.forEach((chip) => {
      chip.addEventListener("click", () => {
        chips.forEach((c) => c.classList.remove("is-active"));
        chip.classList.add("is-active");
        if (customAmount) customAmount.value = chip.dataset.amount;
        syncSummary();
      });
    });

    customAmount?.addEventListener("input", () => {
      chips.forEach((c) => c.classList.remove("is-active"));
      customAmount.value = customAmount.value.replace(/[^\d]/g, "");
      syncSummary();
    });

    freqInputs.forEach((input) => input.addEventListener("change", syncSummary));
    syncSummary();

    donateForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const amount = readAmount();
      const donor = String(new FormData(donateForm).get("donor") || "").trim();
      const method = new FormData(donateForm).get("method");
      const note = qs("#donateNote");
      const fail = (msg) => {
        if (note) {
          note.textContent = msg;
          note.classList.add("is-shown");
        }
        showToast(msg, "error");
      };

      if (amount < 1000) return fail("أقل مبلغ للتبرع هو 1,000 د.ع.");
      if (donor.length < 3) return fail("اكتب اسمك من فضلك.");
      if (!method) return fail("اختر طريقة الدفع أولاً.");
      if (note) note.classList.remove("is-shown");

      const monthly = qs('input[name="freq"]:checked', donateForm)?.value === "monthly";
      const receipt = `TIQ-2026-${Math.floor(10000 + Math.random() * 89999)}`;
      const nameEl = qs("[data-receipt-name]");
      const amountEl = qs("[data-receipt-amount]");
      const freqEl = qs("[data-receipt-freq]");
      const methodEl = qs("[data-receipt-method]");
      const idEl = qs("[data-receipt-id]");
      const treesEl = qs("[data-receipt-trees]");

      const methodName = qs(`input[name="method"][value="${method}"]`)?.dataset.label || method;
      if (nameEl) nameEl.textContent = donor;
      if (amountEl) amountEl.textContent = `${money(amount)} د.ع`;
      if (freqEl) freqEl.textContent = monthly ? "تبرع شهري" : "تبرع لمرة واحدة";
      if (methodEl) methodEl.textContent = methodName;
      if (idEl) idEl.textContent = receipt;
      if (treesEl) treesEl.textContent = `${money(Math.floor(amount / 5000))} شتلة`;

      raised += amount;
      setGoalUI();

      const formView = qs("#donateFormView");
      const success = qs("#donateSuccess");
      if (formView) formView.hidden = true;
      success?.classList.add("is-shown");
      success?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });

      showToast("شكراً لك! تم تسجيل تبرعك بنجاح 🌳");
    });

    qs("#donateAgain")?.addEventListener("click", () => {
      const success = qs("#donateSuccess");
      const formView = qs("#donateFormView");
      success?.classList.remove("is-shown");
      if (formView) formView.hidden = false;
      donateForm.reset();
      chips.forEach((c) => c.classList.remove("is-active"));
      if (customAmount) customAmount.value = "25000";
      syncSummary();
      formView?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
    });
  }

  /* ------------------------------------------------------------------ *
   * Misc
   * ------------------------------------------------------------------ */
  qsa("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

  qsa(".ticker-set, .rotator").forEach((el) => {
    el.style.willChange = "transform";
  });
})();
