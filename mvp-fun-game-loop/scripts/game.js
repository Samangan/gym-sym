// random notes:
// * Ill need to do this at some point: https://phaser.io/examples/v2/groups/depth-sort
// * I'll eventually need to have some scrollable/movable background: https://phaser.io/examples/v2/camera/moving-the-camera or  http://zynga.github.io/scroller/ ?  https://github.com/pbakaus/scroller

// More good reads: http://www.joshmorony.com/how-to-create-an-accurate-timer-for-phaser-games/

var game = new Phaser.Game(1024, 768, Phaser.AUTO, '', { preload: preload, create: create, update: update, render: render });

// Show debug information in the game itself:
var debug = true;

// * Implement collision / pathing for customers.

//Latest todo:
// * pathing + collision
// * show detail info of customer / machine on clicking.
// * Implement employees (see below detailed notes)
// * show some info / graphs in different menus.

// TODO FIRST
// * Allow player to set price of membership
// * Implement employees:
// * * personal trainers --> make customers come to gym more and less likely to cancel at end of year.
// * * janitors --> keep the place clean (implement dirty machines, shower, floors, etc later)
// * * etc.
// * Allow player to manage employees and how much they get paid, etc.
// * Allow player to see a budget with graphs and shit
// * Implement time controls:
// * * pause, halfspeed, double/triple speed
// * Use webpack or something  + require.js and make this a real project instead of testing local poc shit.

// Core game loop brainstorming:
// * This is basically roller coaster tycoon without the custom roller coasters. Could that be fun?
// * Think:
// * * What makes rimworld, or prison architect fun?
// * * * The steadily increasing difficulty curve as you expand. <------ Yes, this.
// * * * Then what is this game's steadily increasing difficulty curve?
// * * * * (Obvious) More customers as the gym becomes more popular and meeting their demands for equipments.
// * * * * The changing trends of the customers over the years (Ex: early 2000's: want ball classes and tanning beds, mid 2010's want crossfit and powerlifting)
// * * * *
// * Ideas:
// * * Different tiers of the same equipment: Ex a faster treadmill that lets people work out faster but it costs more.

var gym;

var customerGroup; // TODO: Can i just use this instead of the customers array? (Most likely)

// machineStore contains the machines the player
// can purchase or rent hashed by the machine's name.
var machineStore = {};

var ui = {
    // ui menu:
    gymClock: null,
    moneyDisplay: null,

    // TODO: Put below into a separate object other than this 'ui' god object.
    // gym building tilemap:
    map: null,

    // TODO: Use a TILED json spritemap instead of the below hardcoding in this file:
    tilesetMap: {
        floor: 1,
        wall: 5
    },
    gymLayer: null,
    isBuilding: false
};

function preload() {
    // preload the ui:
    game.load.image('machine-store-btn', 'assets/ui/machine-store-btn.png');
    game.load.image('build-store-btn', 'assets/ui/build-store-btn.png');
    game.load.image('pause-time-btn', 'assets/ui/pause-time-btn.png');
    game.load.image('resume-time-btn', 'assets/ui/resume-time-btn.png');
    game.load.image('store-background', 'assets/ui/store-background.png');

    // preload the gym:
    //game.load.image('floor-tile', 'assets/map/tile.png');
    //game.load.image('wall-tile', 'assets/map/wall.png');
    game.load.spritesheet('gym-tiles-spritesheet', 'assets/map/gridtiles.png', 32, 32);
    game.load.image('gym-tiles', 'assets/map/gridtiles.png');
    game.load.image('grass-tile', 'assets/map/grasstile.png');

    // preload machines sprites:
    game.load.image('treadmill', 'assets/machines/treadmill.png');
    game.load.image('benchpress', 'assets/machines/barbell.png');
    game.load.image('freeweights', 'assets/machines/free_weights.png');

    // preload customers sprites:
    game.load.spritesheet('customer-1', 'assets/customers/customer-1.png', 32, 48);
    game.load.image('thought-bubble-workout_not_finished', 'assets/customers/thought_bubble_long_lines_suck.png');
    game.load.image('thought-bubble-long_lines_suck', 'assets/customers/thought_bubble_long_lines_suck.png');
    game.load.image('thought-bubble-workout_finished', 'assets/customers/thought_bubble_workout_finished.png');
    game.load.image('thought-bubble-machine_not_available', 'assets/customers/thought_bubble_machine_not_available.png');
    // TODO: create the rest of the thought bubbles

    // preload machines data into store:
    game.load.json('machineStore', 'data/machines.json');
}

