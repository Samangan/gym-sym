
class Gym {
    constructor(startingCash, machines) {
        this.cash = startingCash;

        // openingTime is the minute of the day when the gym opens.
        this.openingTime = 360;
        // closingTime is the minute of the day when the gym closes.
        this.closingTime = 1380;

        // clock keeps track of the current in-game time.
        this.clock = new Clock(1375, new Date(2005, 0, 1));

        // machines is a list of all of the machines in this gym.
        this.machines = machines;
    }

    tickClock() {
        console.log("[DEBUG] Current Gym Date: " + this.clock.getDate());
        console.log("[DEBUG] Current Gym Time: " + this.clock.getTimeFormatted());
        this.clock.processStep();
    }

    isOpen() {
        var time = this.clock.getTime();
        return time >= this.openingTime && time < this.closingTime;
    }

    getTime() {
        return this.clock.getTime();
    }

    getDate() {
        return this.clock.getDate();
    }

    // findMachineToQueue will find the machine for the user to start lining up in front of.
    // If there is not a working instance of that machine in this gym then null is returned.
    findMachineForWorkout(machineName) {

        // TODO: Right now this just grabs the first machine of the same type it finds.
        // This will never use the other machines. 
        // 
        // Make this a round-robin random selection of all of the avaiable machines instead.
        for (var i = 0; i < this.machines.length; i++) {
            var m = this.machines[i];
            if (m.name === machineName) {
                return m;
            }
        }
        return null;
    }
}
