// ==============================
// Utility Functions
// ==============================

// Escape HTML to prevent XSS
function escapeHTML(str) {
  return str.replace(/[&<>"'`=\/]/g, function (s) {
    return ({
      '&': '&', '<': '<', '>': '>', '"': '"',
      "'": '&#39;', '`': '&#96;', '=': '&#61;', '/': '&#47;'
    })[s];
  });
}

// Debounce utility
function debounce(fn, delay) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), delay);
  };
}

// Robust RGB to HEX conversion
function rgbToHex(color) {
  if (!color) return '#222222';
  if (color.startsWith('#')) return color;
  // Handle rgb/rgba
  const rgbArr = color.match(/\d+/g);
  if (rgbArr && rgbArr.length >= 3) {
    return (
      '#' +
      rgbArr
        .slice(0, 3)
        .map(x => {
          const hex = parseInt(x).toString(16);
          return hex.length === 1 ? '0' + hex : hex;
        })
        .join('')
    );
  }
  // Fallback for named colors
  const temp = document.createElement('div');
  temp.style.color = color;
  document.body.appendChild(temp);
  const computed = getComputedStyle(temp).color;
  document.body.removeChild(temp);
  return rgbToHex(computed);
}

// Get today's date as yyyy-mm-dd
function getTodayDateString() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// ==============================
// TaskManager Class
// ==============================

class TaskManager {
  constructor() {
    this.sortAscending = true;
    this.editingIdx = null;
    this.loading = false;
    this.init();
  }

  // ========== Initialization ==========
  init() {
    document.getElementById('due-date-input').value = getTodayDateString();
    this.renderTasks();
    document.getElementById('filter-category').addEventListener('change', debounce(() => this.renderTasks(), 200));
    document.getElementById('sort-due-date-btn').addEventListener('click', debounce(() => {
      this.sortAscending = !this.sortAscending;
      this.renderTasks();
    }, 200));
    document.getElementById('task-form').addEventListener('submit', (e) => this.handleFormSubmit(e));
  }

  // ========== Storage Functions ==========
  getTasksFromStorage() {
    try {
      return JSON.parse(localStorage.getItem('tasks')) || [];
    } catch (e) {
      alert('Error loading tasks from storage.');
      return [];
    }
  }

  saveTasksToStorage(tasks) {
    try {
      localStorage.setItem('tasks', JSON.stringify(tasks));
    } catch (e) {
      alert('Error saving tasks. Storage might be full or disabled.');
    }
  }

