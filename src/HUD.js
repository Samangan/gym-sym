
class HUD {
    // TODO BUG: When zooming out the hud gets smaller.
    // (Phaser does not have out of the box zooming so this is to be expected.)

    constructor(game) {
        this.game = game;
        this.init();
        this.style = { font: "20px Orbitron", fill: "white", wordWrap: false, align: "center"};
    }

    init() {
        // preload the hud:
        this.game.load.image('machine-store-btn', 'assets/ui/machine-store-btn.png');
        this.game.load.image('pause-time-btn', 'assets/ui/pause-time-btn.png');
        this.game.load.image('resume-time-btn', 'assets/ui/resume-time-btn.png');
        this.game.load.image('fullscreen-btn', 'assets/ui/fullscreen-btn.png');

        //  Load the Google WebFont Loader script
        game.load.script('webfont', '//ajax.googleapis.com/ajax/libs/webfont/1.4.7/webfont.js');
    }

    renderHUD(gym) {
        if (!this.machineStoreBtn || !this.pauseTimeBtn) {
            this.machineStoreBtn = this.game.add.button(
                this.game.camera.width - 175,
                -5,
                'machine-store-btn',
                () => {
                    this.game.state.start('menu');
                },
                this
            );
            this.machineStoreBtn.fixedToCamera = true;

            this.fullScreenBtn = this.game.add.button(
                this.machineStoreBtn.x - 60,
                this.machineStoreBtn.y + 5,
                'fullscreen-btn',
                () => {
                    if (this.game.scale.isFullScreen) {
                        this.game.scale.stopFullScreen();
                    }
                    else {
                        this.game.scale.startFullScreen(true);
                    }
                },
                this
            );
            this.fullScreenBtn.fixedToCamera = true;

            this.pauseTimeBtn = this.game.add.button(
                this.game.camera.width - 550,
                5,
                'pause-time-btn',
                () => {},
                this
            );
            this.pauseTimeBtn.fixedToCamera = true;
        }

        this.renderGymClock(gym);
        this.renderGymMoney(gym);
        this.renderCustomers(gym);
        // TODO: Finialize what I am going to display to the user.
        this.renderDebug(gym);
    }

    renderGymClock(gym) {
        if (this.gymClock) {
            this.gymClock.destroy();
        }
        var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
        this.gymClock = this.game.add.text(0, 0, days[gym.getDate().getDay()] + ' ' + gym.getDate().toString().replace(/\S+\s(\S+)\s(\d+)\s(\d+)\s.*/,'$1, $2 $3') + " : " + gym.getTimeFormatted(), this.style);
        this.gymClock.fixedToCamera = true;
    }

    renderGymMoney(gym) {
        if (this.moneyDisplay) {
            this.moneyDisplay.destroy();
        }
        this.moneyDisplay = this.game.add.text(this.game.camera.width - 125, 0, "$ " + gym.getCash() + ".00" ,this.style);
        this.moneyDisplay.fixedToCamera = true;

        if (gym.dailyBalanceQueue.length > 0) {
            var balance = gym.dailyBalanceQueue.pop();
            var posStyle = { font: "20px Arial", fill: "#44e20b", wordWrap: false, align: "center" };
            var negStyle = { font: "20px Arial", fill: "#f70254", wordWrap: false, align: "center" };

            if (balance > 0) {
                this.dailyBalanceTicker = this.game.add.text(this.game.camera.width - 100, 20, "+ $ " + balance + ".00", posStyle);
            } else {
                this.dailyBalanceTicker = this.game.add.text(this.game.camera.width - 100, 20, "- $ " + Math.abs(balance) + ".00", negStyle);
            }
            this.dailyBalanceTicker.fixedToCamera = true;
            this.game.time.events.loop(Phaser.Timer.SECOND / 100, this.dailyBalanceFall, this.dailyBalanceTicker);
        }
    }

    renderCustomers(gym) {
        if (this.numCustomers) {
            this.numCustomers.destroy();
        }
        this.numCustomers = this.game.add.text(0, 20, "Num Customers: " + gym.customers.length, this.style);
        this.numCustomers.fixedToCamera = true;

        if (gym.dailyCustomerQueue.length > 0) {
            var balance = gym.dailyCustomerQueue.pop();
            var posStyle = { font: "20px Arial", fill: "#44e20b", wordWrap: false, align: "center" };
            var negStyle = { font: "20px Arial", fill: "#f70254", wordWrap: false, align: "center" };

            if (balance > 0) {
                this.dailyCustomerBalanceTicker = this.game.add.text(140, 30, "+ " + balance, posStyle);
            } else {
                this.dailyCustomerBalanceTicker = this.game.add.text(140, 30, "- " + Math.abs(balance), negStyle);
            }
            this.dailyCustomerBalanceTicker.fixedToCamera = true;
            this.game.time.events.loop(Phaser.Timer.SECOND / 100, this.dailyBalanceFall, this.dailyCustomerBalanceTicker);
        }
    }

    renderDebug(gym) {
        if (this.gymFame) {
            this.gymFame.destroy();
        }
        this.gymFame = this.game.add.text(0, this.game.camera.height - 80, "Gym Fame: " + gym.fame, this.style);
        this.gymFame.fixedToCamera = true;

        if (this.avgCustHappiness) {
            this.avgCustHappiness.destroy();
        }
        this.avgCustHappiness = this.game.add.text(0, this.game.camera.height - 60, "Avg cust happiness: " + gym.getAvgCustomerHappiness(), this.style);
        this.avgCustHappiness.fixedToCamera = true;

        if (this.membershipCost) {
            this.membershipCost.destroy();
        }
        this.membershipCost = this.game.add.text(0, this.game.camera.height - 40, "Daily membership cost: $" + gym.membershipCost, this.style);
        this.membershipCost.fixedToCamera = true;
    }

    dailyBalanceFall() {
        this.cameraOffset.y += 1;
        if (this.cameraOffset.y > 100) {
            this.destroy();
        }
    }
}

export default HUD;
