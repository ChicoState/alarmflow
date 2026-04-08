import Sound         from 'react-native-sound';
import SystemSetting from 'react-native-system-setting'


// ========================== //
// SOUND
// ========================== //
interface SOUND_INTERFACE {
    // object members
    name:   string;
    path:   string;
    sound:  Sound;
    volume: number;

    // function members
    load(): void;
    play(): void;
    stop(): void;
}

export default class SOUND implements SOUND_INTERFACE {
    // ---------------- //
    // members
    // ---------------- //
    name:   string;
    path:   string;
    sound:  Sound;
    volume: number;

    // ---------------- //
    // contructor 
    // ---------------- //
    constructor(name: string) {
        this.name   = name;
        this.path   = Sound.MAIN_BUNDLE;
        this.sound  = new Sound(this.name, this.path);
        this.volume = 0
    }

    // ---------------- //
    // functions
    // ---------------- //
    load(): void {
        // load new sound
        this.sound = new Sound(this.name, this.path, (error) => {
            // error checking
            if(error) {
                console.log("ERROR] failed to LOAD sound", error);
                return;
            }
            console.log("DEBUG] loaded sound...");
        });
    }
    play(): void {
        // check if sound is NOT currently loaded
        if(!this.sound.isLoaded()){
            this.load(); 
        }

        // sound setup
        //  - using SystemSetting, the return is an async Promise (multithreaded callback)
        //     ... which results in the 'play' feature in this code block
        SystemSetting.getVolume("alarm").then((currentVolume: number)  => { 
            let sys_alarm_volume: number = Number(currentVolume.toFixed(3));

            // set sound parameters 
            this.sound.setVolume(sys_alarm_volume);
            this.sound.setNumberOfLoops(-1);

            // play sound
            this.sound.play((success) => {
                // error checking
                if(success) {
                    console.log("DEBUG] playing sound");
                }
                else{
                    console.log("ERROR] failed to PLAY sound");
                }
            });
        }).catch((error) => {
            console.error("ERROR] failed to get SYSTEM ALARM VOLUME", error);
        });
    }
    stop(): void {
        // stop current sound
        this.sound.stop();
    }
}