function create() {
    game.physics.startSystem(Phaser.Physics.ARCADE);

    // Create the initial gym:
    ui.map = game.add.tilemap();
    // TODO:
    // * Create a proper tileset and then reference the different tiles from within there properly.
    // See: http://brandonclapp.com/creating-and-importing-a-map-for-phaser-using-tiled/
    ui.map.addTilesetImage('gym-tiles');

    //  Creates a new blank layer and sets the map dimensions.
    //  In this case the map is 32x24 tiles in size and the tiles are 32x32 pixels in size.
    ui.gymLayer = ui.map.create('level1', 32, 24, 32, 32);
    ui.gymLayer.scrollFactorX = 0.5;
    ui.gymLayer.scrollFactorY = 0.5;

    // Pre-populate the map with floor tiles:
    ui.map.fill(ui.tilesetMap.floor, 0, 0, game.width, game.height, 'level1');

    // Enable collision only for the wall tiles: (TODO: Not working right now.)
    ui.map.setCollision(ui.tilesetMap.wall);

    //  Resize the world
    ui.gymLayer.resizeWorld();

    // Init the user interface.
    ui.machineStoreBtn = game.add.button(game.world.width - 175, -5, 'machine-store-btn', openMachineStore, this);
    ui.buildStoreBtn = game.add.button(game.world.width - 230, -5, 'build-store-btn', openBuildStore, this).scale.setTo(0.5,0.5);
    ui.pauseTimeBtn = game.add.button(game.world.width - 550, 5, 'pause-time-btn', pauseTime, this);

    // TODO: Make a function to do each of these steps:
    // Init gym:
    gym = new Gym(20000);

    // Every 1/10 seconds is 1 in-game minute:
    game.time.events.loop(Phaser.Timer.SECOND / 100, gym.tickClock, gym);

    machineStore = game.cache.getJSON('machineStore');
    console.log(machineStore);

    customerGroup = game.add.group();
    customerGroup.enableBody = true;
    customerGroup.physicsBodyType = Phaser.Physics.ARCADE;
}

function collisionHandler() {
    console.log('ouch a wall');
}

function update() {
    // TODO: Actaully just tie the update loop to the in-game clock.
    // Read: http://gafferongames.com/game-physics/fix-your-timestep/
    // to see how to achieve this.

    // Add tiles if we are currently adding a tile:
    if (ui.isBuilding) {
        // TODO: Put this shit in a function in the new throw away ui file:
        if (game.input.mousePointer.isDown) {
            ui.map.putTile(
                ui.tilesetMap[ui.buildingItem],
                ui.gymLayer.getTileX(game.input.mousePointer.worldX),
                ui.gymLayer.getTileY(game.input.mousePointer.worldY)
            );
        } else if (game.input.mousePointer.isUp) {
            ui.isBuilding = false;
            ui.buildingItem = null;
        }
    }

    // Collide the customerGrop with:
    // * Itself (so customers collide into each other)
    // * Machines
    // * Walls
    game.physics.arcade.collide(customerGroup, customerGroup); //, collisionHandler, null, this);

    // TODO: I cannot get this to work!
    game.physics.arcade.collide(customerGroup, ui.gymLayer, collisionHandler, null, this);

    // Process potential action for each customer:
    for (var i = 0; i < gym.customers.length; i++) {
        var c = gym.customers[i];

        // If this customer needs to go somewhere,
        // then move them there.
        if (c.destinationPos) {
            var x = c.destinationPos.x;
            var y = c.destinationPos.y;

            var duration = (game.physics.arcade.distanceToXY(c.sprite, x, y) / c.currentMovementSpeed) * 1000;
	          c.tween = game.add.tween(c.sprite).to({ x: x, y: y }, duration, Phaser.Easing.Linear.None, true);
            c.tween.onComplete.addOnce(c.finishMovement, c);
            c.destinationPos = null; // TODO: remove this in favor of doing this in finishMovement()
        }

        // If the customer has a new thought, process it:
        if (c.thoughtBubbles.length > 0) {
            // TODO: Put this all in a function:
            c.currentThought = c.thoughtBubbles.pop();
            c.isThinking = true;
        }

        // Process current state:
        c.processStep(gym);
    }
}

