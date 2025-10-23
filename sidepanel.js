// Side Panel JavaScript - Facilitator Controls

let sidePanelClient;
let meetingState = {
    agendaItems: [],
    currentAgendaIndex: -1,
    agendaTimerState: 'stopped', // 'stopped', 'running', 'paused'
    agendaTimeRemaining: 0,
    speakerTimerState: 'stopped',
    speakerTimeElapsed: 0
};

let agendaTimerInterval;
let speakerTimerInterval;

// Initialize the add-on
async function initializeSidePanel() {
    try {
        // Replace 'YOUR_CLOUD_PROJECT_NUMBER' with your actual Google Cloud project number
        const session = await meet.addon.createAddonSession({
            cloudProjectNumber: '879397453091'
        });
        
        sidePanelClient = await session.createSidePanelClient();
        
        console.log('Side panel initialized');
        
        // Set up the button to launch the main stage
        document.getElementById('start-activity').addEventListener('click', async () => {
            await startMainStage();
        });
        
        // Load saved agenda items from localStorage
        loadAgendaFromStorage();
        renderAgendaList();
        
    } catch (error) {
        console.error('Failed to initialize side panel:', error);
    }
}

// Start the main stage activity (visible to all participants)
async function startMainStage() {
    try {
        await sidePanelClient.startActivity({
            mainStageUrl: 'https://agenda-timer.netlify.app/mainstage.html'
        });
        console.log('Main stage started');
    } catch (error) {
        console.error('Failed to start main stage:', error);
        // If it's already running, that's okay
        if (error.message && error.message.includes('activity is ongoing')) {
            console.log('Main stage is already active');
        }
    }
}

// Broadcast state updates to main stage
function broadcastState() {
    if (sidePanelClient) {
        sidePanelClient.setActivityState({
            additionalData: JSON.stringify(meetingState)
        }).catch(err => console.error('Failed to broadcast state:', err));
    }
}

function startStateBroadcast() {
    // Broadcast state every second when timers are running
    setInterval(() => {
        if (meetingState.agendaTimerState === 'running' || meetingState.speakerTimerState === 'running') {
            broadcastState();
        }
    }, 1000);
}

// Agenda Management
function addAgendaItem() {
    const nameInput = document.getElementById('new-agenda-item');
    const durationInput = document.getElementById('agenda-duration');
    
    const name = nameInput.value.trim();
    const duration = parseInt(durationInput.value);
    
    if (!name || !duration || duration < 1) {
        alert('Please enter a valid agenda item name and duration');
        return;
    }
    
    meetingState.agendaItems.push({
        id: Date.now(),
        name: name,
        durationMinutes: duration,
        completed: false
    });
    
    nameInput.value = '';
    durationInput.value = '5';
    
    saveAgendaToStorage();
    renderAgendaList();
    broadcastState();
}

function removeAgendaItem(id) {
    meetingState.agendaItems = meetingState.agendaItems.filter(item => item.id !== id);
    saveAgendaToStorage();
    renderAgendaList();
    broadcastState();
}

function selectAgendaItem(index) {
    meetingState.currentAgendaIndex = index;
    const item = meetingState.agendaItems[index];
    meetingState.agendaTimeRemaining = item.durationMinutes * 60;
    
    stopAgendaTimer();
    renderAgendaList();
    updateAgendaTimerDisplay();
    broadcastState();
}

function nextAgendaItem() {
    // Mark current as completed
    if (meetingState.currentAgendaIndex >= 0) {
        meetingState.agendaItems[meetingState.currentAgendaIndex].completed = true;
    }
    
    // Move to next
    const nextIndex = meetingState.currentAgendaIndex + 1;
    if (nextIndex < meetingState.agendaItems.length) {
        selectAgendaItem(nextIndex);
    } else {
        alert('No more agenda items');
    }
}

