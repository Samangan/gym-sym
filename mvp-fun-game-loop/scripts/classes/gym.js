
class Gym {
    constructor(startingCash, machines) {
        this.cash = startingCash;

        // openingTime is the minute of the day when the gym opens.
        this.openingTime = 360;
        // closingTime is the minute of the day when the gym closes.
        this.closingTime = 1380;

        // clock keeps track of the current in-game time.
        this.clock = new Clock(358, new Date(2005, 0, 1));

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

    getCash() {
        return this.cash;
    }

    getTime() {
        return this.clock.getTime();
    }

    getTimeFormatted() {
        return this.clock.getTimeFormatted();
    }

    getDate() {
        return this.clock.getDate();
    }

    addToMachines(m) {
        this.machines.push(m);
    }

    // findMachineToQueue will find the machine for the user to start lining up in front of.
    // If there is not a working instance of that machine in this gym then null is returned.
    findMachineForWorkout(machineName) {
        // TODO: Pure random is a little silly.
        //       (Lol @ modern load balancers! :P)
        //       We should favor ones that are empty or near empty first.

        // Basic round robin selection algo.
        if (!machineName) {
            return null;
        }

        var machinesToChooseFrom = _.filter(this.machines, (m) => {
            if (m.name === machineName) {
                return m;
            }
        });

        var len = machinesToChooseFrom.length;

        if (len === 0) {
            return null;
        }

        if (len === 1) {
            return machinesToChooseFrom[0];
        }

        var i = Math.floor((Math.random() * len) + 1);
        return machinesToChooseFrom[i-1];
    }
}
