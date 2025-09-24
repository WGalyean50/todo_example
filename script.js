// Test To Do App - Main JavaScript File

// Application state
let appState = {
    currentScreen: 'input',
    tasks: [],
    listTitle: ''
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Test To Do App initialized');
    initializeEventListeners();
    loadFromSessionStorage();
});

// Input processing functions
function parseCommaSeparatedTasks(inputString) {
    if (!inputString || inputString.trim() === '') {
        return [];
    }

    // Split by comma and clean up each task
    const tasks = inputString
        .split(',')
        .map(task => task.trim())
        .filter(task => task.length > 0)
        .map(taskText => ({
            id: generateId(),
            text: taskText,
            completed: false,
            order: 0 // Will be set when tasks are ordered
        }));

    // Set order based on array index
    tasks.forEach((task, index) => {
        task.order = index;
    });

    return tasks;
}

function validateInput(inputString) {
    if (!inputString || inputString.trim() === '') {
        return { valid: false, message: 'Please enter at least one task.' };
    }

    if (inputString.length > 1000) {
        return { valid: false, message: 'Input is too long. Please limit to 1000 characters.' };
    }

    const tasks = parseCommaSeparatedTasks(inputString);
    if (tasks.length === 0) {
        return { valid: false, message: 'Please enter valid tasks separated by commas.' };
    }

    return { valid: true, tasks: tasks };
}

// Event handlers
function handleSubmit() {
    const input = document.getElementById('task-input');
    const inputValue = input.value;

    const validation = validateInput(inputValue);

    if (!validation.valid) {
        alert(validation.message);
        return;
    }

    // Store tasks and navigate to task screen
    appState.tasks = validation.tasks;
    appState.currentScreen = 'task';
    saveToSessionStorage();
    navigateToTaskScreen();
}

function navigateToTaskScreen() {
    document.getElementById('input-screen').classList.add('hidden');
    document.getElementById('task-screen').classList.remove('hidden');
    displayTasks();
    displayListTitle();
}

function navigateToInputScreen() {
    document.getElementById('task-screen').classList.add('hidden');
    document.getElementById('input-screen').classList.remove('hidden');
}

// Initialize event listeners
function initializeEventListeners() {
    const submitButton = document.getElementById('submit-button');
    submitButton.addEventListener('click', handleSubmit);

    // Allow Enter key to submit (with Ctrl/Cmd for new line)
    const taskInput = document.getElementById('task-input');
    taskInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            handleSubmit();
        }
    });

    // Add task button event listener
    const addTaskButton = document.getElementById('add-task-button');
    addTaskButton.addEventListener('click', addNewTask);

    // Export button event listener (Phase 4 functionality)
    const exportButton = document.getElementById('export-button');
    exportButton.addEventListener('click', exportToMarkdown);

    // Task editing - click to edit task text
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('task-text') && !e.target.classList.contains('completed')) {
            const taskId = e.target.closest('.task-item').getAttribute('data-task-id');
            makeTaskEditable(e.target, taskId);
        }
    });
}

// Utility functions
function generateId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 5);
}

function saveToSessionStorage() {
    sessionStorage.setItem('todoAppState', JSON.stringify(appState));
}

function loadFromSessionStorage() {
    const saved = sessionStorage.getItem('todoAppState');
    if (saved) {
        appState = JSON.parse(saved);
        // Restore screen state if needed
        if (appState.currentScreen === 'task') {
            navigateToTaskScreen();
            displayTasks();
            displayListTitle();
        }
    }
}

// Phase 3: Task Management Functions
function displayTasks() {
    const taskList = document.getElementById('task-list');
    const tasks = appState.tasks.sort((a, b) => a.order - b.order);

    taskList.innerHTML = '';

    tasks.forEach(task => {
        const taskElement = createTaskElement(task);
        taskList.appendChild(taskElement);
    });

    // Initialize drag and drop after tasks are rendered
    if (window.Sortable && taskList.children.length > 0) {
        initializeDragAndDrop();
    }
}

