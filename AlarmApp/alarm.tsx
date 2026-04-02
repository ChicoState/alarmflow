
// ------------------------------------ //
// IMPORTS                              //
// ------------------------------------ //
//TODO: import Sound from "./Sound.tsx"


// ------------------------------------ //
// TYPE DEFINITIONS                     //
// ------------------------------------ //
import type {
    int,
    bool
} from "./types.tsx";

type ID     = string;
type MINUTE = int;


// ------------------------------------ //
// INTERFACE & CLASS                    //
// ------------------------------------ //
export class DATE extends Date {
    date: Date;

    constructor(date: Date){
        super();

        this.date = date;
    }

    toDigitTime() : string {
        return this.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
}



export interface ALARM_INTERFACE {
  id:           ID;
  start:        DATE;           
  end:          DATE;
  min_interval: MINUTE;
  active:       bool;
}

export class ALARM implements ALARM_INTERFACE {
    // members
    id:           ID;
    start:        DATE;           
    end:          DATE;
    min_interval: MINUTE;
    active:       bool;
    //TODO: add sound variable

    // functions
    constructor(times: Date[], interval: MINUTE, is_active: bool) {
        this.id           = generate_alarm_id();    // function creates new alarm id 
        this.start        = new DATE(times[0]);   
        this.end          = new DATE(times[1]);
        this.min_interval = interval;
        this.active       = false;
    }
}


// ------------------------------------ //
// FUNCTIONS                            //
// ------------------------------------ //
let alarm_id = 0;
export function generate_alarm_id(): string {
    alarm_id++;
    return alarm_id.toString();
}