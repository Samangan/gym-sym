
class Customer {
    static getRandomCustomerType() {
        var types = ['weekend_warrior', 'body_builder_barbell', 'how_much_can_you_bench_bro'];
        var i = Math.floor((Math.random() * types.length));
        return types[i];
    }

    // TODO: customerTypes should be a json file like machines that we read in at game startup.
    // customerTypes() outputs a map of the customerType string
    // to the list of machines that the customer will use in a complete
    // workout session.
    static customerTypes() {
        return {
            weekend_warrior : {
                routine: [
                    'treadmill',
                    'freeweights',
                    'benchpress'
                ],
                days_of_week: [0, 6]    // days_of_week is an array of days this customerType works out.
            },
            body_builder_barbell: {
                routine: [
                    'treadmill',
                    'benchpress'
                ],
                days_of_week: [1, 3, 5]
            },
            how_much_can_you_bench_bro: {
                routine: [
                    'benchpress'
                ],
                days_of_week: [2, 4, 6]
            },
            cardio_fiend: {
                routine: [
                    'treadmill',
                    'treadmill' // TODO: Make more cardio machines (ex: stairs)
                ],
                days_of_week: [0, 2, 4, 6]
            },
        };
    };

    constructor(
        name,
        customerType,
        timeWorkoutStarts
    ) {
        // TODO: use uuid package instead:
        this.id = Math.floor((Math.random() * 100000) + 1);
        this.name = name;
        this.dateJoined = new Date();
        this.customerType = customerType;
        this.lastPaymentDate = null;

        // TODO: make clean / dirty environment thoughts
        this.thoughts = {
            happy: {
                'no_lines': 0,
                'workout_finished': 0
            },
            sad: {
                'long_lines_suck': 0,
                'workout_not_finished': 0,
                'machine_not_available': 0,
                'no_shower': 0
            }
        };

        // thoughtBubbles is a queue of thoughts
        // that will be popped off and displayed to the user by game.js render loop.
        this.thoughtBubbles = [];
        this.isThinking = false;
        this.currentThought;
        this.currentThoughtSprite;

        // The customer state machine: (TODO: Make a diagram here)
        this.state = StateMachine.create({
            initial: 'home',
            events: [
                { name: 'goToGym', from: 'home', to: 'idle'  },
                { name: 'lookForMachine', from: ['idle', 'working_out'], to: 'looking_for_machine' },
                { name: 'queueUpForMachine', from: 'looking_for_machine', to: 'waiting_in_line' },
                { name: 'startUsingMachine',  from: 'waiting_in_line',  to: 'working_out' },
                { name: 'waitForLinesToEmpty', from: 'looking_for_machine', to: 'idle' },
                { name: 'getBoredWaitingForMachine',  from: 'waiting_in_line',  to: 'idle' },
                { name: 'startSocializing',  from: 'idle',  to: 'socializing' },
                { name: 'stopSocializing',  from: 'socializing',  to: 'idle' },
                { name: 'endWorkout',  from: 'looking_for_machine',    to: 'showering' },
                { name: 'leaveGym',  from: ['showering', 'idle'],    to: 'home' },
            ]});

        this.currentSession = null;
        this.lastWorkoutDate = null;

        // workoutTime is the minutes into the day that this customer goes to the gym
        this.workoutTime = timeWorkoutStarts;

        // Ui:
        // defaultMovementSpeed is  measured in `n pixels per second`.
        this.defaultMovementSpeed = 300;
        this.currentMovementSpeed = this.defaultMovementSpeed;
        this.sprite = null;
        // destinationPos is an obect that contains the x,y coords where this customer wishes to move to.
        this.destinationPos = null;
        this.isMoving = false;
        this.tween = null;
        this.removeFromGym = false;

        // meters represents all of the customer's current internal levels:
        this.meters = new CustomerMeters();
    }

    delete() {
        this.removeFromGym = true;
    }

    addThought(sentiment, thought) {
        console.log("[DEBUG] " + this.name + " has new thought: " + thought);
        this.thoughts[sentiment][thought]++;
        this.thoughtBubbles.push(thought);
    }

    getTotalHappiness() {
        var h = 1; // TODO: Store this base hapiness somewhere.
        for (var thought in this.thoughts.happy) {
            h += this.thoughts.happy[thought];
        }

        for (var thought in this.thoughts.sad) {
            h -= this.thoughts.sad[thought];
        }

        return h;
    }

    removeThoughtBubble() {
        if (this.currentThoughtSprite) {
            this.currentThoughtSprite.destroy();
        }
        this.isThinking = false;
        this.currentThought = null;
    }

    moveToXY(x,y) {
        this.isMoving = true;
        this.destinationPos = {
          x: x,
          y: y
        }
    }

    finishMovement() {
        this.isMoving = false;
        this.destinationPos = null;
        this.currentMovementSpeed = this.defaultMovementSpeed;
    }