function render() {
    renderUI();

    for (var i = 0; i < gym.customers.length; i++) {
        var c = gym.customers[i];
        if (debug && c.sprite) {
            var style = { font: "10px Arial", fill: "#f9542f4", wordWrap: true, wordWrapWidth: c.sprite.width, align: "center" };
            if (c.debugText) {
                c.debugText.destroy();
            }
            c.debugText = game.add.text(0,0, "state: " + c.state.current, style);
            c.debugText.alignTo(c.sprite, Phaser.LEFT_TOP, 2);
        }

        if (c.isThinking) {
            // Render the current thought
            if (c.currentThoughtSprite) {
                c.currentThoughtSprite.destroy();
            }
            c.currentThoughtSprite = game.add.sprite(c.sprite.x, c.sprite.y - 5, 'thought-bubble-'+c.currentThought);
            c.currentThoughtSprite.anchor.setTo(0.5, 0.5);
            c.currentThoughtSprite.alignTo(c.sprite, Phaser.RIGHT_TOP, 2);
            // Remove the bubble after 1 second:
            game.time.events.add(Phaser.Timer.SECOND * 1, c.removeThoughtBubble, c);
        }
    }
}

// TODO: Actually implement pause/resume/etc.
function pauseTime() {
    // remove game clock:
    game.time.events.removeAll();
    ui.pauseTimeBtn.destroy();
    ui.pauseTimeBtn = game.add.button(game.world.width - 550, 5, 'resume-time-btn', resumeTime, this);
}

function resumeTime() {
    // reset game clock:
    game.time.events.loop(Phaser.Timer.SECOND, gym.tickClock, gym);
    ui.pauseTimeBtn.destroy();
    ui.pauseTimeBtn = game.add.button(game.world.width - 550, 5, 'pause-time-btn', pauseTime, this);
}

// TODO: Put the throw away ui code in some other file:
// NOTE: This is uber hax just to allow me to test the game loop.
function renderUI() {
    // Render Gym clock:
    var style = { font: "20px Arial", fill: "#98f700", wordWrap: false, align: "center"};

    // TODO: just change the text instead of destroying these each time lol.
    if (ui.gymClock) {
        ui.gymClock.destroy();
    }
    var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    ui.gymClock = game.add.text(0, 0, days[gym.getDate().getDay()] + ' ' + gym.getDate().toString().replace(/\S+\s(\S+)\s(\d+)\s(\d+)\s.*/,'$1, $2 $3') + " : " + gym.getTimeFormatted(), style);

    // Render Gym money amount:
    if (ui.moneyDisplay) {
        ui.moneyDisplay.destroy();
    }
    ui.moneyDisplay = game.add.text(game.world.width - 100, 0, "$ " + gym.getCash() + ".00" ,style);

    if (gym.dailyBalanceQueue.length > 0) {
        var balance = gym.dailyBalanceQueue.pop();
        var posStyle = { font: "20px Arial", fill: "#44e20b", wordWrap: false, align: "center" };
        var negStyle = { font: "20px Arial", fill: "#f70254", wordWrap: false, align: "center" };

        if (balance > 0) {
            ui.dailyBalanceTicker = game.add.text(game.world.width - 100, 20, "+ $ " + balance + ".00", posStyle);
        } else {
            ui.dailyBalanceTicker = game.add.text(game.world.width - 100, 20, "- $ " + Math.abs(balance) + ".00", negStyle);
        }
        game.time.events.loop(Phaser.Timer.SECOND / 100, dailyBalanceFall, ui.dailyBalanceTicker);
    }

    // Render number of customers:
    if (ui.numCustomers) {
        ui.numCustomers.destroy();
    }
    ui.numCustomers = game.add.text(0, 20, "Num Customers: " + gym.customers.length, style);

    //if (debug) {
        if (ui.gymFame) {
            ui.gymFame.destroy();
        }
        ui.gymFame = game.add.text(0, 40, "Gym Fame: " + gym.fame, style);

        if (ui.avgCustHappiness) {
            ui.avgCustHappiness.destroy();
        }
        ui.avgCustHappiness = game.add.text(0, 60, "Avg cust happiness: " + gym.getAvgCustomerHappiness(), style);

        if (ui.membershipCost) {
            ui.membershipCost.destroy();
        }
        ui.membershipCost = game.add.text(0, 80, "Daily membership cost: $" + gym.membershipCost, style);
    //}
}

