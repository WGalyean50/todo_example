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
        }
    }
}