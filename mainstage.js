let mainStageClient;
let currentState = {
    agendaItems: [],
    currentItemIndex: -1,
    agendaTimerRunning: false,
    speakerTimerRunning: false,
    agendaTimeRemaining: 0,
    speakerTimeElapsed: 0,
    totalMeetingTime: 0
};

// Circular timer properties
const CIRCLE_RADIUS = 90;
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS; // ~565.48

async function initializeMainStage() {
    try {
        const session = await window.meet.addon.createAddonSession({
            cloudProjectNumber: "879397453091"
        });
        
        mainStageClient = await session.createMainStageClient();
        console.log('Main stage initialized');
        
        // Listen for state updates from side panel
        mainStageClient.on('activityStateChange', (activityState) => {
            console.log('Received state update:', activityState);
            if (activityState && activityState.additionalData) {
                try {
                    const newState = JSON.parse(activityState.additionalData);
                    updateState(newState);
                } catch (error) {
                    console.error('Failed to parse state:', error);
                }
            }
        });
        
        // Start the display update interval
        setInterval(updateDisplay, 1000);
        
    } catch (error) {
        console.error('Failed to initialize main stage:', error);
    }
}

function updateState(newState) {
    console.log('Updating state with:', newState);
    currentState = { ...currentState, ...newState };
    renderAgenda();
    updateCircularTimers();
}

function renderAgenda() {
    const agendaList = document.getElementById('agendaList');
    
    if (!currentState.agendaItems || currentState.agendaItems.length === 0) {
        agendaList.innerHTML = '<li class="no-items-message">No agenda items yet</li>';
        return;
    }
    
    agendaList.innerHTML = '';
    
    currentState.agendaItems.forEach((item, index) => {
        const li = document.createElement('li');
        li.className = 'agenda-item';
        
        if (index === currentState.currentItemIndex) {
            li.classList.add('active');
        }
        if (item.completed) {
            li.classList.add('completed');
        }
        
        const durationMinutes = Math.floor(item.duration / 60);
        const durationSeconds = item.duration % 60;
        const durationText = `${durationMinutes}:${durationSeconds.toString().padStart(2, '0')}`;
        
        // Calculate time used and remaining for this item
        const timeUsed = item.timeUsedSeconds || 0;
        const timeRemaining = item.duration - timeUsed;
        
        const usedMinutes = Math.floor(Math.abs(timeUsed) / 60);
        const usedSeconds = Math.abs(timeUsed) % 60;
        const usedText = `${usedMinutes}:${usedSeconds.toString().padStart(2, '0')}`;
        
        const remainingMinutes = Math.floor(Math.abs(timeRemaining) / 60);
        const remainingSeconds = Math.abs(timeRemaining) % 60;
        const remainingText = timeRemaining < 0 
            ? `-${remainingMinutes}:${remainingSeconds.toString().padStart(2, '0')}`
            : `${remainingMinutes}:${remainingSeconds.toString().padStart(2, '0')}`;
        
        // Determine timer colour based on remaining time
        let timerClass = '';
        if (index === currentState.currentItemIndex && currentState.agendaTimerRunning) {
            if (timeRemaining < 0) {
                timerClass = 'overtime';
            } else if (timeRemaining <= item.duration * 0.2) {
                timerClass = 'warning';
            }
        }
        
        li.innerHTML = `
            <div class="agenda-item-left">
                <div class="agenda-item-name">${escapeHtml(item.name)}</div>
                <div class="agenda-item-duration">Allocated: ${durationText}</div>
            </div>
            <div class="agenda-item-right">
                <div class="agenda-item-timer ${timerClass}">${remainingText}</div>
                <div class="agenda-item-used">Used: ${usedText}</div>
            </div>
        `;
        
        agendaList.appendChild(li);
    });
}

function updateCircularTimers() {
    const meetingTimerDisplay = document.getElementById('meetingTimerDisplay');
    const meetingProgressCircle = document.getElementById('meetingProgressCircle');
    const speakerTimerDisplay = document.getElementById('speakerTimerDisplay');
    const speakerProgressCircle = document.getElementById('speakerProgressCircle');
    
    // Update meeting time display
    const hours = Math.floor(currentState.totalMeetingTime / 3600);
    const minutes = Math.floor((currentState.totalMeetingTime % 3600) / 60);
    const seconds = currentState.totalMeetingTime % 60;
    meetingTimerDisplay.textContent = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // Update meeting time circle (fills up over 60 minutes)
    const meetingProgress = Math.min(currentState.totalMeetingTime / 3600, 1); // 60 minutes = 3600 seconds
    const meetingOffset = CIRCLE_CIRCUMFERENCE * (1 - meetingProgress);
    meetingProgressCircle.style.strokeDashoffset = meetingOffset;
    
    // Update speaker time display
    const speakerMinutes = Math.floor(currentState.speakerTimeElapsed / 60);
    const speakerSeconds = currentState.speakerTimeElapsed % 60;
    speakerTimerDisplay.textContent = `${speakerMinutes}:${speakerSeconds.toString().padStart(2, '0')}`;
    
    // Update speaker time circle (fills up over 10 minutes)
    const speakerProgress = Math.min(currentState.speakerTimeElapsed / 600, 1); // 10 minutes = 600 seconds
    const speakerOffset = CIRCLE_CIRCUMFERENCE * (1 - speakerProgress);
    speakerProgressCircle.style.strokeDashoffset = speakerOffset;
}

function updateDisplay() {
    // Update circular timers every second
    updateCircularTimers();
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Initialize when the page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeMainStage);
} else {
    initializeMainStage();
}
