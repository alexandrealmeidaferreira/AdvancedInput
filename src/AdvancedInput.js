/**
 * Author: Alexandre Almeida Ferreira
 * Description: BasicInput for javascript
 */

import { BasicInput } from './BasicInput.js'
export class AdvancedInput extends BasicInput {
    specialMoves = {};
    inputSpecialMoves = {};
    gameSpecialMovesObservers = [];
    inputsKeyPool = {};
    movesExecutedPool = {};
    constructor(props) {
        super(props);
    }

    createSpecialMoves(moveId, config) {
        if (config.type === 'sequence') {
            this.specialMoves[moveId] = new SpecialMoveSequence({ moveId, config });
        }
        if (config.type === 'charge') {
            this.specialMoves[moveId] = new SpecialMoveCharge({ moveId, config });
        }
    }

    addInputSpecialMove(inputId, moveId) {
        if (this.specialMoves[moveId]) {
            if (!this.inputSpecialMoves[inputId]) {
                this.inputSpecialMoves[inputId] = {};
            }
            this.inputSpecialMoves[inputId][moveId] = {};
            //clone class
            this.inputSpecialMoves[inputId][moveId] = Object.assign(Object.create(Object.getPrototypeOf(this.specialMoves[moveId])), this.specialMoves[moveId])
        }
    }

    startSpecialMoves() {
        this.listen((inputId, inputType, state) => {
            if (!this.movesExecutedPool[inputId]) this.movesExecutedPool[inputId] = [];
            for (var [moveId, moveObject] of Object.entries(this.inputSpecialMoves[inputId])) {
                //start listen objects
                moveObject.listenStates(state.arrayStates, (SpecialMoveObject, buttomPressed) => {
                    //command executed
                    this.movesExecutedPool[inputId].push({ inputId, moveId, buttomPressed, SpecialMoveObject });
                });
            }
            //send to listeners
            this.sendSpecialMovesToListeners(inputId);
        });
    }

    listenSpecialMoves(functionListener) {
        this.gameSpecialMovesObservers.push(functionListener);
    }

    sendSpecialMovesToListeners(inputId) {
        if (this.gameSpecialMovesObservers.length > 0 && this.movesExecutedPool[inputId].length > 0) {
            let movesArray = [];
            for (let x in this.movesExecutedPool[inputId]) {
                movesArray.push(this.movesExecutedPool[inputId][x].moveId);
            }
            for (const observerFunction of this.gameSpecialMovesObservers) {
                observerFunction(inputId, movesArray, this.movesExecutedPool[inputId]);
            }
        }
        //clear pool
        this.movesExecutedPool[inputId] = [];
    }

    invertAllSpecialMoves(inputId, type) {
        let invertType = (typeof type === "undefined") ? 'invertX' : type;
        if (this.inputSpecialMoves[inputId]) {
            for (var [moveId, moveObject] of Object.entries(this.inputSpecialMoves[inputId])) {
                this.inputSpecialMoves[inputId][moveId].config.DPad = this.invertMoveConfig(moveObject.config.DPad, invertType);
            }
        }
    }

    invertSpecialMove(inputId, moveId, type) {
        let invertType = (typeof type === "undefined") ? 'invertX' : type;
        if (this.inputSpecialMoves[inputId][moveId]) {
            this.inputSpecialMoves[inputId][moveId].config.DPad = this.invertMoveConfig(this.inputSpecialMoves[inputId][moveId].config.DPad, invertType);
        }
    }

    invertMoveConfig(moveConfig, invertConfig) {
        switch (invertConfig) {
            default:
            case 'invertX':
                return this.invertXMoves(moveConfig);
            case 'invertY':
                return this.invertYMoves(moveConfig);
            case 'invertXY':
                return this.invertXYMoves(moveConfig);
        }
    }

    invertXMoves(move) {
        let newMove = [];
        for (let m in move) {
            switch (move[m]) {
                case 'Left':
                    newMove.push('Right');
                    break;
                case 'Right':
                    newMove.push('Left');
                    break;
                case 'DownLeft':
                    newMove.push('DownRight');
                    break;
                case 'DownRight':
                    newMove.push('DownLeft');
                    break;
                case 'UpLeft':
                    newMove.push('UpRight');
                    break;
                case 'UpRight':
                    newMove.push('UpLeft');
                    break;
                default:
                    newMove.push(move[m]);
                    break;
            }
        }
        return newMove;
    }

