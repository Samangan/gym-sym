
class Customer {

    // customerTypes() outputs a map of the customerType string
    // to the list of machines that the customer will use in a complete
    // workout session.
    static customerTypes() {
        return {
            weekend_warrior : {
                routine: [
                    'treadmill',
                    'treadmill',
                    'freeweights',
                    'benchpress'
                ],
                days_of_week: [0, 6]    // days_of_week is an array of days this customerType works out.
            },
            body_builder_barbell: {
                routine: [
                    'treadmill',
                    'treadmill',
                    'benchpress'
                ],
                days_of_week: [1, 2, 3, 4, 5]
            },
            how_much_can_you_bench_bro: {
                routine: [
                    'benchpress'
                ],
                days_of_week: [1, 2, 3, 4, 5, 6, 0]
            }
        };
    };

    constructor(
        name,
        customerType,
        membershipCost,
        billingFrequency,
        sprite
    ) {
        // TODO: use uuid package instead:
        this.id = Math.floor((Math.random() * 100000) + 1);
        this.name = name;
        this.dateJoined = new Date();
        this.customerType = customerType;
        this.billingFrequency = billingFrequency;
        this.membershipCost = membershipCost;
        this.lastPaymentDate = null;
        this.propensityToCancel = 0;
        this.thoughts = {
            happy: {
                'no_lines': 0
            },
            sad: {
                'workout_not_finished': 0,
                'long_lines_suck': 0,
                'machine_not_available': 0
            }
        };

        // The customer state machine: (TODO: Make a diagram here)
        this.state = StateMachine.create({
            initial: 'home',
            events: [
                { name: 'goToGym', from: 'home', to: 'idle'  },
                { name: 'lookForMachine', from: ['idle', 'working_out'], to: 'looking_for_machine' },
                { name: 'queueUpForMachine', from: 'looking_for_machine', to: 'waiting_in_line' },
                { name: 'startUsingMachine',  from: 'waiting_in_line',  to: 'working_out' },
                { name: 'getBoredWaitingForMachine',  from: 'waiting_in_line',  to: 'idle' },
                { name: 'startSocializing',  from: 'idle',  to: 'socializing' },
                { name: 'stopSocializing',  from: 'socializing',  to: 'idle' },
                { name: 'endWorkout',  from: 'looking_for_machine',    to: 'showering' },
                { name: 'leaveGym',  from: ['showering', 'idle'],    to: 'home' },
            ]});

        this.currentSession = null;
        this.lastWorkoutDate = null;

        // workoutTime is the minutes into the day that this customer goes to the gym
        this.workoutTime = 370;  // TODO: Randomize this / make the base part of CustomerType

        // Ui:
        this.movementSpeed = 400; // n pixels per second.
        this.sprite = sprite;
        // destinationPos is an obect that contains the x,y coords where this customer wishes to move to.
        this.destinationPos = null;
        this.tween = null;


        // meters represents all of the customer's current internal levels:
        this.meters = new CustomerMeters();
    }

    processStep(gym) {
        if (this.state.is('home')) {
            this.processHomeState();
        } else if (this.state.is('idle')) {
            this.processIdleState();
        } else if (this.state.is('looking_for_machine')) {
            this.processLookingForMachineState();
        } else if (this.state.is('waiting_in_line')) {
            this.processWaitingInLineState();
        } else if (this.state.is('working_out')) {
            this.processWorkingOutState();
        } else if (this.state.is('showering')) {
            this.processShoweringState();
        } else if (this.state.is('socializing')) {
            this.processSocializingState();
        }
    }

    // process*State() functions:
    processHomeState() {
        if (this.isTimeForWorkout(gym)) {
            console.log("[DEBUG] " + this.name + " is going to gym");
            this.resetCustomerSession();
            // Move the sprite to the center of the gym.
            this.destinationPos = {
                x: 200, // TODO: Make this the entrance area.
                y: 200
            };
            this.state.goToGym();
        }
    }

    processIdleState() {
        if (this.meters.social === 0) {
            console.log("[DEBUG] " + this.name + " is starting to socialize");
            return this.state.startSocializing();
        }

        if (!gym.isOpen()) {
            console.log("[DEBUG] Gym is closing. " + this.name + " is going home");
            this.thoughts.sad.workout_not_finished++;
            return this.state.leaveGym();
        }

        if (this.currentSession.isMaxSessionTimeReached(gym.getDate())) {
            console.log("[DEBUG] " + this.name + " reached max workout session time and is going home");
            this.thoughts.sad.workout_not_finished++;
            return this.state.leaveGym();
        }

        // Let's start looking for a machine to use:
        return this.state.lookForMachine();
    }

