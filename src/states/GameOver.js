
class GameOver extends Phaser.State {
    preload() {
        this.game.load.image('game-over-screen', 'assets/ui/game-over-background.png');
    }

    create() {
        this.game.add.sprite(100, 100, 'game-over-screen');
        var newGame = this.game.add.text(this.game.width / 2 - 95, (this.game.height / 2) + 50, 'New Game');
        newGame.inputEnabled = true;
        newGame.events.onInputDown.add(() => {
            this.game.gym = null;
            this.game.state.start('coreGame', true, true);
        }, this);
    }
}

export default GameOver;
