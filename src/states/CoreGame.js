
import _ from 'underscore';
import Hammer from 'hammerjs';

import Gym from '../classes/Gym';
import Machine from '../classes/Machine';
import HUD from '../HUD';

class CoreGame extends Phaser.State {
    // TODO: Pan the camera with 'wasd'.
    // TODO: Pan the camera when the mouse is on the corners of the screen since most strategies work like that.
    // TODO: Zoom in and out.

    preload () {
        this.game.hud = new HUD(game);

        // preload the gym:
        this.game.load.image('gym-tiles', 'assets/map/gridtiles.png');

        // preload machines sprites:
        // TODO: load these all automatically from machines.json:
        this.game.load.image('treadmill', 'assets/machines/treadmill.png');
        this.game.load.image('benchpress', 'assets/machines/barbell.png');
        this.game.load.image('chestpress', 'assets/machines/chest_press.png');
        this.game.load.image('legpress', 'assets/machines/leg_press.png');
        this.game.load.image('squatrack', 'assets/machines/squatrack.png');
        this.game.load.image('freeweights', 'assets/machines/free_weights.png');
        this.game.load.image('stairclimber', 'assets/machines/stair_climber.png');
        this.game.load.image('cycle', 'assets/machines/cycle.png');
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
        this.initGymMap();

        this.customerTypes = this.game.cache.getJSON('customerTypes');

        if (!this.game.gym) {
            this.gym = new Gym(35000, this.game, this.customerTypes);
            this.game.gym = this.gym;
        }

        // Every 1/100 seconds is 1 in-game minute:
        this.game.time.events.loop(Phaser.Timer.SECOND / 100, this.gym.tickClock, this.gym);

        // Listen for a click to disable detailview
        this.game.input.onDown.add(this.listenForDetailViewUnFocus, this);
        this.game.stage.smoothed = false;
        this.cursors = this.game.input.keyboard.createCursorKeys();
    }

