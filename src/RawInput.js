/**
 * Author: Alexandre Almeida Ferreira
 * Description: RawInput for javascript
 */

export class RawInput {
    keyboardInputs = {}; //keyboards configured
    gamepadInputs = {}; //gamepads configured
    observers = []; //observers
    freeGamepads = []; //free gamepad index waiting for config
    gamepadInputsWithNoGamepad = []; //created gamepad waiting for gamepad be connected
    gamepads = {}; //conected object gamepad to index
    gamepadsReverse = {}; //conected object gamepad index to innputId
    gamepadInterval;//interval pool for gamepads
    constructor(props) {
        const inputOptions = {
            gamepadPoolInterval: 20
        }
        Object.assign(inputOptions, props);
        /** KEYBOARD EVENTS **/
        window.addEventListener('keydown', (event) => {
            this.sendKeyChange(event.key, true);
        });
        window.addEventListener('keyup', (event) => {
            this.sendKeyChange(event.key, false);
        });

        /** GAMEPAD EVENTS **/
        window.addEventListener("gamepadconnected", (event) => {
            console.log("A gamepad connected at index %d: %s. %d buttons, %d axes.", event.gamepad.index, event.gamepad.id, event.gamepad.buttons.length, event.gamepad.axes.length);
            this.freeGamepads.push(event.gamepad.index);
            this.indexToGamepad();
            if (!this.gamepadInterval) {
                //CREATE GAMEPAD POOL
                this.gamepadInterval = setInterval(function () {
                    for (var [gamepadId, gamepadIndex] of Object.entries(this.gamepads)) {
                        var gamepad = navigator.getGamepads()[gamepadIndex];
                        if (gamepad) {
                            Object.assign(this.gamepadInputs[gamepadId].prevButtons, this.gamepadInputs[gamepadId].buttons);
                            Object.assign(this.gamepadInputs[gamepadId].prevAxes, this.gamepadInputs[gamepadId].axes);
                            Object.assign(this.gamepadInputs[gamepadId].prevTriggers, this.gamepadInputs[gamepadId].triggers);
                            //update buttons
                            for (let b = 0; b < gamepad.buttons.length; b++) {
                                if (!this.gamepadInputs[gamepadId].allowedKeys[`Button${b}`]) continue;
                                this.gamepadInputs[gamepadId].buttons[`Button${b}`] = gamepad.buttons[b].pressed;
                                //L2 and R2 trigger values
                                if (b === 6) { //L2
                                    this.gamepadInputs[gamepadId].triggers['TriggerL'] = gamepad.buttons[b].value;
                                }
                                if (b === 7) { //R2
                                    this.gamepadInputs[gamepadId].triggers['TriggerR'] = gamepad.buttons[b].value;
                                }
                            }

                            //update axes
                            for (let b = 0; b < gamepad.axes.length; b++) {
                                let axeValue = parseFloat(gamepad.axes[b].toFixed(3));
                                this.gamepadInputs[gamepadId].axes[b] = axeValue;
                                if (this.gamepadInputs[gamepadId].configAxes && Object.entries(this.gamepadInputs[gamepadId].configAxes).length > 0) {
                                    //if has axes config
                                    if (this.gamepadInputs[gamepadId].configAxes[b]) {
                                        this.gamepadInputs[gamepadId].axes[b] = 0;
                                        if (axeValue < 0) {
                                            //compare negative
                                            if (this.gamepadInputs[gamepadId].configAxes[b][0] >= axeValue) {
                                                this.gamepadInputs[gamepadId].axes[b] = -1;
                                            }
                                        } else {
                                            if (this.gamepadInputs[gamepadId].configAxes[b][1] <= axeValue) {
                                                this.gamepadInputs[gamepadId].axes[b] = 1;
                                            }
                                        }
                                    }
                                }
                            }

                            //send event to gamepad buttons observers
                            let buttonsChanged = (JSON.stringify(this.gamepadInputs[gamepadId].buttons) !== JSON.stringify(this.gamepadInputs[gamepadId].prevButtons));
                            if (buttonsChanged) {
                                this.notify(gamepadId, 'gamepad', 'buttons', this.gamepadInputs[gamepadId].buttons);
                            }

                            //send event to gamepad axes observers
                            let axesChanged = (JSON.stringify(this.gamepadInputs[gamepadId].axes) !== JSON.stringify(this.gamepadInputs[gamepadId].prevAxes));
                            if (axesChanged) {
                                this.notify(gamepadId, 'gamepad', 'axes', this.gamepadInputs[gamepadId].axes);
                            }

                            //send event to gamepad triggers observers
                            let triggersChanged = (JSON.stringify(this.gamepadInputs[gamepadId].triggers) !== JSON.stringify(this.gamepadInputs[gamepadId].prevTriggers));
                            if (triggersChanged) {
                                this.notify(gamepadId, 'gamepad', 'triggers', this.gamepadInputs[gamepadId].triggers);
                            }
                        }
                    }
                }.bind(this), inputOptions.gamepadPoolInterval);
            }
        });

        //gamepad disconnect event
        window.addEventListener("gamepaddisconnected", (event) => {
            console.log("Gamepad at index %d disconnected", event.gamepad.index);
            if (this.gamepadsReverse[event.gamepad.index]) {
                let inputId = this.gamepadsReverse[event.gamepad.index];
                delete this.gamepadsReverse[event.gamepad.index];
                delete this.gamepads[inputId];
                if (this.gamepadInputsWithNoGamepad.indexOf(inputId) === -1) {
                    this.gamepadInputsWithNoGamepad.push(inputId);
                }
                if (this.gamepadInputs[inputId]) {
                    this.gamepadInputs[inputId].index = false;
                    console.log("%s has been disconfigured", inputId);
                }
            }
            this.freeGamepads.splice(this.freeGamepads.indexOf(event.gamepad.index), 1);

            if (Object.entries(this.gamepads).length < 1) {
                clearInterval(this.gamepadInterval);
                this.gamepadInterval = null;
            }
        });
    }

