
import Machine from './Machine';

class Menu {
    constructor(gym, game) {
        this.titleStyle = { font: "40px Arial", fill: "#42bcf4", wordWrap: false, align: "center"};
        this.style = { font: "16px Arial", fill: "#42bcf4", wordWrap: false, align: "center"};
        this.gym = gym;
        this.game = game;
        this.machineStore = this.gym.game.cache.getJSON('machineStore');
        this.menuItems = [];
    }

    // TODO: Put the workoutLength, and maxConcurrentCustomers in the store.
    openMachineStore() {
        var background = this.game.add.sprite(100, 100, 'store-background');
        this.menuItems.push(background);
        var title = this.game.add.text(0, 0, 'Machine Store', this.titleStyle);
        this.menuItems.push(title);
        title.alignTo(background, Phaser.TOP_CENTER, 1);
        var exitButton = this.game.add.button(0, 0, 'store-exit-btn', this.exitMenu, this);
        this.menuItems.push(exitButton);
        exitButton.alignTo(background, Phaser.RIGHT_TOP, -45, 0);

        this.renderMachines(background);
    }

    renderMachines(background) {
        var x_offset = -100;
        var y_offset = 10;

        for (var machine in this.machineStore) {
            this.renderMachineBtn(x_offset, y_offset, machine);

            if (y_offset + 200 < background.height) {
                y_offset += 150;
            } else {
                x_offset += 270;
                y_offset = 10;
            }
        }
    }

    renderMachineBtn(x_offset, y_offset, name) {
        var machineSprite = this.game.add.sprite(this.game.camera.width / 2 - 300 + x_offset, this.game.camera.height / 6 + y_offset, name);
        this.menuItems.push(machineSprite);
        var nameTxt = this.game.add.text(0, 0, name, this.style);
        this.menuItems.push(nameTxt);
        nameTxt.alignTo(machineSprite, Phaser.TOP_CENTER, 1);
        var cost = this.game.add.text(0, 0, '$'+this.machineStore[name].cost+".00", this.style);
        this.menuItems.push(cost);
        cost.alignTo(machineSprite, Phaser.RIGHT_TOP, 1);
        var purchase = this.game.add.text(0,0, 'Purchase', this.style);
        this.menuItems.push(purchase);
        purchase.alignTo(machineSprite, Phaser.RIGHT_BOTTOM, 1);

        // Setup click handler to purchase this machine when purchase text is clicked:
        purchase.inputEnabled = true;
        purchase.machine = name;
        purchase.events.onInputDown.add(this.purchaseMachine, this);
    }

    purchaseMachine(m) {
        var mach = this.machineStore[m.machine];

        if (this.gym.cash < mach.cost) {
            return;
        }

        this.gym.cash -= mach.cost;

        // Create a new machine and place it in the gym:
        mach.pos = {
            x: 2,
            y: this.game.rnd.between(20, 500)
        };
        mach.id = this.game.rnd.uuid();
        var machineToAdd = new Machine(mach);
        this.gym.addToMachines(machineToAdd);

        this.exitMenu();
    }

    exitMenu() {
        for (var i = 0; i < this.menuItems.length; i++) {
            this.menuItems[i].destroy();
        }
        this.menuItems = [];
    }
}

export default Menu;
