// ------------------------------------ //
// IMPORTS                              //
// ------------------------------------ //
import {
    DATE
} from "./Date.tsx"



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

//! ================ !//
//!  MUST IMPLEMENT  !//
//! ================ !//
// TODO: toJSON / fromJSON (Serialize <--> Deserialize)
// TODO: save / load alarms

export interface ALARM_INTERFACE {
  id:           ID;
  start:        DATE;           
  end:          DATE;
  min_interval: MINUTE;
  active:       bool;

  toJSON(): void;
  fromJSON(obj: any) : ALARM; 
  copy(update: Partial<ALARM>): ALARM;
}

export class ALARM implements ALARM_INTERFACE {
    // members
    id:           ID;
    start:        DATE;           
    end:          DATE;
    min_interval: MINUTE;
    active:       bool;
    //TODO: add sound variable

    constructor(start: Date, end: Date, interval: MINUTE, is_active: bool, id: ID = "") {
        this.start        = new DATE(start);
        this.end          = new DATE(end);
        this.active       = is_active;
        this.min_interval = interval;

        // overloaded constructor undefined members
        this.id = id;
        if(id == ""){
            this.id = generate_alarm_id();
        }
    }

    toJSON() {
        return {
            id:           this.id,
            active:       this.active,
            start:        this.start,
            end:          this.end,
            min_interval: this.min_interval,
        }
    }
    static fromJSON(obj: any) : ALARM {
        return new ALARM(
            new Date(obj.start.date ?? obj.start), 
            new Date(obj.end.date ?? obj.end),
            obj.min_interval,
            obj.active,
            obj.id
        );
    }
    copy(update: Partial<ALARM>): ALARM {
        const alarm = new ALARM(
            this.start.date, 
            this.end.date,
            this.min_interval,
            this.active,
            this.id
        );

        return Object.assign(alarm, update);
    }
}


// ------------------------------------ //
// FUNCTIONS                            //
// ------------------------------------ //
export function generate_current_alarm_count(start: DATE, end: DATE, min_interval: int, max_count: int): int {
    const now = new DATE();

    const now_str   = now.toDigitTime();
    const start_str = start.toDigitTime();
    const end_str   = end.toDigitTime();

    // alarm is BEFORE START alarm
    // alarm is AFTER END alarm
    if (now_str < start_str) return 0;
    if (now_str > end_str)   return 0;

    // alarm is EQUAL to START alarm 
    if (now_str == start_str) return 0;

    // calculate count BETWEEN start/end alarms
    let count = 0;  // -- to be returned below

    // cycle through each alarm interval
    for(let i = 1; i < max_count; i++){
        // calculate hours/mins
        const elapsed_mins = i * min_interval;
        const t_mins  = elapsed_mins % 60;
        const t_hours = elapsed_mins / 60;

        // set current alarm interval
        let current_time = start;
        current_time.setHours(current_time.getHours() + t_hours);
        current_time.setMinutes(current_time.getMinutes() + t_mins);

        const current_time_str = current_time.toDigitTime();

        // if now is less than next interval, return
        // else, increment counter
        if (now_str < current_time_str) {
            break;
        }
        count++;
    }

    return count;
}
export function generate_max_alarm_count(start: DATE, end: DATE, min_interval: int): int {
    const ms_in_min = 60_000;
    const time_diff_min = (end.getTime() - start.getTime()) / ms_in_min;
    const n_alarms = time_diff_min / min_interval;

    // return n+1 alarm for end time alarm
    return n_alarms + 1;
}



let alarm_id = 0;
export function generate_alarm_id(): string {
    alarm_id++;
    return alarm_id.toString();
}