    invertYMoves(move) {
        let newMove = [];
        for (let m in move) {
            switch (move[m]) {
                case 'Up':
                    newMove.push('Down');
                    break;
                case 'Down':
                    newMove.push('Up');
                    break;
                case 'DownLeft':
                    newMove.push('UpLeft');
                    break;
                case 'DownRight':
                    newMove.push('UpRight');
                    break;
                case 'UpLeft':
                    newMove.push('DownLeft');
                    break;
                case 'UpRight':
                    newMove.push('DownRight');
                    break;
                default:
                    newMove.push(move[m]);
                    break;
            }
        }
        return newMove;
    }

    invertXYMoves(move) {
        let newMove = [];
        newMove = this.invertXMoves(move);
        newMove = this.invertYMoves(move);
        return newMove;
    }

    enableAllSpecialMoves(inputId, enable) {
        enable = (typeof enable === 'undefined') ? true : enable;
        if (this.inputSpecialMoves[inputId]) {
            for (var [moveId, moveConfig] of Object.entries(this.inputSpecialMoves[inputId])) {
                this.enableSpecialMove(inputId, moveId, enable);
            }
        }
    }

    enableSpecialMove(inputId, moveId, enable) {
        enable = (typeof enable === 'undefined') ? true : enable;
        if (this.inputSpecialMoves[inputId]) {
            if (this.inputSpecialMoves[inputId][moveId]) {
                this.inputSpecialMoves[inputId][moveId].enabled = enable;
            }
        }
    }

    isEnabledSpecialMove(inputId, moveId) {
        let enabled = false;
        if (this.inputSpecialMoves[inputId]) {
            if (this.inputSpecialMoves[inputId][moveId]) {
                enabled = this.inputSpecialMoves[inputId][moveId].enabled;
            }
        }
        return enabled;
    }
}

class SpecialMove {
    moveId = false;
    enabled = true;
    isRunning = false;
    config = {};
    pool = { dpad: [], buttons: [] };
    poolTime = { dpad: 0, buttons: 0 };
    commandTimeout = 250;
    timeout = false;
    lastButtomPressed = false;
    constructor(props) {
        this.moveId = props.moveId;
        this.config = props.config;
        if (props.config.timeout) {
            this.commandTimeout = props.config.timeout
        }
    }

    startPool(arrayStates) {
        if (this.enabled) {
            let toJoin = [];
            for (let x in arrayStates) {
                if (
                    arrayStates[x] === 'ButtonA' ||
                    arrayStates[x] === 'ButtonB' ||
                    arrayStates[x] === 'ButtonX' ||
                    arrayStates[x] === 'ButtonY' ||
                    arrayStates[x] === 'ButtonL' ||
                    arrayStates[x] === 'ButtonR' ||
                    arrayStates[x] === 'ButtonL2' ||
                    arrayStates[x] === 'ButtonR2'
                ) {
                    toJoin.push(arrayStates[x]);
                } else {
                    this.pool.dpad.push(arrayStates[x]);
                    if (this.pool.dpad.length > 8) {
                        this.pool.dpad.shift()
                    };
                    this.poolTime.dpad = new Date().getTime();
                }
            }

            if (toJoin.length > 0) {
                let buttomPressed = toJoin.join('+');
                this.pool.buttons = [buttomPressed];
                if (this.poolTime.buttons === 0) {
                    this.poolTime.buttons = new Date().getTime();
                }

            }
        }
    }

    isActionButtomPressed() {
        //if has buttom on config
        //if buttom pressed after last dpad
        //if has buttom on pool
        //if buttom on pool is in action config
        if (this.pool.buttons.length > 0)
            this.lastButtomPressed = [...this.pool.buttons];
        return (
            this.config.Buttons &&
            this.poolTime.buttons >= this.poolTime.dpad &&
            this.pool.buttons.length > 0 &&
            this.config.Buttons.indexOf(this.pool.buttons[0]) !== -1
        );
    }

    listenStates(arrayStates, callback) {
        if (!this.isRunning) {
            this.startPool(arrayStates);
            if (this.isActionButtomPressed()) {
                if (this.isAllDpadsPressed()) {
                    this.startPoolTimeout();
                    if (this.isExecuted()) {
                        this.isRunning = true;
                        if (typeof callback === 'function') callback(this, this.lastButtomPressed);
                    }
                }
            } else if (arrayStates.length === 0) {
                this.startPoolTimeout();
            }
        }
    }

