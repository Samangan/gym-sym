import 'pixi';
import 'p2';

import Phaser from 'phaser';
import CoreGame from './states/CoreGame';
import Menu from './states/Menu';
import GameOver from './states/GameOver';

class Game extends Phaser.Game {
    constructor() {
        super(1024, 768, Phaser.AUTO, 'content');
        this.state.add('coreGame', CoreGame, false);
        this.state.add('menu', Menu, false, false);
        this.state.add('gameOver', GameOver, false);

        this.state.start('coreGame');
    }
}

window.game = new Game();
