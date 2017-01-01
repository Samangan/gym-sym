
# Gym-Sym

< TODO insert screenshot >

This is a small gym simulation game to learn phaser game engine, and to prototype a fun game loop for a fitness gym simulator.

Go here: < TODO insert url> to play a version of the game

## Development

### Local Dev loop
`npm run dev`

### Generate prod assets
`npm run deploy`

## TODO
 + Add more machines + more customerTypes
 * * Make unique sprites for each customerType and each machine.
 * A* Pathing + collision
 * Show detail info of customer / machine on clicking.
 * Implement employees (see below detailed notes)
 * Show some info / graphs in different menus.
 * Allow player to set price of membership
 * Implement employees:
 * * personal trainers --> make customers come to gym more and less likely to cancel at end of year.
 * * janitors --> keep the place clean (implement dirty machines, shower, floors, etc later)
 * Allow player to manage employees and how much they get paid, etc.
 * Allow player to see a budget with graphs and shit
 * Implement time controls:
 * * pause, halfspeed, double/triple speed
 * Productionalize the project:
 * * webpack or some other build tool.
 * * require.js.
 * * etc.

## Brainstorming:
 * Implement advertisements that increase gym fame for a short amount of time.
 * I could have different tiers of the same equipment that cost more money but offer some value (ex: a treadmill that has a shorter workout time)
 * Random links:
 * * https://phaser.io/examples/v2/groups/depth-sort
 * * https://phaser.io/examples/v2/camera/moving-the-camera or  http://zynga.github.io/scroller/ ?  https://github.com/pbakaus/scroller
 * * http://www.joshmorony.com/how-to-create-an-accurate-timer-for-phaser-games/
