const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzhfURPgEDbhQM-j3stSIQLocGOYAa_iUgST8zGhkl7wYhLrAFk-5AMV5ba1W-KHK-d/exec";

// Авторизация (handleLogin) должна быть здесь, если она используется
async function handleLogin() {
  const login = document.getElementById("login").value;
  const password = document.getElementById("password").value;
  const errorField = document.getElementById("error");

  if (!login || !password) {
    errorField.textContent = "Введите логин и пароль.";
    return;
  }

  try {
    const res = await fetch(
      `${SCRIPT_URL}?login=${encodeURIComponent(
        login
      )}&password=${encodeURIComponent(password)}`
    );
    const data = await res.json();

    if (data.success) {
      localStorage.setItem("userId", data.userId);
      localStorage.setItem("role", data.role);
      window.location.href = `${data.role}.html`;
    } else {
      errorField.textContent = "Неверный логин или пароль.";
    }
  } catch (e) {
    errorField.textContent = "Ошибка подключения к серверу.";
  }
}
async function sendForm() {
  const type = document.getElementById("form-type").value;
  const topic = document.getElementById("form-topic").value;
  const text = document.getElementById("form-text").value;
  const role = localStorage.getItem("role");
  const userId = localStorage.getItem("userId");

  if (!topic || !text) {
    alert("Пожалуйста, заполните все поля.");
    return;
  }

  const payload = {
    type,
    topic,
    text,
    role,
    userId,
  };

  try {
    const res = await fetch(SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();
    alert(data.message || "Успешно отправлено!");
    document.getElementById("form-topic").value = "";
    document.getElementById("form-text").value = "";
    loadEntries();
  } catch (e) {
    alert("Ошибка при отправке.");
  }
}

async function loadEntries() {
  const role = localStorage.getItem("role");
  const userId = localStorage.getItem("userId");

  const res = await fetch(SCRIPT_URL + "?action=getEntries");
  const data = await res.json();
  const container = document.getElementById("entries");
  container.innerHTML = "";

  const canReplyRoles = [
    "завуч",
    "социальный педагог",
    "директор",
    "супер админ",
    "системный админ",
  ];

  data.entries.forEach((entry) => {
    const canSeeComplaint =
      entry.type === "жалоба" &&
      ["директор", "системный админ", "супер админ"].includes(role);
    const canSeeQuestion =
      entry.type === "вопрос" &&
      [
        "директор",
        "завуч",
        "социальный педагог",
        "системный админ",
        "супер админ",
      ].includes(role);
    if (canSeeComplaint || canSeeQuestion) {
      const div = document.createElement("div");
      div.className = "entry";
      div.innerHTML = `
        <strong>${entry.type.toUpperCase()}</strong> | <b>${entry.topic}</b><br>
        ${entry.text}<br>
        <i>${entry.userId}</i> | <small>${entry.date || ""}</small><br>
        <b>Ответ:</b> ${entry.answer || "—"}
        <div id="reply-${entry.id}"></div>
        <hr>
      `;

      if (!entry.answer && canReplyRoles.includes(role)) {
        const replyDiv = document.createElement("div");
        replyDiv.innerHTML = `
          <textarea id="answer-${entry.id}" placeholder="Введите ответ..." rows="2"></textarea><br>
          <button onclick="submitAnswer('${entry.id}')">Ответить</button>
        `;
        div.querySelector(`#reply-${entry.id}`).appendChild(replyDiv);
      }

      container.appendChild(div);
    }
  });
}

async function submitAnswer(entryId) {
  const answer = document.getElementById(`answer-${entryId}`).value;
  const userId = localStorage.getItem("userId");
  if (!answer) {
    alert("Введите текст ответа.");
    return;
  }

  try {
    const res = await fetch(SCRIPT_URL + "?action=reply", {
      method: "POST",
      body: JSON.stringify({
        id: entryId,
        answer,
        answeredBy: userId,
      }),
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json();
    alert(data.message || "Ответ отправлен");
    loadEntries();
  } catch (e) {
    alert("Ошибка при отправке ответа.");
  }
}
