// Main Stage JavaScript - Participant View

let mainStageClient;
let meetingState = {
    agendaItems: [],
    currentAgendaIndex: -1,
    agendaTimerState: 'stopped',
    agendaTimeRemaining: 0,
    speakerTimerState: 'stopped',
    speakerTimeElapsed: 0
};

// Initialize the main stage
async function initializeMainStage() {
    try {
        const session = await meet.addon.createAddonSession({
            cloudProjectNumber: '879397453091'
        });
        
        mainStageClient = await session.createMainStageClient();
        console.log('Main stage initialized');
        
        // Load initial state from localStorage
        loadStateFromStorage();
        
        // Listen for localStorage changes from side panel
        window.addEventListener('storage', (e) => {
            if (e.key === 'meeting-state' && e.newValue) {
                meetingState = JSON.parse(e.newValue);
                updateDisplay();
            }
        });
        
        // Also poll localStorage regularly as backup
        setInterval(() => {
            loadStateFromStorage();
        }, 500);
        
    } catch (error) {
        console.error('Failed to initialize main stage:', error);
    }
}

function loadStateFromStorage() {
    const saved = localStorage.getItem('meeting-state');
    if (saved) {
        const newState = JSON.parse(saved);
        // Only update if state actually changed
        if (JSON.stringify(newState) !== JSON.stringify(meetingState)) {
            meetingState = newState;
            updateDisplay();
        }
    }
}
// Update all displays
function updateDisplay() {
    renderAgendaDisplay();
    updateAgendaTimerDisplay();
    updateSpeakerTimerDisplay();
}

// Render agenda items
function renderAgendaDisplay() {
    const container = document.getElementById('agenda-items-display');
    
    if (meetingState.agendaItems.length === 0) {
        container.innerHTML = '<p style="color: #5f6368; font-style: italic; text-align: center;">No agenda items</p>';
        return;
    }
    
    container.innerHTML = meetingState.agendaItems.map((item, index) => {
        let statusClass = '';
        if (item.completed) {
            statusClass = 'completed';
        } else if (index === meetingState.currentAgendaIndex) {
            statusClass = 'active';
        } else if (index > meetingState.currentAgendaIndex || meetingState.currentAgendaIndex === -1) {
            statusClass = 'upcoming';
        }
        
        return `
            <div class="display-agenda-item ${statusClass}">
                <span>${item.name}</span>
                <span>${item.durationMinutes} min</span>
            </div>
        `;
    }).join('');
}

// Update agenda timer display
function updateAgendaTimerDisplay() {
    const nameDisplay = document.getElementById('current-item-name');
    const timerDisplay = document.getElementById('agenda-timer');
    const statusDisplay = document.getElementById('agenda-status');
    
    // Update current item name
    if (meetingState.currentAgendaIndex >= 0 && meetingState.currentAgendaIndex < meetingState.agendaItems.length) {
        const item = meetingState.agendaItems[meetingState.currentAgendaIndex];
        nameDisplay.textContent = item.name;
    } else {
        nameDisplay.textContent = '-';
    }
    
    // Update timer
    const minutes = Math.floor(meetingState.agendaTimeRemaining / 60);
    const seconds = meetingState.agendaTimeRemaining % 60;
    const timeString = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    timerDisplay.textContent = timeString;
    
    // Apply warning/danger colors
    timerDisplay.classList.remove('warning', 'danger');
    if (meetingState.agendaTimeRemaining <= 60 && meetingState.agendaTimeRemaining > 0) {
        timerDisplay.classList.add('warning');
    } else if (meetingState.agendaTimeRemaining === 0) {
        timerDisplay.classList.add('danger');
    }
    
    // Update status
    statusDisplay.className = 'status';
    switch (meetingState.agendaTimerState) {
        case 'running':
            statusDisplay.textContent = 'Running';
            statusDisplay.classList.add('running');
            break;
        case 'paused':
            statusDisplay.textContent = 'Paused';
            statusDisplay.classList.add('paused');
            break;
        case 'stopped':
            statusDisplay.textContent = 'Stopped';
            statusDisplay.classList.add('stopped');
            break;
    }
}

// Update speaker timer display
function updateSpeakerTimerDisplay() {
    const timerDisplay = document.getElementById('speaker-timer');
    const statusDisplay = document.getElementById('speaker-status');
    
    // Update timer
    const minutes = Math.floor(meetingState.speakerTimeElapsed / 60);
    const seconds = meetingState.speakerTimeElapsed % 60;
    const timeString = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    timerDisplay.textContent = timeString;
    
    // Apply warning colors for long speakers (over 3 minutes)
    timerDisplay.classList.remove('warning', 'danger');
    if (meetingState.speakerTimeElapsed >= 180 && meetingState.speakerTimeElapsed < 300) {
        timerDisplay.classList.add('warning');
    } else if (meetingState.speakerTimeElapsed >= 300) {
        timerDisplay.classList.add('danger');
    }
    
    // Update status
    statusDisplay.className = 'status';
    switch (meetingState.speakerTimerState) {
        case 'running':
            statusDisplay.textContent = 'Speaking';
            statusDisplay.classList.add('running');
            break;
        case 'paused':
            statusDisplay.textContent = 'Paused';
            statusDisplay.classList.add('paused');
            break;
        case 'stopped':
            statusDisplay.textContent = 'Ready';
            statusDisplay.classList.add('stopped');
            break;
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    initializeMainStage();
    
    // Update display regularly
    setInterval(() => {
        updateDisplay();
    }, 100);
});
