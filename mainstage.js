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
}

function renderAgenda() {
    const agendaList = document.getElementById('agendaList');
    
    if (!currentState.agendaItems || currentState.agendaItems.length === 0) {
        agendaList.innerHTML = '<li class="no-items-message">No agenda items yet</li>';
        document.getElementById('circularTimerSection').style.display = 'none';
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
    
    // Also update the circular timer when agenda changes
    updateCircularTimer();
}

function updateCircularTimer() {
    const circularSection = document.getElementById('circularTimerSection');
    const circularItemName = document.getElementById('circularItemName');
    const circularTimerDisplay = document.getElementById('circularTimerDisplay');
    const circularTimerLabel = document.getElementById('circularTimerLabel');
    const progressCircle = document.getElementById('circularProgressCircle');
    const speakerTimerDisplay = document.getElementById('speakerTimerDisplay');
    const speakerProgressCircle = document.getElementById('speakerProgressCircle');
    
    // Only show circular timer if there's an active item
    if (currentState.currentItemIndex >= 0 && currentState.currentItemIndex < currentState.agendaItems.length) {
        const currentItem = currentState.agendaItems[currentState.currentItemIndex];
        const timeUsed = currentItem.timeUsedSeconds || 0;
        const timeRemaining = currentItem.duration - timeUsed;
        
        circularSection.style.display = 'flex';
        circularItemName.textContent = currentItem.name;
        
        // Calculate progress for the agenda item circular display
        let progress;
        if (timeRemaining >= 0) {
            // Normal countdown - circle depletes as time is used
            progress = timeRemaining / currentItem.duration;
        } else {
            // Overtime - circle is empty but we still show the negative time
            progress = 0;
        }
        
        // Update the agenda item circle
        const offset = CIRCLE_CIRCUMFERENCE * (1 - progress);
        progressCircle.style.strokeDashoffset = offset;
        
        // Update colour based on remaining time
        progressCircle.classList.remove('warning', 'overtime');
        if (timeRemaining < 0) {
            progressCircle.classList.add('overtime');
        } else if (timeRemaining <= currentItem.duration * 0.2) {
            progressCircle.classList.add('warning');
        }
        
        // Format and display agenda item time
        const displayMinutes = Math.floor(Math.abs(timeRemaining) / 60);
        const displaySeconds = Math.abs(timeRemaining) % 60;
        const timeText = timeRemaining < 0 
            ? `-${displayMinutes}:${displaySeconds.toString().padStart(2, '0')}`
            : `${displayMinutes}:${displaySeconds.toString().padStart(2, '0')}`;
        
        circularTimerDisplay.textContent = timeText;
        circularTimerLabel.textContent = timeRemaining >= 0 ? 'Remaining' : 'Overtime';
        
        // Update speaker timer display
        const speakerMinutes = Math.floor(currentState.speakerTimeElapsed / 60);
        const speakerSeconds = currentState.speakerTimeElapsed % 60;
        speakerTimerDisplay.textContent = `${speakerMinutes}:${speakerSeconds.toString().padStart(2, '0')}`;
        
        // Speaker timer circle fills up (counts up)
        // Cap at full circle after 10 minutes (600 seconds)
        const speakerProgress = Math.min(currentState.speakerTimeElapsed / 600, 1);
        const speakerOffset = CIRCLE_CIRCUMFERENCE * (1 - speakerProgress);
        speakerProgressCircle.style.strokeDashoffset = speakerOffset;
        
    } else {
        circularSection.style.display = 'none';
    }
}

function updateDisplay() {
    // Update total meeting time
    const totalMeetingTimeEl = document.getElementById('totalMeetingTime');
    const hours = Math.floor(currentState.totalMeetingTime / 3600);
    const minutes = Math.floor((currentState.totalMeetingTime % 3600) / 60);
    const seconds = currentState.totalMeetingTime % 60;
    totalMeetingTimeEl.textContent = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // Update circular timer if timer is running
    if (currentState.agendaTimerRunning && 
        currentState.currentItemIndex >= 0 && 
        currentState.currentItemIndex < currentState.agendaItems.length) {
        updateCircularTimer();
    }
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
