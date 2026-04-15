// ========================== //
// CONTANTS
// ========================== //
export const SECOND: number = 1000;


// ========================== //
// FUNCTIONS
// ========================== //
export function get_interval_time(starting_time: Date, interval_time: number, total_intervals: number): Date {
    // calculate time offset
    let total_minutes  = interval_time * total_intervals;                   // get total interval minutes for alarm offset 
    let minutes_offset = parseFloat((total_minutes % 60).toFixed(1));       //  - current minute offset 
    let hours_offset   = parseFloat((total_minutes / 60).toFixed(1));       //  - current hour offset

    // get new time
    let new_time = new Date(starting_time);
    new_time.setHours(starting_time.getHours() + hours_offset);
    new_time.setMinutes(starting_time.getMinutes() + minutes_offset);

    return new_time;
}