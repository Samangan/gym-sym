
import Gym from '../classes/Gym';
import Machine from '../classes/Machine';

class CoreGame extends Phaser.State {
    preload () {
        // preload the hud:
        this.game.load.image('machine-store-btn', 'assets/ui/machine-store-btn.png');
        this.game.load.image('build-store-btn', 'assets/ui/build-store-btn.png');
        this.game.load.image('pause-time-btn', 'assets/ui/pause-time-btn.png');
        this.game.load.image('resume-time-btn', 'assets/ui/resume-time-btn.png');

        // preload the gym:
        this.game.load.spritesheet('gym-tiles-spritesheet', 'assets/map/gridtiles.png', 32, 32);
        this.game.load.image('gym-tiles', 'assets/map/gridtiles.png');
        this.game.load.image('grass-tile', 'assets/map/grasstile.png');

        // preload machines sprites:
        this.game.load.image('treadmill', 'assets/machines/treadmill.png');
        this.game.load.image('benchpress', 'assets/machines/barbell.png');
        this.game.load.image('freeweights', 'assets/machines/free_weights.png');
        this.game.load.image('shower', 'assets/machines/shower.png');

        // preload customer related sprites:
        this.game.load.spritesheet('customer-1', 'assets/customers/customer-1.png', 32, 48);
        // TODO: Put all of the thought bubbles in one spritesheet:
        this.game.load.image('thought-bubble-workout_not_finished', 'assets/customers/thought_bubble_long_lines_suck.png');
        this.game.load.image('thought-bubble-long_lines_suck', 'assets/customers/thought_bubble_long_lines_suck.png');
        this.game.load.image('thought-bubble-workout_finished', 'assets/customers/thought_bubble_workout_finished.png');
        this.game.load.image('thought-bubble-machine_not_available', 'assets/customers/thought_bubble_machine_not_available.png');
        this.game.load.image('thought-bubble-no_shower', 'assets/customers/thought_bubble_no_shower.png');

        // preload json data:
        this.game.load.json('machineStore', 'data/machines.json');
        this.game.load.json('customerTypes', 'data/customerTypes.json');

        // TODO: Put all of the menu related stuff in the menu state file.
        this.game.load.image('store-background', 'assets/ui/store-background.png');
    }

    create() {
        this.debug = false;
        this.game.physics.startSystem(Phaser.Physics.ARCADE);

        this.initGymMap();
        this.initHUD();

        this.machineStore = this.game.cache.getJSON('machineStore');
        this.customerTypes = this.game.cache.getJSON('customerTypes');

        this.gym = new Gym(30000, this.game, this.customerTypes);

        // Every 1/100 seconds is 1 in-game minute:
        this.game.time.events.loop(Phaser.Timer.SECOND / 100, this.gym.tickClock, this.gym);
    }

