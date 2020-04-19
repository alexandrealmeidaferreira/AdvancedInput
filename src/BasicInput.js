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
        let conf = { inputId: inputId, configAxes: {} };
        let keys = {};
        if (inputConfig.Axes) {
            for (var [index, value] of Object.entries(inputConfig.Axes)) {
                conf.configAxes[index] = [];
                for (var [commandName, triggerValue] of Object.entries(value)) {
                    conf.configAxes[index].push(triggerValue);
                }
            }
        }
        //mount keys map
        for (var [index, value] of Object.entries(inputConfig)) {
            if (typeof value === 'string') {
                keys[value] = index;
            }
        }

        //init input
        if (!this.inputs[inputId]) this.inputs[inputId] = {}
        this.inputs[inputId]['gamepad'] = { arrayStates: [], rawStates: {}, config: inputConfig, keys, originalAxes: conf.configAxes };
        this.rawInput.createGamepadInput(conf);
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
                //let arrayStates = this.blockedInputs(inputId, input.arrayStates);
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
                if (config.Axes && config.Axes[key]) {
                    for (var [cindex, cvalue] of Object.entries(config.Axes[key])) {
                        if (state !== 0) {
                            if (cvalue > 0 && state > 0) {
                                arrayStates.push(cindex);
                            } else if (cvalue < 0 && state < 0) {
                                arrayStates.push(cindex);
                            }
                        }
                    }
                } else if (config[key] && state) {
                    arrayStates.push(config[key])
                }
            }
        }
        return this.arrayStatesMapping(arrayStates);
    }

    //new mapping
    arrayStatesMapping(arrayStates) {
        let n = [];
        if (arrayStates.indexOf('Up') !== -1 && arrayStates.indexOf('Left') !== -1)
            n.push('UpLeft');
        else if (arrayStates.indexOf('Up') !== -1 && arrayStates.indexOf('Right') !== -1)
            n.push('UpRight');
        else if (arrayStates.indexOf('Down') !== -1 && arrayStates.indexOf('Left') !== -1)
            n.push('DownLeft');
        else if (arrayStates.indexOf('Down') !== -1 && arrayStates.indexOf('Right') !== -1)
            n.push('DownRight');
        else
            for (let x in arrayStates)
                n.push(arrayStates[x]);

        return n;
    }

    setAxesPrecision(inputId, precision) {
        this.rawInput.setAxesPrecision(inputId, precision);
        this.inputs[inputId]['gamepad'].originalAxes = {
            0: [-precision, precision],
            1: [-precision, precision],
            2: [-precision, precision],
            3: [-precision, precision],
        };
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
                    conf.originalAxes = this.inputs[inputId]['gamepad'].originalAxes;
                    rawAllowedConfig = this.rawInput.getGamepadAllowedKeys(inputId);
                    if (conf.config.Axes) {
                        var axes = this.rawInput.getGamepadAxes(inputId);
                    }
                }
                if (conf.keys && rawAllowedConfig) {
                    if (typeof buttons === 'string') {
                        rawAllowedConfig[conf.keys[buttons]] = allowed;
                        if (axes) {
                            if (buttons === 'Up') {
                                axes[1][0] = (allowed) ? conf.originalAxes[1][0] : -10;
                            }
                            if (buttons === 'Down') {
                                axes[1][1] = (allowed) ? conf.originalAxes[1][1] : 10;
                            }
                            if (buttons === 'Left') {
                                axes[0][0] = (allowed) ? conf.originalAxes[0][0] : -10;
                            }
                            if (buttons === 'Right') {
                                axes[0][1] = (allowed) ? conf.originalAxes[1][1] : 10;
                            }
                        }
                    } else {
                        for (let b in buttons) {
                            rawAllowedConfig[conf.keys[buttons[b]]] = allowed;
                            if (axes) {
                                if (buttons[b] === 'Up') {
                                    axes[1][0] = (allowed) ? conf.originalAxes[1][0] : -10;
                                }
                                if (buttons[b] === 'Down') {
                                    axes[1][1] = (allowed) ? conf.originalAxes[1][1] : 10;
                                }
                                if (buttons[b] === 'Left') {
                                    axes[0][0] = (allowed) ? conf.originalAxes[0][0] : -10;
                                }
                                if (buttons[b] === 'Right') {
                                    axes[0][1] = (allowed) ? conf.originalAxes[1][1] : 10;
                                }
                            }
                        }
                    }
                }
                if (type === 'keyboard') {
                    this.rawInput.setKeyboardAllowedKeys(inputId, rawAllowedConfig)
                }
                if (type === 'gamepad') {
                    this.rawInput.setGamepadAllowedKeys(inputId, rawAllowedConfig)
                    if (axes) {
                        this.rawInput.setGamepadAxes(inputId, axes);
                    }
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
    //axes mapped to buttons
    Axes: {
        1: {
            'Up': -1,
            'Down': 1,
        },
        0: {
            'Left': -1,
            'Right': 1,
        },
    },
    //ENABLE TRIGGERS
    Triggers: true,
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
    Axes: 'disabled',
    //ENABLE TRIGGERS
    Triggers: true,
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
    Axes: {},
    //ENABLE TRIGGERS
    Triggers: true,
}
