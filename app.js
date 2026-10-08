const storageKey = "mindForumPosts";
const userKey = "mindForumUser";
const adminKey = "mindForumIsAdmin";
const dataVersionKey = "mindForumDataVersion";
const currentDataVersion = "school-intervention-v1";
const adminPassword = "admin123";

function createId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `post-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const starterPosts = [
  {
    id: createId(),
    title: "心理疾病被做成玩梗后，真实求助会不会更难说出口？",
    category: "影响分析",
    body: "很多网络内容会把抑郁、焦虑、强迫等词变成夸张表情包。它可能降低谈论心理问题的门槛，也可能让真正需要帮助的人害怕被认为是在跟风。",
    author: "议题发起人",
    createdAt: "2026-09-17",
    replies: [
      { author: "安静观察", body: "我觉得关键是语境。轻松表达不一定有错，但把痛苦当成笑点会让人更难被认真对待。" }
    ]
  },
  {
    id: createId(),
    title: "班会能不能讨论心理疾病玩梗，而不是只贴几张宣传海报？",
    category: "校园干预",
    body: "我觉得学校可以设计一次讨论课，让同学们分析常见网络语境：哪些表达只是情绪释放，哪些表达会让真正有困扰的人被轻视。",
    author: "班级观察员",
    createdAt: "2026-09-17",
    replies: []
  },
  {
    id: createId(),
    title: "我希望学校有一个不用公开暴露自己的求助入口",
    category: "学生感受",
    body: "有时候同学会用开玩笑的方式说自己状态不好，但真正想求助时又怕被议论。如果有匿名预约或者清楚的求助流程，可能会更容易迈出第一步。",
    author: "匿名同学",
    createdAt: "2026-09-17",
    replies: []
  }
];

let posts = loadPosts();
let currentUser = localStorage.getItem(userKey) || "";
let isAdmin = localStorage.getItem(adminKey) === "true";

const postList = document.querySelector("#postList");
const postCount = document.querySelector("#postCount");
const searchInput = document.querySelector("#searchInput");
const categoryFilter = document.querySelector("#categoryFilter");
const postForm = document.querySelector("#postForm");
const userBox = document.querySelector("#userBox");
const loginDialog = document.querySelector("#loginDialog");
const loginForm = document.querySelector("#loginForm");
const openLogin = document.querySelector("#openLogin");
const closeLogin = document.querySelector("#closeLogin");
const nicknameInput = document.querySelector("#nicknameInput");
const adminCheckbox = document.querySelector("#adminCheckbox");
const adminPasswordBox = document.querySelector("#adminPasswordBox");
const adminPasswordInput = document.querySelector("#adminPasswordInput");
const loginError = document.querySelector("#loginError");
const rewriteInput = document.getElementById("rewriteInput");
const rewriteOutput = document.getElementById("rewriteOutput");
const rewriteButton = document.getElementById("rewriteButton");

const rewriteExamples = [
  "你是不是有病？别emo了。",
  "他是抑郁症吧，怎么这么奇怪。",
  "你就是焦虑得不行，别装了。",
  "他真是神经病，整天闹情绪。",
  "你是不是想自残？"
];

const insultMap = [
  { pattern: /\b(有病|神经病|疯了|精神病|脑残|弱智|智障|变态|怪人)\b/i, label: "污名化词汇" },
  { pattern: /\b(emo|抑郁症|焦虑症|精神崩溃|自残)\b/i, label: "病症标签" },
  { pattern: /\b(装|别装|真有病|你怎么这么病)\b/i, label: "嘲讽式语气" }
];

const softeningRules = [
  {
    pattern: /你是不是\s*(有病|神经病|疯了|精神病|脑残|弱智|智障)\b/i,
    replacement: "你现在看起来状态不太好，愿意和我说说发生了什么吗？"
  },
  {
    pattern: /\b(emo|情绪崩溃|很烦)\b/i,
    replacement: "你看起来很难受，想先停下来，和身边的人聊聊吗？"
  },
  {
    pattern: /\b(抑郁|焦虑|压力大|不开心)\b/i,
    replacement: "你现在可能在承受比较大的压力，先停下来看看自己的状态，必要时找信任的人倾诉。"
  },
  {
    pattern: /\b(神经病|怪人|变态)\b/i,
    replacement: "这类说法容易伤害人。更适合的表达是：‘我觉得他现在很难受，可能需要更多理解和支持。’"
  },
  {
    pattern: /\b(自残|想死)\b/i,
    replacement: "如果一个人出现强烈痛苦或危险信号，应该尽快联系可信任成年人、学校心理老师或专业支持。"
  }
];

function loadPosts() {
  const dataVersion = localStorage.getItem(dataVersionKey);
  if (dataVersion !== currentDataVersion) {
    localStorage.setItem(storageKey, JSON.stringify(starterPosts));
    localStorage.setItem(dataVersionKey, currentDataVersion);
    return starterPosts;
  }

  const saved = localStorage.getItem(storageKey);
  if (!saved) {
    localStorage.setItem(storageKey, JSON.stringify(starterPosts));
    localStorage.setItem(dataVersionKey, currentDataVersion);
    return starterPosts;
  }

  try {
    return JSON.parse(saved);
  } catch {
    localStorage.setItem(storageKey, JSON.stringify(starterPosts));
    localStorage.setItem(dataVersionKey, currentDataVersion);
    return starterPosts;
  }
}

function savePosts() {
  localStorage.setItem(storageKey, JSON.stringify(posts));
}

function updateUserBox() {
  if (!currentUser) {
    userBox.innerHTML = '<button class="ghost-button" id="openLogin" type="button">登录</button>';
    document.querySelector("#openLogin").addEventListener("click", showLogin);
    return;
  }

  userBox.innerHTML = `
    <span class="user-name">${escapeHTML(currentUser)}</span>
    ${isAdmin ? '<span class="admin-badge">管理员</span>' : ""}
    <button class="ghost-button" id="logoutButton" type="button">退出</button>
  `;
  document.querySelector("#logoutButton").addEventListener("click", () => {
    currentUser = "";
    isAdmin = false;
    localStorage.removeItem(userKey);
    localStorage.removeItem(adminKey);
    updateUserBox();
    renderPosts();
  });
}

function showLogin() {
  if (typeof loginDialog.showModal === "function") {
    loginDialog.showModal();
    nicknameInput.focus();
  }
}

function renderPosts() {
  const keyword = searchInput.value.trim().toLowerCase();
  const category = categoryFilter.value;
  const visiblePosts = posts.filter((post) => {
    const text = `${post.title} ${post.body} ${post.author}`.toLowerCase();
    const matchesKeyword = !keyword || text.includes(keyword);
    const matchesCategory = category === "全部" || post.category === category;
    return matchesKeyword && matchesCategory;
  });

  postCount.textContent = posts.length;

  if (visiblePosts.length === 0) {
    postList.innerHTML = '<div class="empty-state">还没有找到相关讨论。可以换个关键词，或者发布一个新帖子。</div>';
    return;
  }

  postList.innerHTML = visiblePosts.map((post) => `
    <article class="post-card">
      <div class="post-meta">
        <span class="tag">${escapeHTML(post.category)}</span>
        <span>${escapeHTML(post.author)}</span>
        <span>${escapeHTML(post.createdAt)}</span>
      </div>
      <h3>${escapeHTML(post.title)}</h3>
      <p>${escapeHTML(post.body)}</p>
      <div class="post-actions">
        <button class="small-button reply-toggle" type="button" data-id="${post.id}">回复</button>
        <span>${post.replies.length} 条回复</span>
        ${isAdmin ? `<button class="danger-button delete-post" type="button" data-id="${post.id}">删除帖子</button>` : ""}
      </div>
      <div class="reply-list">
        ${post.replies.map((reply, index) => `
          <div class="reply">
            <div><strong>${escapeHTML(reply.author)}：</strong>${escapeHTML(reply.body)}</div>
            ${isAdmin ? `<button class="danger-button delete-reply" type="button" data-id="${post.id}" data-index="${index}">删除回复</button>` : ""}
          </div>
        `).join("")}
      </div>
      <form class="reply-box" data-id="${post.id}">
        <textarea rows="3" maxlength="300" placeholder="写下你的回复。请保持尊重和具体。" required></textarea>
        <button class="small-button" type="submit">提交回复</button>
      </form>
    </article>
  `).join("");

  document.querySelectorAll(".reply-toggle").forEach((button) => {
    button.addEventListener("click", () => {
      if (!ensureLogin()) return;
      const replyForm = document.querySelector(`.reply-box[data-id="${button.dataset.id}"]`);
      replyForm.classList.toggle("is-open");
      replyForm.querySelector("textarea").focus();
    });
  });

  document.querySelectorAll(".reply-box").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!ensureLogin()) return;

      const textarea = form.querySelector("textarea");
      const post = posts.find((item) => item.id === form.dataset.id);
      post.replies.push({
        author: currentUser,
        body: textarea.value.trim()
      });
      savePosts();
      renderPosts();
    });
  });

  document.querySelectorAll(".delete-post").forEach((button) => {
    button.addEventListener("click", () => {
      if (!isAdmin) return;
      const confirmed = window.confirm("确定删除这条帖子吗？删除后无法在页面中恢复。");
      if (!confirmed) return;

      posts = posts.filter((post) => post.id !== button.dataset.id);
      savePosts();
      renderPosts();
    });
  });

  document.querySelectorAll(".delete-reply").forEach((button) => {
    button.addEventListener("click", () => {
      if (!isAdmin) return;
      const post = posts.find((item) => item.id === button.dataset.id);
      if (!post) return;

      post.replies.splice(Number(button.dataset.index), 1);
      savePosts();
      renderPosts();
    });
  });
}

function ensureLogin() {
  if (currentUser) return true;
  showLogin();
  return false;
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

openLogin.addEventListener("click", showLogin);

closeLogin.addEventListener("click", () => {
  loginDialog.close();
});

adminCheckbox.addEventListener("change", () => {
  adminPasswordBox.classList.toggle("is-visible", adminCheckbox.checked);
  loginError.textContent = "";
});

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const nickname = nicknameInput.value.trim();
  if (!nickname) return;

  if (adminCheckbox.checked && adminPasswordInput.value !== adminPassword) {
    loginError.textContent = "管理员密码不正确。课堂演示密码是：admin123";
    return;
  }

  currentUser = nickname;
  isAdmin = adminCheckbox.checked;
  localStorage.setItem(userKey, currentUser);
  localStorage.setItem(adminKey, String(isAdmin));
  updateUserBox();
  loginDialog.close();
  loginForm.reset();
  adminPasswordBox.classList.remove("is-visible");
  loginError.textContent = "";
  renderPosts();
});

postForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!ensureLogin()) return;

  posts.unshift({
    id: createId(),
    title: document.querySelector("#postTitle").value.trim(),
    category: document.querySelector("#postCategory").value,
    body: document.querySelector("#postBody").value.trim(),
    author: currentUser,
    createdAt: new Date().toLocaleDateString("zh-CN"),
    replies: []
  });

  savePosts();
  postForm.reset();
  renderPosts();
  location.hash = "#topics";
});

searchInput.addEventListener("input", renderPosts);
categoryFilter.addEventListener("change", renderPosts);

rewriteButton.addEventListener("click", () => {
  const text = rewriteInput.value.trim();
  if (!text) {
    rewriteOutput.textContent = "先输入一句校园中常见的表达，网站会给出更尊重的替代表达。";
    return;
  }

  rewriteOutput.textContent = buildRewriteSuggestion(text);
});

function buildRewriteSuggestion(text) {
  const lowerText = text.toLowerCase();

  if (text.includes("有病")) {
    return "建议表达：你的状态看起来不太好。要不要先休息一下，或者找一个可信任的人聊聊？";
  }

  if (lowerText.includes("emo") || text.includes("抑郁")) {
    return "建议表达：我最近情绪很低落，可能需要一点支持，也想被认真听一听。";
  }

  if (text.includes("焦虑") || text.includes("强迫")) {
    return "建议表达：我最近压力很大，有些想法一直停不下来。也许我需要调整节奏，或者寻求帮助。";
  }

  if (text.includes("装") || text.includes("矫情")) {
    return "建议表达：我还不了解你的感受，但我愿意先听你说完，再一起想办法。";
  }

  return "建议表达：我注意到这句话可能会让人感到被标签化。可以改成描述具体状态、具体需要和可以提供的支持。";
}

function normalizeText(text) {
  return text
    .replace(/\s+/g, " ")
    .replace(/[：:]/g, "：")
    .trim();
}

function findRiskType(text) {
  for (const item of insultMap) {
    if (item.pattern.test(text)) {
      return item.label;
    }
  }
  return "普通表达";
}

function rewriteSentence(sentence) {
  const clean = normalizeText(sentence);

  for (const rule of softeningRules) {
    if (rule.pattern.test(clean)) {
      return rule.replacement;
    }
  }

  if (/怎么.*(这么|这么?)*\b(烦|焦虑|抑郁|难受)\b/i.test(clean)) {
    return "你现在的状态看起来有些难受，愿意先把感受说出来吗？";
  }

  if (/(\b他\b|\b她\b|\b他们\b|\b别人\b).*(怪|烦|神经|病|奇怪)/i.test(clean)) {
    return "我觉得这类描述容易把人的难处标签化，或许可以换成‘他现在看起来需要更多理解和支持。’";
  }

  if (/(\b我\b).*(烦|难受|焦虑|郁闷|心烦)/i.test(clean)) {
    return "我现在感到有些难受，想先缓一缓，也许可以找一个信任的人聊聊。";
  }

  if (/(\b你\b).*(烦|难受|焦虑|不舒服|状态)/i.test(clean)) {
    return "你看起来现在状态不太好，愿意和我说说你在经历什么？";
  }

  return "这句话可以改成更温和和尊重的表达，比如：‘我感受到你现在很难受，愿意和人说说吗？’";
}

function rewriteCampusText(rawText) {
  const text = normalizeText(rawText);

  if (!text) {
    return "请输入一段校园中常见的表达，我会帮你改成更尊重、更适合校园沟通的说法。";
  }

  const riskType = findRiskType(text);

  const sentences = text
    .split(/[。！？!?\n]+/)
    .map(s => s.trim())
    .filter(Boolean);

  const rewritten = sentences.map(rewriteSentence);

  const result = rewritten.join(" ");

  if (result.length > 220) {
    return result.slice(0, 220) + "……";
  }

  return `${riskType}：${result}`;
}

if (rewriteButton) {
  rewriteButton.addEventListener("click", () => {
    const input = rewriteInput.value.trim();
    rewriteOutput.textContent = rewriteCampusText(input);
  });
}

if (rewriteInput) {
  rewriteInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      rewriteButton.click();
    }
  });
}

document.querySelectorAll(".mini-tag").forEach((button) => {
  button.addEventListener("click", () => {
    const example = button.dataset.example;
    rewriteInput.value = example;
    rewriteOutput.textContent = rewriteCampusText(example);
  });
});

if (rewriteInput && rewriteExamples.length) {
  rewriteInput.value = rewriteExamples[0];
  rewriteOutput.textContent = rewriteCampusText(rewriteExamples[0]);
}

updateUserBox();
renderPosts();