    //create new keyboard input
    createKeyboardInput(options) {
        let config = {
            inputId: 'keyboard0',
            allowedKeys: {}
        };
        Object.assign(config, options);
        //init keyState
        config.keyState = {};
        config.prevKeyState = {};
        for (var [key, value] of Object.entries(config.allowedKeys)) {
            config.keyState[key] = false;
            config.prevKeyState[key] = false;
        }
        this.keyboardInputs[config.inputId] = config;
    }

    setKeyboardAllowedKeys(inputId, allowedKeys) {
        this.keyboardInputs[inputId].allowedKeys = allowedKeys;
    }

    getKeyboardAllowedKeys(inputId) {
        return this.keyboardInputs[inputId].allowedKeys;
    }

    //send keys from keyboard to observers
    sendKeyChange(key, hasPressedKey) {
        for (var [inputId, input] of Object.entries(this.keyboardInputs)) {
            if (input.allowedKeys.hasOwnProperty(key) && input.allowedKeys[key]) {
                Object.assign(input.prevKeyState, input.keyState);
                input.keyState[key] = hasPressedKey;
                if ((JSON.stringify(input.keyState) !== JSON.stringify(input.prevKeyState))) {
                    this.notify(inputId, 'keyboard', 'buttons', input.keyState);
                }
            }
        }
    }

    //listen keys
    listen(callback) {
        if (typeof callback === 'function') this.observers.push(callback);
    }

    //notify all observers
    notify(inputId, inputType, buttonType, keyState) {
        let kstate = {};
        Object.assign(kstate, keyState)
        if (this.observers.length > 0) {
            for (const observerFunction of this.observers) {
                observerFunction(inputId, inputType, buttonType, kstate);
            }
        }
    }

    //GAMEPAD
    createGamepadInput(options) {
        let config = {
            inputId: false,
            index: false,
            buttons: {},
            prevButtons: {},
            axes: {},
            prevAxes: {},
            triggers: {},
            prevTriggers: {},
            configAxes: {},
            allowedKeys: {
                Button0: true,
                Button1: true,
                Button2: true,
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
            },
        };
        Object.assign(config, options);
        this.gamepadInputsWithNoGamepad.push(config.inputId);
        this.gamepadInputs[config.inputId] = config;
    }

    setGamepadAllowedKeys(inputId, allowedKeys) {
        this.gamepadInputs[inputId].allowedKeys = allowedKeys;
    }

    getGamepadAllowedKeys(inputId) {
        return this.gamepadInputs[inputId].allowedKeys;
    }

    setGamepadAxes(inputId, configAxes) {
        this.gamepadInputs[inputId].configAxes = configAxes;
    }

    getGamepadAxes(inputId) {
        return this.gamepadInputs[inputId].configAxes;
    }

    //index gamepad navigator to gamepad configured
    indexToGamepad() {
        if (this.freeGamepads.length > 0 && this.gamepadInputsWithNoGamepad.length > 0) {
            let inputId = this.gamepadInputsWithNoGamepad.shift();
            let gamepadindex = this.freeGamepads.shift();
            this.gamepads[inputId] = gamepadindex;
            this.gamepadsReverse[gamepadindex] = inputId;
            this.gamepadInputs[inputId].index = gamepadindex;
            console.log('%s has the gamepad index %d', inputId, gamepadindex);
        }
    }

    //change axes precision
    setAxesPrecision(inputId, precision) {
        this.gamepadInputs[inputId].configAxes = {
            0: [-precision, precision],
            1: [-precision, precision],
            2: [-precision, precision],
            3: [-precision, precision],
        }
    }
}
