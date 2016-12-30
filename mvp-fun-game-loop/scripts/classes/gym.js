
class Gym {
    constructor(startingCash, machines, customers) {
        this.cash = startingCash;

        this.dailyBalanceQueue = [];

        // openingTime is the minute of the day when the gym opens.
        this.openingTime = 360;
        // closingTime is the minute of the day when the gym closes.
        this.closingTime = 1380;

        // clock keeps track of the current in-game time.
        this.clock = new Clock(1398, new Date(2005, 0, 1));

        // machines is a list of all of the machines in this gym.
        this.machines = machines || [];

        // customers is a list of the paying customers that belong to the gym.
        this.customers = customers || [];

        // fame represents the gym's popularity (increases over time as more people join) TODO: Implement increasing later.
        this.fame = 1;

        // how many dollars per day it costs to use the gym.
        this.membershipCost = 3;

    }

    tickClock() {
        console.log("[DEBUG] Current Gym Date: " + this.clock.getDate());
        console.log("[DEBUG] Current Gym Time: " + this.clock.getTimeFormatted());
        var nextDay = this.clock.processStep();

        if (nextDay) {
            this.closeBooks();
            this.acquireNewCustomers();
        }
    }

    closeBooks() {
        // Calculate daily income:
        var income = this.customers.length * this.membershipCost;

        // Calculate daily expenditures:
        // TODO: Make a variable in machines.json that tracks the electrical usage for each machine.
        //       Right now we are just making it the same for all machines.
        var electricityBill = this.machines.length * 3;

        // TODO: implement employees:
        var employeeSalaries = 0;

        var expenditures = 0;
        expenditures -= electricityBill + employeeSalaries;

        var dailyBalance = income - Math.abs(expenditures);
        this.cash += dailyBalance;
        this.dailyBalanceQueue.push(dailyBalance);
    }


    // TODO: Implement purchasing different types of advertisements (like in gamedevtycoon)
    //       which will increase the Fame variable for a short period of time.
    acquireNewCustomers() {

        // TODO: Improve this formula:
        // * A problem:
        // * * If I use average happiness some people in a large gym can be really unhappy but never leave.

        // TODO: Major? problem:
        // * How do I address stagnation?
        // * * You can just stop building machines and eventually the customers will stagnate.
        //     Is that ok?
        // * I think introducing employees will make this more pressing to get more customers.
        var numNewCustomers = Math.round(this.fame * (this.getAvgCustomerHappiness() + 1) - this.membershipCost/2);

        console.log('[DEBUG] newCustomers today: ' + numNewCustomers);
        // if numNewCustomers is negative then remove that many customers (most unhappy first) instead of adding new customers.
        if (numNewCustomers < 0) {
            // Remove numNewCustomers from our current customer list (unhappiest first).
            var leastHappyCusts = _.sortBy(this.customers, (c) => {
                return c.getTotalHappiness();
            });

            for (var i = 0; i < -1 * numNewCustomers; i++) {
                var custToRemove = leastHappyCusts[i];
                if (custToRemove) {
                    custToRemove.delete();
                }
            }
            // TODO: There shold be a ticker message saying that people left the gym.
        } else {
            // Add numNewCustomers to our gym
            for (var i = 0; i < numNewCustomers; i++) {
                var customerType = Customer.getRandomCustomerType();
                console.log(customerType);

                // TODO: dont make the sprite until they are going to the gym (This is just for debugging)
                var sprite = customerGroup.create(32 + i * 80, game.world.height - 150, 'customer-1');

                this.customers.push(new Customer(
                    'customer-'+this.customers.length,
                    customerType,
                    Math.floor(Math.random() * (this.closingTime - 3 - this.openingTime + 1)) + this.openingTime,
                    sprite
                ));
                this.fame+=0.1;
                // TODO: There should be a tikcer message saying that people joined the gym.
            }
        }
    }

    getAvgCustomerHappiness() {
        if (this.customers.length === 0) {
            return 1;
        }

        var h = 0;

        for (var i = 0; i < this.customers.length; i++) {
            h += this.customers[i].getTotalHappiness();
        }

        return h / this.customers.length;
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
    // TODO: This function should be cleaned up.
    // * it's a bit messy and long for what it does, and it also returns null and a status.
    //
    // Basic round robin selection algo.
    findMachineForWorkout(machineName) {
        if (!machineName) {
            return null;
        }

        var machinesToChooseFrom = _.filter(this.machines, (m) => {
            if (m.name === machineName) {
                return m;
            }
        });

        var res = {
            status: 'MISSING',
            machine: null
        };

        if (machinesToChooseFrom.length === 0) {
            return res;
        }

        var availableMachines = _.filter(machinesToChooseFrom, (m) => {
            if (!m.isLineMaxCap()) {
                return m;
            }
        });

        if (availableMachines.length === 0) {
            // All lines are full.
            res.status = 'FULL_LINE';
            return res;
        }

        if (availableMachines.length === 1) {
            res.status= 'FOUND';
            res.machine = availableMachines[0];
            return res;
        }

        // Pick a random machine from the ones available.
        var i = Math.floor((Math.random() * availableMachines.length) + 1);
        res.machine = availableMachines[i-1];
        res.status = 'FOUND';
        return res;
    }
}
