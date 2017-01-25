class Fog extends BabylonObject {
    keys(){
        return [
            'mode'
            , 'color'
            , 'density'
            , 'start'
            , 'end'
        ]
    }

    modeKey(v, opts, s){
        return v || Fog.EXP2
    }

    colorKey(v, opts, s){
        return v ? colors.get(v): undefined
    }

    densityKey(v, opts, s){
        return v || 0.02
    }

    startKey(v, opts, s){
        return v || 20.0
    }

    endKey(v, opts, s){
        return v || 60;
    }

    off(scene){
        scene = scene || this._app.scene()
        if(this._on) {
            this._fogMode = scene.fogMode
            this._density = scene.fogDensity
            this._start = scene.fogStart
            this._end   = scene.fogEnd
        };

        scene.fogMode = Fog.NONE

        return this;
    }

    on(options, scene) {
        scene = scene || this._app.scene()
        options = options || {
            mode: this._fogMode || this.modeKey()
            , density: this._density || this.densityKey()
            , start: this._start || this.startKey()
            , end: this._end || this.endKey()
            , color: this._color || this.colorKey()
        }

        let mode = options.mode
        let fdf = function(o, s){
                s.fogDensity = o.density;
            };
        let map = {
            [Fog.NONE]: function(){ return this.off() }.bind(this)
            , [Fog.EXP]: fdf
            , [Fog.EXP2]: fdf
            , [Fog.LINEAR]: function(o, s){
                s.fogStart = o.start
                s.fogEnd = o.end
            }
        };

        map[mode](options, scene)

        scene.fogMode = mode
        if(options.color) {
            scene.fogColor = colors.get(options.color)
        }
        return this;
    }


    babylonArrayArgs() {
        return false
    }

    executeBabylon(BABYLON, className, name, options, scene, ...args) {
        return this.on(options, scene)
    }
}

Fog.NONE = BABYLON.Scene.FOGMODE_NONE
Fog.EXP = BABYLON.Scene.FOGMODE_EXP
Fog.EXP2 = BABYLON.Scene.FOGMODE_EXP2
Fog.LINEAR = BABYLON.Scene.FOGMODE_LINEAR