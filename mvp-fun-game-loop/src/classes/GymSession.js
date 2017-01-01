
// GymSession represents the state of a customer's single gym session.
class GymSession {

    constructor(startDate) {
        this.startTime = startDate;
        // numMachinesUsedInSession is the number of machines they have used of the total
        // number of machines in their workout routine.
        // (See: customerTypes() object for the routine for each customerType)
        this.numMachinesUsedInSession = 0;
        this.numMachinesSkipped = 0;

        this.currentMachine = null;
        this.currentMachineUsageTime = 0;

        // MAX_SESSION_TIME is the constant that the customer will leaveGym() if they spend
        // this much time in the gym (even if their entire workout is not complete).
        // TODO: Make this a const:
        this.MAX_SESSION_TIME = 5000; // NOTE: This is about 50 in-game time
    }

    isMaxSessionTimeReached(curDate) {
        var diff = curDate.getTime() - this.startTime.getTime();
        return (diff / 60000) > this.MAX_SESSION_TIME;
    }

    isDoneUsingMachine() {
        return this.currentMachineUsageTime >= this.currentMachine.workoutLength;
    }

    useNextMachine() {
        this.numMachinesUsedInSession++;
        this.currentMachine = null;
        this.currentMachineUsageTime = 0;
    }

    useCurrentMachine() {
        this.currentMachineUsageTime++;
    }
}

export default GymSession;
