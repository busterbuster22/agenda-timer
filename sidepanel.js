// Side Panel JavaScript - Facilitator Controls

let sidePanelClient;
let meetingState = {
    agendaItems: [],
    currentAgendaIndex: -1,
    agendaTimerState: 'stopped', // 'stopped', 'running', 'paused'
    agendaTimeRemaining: 0,
    speakerTimerState: 'stopped',
    speakerTimeElapsed: 0,
    meetingStartTime: null,
    meetingEndTime: null,
    meetingElapsedSeconds: 0
};

let agendaTimerInterval;
let speakerTimerInterval;
let meetingTimerInterval;

// Initialize the add-on
async function initializeSidePanel() {
    try {
        const session = await meet.addon.createAddonSession({
            cloudProjectNumber: '879397453091'
        });
        
        sidePanelClient = await session.createSidePanelClient();
        
        console.log('Side panel initialized');
        
        // Start broadcasting state updates
        startStateBroadcast();
        
        // Set up event listeners
        setupEventListeners();
        
        // Load saved agenda items from localStorage
        loadAgendaFromStorage();
        renderAgendaList();
        
        // Start meeting timer if meeting has started
        if (meetingState.meetingStartTime) {
            startMeetingTimer();
        }
        
    } catch (error) {
        console.error('Failed to initialize side panel:', error);
    }
}

