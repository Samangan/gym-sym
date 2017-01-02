
import _ from 'underscore';

import Gym from '../classes/Gym';
import Machine from '../classes/Machine';
import HUD from '../HUD';

class CoreGame extends Phaser.State {
    preload () {
        this.game.hud = new HUD(game);

        // preload the gym:
        this.game.load.image('gym-tiles', 'assets/map/gridtiles.png');

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
        this.game.load.json('customerTypes', 'data/customerTypes.json');
    }

    create() {
        this.game.isDebug = false;
        this.game.physics.startSystem(Phaser.Physics.ARCADE);

        this.initGymMap();

        this.customerTypes = this.game.cache.getJSON('customerTypes');

        if (!this.game.gym) {
            this.gym = new Gym(30000, this.game, this.customerTypes);
            this.game.gym = this.gym;
        }

        // Every 1/100 seconds is 1 in-game minute:
        this.game.time.events.loop(Phaser.Timer.SECOND / 100, this.gym.tickClock, this.gym);

        // Listen for a click to disable detailview
        this.game.input.onDown.add(this.listenForDetailViewUnFocus, this);
    }

    update() {
        if (this.gameOver()) {
            this.game.state.start('gameOver');
        }

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
        this.game.hud.renderHUD(this.gym);

        for (var i = 0; i < this.gym.customers.length; i++) {
            var c = this.gym.customers[i];

            // TODO: Get rid of debug now that I have the detailview:
            if (this.game.isDebug && c.sprite) {
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

            if (c.showDetailView && c.sprite) {
                if (c.detailView) {
                    c.detailView.destroy();
                }
                this.detailViewOn = true;
                var workoutDone = ['✖', '✓'];
                var style = { font: "12px Arial", fill: "#ffffff", backgroundColor: "#7a7d82", wordWrap: true, wordWrapWidth: 100, align: "left" };
                c.detailView = this.game.add.text(
                    c.sprite.x - 100,
                    c.sprite.y,
                    c.name +
                        "\n" + c.customerType +
                        "\n\n" + "Routine:" +
                        "\n" + _.map(c.customerRoutine.routine, (w, i) => {
                            return w + "   " + workoutDone[c.getSession().machinesUsed[i]] + "\n";
                        }).join(""),
                    style
                );
            }
        }

        for (var i = 0; i < this.gym.machines.length; i++) {
            var m = this.gym.machines[i];

            if (!m.sprite || !m.sprite.visible) {
                m.sprite = this.game.add.sprite(m.positionInGym.x, m.positionInGym.y, m.name);
                // Register the onDragStop event with the new machine in the gym:
                m.sprite.inputEnabled = true;
                m.sprite.input.enableDrag(true);
                m.sprite.events.onDragStop.add(m.onDragMachineStop, m);
            }
        }
    }

    initGymMap() {
        this.tilesetMap = {
            floor: 1,
            wall: 5
        };
        this.map = game.add.tilemap();
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
    }

    gameOver() {
        return this.gym.cash <= 0;
    }

    listenForDetailViewUnFocus() {
        if (this.detailViewOn) {
            _.each(this.gym.customers, (c) => {
                if (c.showDetailView) {
                    c.showDetailView = false;
                    c.detailView.destroy();
                    c.detailView = null;
                }
            });
            this.detailViewOn = false;
        }
    }
}

export default CoreGame;