  // ========== Task Management Functions ==========
  handleFormSubmit(e) {
    e.preventDefault();
    const taskInput = document.getElementById('task-input');
    const colorPicker = document.getElementById('color-picker');
    const categoryPicker = document.getElementById('category-picker');
    const categoryColorPicker = document.getElementById('category-color-picker');
    const photoInput = document.getElementById('photo-input');
    const dueDateInput = document.getElementById('due-date-input');
    const taskText = taskInput.value.trim();
    const fontColor = colorPicker.value;
    const category = categoryPicker.value;
    const categoryColor = categoryColorPicker.value;
    let dueDate = dueDateInput.value;
    if (!dueDate) dueDate = getTodayDateString();
    const file = photoInput.files[0];

    // Validation
    if (!taskText) {
      alert('Task description cannot be empty.');
      return;
    }
    if (file && !file.type.startsWith('image/')) {
      alert('Only image files are allowed.');
      return;
    }
    if (file && file.size > 2 * 1024 * 1024) { // 2MB limit
      alert('Image size should be less than 2MB.');
      return;
    }

    // Loading indicator
    this.setLoading(true);

    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        this.saveNewTask(taskText, fontColor, category, categoryColor, evt.target.result, dueDate);
        this.setLoading(false);
      };
      reader.onerror = () => {
        alert('Error loading image.');
        this.setLoading(false);
      };
      reader.readAsDataURL(file);
    } else {
      this.saveNewTask(taskText, fontColor, category, categoryColor, null, dueDate);
      this.setLoading(false);
    }
    taskInput.value = '';
    photoInput.value = '';
    dueDateInput.value = '';
    document.getElementById('due-date-input').value = getTodayDateString();
  }

  saveNewTask(text, color, category, categoryColor, photo, dueDate) {
    const tasks = this.getTasksFromStorage();
    tasks.push({ text, color, category, categoryColor, photo, dueDate });
    this.saveTasksToStorage(tasks);
    this.renderTasks();
  }

  // ========== Rendering Functions ==========
  renderTasks() {
    const taskList = document.getElementById('task-list');
    taskList.innerHTML = '';
    let tasks = this.getTasksFromStorage();
    const filter = document.getElementById('filter-category').value;

    // Filter by category
    tasks = tasks.filter(task => filter === 'All' || task.category === filter);

    // Sort by due date
    tasks.sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      if (this.sortAscending) {
        return new Date(a.dueDate) - new Date(b.dueDate);
      } else {
        return new Date(b.dueDate) - new Date(a.dueDate);
      }
    });

    tasks.forEach((task, idx) => {
      if (this.editingIdx === idx) {
        this.renderEditTask(task, idx, taskList);
      } else {
        this.renderTask(task, idx, taskList);
      }
    });
  }

  renderTask(task, idx, taskList) {
    const li = document.createElement('li');

    // Content container (left)
    const contentDiv = document.createElement('div');
    contentDiv.className = 'task-content';

    // Photo (if present)
    if (task.photo) {
      const img = document.createElement('img');
      img.src = task.photo;
      img.className = 'note-photo';
      img.alt = `Task photo for ${task.category}`;
      contentDiv.appendChild(img);
    }

    // Category label
    const categorySpan = document.createElement('span');
    categorySpan.className = 'category-label';
    categorySpan.textContent = task.category;
    categorySpan.style.background = task.categoryColor || '#62b7d9';
    contentDiv.appendChild(categorySpan);

    // Due date label
    const dueDateSpan = document.createElement('span');
    dueDateSpan.className = 'due-date-label';
    dueDateSpan.textContent = task.dueDate ? `Due: ${task.dueDate}` : '';
    contentDiv.appendChild(dueDateSpan);

    // Task text
    const span = document.createElement('span');
    span.className = 'task-text';
    span.innerHTML = escapeHTML(task.text);
    span.style.color = task.color;
    contentDiv.appendChild(span);

    // Buttons container (right)
    const buttonsDiv = document.createElement('div');
    buttonsDiv.className = 'task-buttons';

    // Edit button
    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.className = 'remove-btn';
    editBtn.setAttribute('aria-label', 'Edit task');
    editBtn.onclick = () => {
      this.editingIdx = idx;
      this.renderTasks();
      setTimeout(() => {
        const saveBtn = document.querySelector('.task-buttons button');
        if (saveBtn) saveBtn.focus();
      }, 0);
    };
    buttonsDiv.appendChild(editBtn);

    // Remove button
    const removeBtn = document.createElement('button');
    removeBtn.textContent = 'Remove';
    removeBtn.className = 'remove-btn';
    removeBtn.setAttribute('aria-label', 'Remove task');
    removeBtn.onclick = () => {
      if (confirm('Delete task?')) {
        const tasks = this.getTasksFromStorage();
        tasks.splice(idx, 1);
        this.saveTasksToStorage(tasks);
        this.editingIdx = null;
        this.renderTasks();
      }
    };
    buttonsDiv.appendChild(removeBtn);

    li.appendChild(contentDiv);
    li.appendChild(buttonsDiv);
    taskList.appendChild(li);
  }

  renderEditTask(task, idx, taskList) {
    const li = document.createElement('li');

    // Content container (left)
    const contentDiv = document.createElement('div');
    contentDiv.className = 'task-content';

    // Photo (if present)
    if (task.photo) {
      const img = document.createElement('img');
      img.src = task.photo;
      img.className = 'note-photo';
      img.alt = `Task photo for ${task.category}`;
      contentDiv.appendChild(img);
    }

    // Template for edit fields
    contentDiv.innerHTML += `
      <select aria-label="Edit category" style="margin-right:6px; border-radius:8px; padding:4px;">
        <option value="Work"${task.category === 'Work' ? ' selected' : ''}>Work</option>
        <option value="Personal"${task.category === 'Personal' ? ' selected' : ''}>Personal</option>
        <option value="Other"${task.category === 'Other' ? ' selected' : ''}>Other</option>
      </select>
      <input type="color" aria-label="Edit category color" value="${task.categoryColor || '#62b7d9'}" style="margin-right:6px;">
      <input type="date" aria-label="Edit due date" value="${task.dueDate || getTodayDateString()}" style="margin-right:6px;">
      <input type="text" aria-label="Edit task text" value="${escapeHTML(task.text)}" style="flex:1; margin-right:6px;">
      <input type="color" aria-label="Edit font color" value="${rgbToHex(task.color)}" style="margin-right:6px;">
      <input type="file" aria-label="Edit photo" accept="image/*" style="margin-right:6px;">
    `;

    // Buttons container (right)
    const buttonsDiv = document.createElement('div');
    buttonsDiv.className = 'task-buttons';

    // Save button
    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Save';
    saveBtn.className = 'remove-btn';
    saveBtn.style.background = '#62b7d9';
    saveBtn.style.color = '#fff';
    saveBtn.setAttribute('aria-label', 'Save task');
    saveBtn.onclick = () => {
      const fields = contentDiv.querySelectorAll('select, input');
      const [categoryInput, categoryColorInput, dueDateInput, textInput, colorInput, photoInput] = fields;
      // Validation
      if (!textInput.value.trim()) {
        alert('Task description cannot be empty.');
        return;
      }
      if (photoInput.files[0] && !photoInput.files[0].type.startsWith('image/')) {
        alert('Only image files are allowed.');
        return;
      }
      if (photoInput.files[0] && photoInput.files[0].size > 2 * 1024 * 1024) {
        alert('Image size should be less than 2MB.');
        return;
      }
      // Loading indicator
      this.setLoading(true);
      const tasks = this.getTasksFromStorage();
      const updateTask = (photoData) => {
        tasks[idx] = {
          text: textInput.value,
          color: colorInput.value,
          category: categoryInput.value,
          categoryColor: categoryColorInput.value,
          photo: photoData,
          dueDate: dueDateInput.value || getTodayDateString()
        };
        this.saveTasksToStorage(tasks);
        this.editingIdx = null;
        this.setLoading(false);
        this.renderTasks();
      };
      if (photoInput.files[0]) {
        const reader = new FileReader();
        reader.onload = (evt) => updateTask(evt.target.result);
        reader.onerror = () => {
          alert('Error loading image.');
          this.setLoading(false);
        };
        reader.readAsDataURL(photoInput.files[0]);
      } else {
        updateTask(task.photo);
      }
    };
    buttonsDiv.appendChild(saveBtn);

    // Cancel button
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.className = 'remove-btn';
    cancelBtn.setAttribute('aria-label', 'Cancel edit');
    cancelBtn.onclick = () => {
      this.editingIdx = null;
      this.renderTasks();
    };
    buttonsDiv.appendChild(cancelBtn);

    li.appendChild(contentDiv);
    li.appendChild(buttonsDiv);
    taskList.appendChild(li);

    // Focus on save button for accessibility
    setTimeout(() => saveBtn.focus(), 0);

    // Keyboard navigation: Enter to save, Esc to cancel
    li.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') saveBtn.click();
      if (e.key === 'Escape') cancelBtn.click();
    });
  }

  // ========== Loading Indicator ==========
  setLoading(isLoading) {
    this.loading = isLoading;
    let loader = document.getElementById('loading-indicator');
    if (isLoading) {
      if (!loader) {
        loader = document.createElement('div');
        loader.id = 'loading-indicator';
        loader.setAttribute('role', 'status');
        loader.setAttribute('aria-live', 'polite');
        loader.style.position = 'fixed';
        loader.style.top = '20px';
        loader.style.right = '20px';
        loader.style.background = '#62b7d9';
        loader.style.color = '#fff';
        loader.style.padding = '10px 20px';
        loader.style.borderRadius = '8px';
        loader.style.zIndex = 1000;
        loader.textContent = 'Loading...';
        document.body.appendChild(loader);
      }
    } else if (loader) {
      loader.remove();
    }
  }
}

// ==============================
// Initialize TaskManager
// ==============================
window.taskManager = new TaskManager();