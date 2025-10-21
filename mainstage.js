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
        // Replace 'YOUR_CLOUD_PROJECT_NUMBER' with your actual Google Cloud project number
        const session = await meet.addon.createAddonSession({
            cloudProjectNumber: 'YOUR_CLOUD_PROJECT_NUMBER'
        });
        
        mainStageClient = await session.createMainStageClient();
        
        console.log('Main stage initialized');
        
        // Get initial state
        const activityState = await mainStageClient.getActivityState();
        if (activityState && activityState.additionalData) {
            meetingState = JSON.parse(activityState.additionalData);
            updateDisplay();
        }
        
        // Listen for state changes
        mainStageClient.addStateChangedListener((state) => {
            if (state && state.additionalData) {
                meetingState = JSON.parse(state.additionalData);
                updateDisplay();
            }
        });
        
    } catch (error) {
        console.error('Failed to initialize main stage:', error);
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
