# Features
- Special moves system (like: hadouken and sonic boom)
- Normalizes output of keys and buttons
- Can convert axes to move buttons
- Add multi player to keyboard
- Manages gamepad connections


#### This package has 3 different modules consisting of:
- ### AdvancedInput
Adds a special movement system
- ### BasicInput
Normalizes the configuration and output of the keyboard and gamepad, adds basic mapping of buttons and keys
- ### RawInput
Normalizes basic keyboard and gamepad events, manages connection of new gamepads, manages keyboard keys by separating and configuring part of the keyboard for each player

# AdvancedInput
---
This package inherits BasicInput functionality, initialization is the same
```javascript
import { AdvancedInput } from './src/AdvancedInput.js'
const input = new AdvancedInput();
```
#### SPECIAL MOVEMENTS
##### Type sequence
```javascript
//create a hadouken like
input.createSpecialMoves('hadouken',
    {
        DPad: ['Down', 'DownRight', 'Right'],
        Buttons: ['ButtonX', 'ButtonY', 'ButtonL'],
        type: 'sequence',
        timeout: 100 //max exection time in ms default is 250
    }
);
//add hadouken to player1
input.addInputSpecialMove('Player1', 'hadouken');

//create a shouryuken like
input.createSpecialMoves('shouryuken',
    {
        DPad: ['Right', 'DownRight', 'Right'],
        Buttons: ['ButtonX', 'ButtonY', 'ButtonL'],
        type: 'sequence',
    }
);
//add to players
input.addInputSpecialMove('Player1', 'shouryuken');
input.addInputSpecialMove('Player2', 'shouryuken');
```
##### Type charge
```javascript
//create charge special move
input.createSpecialMoves('sonic-boom',
    {
        DPad: ['Left', 'Right'], //first will be the chargekey
        Buttons: ['ButtonX', 'ButtonY', 'ButtonL'], //buttons 
        type: 'charge', //type charge or sequence
        chargeTime: 1200, //time pressing button to charge
    }
);
//add it to player
input.addInputSpecialMove('Player1', 'sonic-boom');
```
##### Buttons pressed at same time
```javascript
input.createSpecialMoves('super-hadouken',
    {
        DPad: ['Down', 'DownRight', 'Right'],
        Buttons: ['ButtonX+ButtonY+ButtonL'], //press 3 buttons at same time to this movement
        type: 'sequence',
    }
);
```
#### Listen special moves events
```javascript
//start it
input.startSpecialMoves();//start engine
//listen special moves
input.listenSpecialMoves((inputId, movesArray, movesObject) => {
    console.log('SpecialMoves', inputId, movesArray, movesObject);
});
```
#### Others options
```javascript
//invert only one move
input.invertSpecialMove('Player1', 'hadouken', 'invertX');

//invert all moves from player
input.invertAllSpecialMoves('Player1', 'invertX');

//enable or disable one special move
input.enableSpecialMove('Player1', 'hadouken', false);

//enable or disable all special moves
input.enableAllSpecialMoves('Player1', true); //false to disable it
```

