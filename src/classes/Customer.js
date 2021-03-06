
import _ from 'underscore';
import StateMachine from 'javascript-state-machine';

import CustomerMeters from './CustomerMeters';
import GymSession from './GymSession';

// BUG TODO: If the customer goes from standing in line to working out state then they dont move
//           up to the machine.

class Customer {
    constructor(
        id,
        name,
        timeWorkoutStarts,
        customerRoutine,
        customerType
    ) {
        this.id = id;
        this.name = name;
        this.dateJoined = new Date();
        this.customerRoutine = customerRoutine;
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

        this.showDetailView = false;

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
            this.processIdleState(gym);
        } else if (this.state.is('looking_for_machine')) {
            this.processLookingForMachineState(gym);
        } else if (this.state.is('waiting_in_line')) {
            this.processWaitingInLineState();
        } else if (this.state.is('working_out')) {
            this.processWorkingOutState();
        } else if (this.state.is('showering')) {
            this.processShoweringState(gym);
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

        if (this.detailView) {
            this.detailView.destroy();
            this.showDetailView = false;
        }

        if (this.removeFromGym) {
            gym.customers = _.without(gym.customers, _.findWhere(gym.customers, {
                id: this.id
            }));
        }

        if (this.isTimeForWorkout(gym)) {
            this.resetCustomerSession(gym);
            // Create sprite:
            this.createSprite(gym, gym.game.world.width / 2, gym.game.world.height);
            this.state.goToGym();
        }
    }

    processIdleState(gym) {
        if (this.meters.social === 0) {
            return this.state.startSocializing();
        }

        if (!gym.isOpen()) {
            this.addThought('sad', 'workout_not_finished');
            // Go home:
            this.moveToXY(gym.game.world.width / 2, gym.game.world.height);
            return this.state.leaveGym();
        }

        if (this.currentSession.isMaxSessionTimeReached(gym.getDate())) {
            this.addThought('sad', 'workout_not_finished');
            return this.state.leaveGym();
        }

        if (this.meters.boredom > 0 && this.meters.screenTouch > 0) {
            // TODO: Animate the customer looking at their phone. Or make them get water or something.
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

    processLookingForMachineState(gym) {
        if (this.isWorkoutOver()) {
            if (this.currentSession.numMachinesSkipped === 0) {
                this.addThought('happy', 'workout_finished'); // FUN_NOTE: THis might make the game too easy.
            }
            return this.state.endWorkout();
        }

        // Workout is not over; look for a machine to use.
        var machines = this.customerRoutine.routine;
        var nextMachine =  machines[this.currentSession.numMachinesUsedInSession];
        var r = gym.findMachineForWorkout(nextMachine);

        if (r.machine !== null && r.status === 'FOUND') {
            var m = r.machine;
            m.addCustomerToLine(this);
            this.currentSession.currentMachine = m;
            this.state.queueUpForMachine();
        } else if (r.status === 'FULL_LINE') {
            // Machine was found but the line is full.
            this.addThought('sad', 'long_lines_suck');
            this.meters.boredom+= 150;
            this.moveToXY(gym.game.world.width / 2, gym.game.world.height / 2);
            this.state.waitForLinesToEmpty();
        } else {
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
            // TODO: move to the middle of the machine
            this.moveToXY(
                (curM.sprite.x + curM.sprite.width/2) - this.sprite.width/2,
                (curM.sprite.y + curM.sprite.height/2) - this.sprite.height/2 //- (this.sprite.height) / 1.5
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
            // POST MVP TODO: Shift a little to indicate getting impatient with waiting in line.
        }
    }

    processWorkingOutState() {
        var curM = this.currentSession.currentMachine;
        if (this.currentSession.isDoneUsingMachine()){
            curM.removeCustomerFromMachineUsers(this);
            this.currentSession.useNextMachine();
            // Continue next workout:
            this.state.lookForMachine();
        } else {
            this.currentSession.useCurrentMachine();
        }
    }

    // TODO: Should shower just be another machine?
    //       (Meaning also a machine for the machine states.)
    //       That would allow users to line up in a line waiting. But for now showers are going to be magical
    //       and allow infinite people.
    processShoweringState(gym) {
        // TODO: If they are already in the machine showering, then skip this step.
        // Otherwise, the customers will go between multiple showers if more than one exist.
        var r = gym.findMachineForWorkout('shower');

        if (r === null || r.status === 'MISSING') {
            this.addThought('sad', 'no_shower');
            // Go home:
            this.moveToXY(gym.game.world.width / 2, gym.game.world.height);
            this.state.leaveGym();
        } else {
            // Shower exists: Move to that location:
            if (!this.isMoving) {
                this.moveToXY(r.machine.sprite.x, r.machine.sprite.y);
            }

            if (this.meters.dirty === 0) {
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

    resetCustomerSession(gym) {
        this.lastWorkoutDate = new Date(gym.getDate());
        this.currentSession = new GymSession(gym.getDate(), this.customerRoutine.routine.length);
        this.meters = new CustomerMeters();
    }

    isInGym() {
        return !this.state.is('home');
    }

    // TODO: this should be in customerSession.js:
    isWorkoutOver() {
        var workoutLength = this.customerRoutine.routine.length;
        return this.currentSession.numMachinesUsedInSession >= workoutLength;
    }

    isTimeForWorkout(gym) {
        if (this.needsToWorkout(gym.getDate()) && gym.isOpen()) {
            return gym.getTime() >= this.workoutTime;
        }
        return false;
    }

    needsToWorkout(today) {
        var workoutDays = this.customerRoutine.days_of_week;

        if (workoutDays.indexOf(today.getDay()) >= 0) {
            if (this.lastWorkoutDate === null ||
                this.lastWorkoutDate.getDate() !== today.getDate()) {
                return true;
            }
        }
        return false;
    }

    getSession() {
        return this.currentSession;
    }

    createSprite(gym, x, y) {
        this.sprite = gym.game.add.sprite(x, y, 'customer-1');
        this.sprite.inputEnabled = true;
        this.sprite.input.draggable = false;
        this.sprite.events.onInputDown.add(this.onClick, this);
    }

    onClick(s) {
        this.showDetailView = true;
        if (this.detailView) {
            this.detailView = null;
        }
    }
}

export default Customer;
