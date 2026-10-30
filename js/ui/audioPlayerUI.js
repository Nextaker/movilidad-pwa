// js/ui/audioPlayerUI.js - Widget de Audio
export const audioPlayerUI = {
    init() {
        const musicWidget = document.createElement('div');
        musicWidget.id = 'hud-audio-player';
        musicWidget.innerHTML = `
            <div class="audio-info-ticker">
                <span class="audio-status-tag">🎵 HUD AUDIO</span>
                <span class="audio-track-name">Cyberpunk Synthwave - Overdrive Track 01</span>
            </div>
            <button id="btn-toggle-audio">PLAY</button>
        `;
        document.body.appendChild(musicWidget);

        const audio = new Audio('./assets/audio/cyberpunk-bg.mp3');
        audio.loop = true;
        audio.volume = 0.3;

        const btnToggle = document.getElementById('btn-toggle-audio');
        let isPlaying = false;

        const reproducir = () => {
            audio.play().then(() => {
                isPlaying = true;
                btnToggle.textContent = 'PAUSE';
                btnToggle.style.background = 'var(--hud-accent)';
                btnToggle.style.color = '#fff';
            }).catch(err => console.log("Autoplay bloqueado:", err));
        };

        const pausar = () => {
            audio.pause();
            isPlaying = false;
            btnToggle.textContent = 'PLAY';
            btnToggle.style.background = 'var(--hud-primary)';
            btnToggle.style.color = '#050811';
        };

        btnToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            isPlaying ? pausar() : reproducir();
        });

        const unlockAudio = () => {
            if (!isPlaying) reproducir();
            window.removeEventListener('pointerdown', unlockAudio);
            window.removeEventListener('touchstart', unlockAudio);
        };

        window.addEventListener('pointerdown', unlockAudio, { once: true });
        window.addEventListener('touchstart', unlockAudio, { once: true });
    }
};