    processLookingForMachineState() {
        if (this.isWorkoutOver()) {
            console.log("[DEBUG] Workout over. " + this.name + " is going to shower.");
            return this.state.endWorkout();
        }

        // Workout is not over; look for a machine to use.
        var machines = Customer.customerTypes()[this.customerType].routine;
        var nextMachine =  machines[this.currentSession.numMachinesUsedInSession];
        var m = gym.findMachineForWorkout(nextMachine);

        if (m !== null) {
            console.log("[DEBUG] " + this.name + " is going to machine: " + m.name);
            m.addCustomerToLine(this);
            this.currentSession.currentMachine = m;
            // Set the destination of the customer to this machine.
            this.destinationPos = {
                x: m.sprite.x,
                y: m.sprite.y - (this.sprite.height)
            };
            this.state.queueUpForMachine();
        } else {
            console.log("[DEBUG] " + this.name + " cannot find a " + nextMachine + " machine");
            // There is not currently a working machine of this type in the gym.
            this.thoughts.sad.machine_not_available++;
            // Try the next machine in the routine:
            this.currentSession.numMachinesUsedInSession++;
        }
    }

    processWaitingInLineState() {
        // TODO: If too bored then: getBoredWaitingForMachine()
        var curM = this.currentSession.currentMachine;

        if (curM.isCustomerFirstInLine(this) && curM.canFirstCustomerInLineUseMachine()) {
            curM.addNextCustomerToMachineUsers();
            // Move to machine:
            this.destinationPos = {
                x: curM.sprite.x,
                y: curM.sprite.y - (this.sprite.height)
            };
            this.state.startUsingMachine();
        } else {
            // TODO: I should only set this once. Right now I am setting it every frame. Yikes!
            if (!this.destinationPos) {
                // Move to the correct position in line.
                var posInLine = curM.getCustomerPosInLine(this);
                this.destinationPos = {
                    x: curM.sprite.x,
                    y: curM.sprite.y + (this.sprite.height * (posInLine + 1))
                };
            }

            // TODO: bored++
            console.log("[DEBUG] " + this.name + " is waiting in line for " + curM.name);
            // POST MVP TODO: Shift a little to indicate getting impatient with waiting in line.
        }
    }

    processWorkingOutState() {
        var curM = this.currentSession.currentMachine;
        if (this.currentSession.isDoneUsingMachine()){
            console.log("[DEBUG] " + this.name + " is done using machine: " + curM.name);
            curM.removeCustomerFromMachineUsers(this);
            this.currentSession.useNextMachine();
            // Continue next workout:
            this.state.lookForMachine();
        } else {
            console.log("[DEBUG] " + this.name + " is still using machine: " + curM.name);
            this.currentSession.useCurrentMachine();
        }
    }

    processShoweringState() {
        // TODO: Move them to the shower.
        // See below notes.
        this.destinationPos = {
            x: 500,
            y: 25
        };

        // TODO: If there is no shower then leave a negative thought and leave.
        // NOTE: A shower should be another 'machine' with a large number of concurrentCustomers.
        // This state will specifically look for a shower machine since it has it's own state / thought.

        if (this.meters.dirty === 0) {
            console.log("[DEBUG] " + this.name + " has finished showering. Going home.");
            this.state.leaveGym();
        } else  {
            this.meters.dirty--;
        }
    }

    processSocializingState() {
        // TODO: These should be random not absolute, plus different customerTypes
        // should have different thresholds for all of these values.
        if (this.meters.social >= 70) {
            this.state.stopSocializing();
        } else {
            this.meters.social++;
        }
    }
    // End of process*State() functions

    resetCustomerSession() {
        this.lastWorkoutDate = gym.getDate();
        this.currentSession = new GymSession(gym.getDate());
        this.meters = new CustomerMeters();
    }

    isInGym() {
        return !this.state.is('home');
    }

    // TODO: this should be in customerSession.js:
    isWorkoutOver() {
        var workoutLength = this.getCustomerType().routine.length;
        return this.currentSession.numMachinesUsedInSession >= workoutLength;
    }

    isTimeForWorkout(gym) {
        if (this.needsToWorkout(gym.getDate()) && gym.isOpen()) {
            return gym.getTime() >= this.workoutTime;
        }
        return false;
    }

    needsToWorkout(today) {
        var workoutDays = this.getCustomerType().days_of_week;

        if (workoutDays.indexOf(today.getDay()) >= 0) {
            if (this.lastWorkoutDate === null ||
                this.lastWorkoutDate.getDate() !== today.getDate()) {
                return true;
            }
        }
        return false;
    }

    getCustomerType() {
        return Customer.customerTypes()[this.customerType];
    }
}
