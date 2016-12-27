// random notes:
// * Ill need to do this at some point: https://phaser.io/examples/v2/groups/depth-sort
// * I'll eventually need to have some scrollable/movable background: http://zynga.github.io/scroller/ ?  https://github.com/pbakaus/scroller


var game = new Phaser.Game(1024, 768, Phaser.AUTO, '', { preload: preload, create: create, update: update });

var debug = true;

// MVP TODO: <-----
// The basic customer <-> machine simulation loop is created, I need to:
// * Make a loop that will randomly bring in new customers per day.
// * * Write a formula for acquiring new customers based off of the following metrics:
// * * * fame: how popular the gym is (increases over time)
// * * * customer_happiness: how happy the customers are (ratio of total happy thoughts to sad thoughts)
// * * * membership_cost: lower cost == more customers.

// TODO:
// * Let's create a static gym (walls + floor) for now just so we can implement pathing + collision detection.
// * * We will eventually allow the user to create their own gym like DF (see: https://phaser.io/examples/v2/tilemaps/paint-tiles)



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
// * Implement time controls:
// * * pause, halfspeed, double/triple speed

var gym;

// customers is the list of paying customers in this gym.
var customers = [];
var customerGroup; // TODO: Can i just use this instead of the customers array? (Most likely)

// machineStore contains the machines the player
// can purchase or rent hashed by the machine's name.
var machineStore = {};

var ui = {
    gymClock: null,
    moneyDisplay: null,
    machineStoreBtn: null
};

function preload() {
    // preload the ui:
    game.load.image('machine-store-btn', 'assets/ui/machine-store-btn.png');
    //game.load.image('machine-store-background', 'assets/ui/machine-store-backgroung.png');

    // preload the gym:
    //game.load.image('floor-tile', 'assets/floor-tile.png');

    // preload machines sprites:
    game.load.image('treadmill', 'assets/machines/treadmill.png');
    game.load.image('benchpress', 'assets/machines/barbell.png');
    game.load.image('freeweights', 'assets/machines/barbell.png');

    // preload customers sprites:
    game.load.spritesheet('customer-1', 'assets/customers/customer-1.png', 32, 48);

    // preload machines data into store:
    game.load.json('machineStore', 'data/machines.json');
}