    isExecuted() {
        //all pressed, test if buttom order is ok
        let indexMove = 0;
        let pressed = [];
        for (let d in this.pool.dpad) {
            let ktest = this.pool.dpad[d];
            if (this.config.DPad[indexMove] === ktest) {
                indexMove = indexMove + 1;
                pressed.push(ktest);
            }
        }
        return (JSON.stringify(pressed) === JSON.stringify(this.config.DPad))

    }

    isAllDpadsPressed() {
        let allDpadPressed = true;
        for (let d in this.config.DPad) {
            let id = this.pool.dpad.indexOf(this.config.DPad[d]);
            if (id === -1) {
                allDpadPressed = false;
                break;
            }
        }
        return allDpadPressed;
    }

    clearPool() {
        this.pool.dpad.splice(0);
        this.pool.buttons.splice(0);
        this.poolTime.dpad = 0;
        this.poolTime.buttons = 0;
        this.isRunning = false;
    }

    startPoolTimeout() {
        if (this.pool.dpad.length > 0) {
            this.timeout = setTimeout(() => {
                clearTimeout(this.timeout);
                this.timeout = false
                //clear key pool
                this.clearPool();
            }, this.commandTimeout);
        }
    }
}

class SpecialMoveSequence extends SpecialMove {
    constructor(props) {
        super(props);
    }
}

class SpecialMoveCharge extends SpecialMove {
    isCharged = false;
    chargeTimeout = false;
    commandTimeout = 300;
    chargeKeyIndex = 0;
    logIsCharged = false;
    constructor(props) {
        super(props);
    }

    listenCharge(arrayState, callback) {
        if (arrayState.length) {
            if (arrayState[0].indexOf(this.config.DPad[this.chargeKeyIndex]) !== -1) {
                //clearTimeout(this.timeout);
                this.isCharged = false;
                this.isRunning = false;
                if (this.chargeTimeout) {
                    clearTimeout(this.chargeTimeout);
                    this.chargeTimeout = false;
                    this.isCharged = false;
                    this.isRunning = false;
                }

                this.chargeTimeout = setTimeout(() => {
                    this.isCharged = true;
                    //callback to know if charged
                    if (typeof callback === 'function') callback()
                }, this.config.chargeTime);

            } else if (!this.isCharged) {
                clearTimeout(this.chargeTimeout);
                this.chargeTimeout = false;
                clearTimeout(this.timeout);
                this.timeout = false;
                this.clearPool();
            }
        }
    }

    listenStates(arrayStates, callback) {
        if (this.enabled) {
            this.startPool(arrayStates);
            if (this.isCharged && !this.isRunning &&
                arrayStates.length > 0 &&
                arrayStates[0].indexOf(this.config.DPad[this.chargeKeyIndex]) === -1) {
                if (this.isAllDpadsPressed()) {
                    this.startPoolTimeout();
                    if (this.isActionButtomPressed() && this.isExecuted()) {
                        this.isRunning = true;
                        this.pool.dpad.splice(0);
                        this.pool.buttons.splice(0);
                        this.poolTime.dpad = 0;
                        this.poolTime.buttons = 0;
                        if (typeof callback === 'function') callback(this, this.lastButtomPressed);
                    }
                }
            } else if (this.isCharged && !this.isRunning) {
                if (arrayStates.length === 0 || arrayStates[0].indexOf(this.config.DPad[this.chargeKeyIndex]) === -1) {
                    this.startPoolTimeout();
                }
            } else {
                this.listenCharge(arrayStates, () => {
                    if (this.logIsCharged)
                        console.log('charged', this.pool, arrayStates);
                    clearTimeout(this.timeout);
                });
            }
        }
    }

    startPoolTimeout() {
        if (this.pool.dpad.length > 0 && this.timeout === false) {
            this.timeout = setTimeout(() => {
                //clear key pool
                this.pool.dpad.splice(0);
                this.pool.buttons.splice(0);
                this.poolTime.dpad = 0;
                this.poolTime.buttons = 0;
                clearTimeout(this.timeout);
                this.timeout = false
                this.isRunning = false;
                this.isCharged = false;
            }, this.commandTimeout);
        }
    }
}
