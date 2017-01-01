
class Clock {
    constructor(startTime, startDate) {
        // currentTime is the current in-game minute of the day.
        this.currentTime = startTime;
        // currentDate is the current in-game date.
        this.currentDate = startDate;

        // NOTE: There are 1440 minutes in a day.
        // * The minute is the atomic unit of time in GymSym.
        this.MINUTES_IN_DAY = 1440; // TODO: Make this a static thing shared by the whole class.
    }

    processStep() {
        var nextDay = false;

        if (this.currentTime === this.MINUTES_IN_DAY - 1) {
            this.currentDate.setDate(this.currentDate.getDate() + 1);
            nextDay = true;
        }
        this.currentTime = (this.currentTime + 1) % this.MINUTES_IN_DAY;
        return nextDay;
    }

    getTime() {
        return this.currentTime;
    }

    getTimeFormatted() {
        var hours = Math.floor(this.currentTime / 60);
        var minutes = this.currentTime - (hours * 60);
        return hours + ":" + minutes;
    }

    getDate() {
        return this.currentDate;
    }

    getDateFormatted() {
        // TODO: Implement
    }
}

export default Clock;
