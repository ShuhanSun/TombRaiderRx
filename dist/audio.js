/* Gesture-activated media playback plus Web Audio effects. No remote audio services. */
const Sound = {
    music:null, testClip:null, active:false, issue:'', suspended:false,
    setup() {
        if(this.music) return;
        this.music=new Audio('assets/tomb-ambience.wav');
        this.music.loop=true; this.music.preload='auto'; this.music.volume=0.28;
        this.testClip=new Audio('assets/sound-check.wav');
        this.testClip.preload='auto'; this.testClip.volume=0.55;
        this.music.addEventListener('error',()=>{this.issue='load';this.status();});
    },
    unlock() {
        this.setup();
        if(AudioSys.muted) return;
        this.suspended=false;
        // Playback is deliberately initiated synchronously inside a tap/click.
        try { if(navigator.audioSession) navigator.audioSession.type='playback'; } catch (_) {}
        if(this.music.paused) {
            const play=this.music.play();
            if(play) play.then(()=>{this.active=true;this.issue='';this.status();}).catch(()=>{this.issue='gesture';this.status();});
        }
        if(!AudioSys.ctx || AudioSys.ctx.state==='closed') {
            try {
                const Context=window.AudioContext||window.webkitAudioContext;
                if(Context) {
                    AudioSys.ctx=new Context(); AudioSys.gain=AudioSys.ctx.createGain();
                    AudioSys.gain.gain.value=0.55; AudioSys.gain.connect(AudioSys.ctx.destination);
                    AudioSys.ctx.onstatechange=()=>this.status();
                }
            } catch (_) { this.issue='effects'; }
        }
        if(AudioSys.ctx?.state!=='running') AudioSys.ctx?.resume().then(()=>this.status()).catch(()=>{this.issue='effects';this.status();});
        this.status();
    },
    pause() {
        this.suspended=true; this.music?.pause(); this.testClip?.pause();
        AudioSys.ctx?.suspend().catch(()=>{}); this.status();
    },
    test() {
        AudioSys.muted=false; this.unlock();
        this.testClip.currentTime=0;
        this.testClip.play().then(()=>{
            this.issue='';this.status();
            for(const id of ['audio-status','pause-audio-status']) document.getElementById(id).textContent=curLang==='CN'?'试音已播放。仍无声时，请调高媒体音量并检查蓝牙输出。':'Test tone played. If silent, check media volume and Bluetooth output.';
        }).catch(()=>{this.issue='gesture';this.status();});
        if(AudioSys.gain) AudioSys.gain.gain.value=0.55;
        Game.updateSoundButton();
    },
    toggle() {
        AudioSys.muted=!AudioSys.muted;
        if(AudioSys.gain) AudioSys.gain.gain.value=AudioSys.muted?0:0.55;
        if(AudioSys.muted) this.pause(); else this.unlock();
        Game.updateSoundButton(); this.status();
    },
    status() {
        const label=document.getElementById('audio-status'); if(!label) return;
        const cn=typeof curLang==='undefined'||curLang==='CN';
        label.textContent=AudioSys.muted?(cn?'声音已关闭':'Sound off'):
            this.issue==='load'?(cn?'音频未加载，请刷新后重试。':'Audio could not load. Refresh to retry.'):
            this.issue==='gesture'?(cn?'请点「开启 / 试音」启动声音。':'Tap Enable / Test sound to start audio.'):
            this.issue==='effects'?(cn?'环境音可用；音效待激活，请点试音。':'Ambience available; tap Test to activate effects.'):
            this.suspended?(cn?'已暂停 · 继续探索时恢复环境音':'Paused · ambience resumes with exploration'):
            this.active?(cn?'环境音已开启 · 可用右上角声音按钮关闭':'Ambience on · mute with the top-right sound button'):
            (cn?'点击开始后启用环境音与音效；请调高媒体音量。':'Starting enables ambience and effects. Turn up media volume.');
        const pauseLabel=document.getElementById('pause-audio-status');if(pauseLabel)pauseLabel.textContent=label.textContent;
    }
};
