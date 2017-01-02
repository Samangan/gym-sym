
class HUD {
    constructor(game) {
        this.game = game;
        this.init();
        this.style = { font: "20px Arial", fill: "#e9e8ea", wordWrap: false, align: "center"};
    }

    init() {
        // preload the hud:
        this.game.load.image('machine-store-btn', 'assets/ui/machine-store-btn.png');
        this.game.load.image('pause-time-btn', 'assets/ui/pause-time-btn.png');
        this.game.load.image('resume-time-btn', 'assets/ui/resume-time-btn.png');
    }

    renderHUD(gym) {
        if (!this.machineStoreBtn || !this.pauseTimeBtn) {
            this.machineStoreBtn = this.game.add.button(
                this.game.world.width - 175,
                -5,
                'machine-store-btn',
                () => {
                    this.game.state.start('menu');
                },
                this
            );
            this.pauseTimeBtn = this.game.add.button(
                this.game.world.width - 550,
                5,
                'pause-time-btn',
                () => {},
                this
            );
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
    }

    renderGymMoney(gym) {
        if (this.moneyDisplay) {
            this.moneyDisplay.destroy();
        }
        this.moneyDisplay = this.game.add.text(this.game.world.width - 100, 0, "$ " + gym.getCash() + ".00" ,this.style);

        if (gym.dailyBalanceQueue.length > 0) {
            var balance = gym.dailyBalanceQueue.pop();
            var posStyle = { font: "20px Arial", fill: "#44e20b", wordWrap: false, align: "center" };
            var negStyle = { font: "20px Arial", fill: "#f70254", wordWrap: false, align: "center" };

            if (balance > 0) {
                this.dailyBalanceTicker = this.game.add.text(this.game.world.width - 100, 20, "+ $ " + balance + ".00", posStyle);
            } else {
                this.dailyBalanceTicker = this.game.add.text(this.game.world.width - 100, 20, "- $ " + Math.abs(balance) + ".00", negStyle);
            }
            this.game.time.events.loop(Phaser.Timer.SECOND / 100, this.dailyBalanceFall, this.dailyBalanceTicker);
        }
    }

    renderCustomers(gym) {
        if (this.numCustomers) {
            this.numCustomers.destroy();
        }
        this.numCustomers = this.game.add.text(0, 20, "Num Customers: " + gym.customers.length, this.style);

        if (gym.dailyCustomerQueue.length > 0) {
            var balance = gym.dailyCustomerQueue.pop();
            var posStyle = { font: "20px Arial", fill: "#44e20b", wordWrap: false, align: "center" };
            var negStyle = { font: "20px Arial", fill: "#f70254", wordWrap: false, align: "center" };

            if (balance > 0) {
                this.dailyCustomerBalanceTicker = this.game.add.text(140, 30, "+ " + balance, posStyle);
            } else {
                this.dailyCustomerBalanceTicker = this.game.add.text(140, 30, "- " + Math.abs(balance), negStyle);
            }
            this.game.time.events.loop(Phaser.Timer.SECOND / 100, this.dailyBalanceFall, this.dailyCustomerBalanceTicker);
        }
    }

    renderDebug(gym) {
        if (this.gymFame) {
            this.gymFame.destroy();
        }
        this.gymFame = this.game.add.text(0, this.game.world.height - 80, "Gym Fame: " + gym.fame, this.style);

        if (this.avgCustHappiness) {
            this.avgCustHappiness.destroy();
        }
        this.avgCustHappiness = this.game.add.text(0, this.game.world.height - 60, "Avg cust happiness: " + gym.getAvgCustomerHappiness(), this.style);

        if (this.membershipCost) {
            this.membershipCost.destroy();
        }
        this.membershipCost = this.game.add.text(0, this.game.world.height - 40, "Daily membership cost: $" + gym.membershipCost, this.style);
    }

    // TODO: Put this somewhere meaningful
    dailyBalanceFall() {
        this.y += 1;
        if (this. y > 100) {
            this.destroy();
        }
    }
}

export default HUD;