function renderAgendaList() {
    const container = document.getElementById('agenda-list');
    
    if (meetingState.agendaItems.length === 0) {
        container.innerHTML = '<p style="color: #5f6368; font-style: italic;">No agenda items yet. Add one below.</p>';
        return;
    }
    
    container.innerHTML = meetingState.agendaItems.map((item, index) => {
        const isActive = index === meetingState.currentAgendaIndex;
        const statusClass = item.completed ? 'completed' : (isActive ? 'active' : '');
        
        return `
            <div class="agenda-item ${statusClass}">
                <div class="agenda-item-content">
                    <div class="agenda-item-name">${item.name}</div>
                    <div class="agenda-item-duration">${item.durationMinutes} minutes</div>
                </div>
                <div class="agenda-item-controls">
                    <button class="small secondary" onclick="selectAgendaItem(${index})">Select</button>
                    <button class="small danger" onclick="removeAgendaItem(${item.id})">✕</button>
                </div>
            </div>
        `;
    }).join('');
}

// Agenda Timer Functions
function startAgendaTimer() {
    if (meetingState.currentAgendaIndex < 0) {
        alert('Please select an agenda item first');
        return;
    }
    
    meetingState.agendaTimerState = 'running';
    
    agendaTimerInterval = setInterval(() => {
        if (meetingState.agendaTimeRemaining > 0) {
            meetingState.agendaTimeRemaining--;
            updateAgendaTimerDisplay();
            broadcastState();
        } else {
            stopAgendaTimer();
            alert('Agenda item time is up!');
        }
    }, 1000);
    
    updateAgendaTimerDisplay();
}

function pauseAgendaTimer() {
    meetingState.agendaTimerState = 'paused';
    clearInterval(agendaTimerInterval);
    updateAgendaTimerDisplay();
    broadcastState();
}

function stopAgendaTimer() {
    meetingState.agendaTimerState = 'stopped';
    clearInterval(agendaTimerInterval);
    
    if (meetingState.currentAgendaIndex >= 0) {
        const item = meetingState.agendaItems[meetingState.currentAgendaIndex];
        meetingState.agendaTimeRemaining = item.durationMinutes * 60;
    }
    
    updateAgendaTimerDisplay();
    broadcastState();
}

function updateAgendaTimerDisplay() {
    const display = document.getElementById('current-agenda-display');
    
    if (meetingState.currentAgendaIndex < 0) {
        display.textContent = 'No item selected';
        return;
    }
    
    const item = meetingState.agendaItems[meetingState.currentAgendaIndex];
    const minutes = Math.floor(meetingState.agendaTimeRemaining / 60);
    const seconds = meetingState.agendaTimeRemaining % 60;
    const timeString = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    
    display.textContent = `${item.name} - ${timeString}`;
}

// Speaker Timer Functions
function startSpeakerTimer() {
    meetingState.speakerTimerState = 'running';
    
    speakerTimerInterval = setInterval(() => {
        meetingState.speakerTimeElapsed++;
        updateSpeakerTimerDisplay();
        broadcastState();
    }, 1000);
    
    updateSpeakerTimerDisplay();
}

function pauseSpeakerTimer() {
    meetingState.speakerTimerState = 'paused';
    clearInterval(speakerTimerInterval);
    updateSpeakerTimerDisplay();
    broadcastState();
}

function stopSpeakerTimer() {
    meetingState.speakerTimerState = 'stopped';
    clearInterval(speakerTimerInterval);
    meetingState.speakerTimeElapsed = 0;
    updateSpeakerTimerDisplay();
    broadcastState();
}

function updateSpeakerTimerDisplay() {
    const display = document.getElementById('speaker-timer-display');
    const minutes = Math.floor(meetingState.speakerTimeElapsed / 60);
    const seconds = meetingState.speakerTimeElapsed % 60;
    const timeString = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    
    display.textContent = timeString;
}

// Local Storage Functions
function saveAgendaToStorage() {
    localStorage.setItem('greens-agenda', JSON.stringify(meetingState.agendaItems));
}

function loadAgendaFromStorage() {
    const saved = localStorage.getItem('greens-agenda');
    if (saved) {
        meetingState.agendaItems = JSON.parse(saved);
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    initializeSidePanel();
    
    // Update timer displays
    setInterval(() => {
        updateAgendaTimerDisplay();
        updateSpeakerTimerDisplay();
    }, 100);
});