function create() {
    // TODO: Maybe I want to use p2 physics + collision groups, but then I would have to
    // make my own moveToXY() func or I could say: accelerate to the machine's sprite instead or somethign. I shold commit what I have and try it.
    game.physics.startSystem(Phaser.Physics.ARCADE);

    // Init the user interface.
    ui.machineStoreBtn = game.add.button(game.world.width - 175, -5, 'machine-store-btn', openMachineStore, this);

    // TODO: Make a function to do each of these steps:
    // Init gym:
    gym = new Gym(100, [
        //new Machine('treadmill')
    ]);

    // Every 1 seconds is 1 in-game minute:
    game.time.events.loop(Phaser.Timer.SECOND, gym.tickClock, gym);

    machineStore = game.cache.getJSON('machineStore');
    console.log(machineStore);

    customerGroup = game.add.group();
    customerGroup.enableBody = true;
    customerGroup.physicsBodyType = Phaser.Physics.ARCADE;

    // Init some test customers in order to create the initial simulation loop:
    for (var i = 0; i < 16; i++) {
        var customerType = 'weekend_warrior';
        if (i === 1) {
            customerType = 'body_builder_barbell';
        }

        if (i > 20) {
            customerType = 'how_much_can_you_bench_bro';
        }

        //var customer = game.add.sprite(32 + i * 80, game.world.height - 150, 'customer-1');
        var customer = customerGroup.create(32 + i * 80, game.world.height - 150, 'customer-1');
        game.physics.arcade.enable(customer);
        customer.body.collideWorldBounds = true;
        //customer.body.bounce.setTo(1, 1);
        customer.body.mass = 10;

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
    renderUI();

    // Collide the customerGrop with:
    // * Itself (so customers collide into each other)
    // * Machines
    // * Walls
    game.physics.arcade.collide(customerGroup, customerGroup, collisionHandler, null, this); // This could probably be 'overlap'

    // Process potential action for each customer:
    for (var i = 0; i < customers.length; i++) {
        var c = customers[i];

        // If this customer needs to go somewhere, then move them there.
        if (c.destinationPos) {
            var x = c.destinationPos.x;
            var y = c.destinationPos.y;

            var duration = (game.physics.arcade.distanceToXY(c.sprite, x, y) / c.movementSpeed) * 1000;
	          c.tween = game.add.tween(c.sprite).to({ x: x, y: y }, duration, Phaser.Easing.Linear.None, true);
            c.destinationPos = null;
        }

        if (debug) {
            style = { font: "10px Arial", fill: "#f922d9", wordWrap: true, wordWrapWidth: c.sprite.width, align: "center", backgroundColor: "#fffff" };
            if (c.debugText) {
                c.debugText.destroy();
            }
            c.debugText = game.add.text(0,0, "state: " + c.state.current, style);
            c.debugText.alignTo(c.sprite, Phaser.LEFT_TOP, 2);
        }

        c.processStep(gym);
    }
}

// TODO: DEBUGGING:
function collisionHandler(customer1, customer2) {
    console.log('COLLISION!');

}


// TODO: Organize below:
function renderUI() {
    // Render Gym clock:
    var style = { font: "20px Arial", fill: "#f922d9", wordWrap: false, align: "center", backgroundColor: "#fffff" };

    if (ui.gymClock) {
        ui.gymClock.destroy();
    }
    ui.gymClock = game.add.text(0, 0, gym.getDate().toString().replace(/\S+\s(\S+)\s(\d+)\s(\d+)\s.*/,'$1, $2 $3') + " : " + gym.getTimeFormatted(), style);

    // Render Gym money amount:
    if (ui.moneyDisplay) {
        ui.moneyDisplay.destroy();
    }
    ui.moneyDisplay = game.add.text(game.world.width - 100, 0, "$ " + gym.getCash() + ".00" ,style);

    // Render number of customers:
    if (ui.numCustomers) {
        ui.numCustomers.destroy();
    }
    ui.numCustomers = game.add.text(0, 20, "Num Customers: " + customers.length, style);
}

// NOTE: This is uber hax just to allow me to
// focus on creating a fun game core game loop:
function openMachineStore() {
    // Some inspiration for what the store could look like: http://www.gamesbrief.com/assets/2014/02/store-screens.jpg
    // For now I am going to just use a debug rectangle, lol. Keep it programmer art for now!
    var background = new Phaser.Rectangle(100, 100, 800, 600);
    //game.debug.geom(background,'#42bca0');

    var style = { font: "20px Arial", fill: "#f922d9", wordWrap: false, align: "center", backgroundColor: "#fffff" };
    var title = game.add.text(0, 0, 'Machine Store', style);
    title.alignTo(background, Phaser.TOP_CENTER, 1);

    // Put machines on store
    var x_offset = 0;
    var y_offset = 0;

    var machStoreUiElements = [title];
    for (var machine in machineStore) {
        var machineSprite = game.add.sprite(game.world.width / 2 - 300, game.world.height / 6 + y_offset, machine);
        var name = game.add.text(0, 0, machine, style);
        name.alignTo(machineSprite, Phaser.TOP_LEFT, 1);
        var cost = game.add.text(0, 0, '$'+machineStore[machine].cost+".00", style);
        cost.alignTo(machineSprite, Phaser.RIGHT_TOP, 1);
        var purchase = game.add.text(0,0, 'Purchase', style);
        purchase.alignTo(machineSprite, Phaser.RIGHT_BOTTOM, 1);
        // setup click handler to purchase this machine when purchase text is clicked:
        purchase.inputEnabled = true;
        purchase.machine = machine;

        purchase.events.onInputDown.add((m) => {
            // TODO: Actually purchase the machine using the gym's cash supply.

            // Tear down the store page:
            for (var i = 0; i < machStoreUiElements.length; i++) {
                machStoreUiElements[i].destroy();
            }
            machStoreUiElements = [];

            // Put a machine in the user's cursor and let them place it somewhere in the gym.
            var mach = machineStore[m.machine];
            var x = game.input.mousePointer.worldX;
            var y = game.input.mousePointer.worldY;

            // Create a new machine and place it in the gym:
            mach.pos = { x: x, y: y };
            mach.sprite = game.add.sprite(x, y, mach.name);
            var machineToAdd = new Machine(mach);
            gym.addToMachines(machineToAdd);

            // Register the onDragStop event with the new machine in the gym:
            mach.sprite.inputEnabled = true;
            mach.sprite.input.enableDrag(true);
            mach.sprite.events.onDragStop.add(Machine.onDragMachineStop, machineToAdd);
        }, this);

        machStoreUiElements.push(machineSprite);
        machStoreUiElements.push(name);
        machStoreUiElements.push(cost);
        machStoreUiElements.push(purchase);
        y_offset += 200;
    }
}