    update() {
        // TODO: Actaully just tie the update loop to the in-game clock.
        // Read: http://gafferongames.com/game-physics/fix-your-timestep/
        // to see how to achieve this.

        // Add tiles if we are currently adding a tile:
        if (this.isBuilding) {
            // TODO: Put this shit in a function in the new throw away ui file:
            if (this.game.input.mousePointer.isDown) {
                this.map.putTile(
                    this.tilesetMap[this.buildingItem],
                    this.gymLayer.getTileX(this.game.input.mousePointer.worldX),
                    this.gymLayer.getTileY(this.game.input.mousePointer.worldY)
                );
            } else if (this.game.input.mousePointer.isUp) {
                this.isBuilding = false;
                this.buildingItem = null;
            }
        }

        //game.physics.arcade.collide(customerGroup, customerGroup); //, collisionHandler, null, this);
        //game.physics.arcade.collide(customerGroup, ui.gymLayer, collisionHandler, null, this);

        // Process potential action for each customer:
        for (var i = 0; i < this.gym.customers.length; i++) {
            var c = this.gym.customers[i];

            // If this customer needs to go somewhere,
            // then move them there.
            if (c.destinationPos) {
                var x = c.destinationPos.x;
                var y = c.destinationPos.y;

                var duration = (this.game.physics.arcade.distanceToXY(c.sprite, x, y) / c.currentMovementSpeed) * 1000;
	              c.tween = this.game.add.tween(c.sprite).to({ x: x, y: y }, duration, Phaser.Easing.Linear.None, true);
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
            c.processStep(this.gym);
        }
    }

    render() {
        this.renderHUD();

        for (var i = 0; i < this.gym.customers.length; i++) {
            var c = this.gym.customers[i];
            if (this.debug && c.sprite) {
                var style = { font: "10px Arial", fill: "#f9542f4", wordWrap: true, wordWrapWidth: c.sprite.width, align: "center" };
                if (c.debugText) {
                    c.debugText.destroy();
                }
                c.debugText = this.game.add.text(0,0, "state: " + c.state.current, style);
                c.debugText.alignTo(c.sprite, Phaser.LEFT_TOP, 2);
            }

            // TODO: Instead of destroying the sprite and recreating each time. Cant we just change the x,y vals of the sprite?
            if (c.isThinking && c.sprite) {
                // Render the current thought
                if (c.currentThoughtSprite) {
                    c.currentThoughtSprite.destroy();
                }
                c.currentThoughtSprite = this.game.add.sprite(c.sprite.x, c.sprite.y - 5, 'thought-bubble-'+c.currentThought);
                c.currentThoughtSprite.anchor.setTo(0.5, 0.5);
                c.currentThoughtSprite.alignTo(c.sprite, Phaser.RIGHT_TOP, 2);
                // Remove the bubble after 1 second:
                this.game.time.events.add(Phaser.Timer.SECOND * 1, c.removeThoughtBubble, c);
            }
        }
    }

    initHUD() {
        this.ui = {
            tilesetMap: {
                floor: 1,
                wall: 5
            },
        };
        this.ui.machineStoreBtn = this.game.add.button(this.game.world.width - 175, -5, 'machine-store-btn', this.openMachineStore, this);
        this.ui.buildStoreBtn = this.game.add.button(this.game.world.width - 230, -5, 'build-store-btn', this.openBuildStore, this).scale.setTo(0.5,0.5);
        this.ui.pauseTimeBtn = this.game.add.button(this.game.world.width - 550, 5, 'pause-time-btn', this.pauseTime, this);
    }

    initGymMap() {
        // TODO: Use a TILED json spritemap instead of the below hardcoding in this file:
        this.tilesetMap = {
            floor: 1,
            wall: 5
        };
        this.map = game.add.tilemap();

        // TODO:
        // * Create a proper tileset and then reference the different tiles from within there properly.
        // See: http://brandonclapp.com/creating-and-importing-a-map-for-phaser-using-tiled/
        this.map.addTilesetImage('gym-tiles');

        //  Creates a new blank layer and sets the map dimensions.
        //  In this case the map is 32x24 tiles in size and the tiles are 32x32 pixels in size.
        this.gymLayer = this.map.create('level1', 32, 24, 32, 32);
        this.gymLayer.scrollFactorX = 0.5;
        this.gymLayer.scrollFactorY = 0.5;

        // Pre-populate the map with floor tiles:
        this.map.fill(this.tilesetMap.floor, 0, 0, this.game.width, this.game.height, 'level1');

        // Enable collision only for the wall tiles: (TODO: Not working right now.)
        this.map.setCollision(this.tilesetMap.wall);

        //  Resize the world
        this.gymLayer.resizeWorld();

        // TODO: Make a player action state. For now just have this variable:
        this.isBuilding = false;
    }

    // TODO: All this hud rendering junnk is janky and shouldnt belong here.
    // * The menus should be in their own state at least.
    renderHUD() {
        // Render Gym clock:
        var style = { font: "20px Arial", fill: "#98f700", wordWrap: false, align: "center"};

        // TODO: just change the text instead of destroying these each time lol.
        if (this.ui.gymClock) {
            this.ui.gymClock.destroy();
        }
        var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
        this.ui.gymClock = this.game.add.text(0, 0, days[this.gym.getDate().getDay()] + ' ' + this.gym.getDate().toString().replace(/\S+\s(\S+)\s(\d+)\s(\d+)\s.*/,'$1, $2 $3') + " : " + this.gym.getTimeFormatted(), style);

        // Render Gym money amount:
        if (this.ui.moneyDisplay) {
            this.ui.moneyDisplay.destroy();
        }
        this.ui.moneyDisplay = this.game.add.text(this.game.world.width - 100, 0, "$ " + this.gym.getCash() + ".00" ,style);

        if (this.gym.dailyBalanceQueue.length > 0) {
            var balance = this.gym.dailyBalanceQueue.pop();
            var posStyle = { font: "20px Arial", fill: "#44e20b", wordWrap: false, align: "center" };
            var negStyle = { font: "20px Arial", fill: "#f70254", wordWrap: false, align: "center" };

            if (balance > 0) {
                this.ui.dailyBalanceTicker = this.game.add.text(this.game.world.width - 100, 20, "+ $ " + balance + ".00", posStyle);
            } else {
                this.ui.dailyBalanceTicker = this.game.add.text(this.game.world.width - 100, 20, "- $ " + Math.abs(balance) + ".00", negStyle);
            }
            this.game.time.events.loop(Phaser.Timer.SECOND / 100, this.dailyBalanceFall, this.ui.dailyBalanceTicker);
        }

        // Render number of customers:
        if (this.ui.numCustomers) {
            this.ui.numCustomers.destroy();
        }
        this.ui.numCustomers = this.game.add.text(0, 20, "Num Customers: " + this.gym.customers.length, style);

        if (this.gym.dailyCustomerQueue.length > 0) {
            balance = this.gym.dailyCustomerQueue.pop();
            posStyle = { font: "20px Arial", fill: "#44e20b", wordWrap: false, align: "center" };
            negStyle = { font: "20px Arial", fill: "#f70254", wordWrap: false, align: "center" };

            if (balance > 0) {
                this.ui.dailyCustomerBalanceTicker = this.game.add.text(140, 30, "+ " + balance, posStyle);
            } else {
                this.ui.dailyCustomerBalanceTicker = this.game.add.text(140, 30, "- " + Math.abs(balance), negStyle);
            }
            this.game.time.events.loop(Phaser.Timer.SECOND / 100, this.dailyBalanceFall, this.ui.dailyCustomerBalanceTicker);
        }

        style.fill = "#f442c5";

        if (this.ui.gymFame) {
            this.ui.gymFame.destroy();
        }
        this.ui.gymFame = this.game.add.text(0, this.game.world.height - 80, "Gym Fame: " + this.gym.fame, style);

        if (this.ui.avgCustHappiness) {
            this.ui.avgCustHappiness.destroy();
        }
        this.ui.avgCustHappiness = this.game.add.text(0, this.game.world.height - 60, "Avg cust happiness: " + this.gym.getAvgCustomerHappiness(), style);

        if (this.ui.membershipCost) {
            this.ui.membershipCost.destroy();
        }
        this.ui.membershipCost = this.game.add.text(0, this.game.world.height - 40, "Daily membership cost: $" + this.gym.membershipCost, style);
    }

    // TODO: Put this somewhere meaningful
    dailyBalanceFall() {
        this.y += 1;

        // A bit hacky..
        // TODO: JUst make this a tween + fade out
        if (this. y > 100) {
            this.destroy();
        }
    }

    // focus on creating a fun game core game loop:
    openBuildStore() {
        // Some inspiration for what the store could look like: http://www.gamesbrief.com/assets/2014/02/store-screens.jpg
        // For now I am going to just use a debug rectangle, lol. Keep it programmer art for now!
        var background = this.game.add.sprite(100, 100, 'store-background');

        var style = { font: "20px Arial", fill: "#0a0a0a", wordWrap: false, align: "center" };
        var title = this.game.add.text(0, 0, 'Build Store', style);
        title.alignTo(background, Phaser.TOP_CENTER, 1);

        var buildingParts = ['floor', 'wall'];
        var buildStoreUiElements = [title, background];
        var y_offset = 10;

        for (var i = 0; i < buildingParts.length; i++) {
            var part = buildingParts[i];
            var floorSprite = this.game.add.sprite(this.game.world.width / 2 - 300, this.game.world.height / 6 + y_offset, 'gym-tiles-spritesheet' , this.ui.tilesetMap[part]);
            var name = this.game.add.text(0, 0, part, style);
            name.alignTo(floorSprite, Phaser.TOP_LEFT, 1);
            var purchase = this.game.add.text(0,0, 'Purchase', style);
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
                this.isBuilding = true;
                this.buildingItem = p.part;
            }, this);

            buildStoreUiElements.push(floorSprite);
            buildStoreUiElements.push(name);
            buildStoreUiElements.push(purchase);

            if (y_offset + 100 < this.game.world.height) {
                y_offset += 100;
            } else {
                x_offset = 400;
                y_offset = 10;
            }
        }
    }


    // TODO:
    // * Put the workoutLength, and maxConcurrentCustomers in the store.
    openMachineStore() {
        // Some inspiration for what the store could look like: http://www.gamesbrief.com/assets/2014/02/store-screens.jpg
        // For now I am going to just use a debug rectangle, lol. Keep it programmer art for now!
        var background = this.game.add.sprite(100, 100, 'store-background');

        var style = { font: "20px Arial", fill: "#f922d9", wordWrap: false, align: "center"};
        var title = this.game.add.text(0, 0, 'Machine Store', style);
        title.alignTo(background, Phaser.TOP_CENTER, 1);

        // Put machines on store
        var x_offset = -100;
        var y_offset = 10;

        var machStoreUiElements = [title, background];
        for (var machine in this.machineStore) {
            var machineSprite = this.game.add.sprite(this.game.world.width / 2 - 300 + x_offset, this.game.world.height / 6 + y_offset, machine);
            var name = this.game.add.text(0, 0, machine, style);
            name.alignTo(machineSprite, Phaser.TOP_LEFT, 1);
            var cost = this.game.add.text(0, 0, '$'+this.machineStore[machine].cost+".00", style);
            cost.alignTo(machineSprite, Phaser.RIGHT_TOP, 1);
            var purchase = this.game.add.text(0,0, 'Purchase', style);
            purchase.alignTo(machineSprite, Phaser.RIGHT_BOTTOM, 1);
            // setup click handler to purchase this machine when purchase text is clicked:
            purchase.inputEnabled = true;
            purchase.machine = machine;

            purchase.events.onInputDown.add((m) => {
                // TODO: Actually purchase the machine using the gym's cash supply.
                var mach = this.machineStore[m.machine];

                if (this.gym.cash < mach.cost) {
                    return;
                }

                this.gym.cash -= mach.cost;

                // Tear down the store page:
                for (var i = 0; i < machStoreUiElements.length; i++) {
                    machStoreUiElements[i].destroy();
                }
                machStoreUiElements = [];

                // Put a machine in the user's cursor and let them place it somewhere in the gym.
                var x = this.game.input.mousePointer.worldX;
                var y = this.game.input.mousePointer.worldY;

                // Create a new machine and place it in the gym:
                mach.pos = { x: x, y: y };
                mach.sprite = this.game.add.sprite(x, y, mach.name);
                var machineToAdd = new Machine(mach);
                this.gym.addToMachines(machineToAdd);

                // Register the onDragStop event with the new machine in the gym:
                mach.sprite.inputEnabled = true;
                mach.sprite.input.enableDrag(true);
                mach.sprite.events.onDragStop.add(Machine.onDragMachineStop, machineToAdd);
            }, this);

            machStoreUiElements.push(machineSprite);
            machStoreUiElements.push(name);
            machStoreUiElements.push(cost);
            machStoreUiElements.push(purchase);

            if (y_offset + 200 < background.height) {
                y_offset += 200;
            } else {
                x_offset = 350;
                y_offset = 10;
            }
        }
    }
}

export default CoreGame;