// TODO: Put this somewhere meaningful
function dailyBalanceFall() {
    this.y += 1;

    // A bit hacky..
    // TODO: JUst make this a tween + fade out
    if (this. y > 100) {
        this.destroy();
    }
}

// focus on creating a fun game core game loop:
function openBuildStore() {
    // Some inspiration for what the store could look like: http://www.gamesbrief.com/assets/2014/02/store-screens.jpg
    // For now I am going to just use a debug rectangle, lol. Keep it programmer art for now!
    var background = game.add.sprite(100, 100, 'store-background');

    var style = { font: "20px Arial", fill: "#0a0a0a", wordWrap: false, align: "center" };
    var title = game.add.text(0, 0, 'Build Store', style);
    title.alignTo(background, Phaser.TOP_CENTER, 1);

    var buildingParts = ['floor', 'wall'];
    var buildStoreUiElements = [title, background];
    var y_offset = 0;

    for (var i = 0; i < buildingParts.length; i++) {
        var part = buildingParts[i];
        var floorSprite = game.add.sprite(game.world.width / 2 - 300, game.world.height / 6 + y_offset, 'gym-tiles-spritesheet' , ui.tilesetMap[part]);
        var name = game.add.text(0, 0, part, style);
        name.alignTo(floorSprite, Phaser.TOP_LEFT, 1);
        var purchase = game.add.text(0,0, 'Purchase', style);
        purchase.alignTo(floorSprite, Phaser.RIGHT_BOTTOM, 1);
        // setup click handler to purchase this machine when purchase text is clicked:
        purchase.inputEnabled = true;
        purchase.part = part;

        purchase.events.onInputDown.add((p) => {
            // Tear down the store page:
            for (var z = 0; z < buildStoreUiElements.length; z++) {
                buildStoreUiElements[z].destroy();
            }

            // Set us up for building:
            ui.isBuilding = true;
            ui.buildingItem = p.part;
        }, this);

        buildStoreUiElements.push(floorSprite);
        buildStoreUiElements.push(name);
        buildStoreUiElements.push(purchase);
        y_offset += 100;
    }
}


// TODO:
// * Put the workoutLength, and maxConcurrentCustomers in the store.
function openMachineStore() {
    // Some inspiration for what the store could look like: http://www.gamesbrief.com/assets/2014/02/store-screens.jpg
    // For now I am going to just use a debug rectangle, lol. Keep it programmer art for now!
    var background = game.add.sprite(100, 100, 'store-background');

    var style = { font: "20px Arial", fill: "#f922d9", wordWrap: false, align: "center"};
    var title = game.add.text(0, 0, 'Machine Store', style);
    title.alignTo(background, Phaser.TOP_CENTER, 1);

    // Put machines on store
    var x_offset = 0;
    var y_offset = 0;

    var machStoreUiElements = [title, background];
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
            var mach = machineStore[m.machine];

            if (gym.cash < mach.cost) {
                return;
            }

            gym.cash -= mach.cost;

            // Tear down the store page:
            for (var i = 0; i < machStoreUiElements.length; i++) {
                machStoreUiElements[i].destroy();
            }
            machStoreUiElements = [];

            // Put a machine in the user's cursor and let them place it somewhere in the gym.
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
