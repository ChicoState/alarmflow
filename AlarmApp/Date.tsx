// ------------------------------------ //
// IMPORTS                              //
// ------------------------------------ //



// ------------------------------------ //
// TYPE DEFINITIONS                     //
// ------------------------------------ //
type HOUR = number;
type MIN  = number;

const HOURS_IN_HALF_DAY = 12;
const HOURS_IN_DAY      = 24;
const MINS_IN_HOUR      = 60;



// ------------------------------------ //
// INTERFACE & CLASS                    //
// ------------------------------------ //
export class DATE extends Date {
    // members
    date: Date;

    // constructor
    constructor(date: Date = new Date()){
        super();
        this.date = date;
    }

    // member functions
    updateDigitTime(hour: HOUR, min: MIN) : void {
        const date_m = this.date.getMinutes() + min;
        const date_h = this.date.getHours() + hour;

        // increases mins wihtin bounds of mins in hour
        // if hour overflow, increase 'hour' by overflow
        let new_date_min      = date_m % MINS_IN_HOUR;
        let date_min_overflow = date_m / MINS_IN_HOUR;

        // increases hours wihtin bounds of hours in day
        // update from input and minute overflow
        let new_date_hour = (date_h + date_min_overflow)

        // set values
        this.date.setMinutes(new_date_min);
        this.date.setHours(new_date_hour);
        return;
    }
    toDigitTime() : string {
        return this.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
}


export function toDateDigitTime(date: Date) : string {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}