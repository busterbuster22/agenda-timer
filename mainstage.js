let mainStageClient;
let coDoingClient;
let currentState = {
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

// Circular timer properties
const CIRCLE_RADIUS = 90;
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS; // ~565.48

async function initializeMainStage() {
    try {
        const session = await window.meet.addon.createAddonSession({
            cloudProjectNumber: "879397453091"
        });

        mainStageClient = await session.createMainStageClient();

        // Create CoDoingClient to receive state updates from side panel
        coDoingClient = await session.createCoDoingClient({
            activityTitle: "Agenda Timer",
            onCoDoingStateChanged(coDoingState) {
                console.log('Received CoDoing state update');
                try {
                    // Convert Uint8Array back to JSON string and parse
                    const stateString = new TextDecoder().decode(coDoingState.bytes);
                    const newState = JSON.parse(stateString);
                    updateState(newState);
                } catch (error) {
                    console.error('Failed to parse CoDoing state:', error);
                }
            }
        });

        console.log('Main stage initialized with CoDoing client');

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
        
        if (index === currentState.currentAgendaIndex) {
            li.classList.add('active');
        }
        if (item.completed) {
            li.classList.add('completed');
        }
        
        const durationMinutes = item.durationMinutes;
        const durationText = `${durationMinutes} min`;
        
        // Calculate time used and remaining for this item
        const timeUsed = item.timeUsedSeconds || 0;
        const totalDuration = item.durationMinutes * 60; // Convert to seconds
        const timeRemaining = totalDuration - timeUsed;
        
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
        if (index === currentState.currentAgendaIndex && currentState.agendaTimerState === 'running') {
            if (timeRemaining < 0) {
                timerClass = 'overtime';
            } else if (timeRemaining <= totalDuration * 0.2) {
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
    const totalSeconds = currentState.meetingElapsedSeconds || 0;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    meetingTimerDisplay.textContent = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // Update meeting time circle (fills up over 1 hour)
    const meetingProgress = Math.min(totalSeconds / 3600, 1); // 1 hour = 3600 seconds
    const meetingOffset = CIRCLE_CIRCUMFERENCE * (1 - meetingProgress);
    meetingProgressCircle.style.strokeDashoffset = meetingOffset;
    
    // Update speaker time display
    const speakerSeconds = currentState.speakerTimeElapsed || 0;
    const speakerMinutes = Math.floor(speakerSeconds / 60);
    const speakerSecs = speakerSeconds % 60;
    speakerTimerDisplay.textContent = `${speakerMinutes}:${speakerSecs.toString().padStart(2, '0')}`;
    
    // Update speaker time circle (fills up over 10 minutes)
    const speakerProgress = Math.min(speakerSeconds / 600, 1); // 10 minutes = 600 seconds
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
