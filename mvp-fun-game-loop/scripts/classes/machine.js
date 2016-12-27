
class Machine {
    constructor(m) {
        // TODO: use uuid package instead:
        this.id = Math.floor((Math.random() * 100000) + 1);
        this.name = m.name;
        this.isRental = false;
        this.costToPurchase = m.cost;

        this.maintLevel = 100;
        this.maintFactor = m.maintFactor;

        this.workoutLength = m.workoutLength; // Minutes it takes a customer to workout on machine

        this.maxConcurrentCustomers = m.maxConcurrentCustomers; // Some 'machines' like yoga_room and free_weights can have lots of simulaneous occupants
        this.currentCustomers = []; // Customers currently using this machine.

        this.positionInGym = m.pos;
        this.dimensions = m.dimensions;

        this.customerLine = [];

        this.sprite = m.sprite;
    }

    isLineEmpty() {
        return this.customerLine.length === 0;
    }

    addCustomerToLine(c) {
        this.customerLine.push(c);
    }

    // Move the 1st customer in line into the machine.
    removeFirstCustomerInLine() {
        this.currentCustomers.push(
            this.customerLine.shift()
        );
    }

    // Check if 1st customer in line can use the machine now.
    canFirstCustomerInLineUseMachine() {
        if (this.currentCustomers.length === this.maxConcurrentCustomers) {
            return false;
        }
        return true;
    }

    // Make this customer start using this machine.
    addNextCustomerToMachineUsers() {
        if (!this.canFirstCustomerInLineUseMachine()) {
            console.log("[ERROR] This machine: " + m.id + " is full!");
            return;
        }

        this.removeFirstCustomerInLine();
    }

    removeCustomerFromMachineUsers(c) {
        for (var i = 0; i < this.currentCustomers.length; i++) {
            if (this.currentCustomers[i].id === c.id) {
                this.currentCustomers.splice(i, 1);
                break;
            }
        }
    }

    isCustomerFirstInLine(c) {
        return this.getCustomerPosInLine(c)  === 0;
    }

    getCustomerPosInLine(c) {
        for (var i = 0; i < this.customerLine.length; i++) {
            if (this.customerLine[i].id === c.id) {
                return i;
            }
        }
        return -1;
    }

    // UI helpers:
    static onDragMachineStop(m) {
        // Move the machine to the new location of the sprite:
        this.positionInGym = {
            x: m.x,
            y: m.y
        };
    }
}