    update() {
        if (this.gameOver()) {
            this.game.state.start('gameOver');
        }

        // Process user any user input:
        this.processUserInput();

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
                c.destinationPos = null; // TODO: remove this in favor of doing something like finishMovement()
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
        //this.game.debug.cameraInfo(game.camera, game.camera.width - 300, game.camera.height - 100);

        this.game.hud.renderHUD(this.gym);

        // TODO: Remove this for loop once I make the menu not a game state.
        for (var i = 0; i < this.gym.machines.length; i++) {
            var m = this.gym.machines[i];

            if (!m.sprite || !m.sprite.visible) {
                m.sprite = this.game.add.sprite(m.positionInGym.x, m.positionInGym.y, m.name);
                this.game.physics.enable(m.sprite, Phaser.Physics.ARCADE);

                // Register the onDragStop event with the new machine in the gym:
                m.sprite.inputEnabled = true;
                m.sprite.input.enableDrag(true);
                m.sprite.events.onDragStop.add(this.onMachineDragStop, m);
            }
        }

        for (var i = 0; i < this.gym.customers.length; i++) {
            var c = this.gym.customers[i];

            if (c.sprite && !c.sprite.visible) {
                // TODO: The menu shouldnt be a game state. So that I dont have to do this.
                c.createSprite(this.gym, c.sprite.x, c.sprite.y);
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
                        "\n" + "Routine:" +
                        "\n" + _.map(c.customerRoutine.routine, (w, i) => {
                            return w + "   " + workoutDone[c.getSession().machinesUsed[i]] + "\n";
                        }).join("") +
                        "\n" + "Current Action: " + c.state.current + "\n",
                    style
                );
            }
        }
    }

    initGymMap() {
        this.game.physics.startSystem(Phaser.Physics.ARCADE);
        this.game.world.setBounds(0, 0, 1920, 1200);
        this.game.physics.setBoundsToWorld();
        //this.game.scale.pageAlignHorizontally = true;
        //this.game.scale.pageAlignVertically = true;

        // TODO: Organize all of the zooming logic somewhere else.
        this.allowZoom = true;
        this.rendererScale = 1;
        this.minRendererScale = 1;
        this.maxRendererScale = 2;
        this.scaleIncrement = 0.01;

        // TODO: Implement pinch for mobile devices
        // Hammer(document.getElementById('content')).on("pinch", function (event) {
        // });

        this.game.scale.fullScreenScaleMode = Phaser.ScaleManager.EXACT_FIT;

        this.tilesetMap = {
            floor: 41,
            wall: 5,
            grass: 83
        };
        this.map = this.game.add.tilemap();
        this.map.addTilesetImage('gym-tiles');

        //  Creates a new blank layer and sets the map dimensions.
        //  In this case the map is 32x24 tiles in size and the tiles are 32x32 pixels in size.
        this.gymLayer = this.map.create('level1', 64, 48, 32, 32);
        this.gymLayer.scrollFactorX = 0.5;
        this.gymLayer.scrollFactorY = 0.5;

        // Pre-populate the map with floor tiles:
        this.map.fill(this.tilesetMap.floor, 0, 0, this.game.width, this.game.height);

        //  Resize the world
        this.gymLayer.resizeWorld();
    }

    gameOver() {
        return this.gym.cash <= 0;
    }

    processUserInput() {
        this.processWorldZoom();

        if (this.cursors.up.isDown)
        {
            this.game.camera.y -= 32;
        }
        else if (this.cursors.down.isDown)
        {
            this.game.camera.y += 32;
        }

        if (this.cursors.left.isDown)
        {
            this.game.camera.x -= 32;
        }
        else if (this.cursors.right.isDown)
        {
            this.game.camera.x += 32;
        }
    }

    processWorldZoom() {
        if (this.game.input.keyboard.isDown(Phaser.KeyCode.W)) {
            this.zoomIn();
        }

        if (this.game.input.keyboard.isDown(Phaser.KeyCode.S)) {
            this.zoomOut();
        }
    }

    zoomIn() {
        if (!this.allowZoom) {
            return;
        };
        if (this.rendererScale == 1) {
            return;
        }

        if (this.rendererScale < this.minRendererScale) {
            return;
        }

        var worldScale = 1 - this.scaleIncrement;
        this.rendererScale = this.rendererScale * worldScale;

        var newWidth = (game.renderer.width * worldScale);
        var newHeight = (game.renderer.height * worldScale);

        if (this.rendererScale < 1.10) {
            this.rendererScale = 1;
            newHeight = 768; // TODO: Dont hardcode.
            newWidth = 1024;
        }

        this.updateGameOnRendererResize(newWidth, newHeight);

        game.renderer.resize(newWidth, newHeight);

    }

    zoomOut() {
        if (!this.allowZoom) {
            return;
        };

        if (this.rendererScale > this.maxRendererScale) {
            return;
        }

        var worldScale = 1 + this.scaleIncrement;
        this.rendererScale = this.rendererScale * worldScale;

        var newWidth = (this.game.renderer.width * worldScale);
        var newHeight = (this.game.renderer.height * worldScale);
        this.updateGameOnRendererResize(newWidth, newHeight);
        this.game.renderer.resize(newWidth, newHeight);

    }

    updateGameOnRendererResize(newWidth, newHeight) {
        this.game.width = newWidth;
        this.game.height = newHeight;
        this.game.stage.width = newWidth;
        this.game.stage.height = newHeight;
        this.game.camera.setSize(newWidth, newHeight);
        this.game.input.scale.setTo(this.rendererScale);
        this.gymLayer.resize(newWidth, newHeight);
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

    onMachineDragStop(m) {
        for (var i = 0; i < m.game.gym.machines.length; i++) {
            if (m.game.physics.arcade.overlap(m, m.game.gym.machines[i].sprite)) {
                m.visible = false;
                return;
            }
        }
        this.onDragMachineStop(m);
    }
}

export default CoreGame;

