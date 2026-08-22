// ===== Конфигурация =====
// После деплоя Google Apps Script (см. google-apps-script/README-SETUP.md)
// вставьте сюда URL веб-приложения — он выглядит как
// https://script.google.com/macros/s/XXXXXXXXXXXXXXXXXXXXXXXX/exec
const GOOGLE_SCRIPT_URL = "";

// ===== Появление секций при прокрутке =====
const revealEls = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window && revealEls.length) {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  revealEls.forEach((el) => io.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add("is-visible"));
}

// ===== RSVP: показ/скрытие доп. вопросов при ответе "Не смогу" =====
const attendRadios = document.querySelectorAll('input[name="attending"]');
const extraBlock = document.getElementById("rsvp-extra");

function syncExtraVisibility() {
  const checked = document.querySelector('input[name="attending"]:checked');
  const attending = checked && checked.value === "да";
  extraBlock.style.display = attending ? "" : "none";
}
attendRadios.forEach((r) => r.addEventListener("change", syncExtraVisibility));
syncExtraVisibility();

// ===== RSVP: отправка =====
const form = document.getElementById("rsvp-form");
const statusEl = document.getElementById("rsvp-status");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  statusEl.classList.remove("is-error");

  const attending = form.querySelector('input[name="attending"]:checked');
  if (!attending) {
    statusEl.textContent = "Пожалуйста, отметьте, планируете ли вы присутствовать.";
    statusEl.classList.add("is-error");
    return;
  }

  const payload = {
    name: form.name.value.trim(),
    attending: attending.value,
    drinks: Array.from(form.querySelectorAll('input[name="drinks"]:checked')).map((c) => c.value),
    notes: form.notes.value.trim(),
    submittedAt: new Date().toISOString(),
  };

  if (!payload.name) {
    statusEl.textContent = "Пожалуйста, укажите имя и фамилию.";
    statusEl.classList.add("is-error");
    return;
  }

  if (!GOOGLE_SCRIPT_URL) {
    console.warn("RSVP: GOOGLE_SCRIPT_URL не настроен, ответ не отправлен.", payload);
    statusEl.textContent = "Форма пока не подключена к таблице — сообщите разработчику.";
    statusEl.classList.add("is-error");
    return;
  }

  const submitBtn = form.querySelector(".btn");
  submitBtn.disabled = true;
  statusEl.textContent = "Отправляем…";

  try {
    // Apps Script Web App не отдаёт CORS-заголовки на fetch с браузера,
    // поэтому используем no-cors: ответ прочитать нельзя, но запрос доходит и обрабатывается.
    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });
    statusEl.textContent = "Спасибо! Ваш ответ отправлен.";
    form.reset();
    syncExtraVisibility();
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Не получилось отправить, попробуйте ещё раз чуть позже.";
    statusEl.classList.add("is-error");
  } finally {
    submitBtn.disabled = false;
  }
});
