// js/ui/audioPlayerUI.js - Control limpio del reproductor de audio integrado en el HUD
export const audioPlayerUI = {
    init() {
        const btnToggle = document.getElementById('btn-toggle-audio');
        const waveform = document.getElementById('audio-waveform');
        const settingsToggle = document.getElementById('btn-audio-settings');
        const settingsPanel = document.getElementById('audio-settings');
        const volumeControl = document.getElementById('audio-volume');
        const volumeValue = document.getElementById('audio-volume-value');
        
        const audio = new Audio('./assets/audio/cyberpunk-bg.mp3');
        audio.loop = true;
        audio.volume = Number(volumeControl?.value ?? 0.3);

        const reproducir = () => {
            audio.play().catch((err) => {
                console.error('No se pudo reproducir el audio:', err);
            });
        };

        const pausar = () => {
            audio.pause();
        };

        const sincronizarEstado = () => {
            const isPlaying = !audio.paused;
            btnToggle?.classList.toggle('is-playing', isPlaying);
            btnToggle?.setAttribute('aria-pressed', String(isPlaying));
            btnToggle?.setAttribute('aria-label', isPlaying ? 'Pausar audio' : 'Reproducir audio');
            waveform?.classList.toggle('is-playing', isPlaying);
        };

        audio.addEventListener('play', sincronizarEstado);
        audio.addEventListener('pause', sincronizarEstado);

        if (btnToggle) {
            btnToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                audio.paused ? reproducir() : pausar();
            });
        }

        const unlockAudio = (event) => {
            const activatedPlayButton = event.target instanceof Element
                && event.target.closest('#btn-toggle-audio');
            window.removeEventListener('pointerdown', unlockAudio);
            window.removeEventListener('touchstart', unlockAudio);
            if (!activatedPlayButton && audio.paused) reproducir();
        };

        window.addEventListener('pointerdown', unlockAudio);
        if (!('PointerEvent' in window)) {
            window.addEventListener('touchstart', unlockAudio);
        }

        settingsToggle?.addEventListener('click', (event) => {
            event.stopPropagation();
            const isExpanded = settingsToggle.getAttribute('aria-expanded') === 'true';
            settingsToggle.setAttribute('aria-expanded', String(!isExpanded));
            if (settingsPanel) settingsPanel.hidden = isExpanded;
        });

        volumeControl?.addEventListener('input', () => {
            audio.volume = Number(volumeControl.value);
            if (volumeValue) volumeValue.value = `${Math.round(audio.volume * 100)}%`;
        });
    }
};