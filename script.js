const audioPlayer = document.getElementById('audio-player') || new Audio();
const progressBar = document.querySelector('.progress-bar');
const currTimeDisplay = document.querySelector('.curr-time');
const totTimeDisplay = document.querySelector('.tot-time');
const playPauseBtn = document.querySelector('.player-control-icon:nth-child(3)');

let currentDuration = 213;
let isSeeking = false;
let isSimulatedPlaying = false;
let simulatedTime = 0;
let simulatedInterval = null;

function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

function resetProgress() {
    if (progressBar) {
        progressBar.value = 0;
        progressBar.style.setProperty('--progress', '0%');
    }
    if (currTimeDisplay) {
        currTimeDisplay.textContent = '0:00';
    }
    simulatedTime = 0;
    if (audioPlayer && audioPlayer.src) {
        audioPlayer.currentTime = 0;
    }
}

function updateProgress(currentTime, duration) {
    if (isSeeking) return;

    const time = typeof currentTime === 'number' ? currentTime : (audioPlayer.currentTime || simulatedTime);
    const total = typeof duration === 'number' ? duration : (audioPlayer.duration || currentDuration);

    if (!total || isNaN(total) || total <= 0) {
        resetProgress();
        return;
    }

    const progressWidth = (time / total) * 100;
    const clampedProgress = Math.min(Math.max(progressWidth, 0), 100);

    if (progressBar) {
        progressBar.value = clampedProgress;
        progressBar.style.setProperty('--progress', `${clampedProgress}%`);
    }

    if (currTimeDisplay) {
        currTimeDisplay.textContent = formatTime(time);
    }
}

function loadSong(song, duration) {
    if (simulatedInterval) {
        clearInterval(simulatedInterval);
        simulatedInterval = null;
        isSimulatedPlaying = false;
    }

    resetProgress();

    let src = '';
    if (typeof song === 'string') {
        src = song;
    } else if (song && song.src) {
        src = song.src;
        if (song.duration) duration = song.duration;
    }

    if (duration) {
        currentDuration = duration;
        if (totTimeDisplay) {
            totTimeDisplay.textContent = formatTime(duration);
        }
    }

    if (src && audioPlayer) {
        audioPlayer.src = src;
        audioPlayer.load();
    }
}

if (audioPlayer) {
    audioPlayer.addEventListener('timeupdate', () => {
        updateProgress(audioPlayer.currentTime, audioPlayer.duration);
    });

    audioPlayer.addEventListener('loadedmetadata', () => {
        if (audioPlayer.duration && !isNaN(audioPlayer.duration)) {
            currentDuration = audioPlayer.duration;
            if (totTimeDisplay) {
                totTimeDisplay.textContent = formatTime(audioPlayer.duration);
            }
        }
        resetProgress();
    });

    audioPlayer.addEventListener('loadstart', resetProgress);

    audioPlayer.addEventListener('ended', () => {
        resetProgress();
        if (playPauseBtn) {
            playPauseBtn.src = './assets/player_icon3.png';
        }
    });
}

if (progressBar) {
    progressBar.addEventListener('input', (e) => {
        isSeeking = true;
        const val = parseFloat(e.target.value) || 0;
        progressBar.style.setProperty('--progress', `${val}%`);

        const total = (audioPlayer && audioPlayer.duration) ? audioPlayer.duration : currentDuration;
        const seekTime = (val / 100) * total;
        if (currTimeDisplay) {
            currTimeDisplay.textContent = formatTime(seekTime);
        }
    });

    progressBar.addEventListener('change', (e) => {
        const val = parseFloat(e.target.value) || 0;
        const total = (audioPlayer && audioPlayer.duration) ? audioPlayer.duration : currentDuration;
        const seekTime = (val / 100) * total;

        if (audioPlayer && audioPlayer.src) {
            audioPlayer.currentTime = seekTime;
        } else {
            simulatedTime = seekTime;
        }
        isSeeking = false;
        updateProgress(seekTime, total);
    });
}

function togglePlayPause() {
    if (audioPlayer && audioPlayer.src) {
        if (audioPlayer.paused) {
            audioPlayer.play().catch(() => startSimulatedPlayback());
        } else {
            audioPlayer.pause();
        }
    } else {
        if (isSimulatedPlaying) {
            clearInterval(simulatedInterval);
            simulatedInterval = null;
            isSimulatedPlaying = false;
        } else {
            startSimulatedPlayback();
        }
    }
}

function startSimulatedPlayback() {
    isSimulatedPlaying = true;
    if (simulatedTime >= currentDuration) {
        resetProgress();
    }
    simulatedInterval = setInterval(() => {
        if (!isSeeking) {
            simulatedTime += 0.25;
            if (simulatedTime >= currentDuration) {
                simulatedTime = currentDuration;
                updateProgress(simulatedTime, currentDuration);
                clearInterval(simulatedInterval);
                simulatedInterval = null;
                isSimulatedPlaying = false;
                return;
            }
            updateProgress(simulatedTime, currentDuration);
        }
    }, 250);
}

if (playPauseBtn) {
    playPauseBtn.style.cursor = 'pointer';
    playPauseBtn.addEventListener('click', togglePlayPause);
}

const cards = document.querySelectorAll('.card');
cards.forEach(card => {
    card.addEventListener('click', () => {
        loadSong('', 213);
    });
});

document.addEventListener('DOMContentLoaded', resetProgress);
resetProgress();

window.resetProgress = resetProgress;
window.updateProgress = updateProgress;
window.loadSong = loadSong;
