/**
 * Author: Alexandre Almeida Ferreira
 * Description: BasicInput for javascript
 */

import { RawInput } from './RawInput.js'
export class BasicInput {

    inputs = {};
    rawInput = new RawInput();
    observers = []; //observers

    //create keyboard
    createKeyboard(inputId, config) {
        let conf = { inputId: inputId, allowedKeys: {} }
        let keys = {};
        for (var [key, value] of Object.entries(config)) {
            conf.allowedKeys[key] = true;
            keys[value] = key;
        }
        //init input
        if (!this.inputs[inputId]) this.inputs[inputId] = {}
        this.inputs[inputId]['keyboard'] = { arrayStates: [], rawStates: {}, config: config, keys };
        this.rawInput.createKeyboardInput(conf);
    }

    //create a gamepad
    createGamepad(inputId, config) {
        let inputConfig = config;
        if (typeof config === 'string') {
            switch (inputConfig) {
                default:
                case 'DEFAULT_GENERIC':
                    inputConfig = defaultGenericGamepadConfig;
                    break;
                case 'DEFAULT_GENERIC_NO_AXES':
                    inputConfig = defaultGenericGamepadConfigNoAxes;
                    break;
                case 'DEFAULT_GENERIC_AXES':
                    inputConfig = defaultGenericGamepadConfigAxes;
                    break;
            }
        }
        //let conf = { inputId: inputId, configAxes: {} };
        let conf = { inputId: inputId, axesPrecision: [-1, 1], triggers: false };
        let keys = {};

        //config thumbsticks
        if (inputConfig.Thumbsticks) {
            conf['axesToButtons'] = {};
            if (inputConfig.Thumbsticks.Left) {
                if (!conf['axesToButtons'][0]) conf['axesToButtons'][0] = [];
                conf['axesToButtons'][0].push(inputConfig.Thumbsticks.Left.left);
                conf['axesToButtons'][0].push(inputConfig.Thumbsticks.Left.right);
                if (!conf['axesToButtons'][1]) conf['axesToButtons'][1] = [];
                conf['axesToButtons'][1].push(inputConfig.Thumbsticks.Left.up);
                conf['axesToButtons'][1].push(inputConfig.Thumbsticks.Left.down);
            }
            if (inputConfig.Thumbsticks.Right) {
                if (!conf['axesToButtons'][2]) conf['axesToButtons'][2] = [];
                conf['axesToButtons'][2].push(inputConfig.Thumbsticks.Right.left);
                conf['axesToButtons'][2].push(inputConfig.Thumbsticks.Right.right);
                if (!conf['axesToButtons'][3]) conf['axesToButtons'][3] = [];
                conf['axesToButtons'][3].push(inputConfig.Thumbsticks.Right.up);
                conf['axesToButtons'][3].push(inputConfig.Thumbsticks.Right.down);
            }
        }

        if (inputConfig.Triggers) {
            conf['triggers'] = inputConfig.Triggers;
        }

        //mount keys map
        for (var [index, value] of Object.entries(inputConfig)) {
            if (typeof value === 'string') {
                keys[value] = index;
            }
        }

        //init input
        if (!this.inputs[inputId]) this.inputs[inputId] = {}
        this.inputs[inputId]['gamepad'] = { arrayStates: [], rawStates: {}, config: inputConfig, keys };
        this.rawInput.createGamepadInput(conf);
    }

    enableGamepadTriggers(inputId, enable) {
        if (this.inputs[inputId]['gamepad']) {
            this.rawInput.enableGamepadTriggers(inputId, enable);
        }
    }

    //start
    start() {
        this.rawInput.listen((inputId, inputType, buttonType, keyState) => {
            this.inputs[inputId][inputType].rawStates = keyState;
            this.inputs[inputId][inputType].arrayStates = this.createArrayStates(this.inputs[inputId][inputType].config, keyState);
            this.notify(inputId, inputType);
        });
    }

    //notify all listeners
    notify(inputId, inputType) {
        let input = {};
        Object.assign(input, this.inputs[inputId][inputType]);
        if (this.observers.length > 0) {
            for (const observerFunction of this.observers) {
                observerFunction(inputId, inputType, input);
            }
        }
    }

    //listen keys
    listen(callback) {
        if (typeof callback === 'function') this.observers.push(callback);
    }

    //create array states
    createArrayStates(config, keyState) {
        let arrayStates = [];
        if (config) {
            for (var [key, state] of Object.entries(keyState)) {
                if (config[key] && state) {
                    arrayStates.push(config[key])
                }

            }
        }
        return this.arrayStatesMapping(arrayStates);
    }

