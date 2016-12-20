
var game = new Phaser.Game(800, 600, Phaser.AUTO, '', { preload: preload, create: create, update: update });

var debug = true;

// MVP TODO: <-----
// The basic customer <-> machine simulation loop is created, I need to:
//
// * Formulate some machines into json files and load all of the possible machines in this class into a hash of the machine name -> the object.
// * * Create a machine factory method that creates a new machine instance based off of the machine data in the json.
//
// * Add a basic UI to allow user to purchase machines and place them somewhere in the gym.
// * Make a loop that will randomly bring in new customers per day.
// * * Write a formula for acquiring new customers based off of the following metrics:
// * * * fame: how popular the gym is (increases over time)
// * * * customer_happiness: how happy the customers are (ratio of total happy thoughts to sad thoughts)
// * * * membership_cost: lower cost == more customers.
// * Move customers around based on their state:
// * * waiting_in_line: form a queue in front of the machine based on their position in the queue.
// * * working_out: animate them using the machine (v2). For now put the sprite on top of the machine.
// * Show customers thoughts as thought bubbles:
// * * Make little images for each thought.
// * "close the books" each night:
// * * + daily revenue (calculate any recurring subscriptions. If about to end perform a happniess + random number calculation to see if customer is going to cancel or not).
// * * - daily operating costs (machine rental amount, utilities, employee paychecks)
// * Allow player to set price of membership
// * Implement employees:
// * * personal trainers --> make customers come to gym more and less likely to cancel at end of year.
// * * janitors --> keep the place clean (implement dirty machines, shower, floors, etc later)
// * * etc.
// * Allow player to manage employees and how much they get paid, etc.
// * Allow player to see a budget with graphs and shit



var customers = [];

function preload() {
    //game.load.image('floor-tile', 'assets/floor-tile.png');

    // preload machines:
    game.load.image('treadmill', 'assets/machines/treadmill.png');

    // preload customers:
    game.load.spritesheet('customer-1', 'assets/customers/customer-1.png', 32, 48);
}

function create() {
    game.add.sprite(0, 0, 'treadmill');

    // Init gym and clock:
    gym = new Gym(100, [
        // TODO: load these machines from json files (and pass in all of the other attributes for each one)
        new Machine('treadmill')
    ]);

    // Every 1 seconds is 1 in-game minute:
    game.time.events.loop(Phaser.Timer.SECOND, gym.tickClock, gym);

    // Init some test customers in order to create the initial simulation loop:
    for (var i = 0; i < 3; i++) {
        var customerType = 'weekend_warrior';
        if (i === 1) {
            customerType = 'body_builder_barbell';
        }

        var customer = game.add.sprite(32 + i * 100, game.world.height - 150, 'customer-1');
        game.physics.arcade.enable(customer);
        customer.body.collideWorldBounds = true;
        customers.push(new Customer(
            'customer-'+i,
            customerType,
            14000,
            'yearly',
            customer
        ));
    }
}

function update() {
    // Process potential action for each customer:
    // * From their current state, check if they need to move to next state.
    for (var i = 0; i < customers.length; i++) {
        var c = customers[i];

        if (debug) {
            // Show their current state above their sprite:
            var style = { font: "10px Arial", fill: "#f922d9", wordWrap: true, wordWrapWidth: c.sprite.width, align: "center", backgroundColor: "#fffff" };
            text = game.add.text(c.sprite.x, c.sprite.y, "state: " + c.state.current, style);
            text.anchor.set(0.5);
        }

        c.processStep(gym);
    }
}