// Set up all event listeners
function setupEventListeners() {
    document.getElementById('start-activity').addEventListener('click', startMainStage);
    document.getElementById('set-meeting-time-btn').addEventListener('click', setMeetingTime);
    document.getElementById('start-agenda-timer-btn').addEventListener('click', startAgendaTimer);
    document.getElementById('pause-agenda-timer-btn').addEventListener('click', pauseAgendaTimer);
    document.getElementById('stop-agenda-timer-btn').addEventListener('click', stopAgendaTimer);
    document.getElementById('next-agenda-item-btn').addEventListener('click', nextAgendaItem);
    document.getElementById('start-speaker-timer-btn').addEventListener('click', startSpeakerTimer);
    document.getElementById('pause-speaker-timer-btn').addEventListener('click', pauseSpeakerTimer);
    document.getElementById('stop-speaker-timer-btn').addEventListener('click', stopSpeakerTimer);
    document.getElementById('add-agenda-item-btn').addEventListener('click', addAgendaItem);
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

// Broadcast state updates to main stage via localStorage
function broadcastState() {
    // Save to localStorage so mainstage can read it
    localStorage.setItem('meeting-state', JSON.stringify(meetingState));
    
    // Also try the SDK method (in case it works)
    if (sidePanelClient) {
        sidePanelClient.setActivityStartingState({
            additionalData: JSON.stringify(meetingState)
        }).catch(err => console.error('Failed to set activity state:', err));
    }
}

function startStateBroadcast() {
    // Broadcast state every second when timers are running
    setInterval(() => {
        if (meetingState.agendaTimerState === 'running' || 
            meetingState.speakerTimerState === 'running' ||
            meetingState.meetingStartTime) {
            broadcastState();
        }
    }, 1000);
}

// Meeting Time Management
function setMeetingTime() {
    const startInput = document.getElementById('meeting-start-time');
    const endInput = document.getElementById('meeting-end-time');
    
    if (startInput.value && endInput.value) {
        const now = new Date();
        const startTime = new Date(now.toDateString() + ' ' + startInput.value);
        const endTime = new Date(now.toDateString() + ' ' + endInput.value);
        
        if (endTime <= startTime) {
            alert('End time must be after start time');
            return;
        }
        
        meetingState.meetingStartTime = startTime.getTime();
        meetingState.meetingEndTime = endTime.getTime();
        meetingState.meetingElapsedSeconds = 0;
        
        startMeetingTimer();
        updateMeetingTimeDisplay();
        broadcastState();
        saveAgendaToStorage();
    }
}

function startMeetingTimer() {
    if (meetingTimerInterval) {
        clearInterval(meetingTimerInterval);
    }
    
    meetingTimerInterval = setInterval(() => {
        if (meetingState.meetingStartTime) {
            const now = Date.now();
            meetingState.meetingElapsedSeconds = Math.floor((now - meetingState.meetingStartTime) / 1000);
            updateMeetingTimeDisplay();
            broadcastState();
        }
    }, 1000);
}

function updateMeetingTimeDisplay() {
    const display = document.getElementById('meeting-time-display');
    
    if (!meetingState.meetingStartTime || !meetingState.meetingEndTime) {
        display.innerHTML = '<span style="color: #5f6368;">Set meeting times above</span>';
        return;
    }
    
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
    
    let statusClass = '';
    if (remaining === 0) {
        statusClass = 'danger';
    } else if (remaining < 300) { // Less than 5 minutes
        statusClass = 'warning';
    }
    
    display.innerHTML = `
        <div>Elapsed: <strong>${elapsedStr}</strong></div>
        <div>Remaining: <strong class="${statusClass}">${remainingStr}</strong></div>
        <div>End time: <strong>${endTimeStr}</strong></div>
    `;
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
        completed: false,
        timeUsedSeconds: 0,
        startedAt: null
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

function moveAgendaItemUp(index) {
    if (index > 0) {
        const items = meetingState.agendaItems;
        [items[index - 1], items[index]] = [items[index], items[index - 1]];
        
        // Update currentAgendaIndex if needed
        if (meetingState.currentAgendaIndex === index) {
            meetingState.currentAgendaIndex = index - 1;
        } else if (meetingState.currentAgendaIndex === index - 1) {
            meetingState.currentAgendaIndex = index;
        }
        
        saveAgendaToStorage();
        renderAgendaList();
        broadcastState();
    }
}

function moveAgendaItemDown(index) {
    if (index < meetingState.agendaItems.length - 1) {
        const items = meetingState.agendaItems;
        [items[index], items[index + 1]] = [items[index + 1], items[index]];
        
        // Update currentAgendaIndex if needed
        if (meetingState.currentAgendaIndex === index) {
            meetingState.currentAgendaIndex = index + 1;
        } else if (meetingState.currentAgendaIndex === index + 1) {
            meetingState.currentAgendaIndex = index;
        }
        
        saveAgendaToStorage();
        renderAgendaList();
        broadcastState();
    }
}

function selectAgendaItem(index) {
    // Stop timing the previous item if it was running
    if (meetingState.currentAgendaIndex >= 0 && meetingState.agendaTimerState === 'running') {
        stopAgendaTimer();
    }
    
    meetingState.currentAgendaIndex = index;
    const item = meetingState.agendaItems[index];
    meetingState.agendaTimeRemaining = (item.durationMinutes * 60) - item.timeUsedSeconds;
    
    renderAgendaList();
    updateAgendaTimerDisplay();
    broadcastState();
}

function nextAgendaItem() {
    // Mark current as completed
    if (meetingState.currentAgendaIndex >= 0) {
        meetingState.agendaItems[meetingState.currentAgendaIndex].completed = true;
        stopAgendaTimer();
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
    
    container.innerHTML = '';
    
    meetingState.agendaItems.forEach((item, index) => {
        const isActive = index === meetingState.currentAgendaIndex;
        const statusClass = item.completed ? 'completed' : (isActive ? 'active' : '');
        
        const allocatedSeconds = item.durationMinutes * 60;
        const usedSeconds = item.timeUsedSeconds;
        const remainingSeconds = Math.max(0, allocatedSeconds - usedSeconds);
        const isOvertime = usedSeconds > allocatedSeconds;
        
        const usedStr = formatTime(usedSeconds);
        const remainingStr = formatTime(remainingSeconds);
        const overtimeStr = isOvertime ? formatTime(usedSeconds - allocatedSeconds) : '';
        
        const itemDiv = document.createElement('div');
        itemDiv.className = `agenda-item ${statusClass}`;
        itemDiv.innerHTML = `
            <div class="agenda-item-header">
                <div class="agenda-item-name">${item.name}</div>
                <div class="agenda-item-controls">
                    <button class="small secondary btn-move-up" data-index="${index}" ${index === 0 ? 'disabled' : ''}>↑</button>
                    <button class="small secondary btn-move-down" data-index="${index}" ${index === meetingState.agendaItems.length - 1 ? 'disabled' : ''}>↓</button>
                    <button class="small secondary btn-select" data-index="${index}">Select</button>
                    <button class="small danger btn-remove" data-id="${item.id}">✕</button>
                </div>
            </div>
            <div class="agenda-item-times">
                <span>Allocated: ${item.durationMinutes} min</span>
                <span>Used: <strong class="${isOvertime ? 'danger' : ''}">${usedStr}</strong></span>
                <span>Remaining: <strong class="${isOvertime ? 'danger' : (remainingSeconds < 60 ? 'warning' : '')}">${isOvertime ? '-' + overtimeStr : remainingStr}</strong></span>
            </div>
        `;
        
        container.appendChild(itemDiv);
    });
    
    // Add event listeners to the dynamically created buttons
    container.querySelectorAll('.btn-move-up').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            moveAgendaItemUp(index);
        });
    });
    
    container.querySelectorAll('.btn-move-down').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            moveAgendaItemDown(index);
        });
    });
    
    container.querySelectorAll('.btn-select').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            selectAgendaItem(index);
        });
    });
    
    container.querySelectorAll('.btn-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.dataset.id);
            removeAgendaItem(id);
        });
    });
}