    processStep(gym) {
        if (this.state.is('home')) {
            this.processHomeState(gym);
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
    processHomeState(gym) {
        if (this.sprite && !this.isMoving) {
            this.sprite.destroy();
            this.sprite = null;
        }

        if (this.removeFromGym) {
            console.log("[DEBUG] " + this.name + ' is cancelling their subscription');
            gym.customers = _.without(gym.customers, _.findWhere(gym.customers, {
                id: this.id
            }));
        }

        if (this.isTimeForWorkout(gym)) {
            console.log("[DEBUG] " + this.name + " is going to gym");
            this.resetCustomerSession();
            // Create sprite:
            this.sprite = customerGroup.create(game.world.width / 2, game.world.height, 'customer-1');
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
            this.addThought('sad', 'workout_not_finished');
            // Go home:
            this.moveToXY(game.world.width / 2, game.world.height);
            return this.state.leaveGym();
        }

        if (this.currentSession.isMaxSessionTimeReached(gym.getDate())) {
            console.log("[DEBUG] " + this.name + " reached max workout session time and is going home");
            this.addThought('sad', 'workout_not_finished');
            return this.state.leaveGym();
        }

        if (this.meters.boredom > 0 && this.meters.screenTouch > 0) {
            // TODO: Make screentouching a state as well.
            // TODO: Animate the customer looking at their phone. Or make them get water or something.
            console.log("[DEBUG] " + this.name + " is screen touching");
            var sign = Math.floor(Math.random()*2) == 1 ? 1 : -1;
            if (!this.isMoving) {
                this.currentMovementSpeed = 100; // TODO: make this a param of moveToXY()
                this.moveToXY(
                  this.sprite.x + sign * (Math.floor(Math.random()*300) + 1),
                  this.sprite.y + sign * ( Math.floor(Math.random()*300) + 1)
                );
            } else {
              this.meters.boredom--;
            }
          } else {
          // Let's start looking for a machine to use:
          return this.state.lookForMachine();
        }
    }

    processLookingForMachineState() {
        if (this.isWorkoutOver()) {
            console.log("[DEBUG] Workout over. " + this.name + " is going to shower.");
            if (this.currentSession.numMachinesSkipped === 0) {
                this.addThought('happy', 'workout_finished'); // FUN_NOTE: THis might make the game too easy.
            }
            return this.state.endWorkout();
        }

        // Workout is not over; look for a machine to use.
        var machines = Customer.customerTypes()[this.customerType].routine;
        var nextMachine =  machines[this.currentSession.numMachinesUsedInSession];
        var r = gym.findMachineForWorkout(nextMachine);

        if (r.machine !== null && r.status === 'FOUND') {
            var m = r.machine;
            console.log("[DEBUG] " + this.name + " is going to machine: " + m.name);
            m.addCustomerToLine(this);
            this.currentSession.currentMachine = m;
            this.state.queueUpForMachine();
        } else if (r.status === 'FULL_LINE') {
            // Machine was found but the line is full.
            this.addThought('sad', 'long_lines_suck');
            this.meters.boredom+= 80;
            console.log("[DEBUG] all lines for " + nextMachine + " are currently full");
            this.state.waitForLinesToEmpty();
        } else {
            console.log("[DEBUG] " + this.name + " cannot find a " + nextMachine + " machine");
            // There is not currently a working machine of this type in the gym.
            this.currentSession.numMachinesSkipped++;
            this.addThought('sad', 'machine_not_available');
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
            this.moveToXY(
                curM.sprite.x,
                curM.sprite.y - (this.sprite.height) / 1.5
            );
            this.state.startUsingMachine();
        } else {
            if (!this.isMoving) {
                // Move to the correct position in line.
                var posInLine = curM.getCustomerPosInLine(this);
                this.moveToXY(
                    curM.sprite.x,
                    curM.sprite.y + (this.sprite.height * (posInLine + 1))
                );
            }

            this.meters.boredom++;
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

    // TODO: Should shower just be another machine?
    //       (Meaning also a machine for the machine states.)
    //       That would allow users to line up in a line waiting. But for now showers are going to be magical
    //       and allow infinite people.
    processShoweringState() {
        var r = gym.findMachineForWorkout('shower');

        if (r === null || r.status === 'MISSING') {
            this.addThought('sad', 'no_shower');
            // Go home:
            this.moveToXY(game.world.width / 2, game.world.height);
            this.state.leaveGym();
        } else {
            // Shower exists: Move to that location:
            if (!this.isMoving) {
                this.moveToXY(r.machine.sprite.x, r.machine.sprite.y);
            }

            if (this.meters.dirty === 0) {
                console.log("[DEBUG] " + this.name + " has finished showering. Going home.");
                this.state.leaveGym();
            } else  {
                this.meters.dirty--;
            }
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
        this.lastWorkoutDate = new Date(gym.getDate());
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