    //new mapping
    arrayStatesMapping(arrayStates) {
        let n = [];
        if (arrayStates.indexOf('Up') !== -1 && arrayStates.indexOf('Left') !== -1) {
            arrayStates.splice(arrayStates.indexOf('Up'), 1);
            arrayStates.splice(arrayStates.indexOf('Left'), 1);
            n.push('UpLeft');
        }

        if (arrayStates.indexOf('Up') !== -1 && arrayStates.indexOf('Right') !== -1) {
            arrayStates.splice(arrayStates.indexOf('Up'), 1);
            arrayStates.splice(arrayStates.indexOf('Right'), 1);
            n.push('UpRight');
        }

        if (arrayStates.indexOf('Down') !== -1 && arrayStates.indexOf('Left') !== -1) {
            arrayStates.splice(arrayStates.indexOf('Down'), 1);
            arrayStates.splice(arrayStates.indexOf('Left'), 1);
            n.push('DownLeft');
        }

        if (arrayStates.indexOf('Down') !== -1 && arrayStates.indexOf('Right') !== -1) {
            arrayStates.splice(arrayStates.indexOf('Down'), 1);
            arrayStates.splice(arrayStates.indexOf('Right'), 1);
            n.push('DownRight');
        }

        for (let x in arrayStates)
            n.push(arrayStates[x]);

        return n;
    }

    setAxesPrecision(inputId, precision) {
        this.rawInput.setAxesPrecision(inputId, precision);
    }

    updateAllowedKeysButtons(inputId, allowed, buttons) {
        if (typeof allowed === 'undefined') allowed = true;
        if (this.inputs[inputId]) {
            for (var [type, conf] of Object.entries(this.inputs[inputId])) {
                let rawAllowedConfig = false;
                if (type === 'keyboard') {
                    rawAllowedConfig = this.rawInput.getKeyboardAllowedKeys(inputId);
                }
                if (type === 'gamepad') {
                    rawAllowedConfig = this.rawInput.getGamepadAllowedKeys(inputId);
                }
                if (conf.keys && rawAllowedConfig) {
                    if (typeof buttons === 'string') {
                        rawAllowedConfig[conf.keys[buttons]] = allowed;
                    } else {
                        for (let b in buttons) {
                            rawAllowedConfig[conf.keys[buttons[b]]] = allowed;
                        }
                    }
                }
                if (type === 'keyboard') {
                    this.rawInput.setKeyboardAllowedKeys(inputId, rawAllowedConfig)
                }
                if (type === 'gamepad') {
                    this.rawInput.setGamepadAllowedKeys(inputId, rawAllowedConfig)
                }
            }
        }
    }

    disableButtons(inputId, buttons) {
        this.updateAllowedKeysButtons(inputId, false, buttons);
    }

    enableButtons(inputId, buttons) {
        this.updateAllowedKeysButtons(inputId, true, buttons);
    }

    disableAllButtons(inputId) {
        this.updateAllowedKeysButtons(inputId, false, [
            'Up',
            'Down',
            'Left',
            'Right',
            'Start',
            'Select',
            'ButtonA',
            'ButtonB',
            'ButtonX',
            'ButtonY',
            'ButtonL',
            'ButtonR',
            'ButtonL2',
            'ButtonR2',
            'ButtonL3',
            'ButtonR3',
            'Home',
            'Touchpad',
        ]);
    }
    enableAllButtons(inputId) {
        this.updateAllowedKeysButtons(inputId, true, [
            'Up',
            'Down',
            'Left',
            'Right',
            'Start',
            'Select',
            'ButtonA',
            'ButtonB',
            'ButtonX',
            'ButtonY',
            'ButtonL',
            'ButtonR',
            'ButtonL2',
            'ButtonR2',
            'ButtonL3',
            'ButtonR3',
            'Home',
            'Touchpad',
        ])
    }

    disableMoveButtons(inputId) {
        this.updateAllowedKeysButtons(inputId, false, [
            'Up',
            'Down',
            'Left',
            'Right',
        ]);
    }
    enableMoveButtons(inputId) {
        this.updateAllowedKeysButtons(inputId, true, [
            'Up',
            'Down',
            'Left',
            'Right',
        ]);
    }
}

/**
 * Default generic gamepad, with axes mapped into direction button
 */
const defaultGenericGamepadConfig = {
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
    Thumbsticks: {
        Left: {
            left: 'Button14',
            right: 'Button15',
            up: 'Button12',
            down: 'Button13',
        },
        Right: {
            left: 'Button2',
            right: 'Button1',
            up: 'Button3',
            down: 'Button0',
        }
    },
    Triggers: false
}

/**
 * Default generic gamepad, without axes and not fire axes event
 */
const defaultGenericGamepadConfigNoAxes = {
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
    Triggers: false
}

/**
 * Default generic gamepad, without axes mapping but fire event and return raw axes values
 */
const defaultGenericGamepadConfigAxes = {
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
    Triggers: false
}