// Agenda Timer Functions
function startAgendaTimer() {
    if (meetingState.currentAgendaIndex < 0) {
        alert('Please select an agenda item first');
        return;
    }
    
    const currentItem = meetingState.agendaItems[meetingState.currentAgendaIndex];
    if (!currentItem.startedAt) {
        currentItem.startedAt = Date.now();
    }
    
    meetingState.agendaTimerState = 'running';
    
    agendaTimerInterval = setInterval(() => {
        const currentItem = meetingState.agendaItems[meetingState.currentAgendaIndex];
        
        if (meetingState.agendaTimeRemaining > 0) {
            meetingState.agendaTimeRemaining--;
            currentItem.timeUsedSeconds++;
        } else {
            // Keep counting into overtime
            currentItem.timeUsedSeconds++;
        }
        
        updateAgendaTimerDisplay();
        renderAgendaList();
        broadcastState();
        saveAgendaToStorage();
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
        meetingState.agendaTimeRemaining = (item.durationMinutes * 60) - item.timeUsedSeconds;
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
    const minutes = Math.floor(Math.abs(meetingState.agendaTimeRemaining) / 60);
    const seconds = Math.abs(meetingState.agendaTimeRemaining) % 60;
    const timeString = `${meetingState.agendaTimeRemaining < 0 ? '-' : ''}${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    
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
    display.textContent = formatTime(meetingState.speakerTimeElapsed);
}

// Utility Functions
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// Local Storage Functions
function saveAgendaToStorage() {
    localStorage.setItem('greens-agenda', JSON.stringify(meetingState.agendaItems));
    localStorage.setItem('greens-meeting-times', JSON.stringify({
        startTime: meetingState.meetingStartTime,
        endTime: meetingState.meetingEndTime
    }));
}

function loadAgendaFromStorage() {
    const saved = localStorage.getItem('greens-agenda');
    if (saved) {
        meetingState.agendaItems = JSON.parse(saved);
    }
    
    const times = localStorage.getItem('greens-meeting-times');
    if (times) {
        const parsed = JSON.parse(times);
        meetingState.meetingStartTime = parsed.startTime;
        meetingState.meetingEndTime = parsed.endTime;
        
        // Pre-populate time inputs if available
        if (meetingState.meetingStartTime && meetingState.meetingEndTime) {
            const startTime = new Date(meetingState.meetingStartTime);
            const endTime = new Date(meetingState.meetingEndTime);
            
            document.getElementById('meeting-start-time').value = 
                startTime.toTimeString().slice(0, 5);
            document.getElementById('meeting-end-time').value = 
                endTime.toTimeString().slice(0, 5);
        }
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    initializeSidePanel();
    
    // Update timer displays
    setInterval(() => {
        updateAgendaTimerDisplay();
        updateSpeakerTimerDisplay();
        updateMeetingTimeDisplay();
    }, 100);
});
