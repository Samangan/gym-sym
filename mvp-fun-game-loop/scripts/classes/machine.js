
class Machine {
    // TODO: pass in the other attributes.
    constructor(name) {
        // TODO: use uuid package instead:
        this.id = Math.floor((Math.random() * 100000) + 1);
        this.name = name;
        this.isRental = false;
        this.costToPurchase = 1000;

        this.maintLevel = 100;
        this.maintFactor = 1;

        this.workoutLength = 1000; // Minutes it takes a customer to workout on machine

        this.maxConcurrentCustomers = 1; // Some 'machines' like yoga_room and free_weights can have lots of simulaneous occupants
        this.currentCustomers = []; // Customers currently using this machine.

        this.positionInGym = {
            x: 100,
            y: 100
        };
        this.dimensions = {
            x: 10,
            y: 10
        };

        this.customerLine = [];
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
        return this.customerLine[0].id === c.id;
    }
}