# BasicInput
---
```javascript
import { BasicInput } from './src/BasicInput.js'
const input = new BasicInput();
```
You can create a keyboard and gamepad with same player id this will add Players ability to use keyboard and gamepad simultaneous
#### Keyboard
```javascript
input.createKeyboard('Player1', {
    ArrowUp: 'Up',
    ArrowDown: 'Down',
    ArrowLeft: 'Left',
    ArrowRight: 'Right',
    Enter: 'Start',
    Esc: 'Select',
    z: 'ButtonA',
    x: 'ButtonB',
    a: 'ButtonX',
    s: 'ButtonY',
    c: 'ButtonR',
    d: 'ButtonL',
    q: 'ButtonL2',
    w: 'ButtonR2',
    e: 'ButtonL3',
    r: 'ButtonR3',
});
```
#### Gamepad
```javascript
//values can be 
//DEFAULT_GENERIC, DEFAULT_GENERIC_NO_AXES, DEFAULT_GENERIC_AXES
input.createGamepad('Player1', 'DEFAULT_GENERIC');

//or create a map
input.createGamepad('Player1', 
{
    Button12: 'Up',
    Button13: 'Down',
    Button14: 'Left',
    Button15: 'Right',
    Button9: 'Start',
    Button8: 'Select',
    Button0: 'ButtonA',
    Button1: 'ButtonB',
    Button2: 'ButtonX',
    Button3: 'ButtonY',
    Button4: 'ButtonL',
    Button5: 'ButtonR',
    Button7: 'ButtonL2',
    Button6: 'ButtonR2',
    Button10: 'ButtonL3',
    Button11: 'ButtonR3',
    Button16: 'Home',
    Button17: 'Touchpad', //ps4 controller touchpad
    Axes: {},
    //ENABLE TRIGGERS
    Triggers: true,
});
```
#### Listen events
```javascript
//you need start it first
input.start();
//listen events
input.listen((inputId, inputType, state) => {
    console.log(inputId, inputType, state);
});
```
#### Others options
```javascript
//disable up, down, left, right
input.disableMoveButtons('Player1');

//enable up, down, left, right
input.enableMoveButtons('Player1');

//disable custom keys
input.disableButtons('Player1',
    ['Up', 'Down']
);

//enable custom keys
input.enableButtons('Player1',
    ['Up', 'Down']
);

//disable all buttons
input.disableAllButtons('Player1');

//enable all buttons
input.enableAllButtons('Player1');

//set axes precision
input.setAxesPrecision('Player1', 0.5);
```

# RawInput
---
```javascript
import { RawInput } from './src/RawInput.js'
const input = new RawInput();
```
#### Keyboard
```javascript
//init keyboard
input.createKeyboardInput({
    inputId: 'keyboard1',
    allowedKeys: {
        ArrowUp: true,
        ArrowDown: true,
        ArrowLeft: true,
        ArrowRight: true,
        Enter: true,
    }
});

//you may init more players
input.createKeyboardInput({
    inputId: 'keyboard2',
    allowedKeys: {
        w: true,
        s: true,
        a: true,
        d: true,
        e: true,
    }
});
```
#### Gamepads
```javascript
//init a gamepad
//trim axes to values
input.createGamepadInput({
    inputId: 'gamepad2',
    configAxes: {
        0: [-1, 1], //x axes of left thumbstick
        1: [-1, 1], //y axes of left thumbstick
        2: [-1, 1], //x axes of right thumbstick
        3: [-1, 1], //y axes of right thumbstick
    },
});

//change axes precision
input.setAxesPrecision(inputId, 0.05);

//change precision is same do this
input.createGamepadInput({
    inputId: 'gamepad2',
    configAxes: {
        0: [-0.05, 0.05],
        1: [-0.05, 0.05],
        2: [-0.05, 0.05],
        3: [-0.05, 0.05],
    },
});
```
#### Listen events
```javascript
//listen for keys events
input.listen((inputId, inputType, buttonType, keyState) => {
    console.log(inputId, inputType, buttonType, keyState);
});
```
#### Block movements
```javascript
//keyboard
input.setKeyboardAllowedKeys(inputId, 
{
    ArrowUp: true,
    ArrowDown: true,
    ArrowLeft: true,
    ArrowRight: false,
    Enter: false,
});

//gamepad
input.setGamepadAllowedKeys(inputId, 
{
    Button0: false,
    Button1: false,
    Button2: false,
    Button3: true,
    Button4: true,
    Button5: true,
    Button6: true,
    Button7: true,
    Button8: true,
    Button9: true,
    Button10: true,
    Button11: true,
    Button12: true,
    Button13: true,
    Button14: true,
    Button15: true,
    Button16: true,
    Button17: true,
})
//you have getters to actual enabled and disabled keys
let keyboardAllowedKeys = input.getKeyboardAllowedKeys(inputId);
let gamepadAllowedKeys = input.getGamepadAllowedKeys(inputId);
```
*Enjoy!*