function createTaskElement(task) {
    const taskDiv = document.createElement('div');
    taskDiv.className = 'task-item';
    taskDiv.setAttribute('data-task-id', task.id);

    taskDiv.innerHTML = `
        <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}
               onchange="toggleTaskCompletion('${task.id}')">
        <span class="task-text ${task.completed ? 'completed' : ''}">${escapeHtml(task.text)}</span>
    `;

    return taskDiv;
}

function displayListTitle() {
    const titleInput = document.getElementById('list-title');
    titleInput.value = appState.listTitle || '';

    // Add event listener for title changes
    titleInput.addEventListener('input', function() {
        appState.listTitle = this.value;
        saveToSessionStorage();
    });
}

function toggleTaskCompletion(taskId) {
    const task = appState.tasks.find(t => t.id === taskId);
    if (task) {
        task.completed = !task.completed;
        saveToSessionStorage();
        displayTasks(); // Refresh display
    }
}

function addNewTask() {
    const newTask = {
        id: generateId(),
        text: 'New task',
        completed: false,
        order: 0 // Will be placed at top
    };

    // Increment order of existing tasks
    appState.tasks.forEach(task => {
        task.order++;
    });

    // Add new task at the beginning
    appState.tasks.unshift(newTask);

    saveToSessionStorage();
    displayTasks();

    // Focus on the new task for editing
    setTimeout(() => {
        const newTaskElement = document.querySelector(`[data-task-id="${newTask.id}"] .task-text`);
        if (newTaskElement) {
            makeTaskEditable(newTaskElement, newTask.id);
        }
    }, 100);
}

function makeTaskEditable(textElement, taskId) {
    const currentText = textElement.textContent;
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentText;
    input.className = 'task-edit-input';

    input.addEventListener('blur', function() {
        finishTaskEdit(this, taskId, textElement);
    });

    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            this.blur();
        }
        if (e.key === 'Escape') {
            textElement.textContent = currentText;
            textElement.style.display = 'inline';
            this.remove();
        }
    });

    textElement.style.display = 'none';
    textElement.parentNode.insertBefore(input, textElement.nextSibling);
    input.focus();
    input.select();
}

function finishTaskEdit(input, taskId, textElement) {
    const newText = input.value.trim();
    if (newText) {
        const task = appState.tasks.find(t => t.id === taskId);
        if (task) {
            task.text = newText;
            textElement.textContent = newText;
            saveToSessionStorage();
        }
    }

    textElement.style.display = 'inline';
    input.remove();
}

function initializeDragAndDrop() {
    const taskList = document.getElementById('task-list');

    if (window.Sortable) {
        Sortable.create(taskList, {
            animation: 150,
            ghostClass: 'sortable-ghost',
            onEnd: function(evt) {
                // Update task order based on new positions
                const taskElements = Array.from(taskList.children);
                taskElements.forEach((element, index) => {
                    const taskId = element.getAttribute('data-task-id');
                    const task = appState.tasks.find(t => t.id === taskId);
                    if (task) {
                        task.order = index;
                    }
                });

                saveToSessionStorage();
            }
        });
    }
}

// Phase 4: Export functionality
function exportToMarkdown() {
    let markdown = '';

    // Add title if exists
    if (appState.listTitle && appState.listTitle.trim()) {
        markdown += `# ${appState.listTitle.trim()}\n\n`;
    }

    // Add tasks in order
    const sortedTasks = appState.tasks.sort((a, b) => a.order - b.order);
    sortedTasks.forEach(task => {
        const checkbox = task.completed ? '[x]' : '[ ]';
        markdown += `- ${checkbox} ${task.text}\n`;
    });

    // Create and download file
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = appState.listTitle ? `${appState.listTitle.trim()}.md` : 'todo-list.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Utility function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}