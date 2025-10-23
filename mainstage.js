// Main Stage JavaScript - Participant View

let mainStageClient;
let meetingState = {
    agendaItems: [],
    currentAgendaIndex: -1,
    agendaTimerState: 'stopped',
    agendaTimeRemaining: 0,
    speakerTimerState: 'stopped',
    speakerTimeElapsed: 0,
    meetingStartTime: null,
    meetingEndTime: null,
    meetingElapsedSeconds: 0
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
    updateMeetingTimeDisplay();
}

// Update meeting time display
function updateMeetingTimeDisplay() {
    const container = document.getElementById('meeting-time-container');
    
    if (!meetingState.meetingStartTime || !meetingState.meetingEndTime) {
        container.style.display = 'none';
        return;
    }
    
    container.style.display = 'block';
    
    const elapsed = meetingState.meetingElapsedSeconds;
    const totalDuration = Math.floor((meetingState.meetingEndTime - meetingState.meetingStartTime) / 1000);
    const remaining = Math.max(0, totalDuration - elapsed);
    
    const elapsedStr = formatTime(elapsed);
    const remainingStr = formatTime(remaining);
    const endTimeStr = new Date(meetingState.meetingEndTime).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
    });
    
    document.getElementById('meeting-elapsed').textContent = elapsedStr;
    document.getElementById('meeting-remaining').textContent = remainingStr;
    document.getElementById('meeting-end-time').textContent = endTimeStr;
    
    // Apply warning/danger classes
    const remainingElement = document.getElementById('meeting-remaining');
    remainingElement.classList.remove('warning', 'danger');
    if (remaining === 0) {
        remainingElement.classList.add('danger');
    } else if (remaining < 300) { // Less than 5 minutes
        remainingElement.classList.add('warning');
    }
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
        
        const allocatedSeconds = item.durationMinutes * 60;
        const usedSeconds = item.timeUsedSeconds || 0;
        const remainingSeconds = Math.max(0, allocatedSeconds - usedSeconds);
        const isOvertime = usedSeconds > allocatedSeconds;
        
        const usedStr = formatTime(usedSeconds);
        const remainingStr = formatTime(remainingSeconds);
        const overtimeStr = isOvertime ? formatTime(usedSeconds - allocatedSeconds) : '';
        
        let progressPercentage = Math.min(100, (usedSeconds / allocatedSeconds) * 100);
        let progressClass = '';
        if (isOvertime) {
            progressClass = 'overtime';
            progressPercentage = 100;
        } else if (remainingSeconds < 60) {
            progressClass = 'warning';
        }
        
        return `
            <div class="display-agenda-item ${statusClass}">
                <div class="agenda-item-header">
                    <span class="agenda-item-name">${item.name}</span>
                    <span class="agenda-item-allocated">${item.durationMinutes} min</span>
                </div>
                <div class="agenda-item-progress">
                    <div class="progress-bar">
                        <div class="progress-fill ${progressClass}" style="width: ${progressPercentage}%"></div>
                    </div>
                    <div class="agenda-item-times">
                        <span class="time-label">Used: <strong class="${isOvertime ? 'danger' : ''}">${usedStr}</strong></span>
                        <span class="time-label">Left: <strong class="${isOvertime ? 'danger' : (remainingSeconds < 60 ? 'warning' : '')}">${isOvertime ? '-' + overtimeStr : remainingStr}</strong></span>
                    </div>
                </div>
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
    const minutes = Math.floor(Math.abs(meetingState.agendaTimeRemaining) / 60);
    const seconds = Math.abs(meetingState.agendaTimeRemaining) % 60;
    const timeString = `${meetingState.agendaTimeRemaining < 0 ? '-' : ''}${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    timerDisplay.textContent = timeString;
    
    // Apply warning/danger colors
    timerDisplay.classList.remove('warning', 'danger');
    if (meetingState.agendaTimeRemaining < 0) {
        timerDisplay.classList.add('danger');
    } else if (meetingState.agendaTimeRemaining <= 60 && meetingState.agendaTimeRemaining > 0) {
        timerDisplay.classList.add('warning');
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
    const timeString = formatTime(meetingState.speakerTimeElapsed);
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

// Utility function
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    initializeMainStage();
    
    // Update display regularly
    setInterval(() => {
        updateDisplay();
    }, 100);
});
