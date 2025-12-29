// =========================
// Preset category colors
// =========================
const categoryColors = {
  Work: "#4fb9ffff",
  Personal: "#ff42c6ff",
  Other: "#6fcf97"
};

// =========================
// DOM elements
// =========================
const form = document.getElementById("task-form");
const taskList = document.getElementById("task-list");
const filterCategory = document.getElementById("filter-category");
const sortBtn = document.getElementById("sort-due-date-btn");

// =========================
// State
// =========================
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let lastDeletedTask = null;

// =========================
// Save to localStorage
// =========================
function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

// =========================
// Add task
// =========================
form.addEventListener("submit", function (e) {
  e.preventDefault();

  const taskText = document.getElementById("task-input").value.trim();
  if (!taskText) return;

  const task = {
    id: Date.now(),
    text: taskText,
    category: document.getElementById("category-picker").value,
    fontColor: document.getElementById("color-picker").value,
    categoryColor: categoryColors[
      document.getElementById("category-picker").value
    ],
    dueDate: document.getElementById("due-date-input").value,
    priority: "Normal",
    photo: document.getElementById("photo-input").files[0]
      ? URL.createObjectURL(
          document.getElementById("photo-input").files[0]
        )
      : null
  };

  tasks.push(task);
  saveTasks();
  renderTasks();
  form.reset();
});

// =========================
// Render tasks
// =========================
function renderTasks() {
  taskList.innerHTML = "";

  let visibleTasks = [...tasks];
  const filter = filterCategory.value;

  if (filter !== "All") {
    visibleTasks = visibleTasks.filter(t => t.category === filter);
  }

  visibleTasks.forEach(task => {
    const li = document.createElement("li");

    // Priority indicator
    li.style.borderLeft =
      task.priority === "High"
        ? "6px solid #ff4d4d"
        : task.priority === "Low"
        ? "6px solid #6fcf97"
        : `6px solid ${task.categoryColor}`;

    const content = document.createElement("div");
    content.className = "task-content";

    // Category
    const cat = document.createElement("span");
    cat.className = "category-label";
    cat.style.background = task.categoryColor;
    cat.textContent = task.category;

    // Text
    const text = document.createElement("span");
    text.className = "task-text";
    text.textContent = task.text;
    text.style.color = task.fontColor;

    content.appendChild(cat);
    content.appendChild(text);

    // Due date
    if (task.dueDate) {
      const due = document.createElement("span");
      due.className = "due-date-label";
      due.textContent = task.dueDate;
      content.appendChild(due);
    }

    // Photo
    if (task.photo) {
      const img = document.createElement("img");
      img.src = task.photo;
      img.className = "note-photo";
      content.appendChild(img);
    }

    // Buttons
    const buttons = document.createElement("div");
    buttons.className = "task-buttons";

    const editBtn = document.createElement("button");
    editBtn.className = "remove-btn";
    editBtn.textContent = "Edit";
    editBtn.onclick = () => editTask(task.id);

    const priorityBtn = document.createElement("button");
    priorityBtn.className = "remove-btn";
    priorityBtn.textContent = task.priority;
    priorityBtn.onclick = () => togglePriority(task.id);

    const removeBtn = document.createElement("button");
    removeBtn.className = "remove-btn";
    removeBtn.textContent = "Remove";
    removeBtn.onclick = () => deleteTask(task.id);

    buttons.append(editBtn, priorityBtn, removeBtn);

    li.append(content, buttons);
    taskList.appendChild(li);
  });
}

// =========================
// Edit task
// =========================
function editTask(id) {
  const task = tasks.find(t => t.id === id);
  const newText = prompt("Edit task:", task.text);
  if (newText !== null && newText.trim() !== "") {
    task.text = newText.trim();
    saveTasks();
    renderTasks();
  }
}

// =========================
// Toggle priority
// =========================
function togglePriority(id) {
  const task = tasks.find(t => t.id === id);
  task.priority =
    task.priority === "Normal"
      ? "High"
      : task.priority === "High"
      ? "Low"
      : "Normal";

  saveTasks();
  renderTasks();
}

// =========================
// Delete + undo
// =========================
function deleteTask(id) {
  lastDeletedTask = tasks.find(t => t.id === id);
  tasks = tasks.filter(t => t.id !== id);
  saveTasks();
  renderTasks();
  showUndo();
}

function showUndo() {
  const undo = document.createElement("div");
  undo.textContent = "Task deleted — Undo";
  undo.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #333;
    color: #fff;
    padding: 10px 16px;
    border-radius: 8px;
    cursor: pointer;
    z-index: 999;
  `;

  undo.onclick = () => {
    if (lastDeletedTask) {
      tasks.push(lastDeletedTask);
      saveTasks();
      renderTasks();
      lastDeletedTask = null;
    }
    undo.remove();
  };

  document.body.appendChild(undo);
  setTimeout(() => undo.remove(), 4000);
}

// =========================
// Filter & sort
// =========================
filterCategory.addEventListener("change", renderTasks);

sortBtn.addEventListener("click", () => {
  tasks.sort((a, b) => {
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate) - new Date(b.dueDate);
  });
  saveTasks();
  renderTasks();
});

// =========================
// Initial render
// =========================
renderTasks();
