const store = {
  get(key, fallback) {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
};

const state = {
  users: store.get("users", []),
  posts: store.get("posts", []),
  sessionUserId: store.get("sessionUserId", null),
  view: "home",
};

const tabsConfig = [
  { id: "home", label: "Home", auth: "all" },
  { id: "auth", label: "Login/Register", auth: "guest" },
  { id: "profile", label: "Profile", auth: "user" },
  { id: "create-post", label: "Create Post", auth: "user" },
  { id: "my-posts", label: "My Posts", auth: "user" },
  { id: "admin", label: "Admin", auth: "admin" },
];

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function now() {
  return new Date().toLocaleString();
}

function sessionUser() {
  return state.users.find((u) => u.id === state.sessionUserId) || null;
}

function isAdmin(user) {
  return !!user && user.role === "admin";
}

function persist() {
  store.set("users", state.users);
  store.set("posts", state.posts);
  store.set("sessionUserId", state.sessionUserId);
}

function setView(view) {
  state.view = view;
  render();
}

function resetPostForm() {
  const form = document.getElementById("post-form");
  form.reset();
  form.postId.value = "";
}

function visibleForTab(tab, user) {
  if (tab.auth === "all") return true;
  if (tab.auth === "guest") return !user;
  if (tab.auth === "user") return !!user;
  if (tab.auth === "admin") return isAdmin(user);
  return false;
}

function renderTabs() {
  const user = sessionUser();
  const tabs = document.getElementById("tabs");
  tabs.innerHTML = "";

  tabsConfig.filter((t) => visibleForTab(t, user)).forEach((tab) => {
    const btn = document.createElement("button");
    btn.textContent = tab.label;
    btn.className = state.view === tab.id ? "active" : "";
    btn.onclick = () => setView(tab.id);
    tabs.appendChild(btn);
  });

  if (user) {
    const logoutBtn = document.createElement("button");
    logoutBtn.className = "secondary";
    logoutBtn.textContent = "Logout";
    logoutBtn.onclick = () => {
      state.sessionUserId = null;
      persist();
      setView("home");
    };
    tabs.appendChild(logoutBtn);
  }
}

function renderSessionInfo() {
  const user = sessionUser();
  const el = document.getElementById("session-info");
  if (!user) {
    el.textContent = "Guest";
    return;
  }
  el.textContent = `${user.name} (${user.role})`;
}

function renderViews() {
  const user = sessionUser();
  document.querySelectorAll("[data-view]").forEach((section) => {
    const id = section.dataset.view;
    const tab = tabsConfig.find((t) => t.id === id);
    const allowed = tab ? visibleForTab(tab, user) : true;
    const isCurrent = state.view === id;
    section.classList.toggle("hidden", !(allowed && isCurrent));
  });

  if (!tabsConfig.some((t) => t.id === state.view && visibleForTab(t, user))) {
    state.view = "home";
    renderViews();
  }
}

function renderPublicPosts() {
  const wrapper = document.getElementById("public-posts");
  const user = sessionUser();
  const posts = state.posts.filter((p) => p.status === "published").reverse();

  if (!posts.length) {
    wrapper.innerHTML = "<p class='meta'>এখনও কোনো Published পোস্ট নেই।</p>";
    return;
  }

  wrapper.innerHTML = posts
    .map((post) => {
      const author = state.users.find((u) => u.id === post.userId);
      return `
      <article class="post">
        <h3>${post.title}</h3>
        <div class="meta">লেখক: ${author?.name || "Unknown"} • ${post.updatedAt}</div>
        ${post.image ? `<img src="${post.image}" alt="${post.title}" />` : ""}
        <p>${post.content}</p>
        <div class="inline-actions">
          <button data-like="${post.id}">👍 Like (${post.likes.length})</button>
        </div>
        <div>
          <strong>কমেন্ট (${post.comments.length})</strong>
          ${post.comments
            .map(
              (c) => `<div class="comment"><span class="meta">${c.by} • ${c.createdAt}</span><div>${c.text}</div></div>`
            )
            .join("")}
          ${
            user
              ? `<form data-comment="${post.id}" class="panel"><input name="comment" required placeholder="কমেন্ট লিখুন" /><button type="submit">Add Comment</button></form>`
              : `<p class="meta">কমেন্ট করতে লগইন করুন।</p>`
          }
        </div>
      </article>`;
    })
    .join("");

  wrapper.querySelectorAll("[data-like]").forEach((btn) => {
    btn.onclick = () => {
      const current = sessionUser();
      if (!current) return alert("লাইক করতে লগইন করুন");
      const post = state.posts.find((p) => p.id === btn.dataset.like);
      if (!post.likes.includes(current.id)) post.likes.push(current.id);
      post.updatedAt = now();
      persist();
      renderPublicPosts();
      renderAdmin();
    };
  });

  wrapper.querySelectorAll("form[data-comment]").forEach((form) => {
    form.onsubmit = (e) => {
      e.preventDefault();
      const current = sessionUser();
      if (!current) return;
      const post = state.posts.find((p) => p.id === form.dataset.comment);
      post.comments.push({ by: current.name, text: form.comment.value.trim(), createdAt: now() });
      form.reset();
      post.updatedAt = now();
      persist();
      renderPublicPosts();
      renderAdmin();
    };
  });
}

function renderMyPosts() {
  const user = sessionUser();
  const wrapper = document.getElementById("my-post-list");
  if (!user) {
    wrapper.innerHTML = "";
    return;
  }

  const own = state.posts.filter((p) => p.userId === user.id).reverse();
  if (!own.length) {
    wrapper.innerHTML = "<p class='meta'>আপনি এখনও কোনো পোস্ট তৈরি করেননি।</p>";
    return;
  }

  wrapper.innerHTML = own
    .map(
      (post) => `
      <article class="post">
        <h3>${post.title}</h3>
        <div class="meta">Status: ${post.status} • Updated: ${post.updatedAt}</div>
        <p>${post.content.slice(0, 180)}...</p>
        <div class="inline-actions">
          <button class="secondary" data-edit="${post.id}">Edit</button>
          <button class="danger" data-delete="${post.id}">Delete</button>
        </div>
      </article>`
    )
    .join("");

  wrapper.querySelectorAll("[data-edit]").forEach((btn) => {
    btn.onclick = () => {
      const post = state.posts.find((p) => p.id === btn.dataset.edit);
      const form = document.getElementById("post-form");
      form.postId.value = post.id;
      form.title.value = post.title;
      form.image.value = post.image;
      form.content.value = post.content;
      form.status.value = post.status;
      setView("create-post");
    };
  });

  wrapper.querySelectorAll("[data-delete]").forEach((btn) => {
    btn.onclick = () => {
      state.posts = state.posts.filter((p) => p.id !== btn.dataset.delete);
      persist();
      render();
    };
  });
}

function renderAdmin() {
  const user = sessionUser();
  if (!isAdmin(user)) return;

  const usersEl = document.getElementById("admin-users");
  usersEl.innerHTML = state.users
    .map((u) => `<div class="post"><strong>${u.name}</strong><div class="meta">${u.email} • ${u.role}</div></div>`)
    .join("");

  const postsEl = document.getElementById("admin-posts");
  postsEl.innerHTML = state.posts
    .slice()
    .reverse()
    .map(
      (p) => `<div class="post"><strong>${p.title}</strong><div class="meta">${p.status} • Likes: ${p.likes.length} • Comments: ${p.comments.length}</div></div>`
    )
    .join("");
}

function bindAuthForms() {
  document.getElementById("register-form").onsubmit = (e) => {
    e.preventDefault();
    const form = e.target;
    if (state.users.some((u) => u.email === form.email.value.trim())) {
      return alert("এই ইমেইল আগে থেকেই ব্যবহৃত হয়েছে");
    }

    const user = {
      id: uid(),
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      password: form.password.value,
      avatar: "",
      bio: "",
      role: state.users.length === 0 ? "admin" : "user",
    };

    state.users.push(user);
    state.sessionUserId = user.id;
    persist();
    form.reset();
    setView("profile");
  };

  document.getElementById("login-form").onsubmit = (e) => {
    e.preventDefault();
    const form = e.target;
    const user = state.users.find(
      (u) => u.email === form.email.value.trim() && u.password === form.password.value
    );
    if (!user) return alert("ইমেইল বা পাসওয়ার্ড সঠিক নয়");
    state.sessionUserId = user.id;
    persist();
    form.reset();
    setView("home");
  };
}

function bindProfileForm() {
  document.getElementById("profile-form").onsubmit = (e) => {
    e.preventDefault();
    const user = sessionUser();
    if (!user) return;
    const form = e.target;
    user.name = form.name.value.trim();
    user.avatar = form.avatar.value.trim();
    user.bio = form.bio.value.trim();
    persist();
    render();
    alert("প্রোফাইল আপডেট হয়েছে");
  };
}

function bindPostForm() {
  document.getElementById("post-form").onsubmit = (e) => {
    e.preventDefault();
    const user = sessionUser();
    if (!user) return;

    const form = e.target;
    const postId = form.postId.value;
    const payload = {
      title: form.title.value.trim(),
      image: form.image.value.trim(),
      content: form.content.value.trim(),
      status: form.status.value,
      updatedAt: now(),
    };

    if (postId) {
      const post = state.posts.find((p) => p.id === postId && p.userId === user.id);
      Object.assign(post, payload);
    } else {
      state.posts.push({
        id: uid(),
        userId: user.id,
        likes: [],
        comments: [],
        ...payload,
      });
    }

    persist();
    resetPostForm();
    setView("my-posts");
  };
}

function hydrateProfileForm() {
  const user = sessionUser();
  const form = document.getElementById("profile-form");
  if (!user) {
    form.reset();
    return;
  }
  form.name.value = user.name;
  form.avatar.value = user.avatar || "";
  form.bio.value = user.bio || "";
}

function render() {
  renderTabs();
  renderSessionInfo();
  renderViews();
  hydrateProfileForm();
  renderPublicPosts();
  renderMyPosts();
  renderAdmin();
}

bindAuthForms();
bindProfileForm();
bindPostForm();
render();
