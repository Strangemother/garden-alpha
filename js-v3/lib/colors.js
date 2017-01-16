var colors = {};
var materials = {};
var modifiers = {};

colors.DIFFUSE = 'diffuseColor'
colors.EMISSIVE = 'emessiveColor'

materials.white = function(scene) {
    var mat = materials.standard(scene, 'White')
    mat.diffuseColor = colors.white()
    return mat
}

materials.blue = function(scene) {
    var mat = materials.standard(scene, 'Blue')
    mat.emissiveColor = colors.blue()
    return mat
}

materials.standard = function(scene, name) {
    var m = new BABYLON.StandardMaterial(name, scene);
    return m;
}

materials.color = function(scene, name, type=colors.DIFFUSE){
    let item = name;
    if(typeof(name) == 'string') {
        item = colors[name]()
    } else {
        name = simpleID(item.name)
    }

    let m = materials.standard(scene, name);
    m[type] = item;
    return m
}

modifiers.fog = function(scene) {
    scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
    scene.fogDensity = 0.04;
    scene.fogColor = new BABYLON.Color3(0.8, 0.83, 0.8);
}


let _colors = {
    red:       [1, 0, 0]
    , green:   [0, 1, 0]
    , blue:    [0, 0, 1] // will be skipped due to override
    , blue:    [0, 0, 1] // will be skipped due to override
    , black:   [0,0,0]
    , white:   [1,1,1]
    , red:     [1,0,0]
    , lime:    [0,1,0]
    , blue:    [0,0,1]
    , yellow:  [1,1,0]
    , cyan:    [0,1,1]
    , magenta: [1,0,1]
    , silver:  [.75,.75,.75]
    , gray:    [.6,.6,.6]
    , maroon:  [.6,0,0]
    , olive:   [.6,.6,0]
    , purple:  [.6,0,.6]
    , teal:    [0,.6,.6]
    , navy:    [0,0,.6]

}

colors.get = function(value){
    if(typeof(value) == 'string')
        return colors[value]()
    return value;
}

colors.white = function() {
    return colors.make(1, 1, 1);
}

colors.color3 = function(num) {
    return colors.make(num, num, num)
}


colors.color4 = function(num, a) {
    return colors.make(num, num, num, a || num)
}


colors.hexToRgb = function(hex) {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
        return r + r + g + g + b + b;
    });

    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
        parseInt(result[1], 16)
        , parseInt(result[2], 16)
        , parseInt(result[3], 16)
    ] : null;
}


colors.hex = function(hexVal){
    /* Create a color using a hex value*/
    return colors.make.apply(colors, colors.hexToRgb(hexVal).map(x => x/255))
}


colors.rgbToHex = function(...args) {
    let [r,g,b] = args.map(x => x*255)
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

colors.make = function(r, g, b, a) {
    if(r instanceof Array && g == undefined && b == undefined) {
        var v = r;
        r = v[0];
        g = v[1];
        b = v[2];
        a = v[3] || 1;
    };

    if(arguments.length == 3){
        return new BABYLON.Color3(r,g,b);
    };

    return new BABYLON.Color4(r,g,b,a);
}

colors.names = [];

colors.addColors = function(_colors, overwrite=true) {
    /* Add an object of colors,
    Creating a function on `colors` of the key from the given object.
    The function calls `colors.make` returning a BABYLON type.

        colors.addColors({ red: [1, 0, 0]})*/
    for(var name in _colors) {
        if(colors[name] !== undefined) {
            if(overwrite == false) {
                continue;
            } else {
                console.warn('overwrite ' + name)
            }
        }

        colors.names.push(name)

        _colors[`_${name}`] = _colors[name];

        colors[name] = (function(){
            var name = this.name;
            var _colors = this._colors
            return function(){
                let c = colors.make(_colors[`_${name}`])
                return c;
            }

        }).apply({ name, _colors })
    }
}


colors.addColors(_colors, false)
