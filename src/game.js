import 'pixi';
import 'p2';

import Phaser from 'phaser';
import CoreGame from './states/CoreGame';
import Menu from './states/Menu';
import GameOver from './states/GameOver';

class Game extends Phaser.Game {
    constructor() {
        let width = document.documentElement.clientWidth >= 1024 ? 1024 : document.documentElement.clientWidth;
        let height = document.documentElement.clientHeight >= 768 ? 768 : document.documentElement.clientHeight;

        super(width, height, Phaser.AUTO, 'content');
        this.state.add('coreGame', CoreGame, false);
        this.state.add('menu', Menu, false, false);
        this.state.add('gameOver', GameOver, false);

        this.state.start('coreGame');
    }
}

window.game = new Game();

window.WebFontConfig = {
    active: function() { window.game.time.events.add(Phaser.Timer.SECOND, () => {}, this); },
    google: {
        families: ['Orbitron']
    }
};
