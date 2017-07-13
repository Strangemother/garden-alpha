class Object2D {
    /* implement the base level of world scene abstracton.
    All items and singletons should inherit from here. */

    canvas(id){
        /* provide and create, or return a canvas instance. */
        if(id == undefined) {
            return this._canvas
        }

        return this._canvas = document.getElementById(id);

    }

    screenSpace(id){
        if(id == undefined) {
            this._screenSpace
        };

        let scene = this.scene()
        return (new BABYLON.ScreenSpaceCanvas2D(scene, { id: id }))
    }

    engine(canvas){

        if(canvas == undefined && this._engine != undefined) {
            return this._engine;
        };

        if(canvas == undefined) {
            canvas = this.canvas()
        }
        // Load the BABYLON 3D engine
        var engine = new BABYLON.Engine(canvas, true);

        // Watch for browser/canvas resize events
        window.addEventListener("resize", function () {
           engine.resize();
        });

        this._engine = engine
        return this._engine;
    }

    scene(engine){
        if(this._scene) return this._scene;

        if(engine == undefined) {
            engine = this.engine()
        };

        return this._scene = new BABYLON.Scene(engine);
    }

    getBabylonSet(app){

        if(Garden != undefined) {
            let i = Garden.instance();
            if(i != undefined) {
                return i.babylonSet;
            }
        };

        this.create()
        return [this._scene, this._engine, this._canvas]
    }

}


class Scene2D extends Object2D {
    /*
    A basic scene can hold an instance of the ScreenSpaceCanvas2D
    or generate new with Scene2D.create() */
    create(canvasName='renderCanvas'){
         let [scene, engine, canvas] = this.getBabylonSet()
        return [scene, engine, canvas]
    }

    screenSpace(scene, canvasName='renderCanvas'){
        if(scene == undefined) {
            scene = this.create(canvasName)[0];
        };

        return new BABYLON.ScreenSpaceCanvas2D(scene,
            {
                id: canvasName
                , size: new BABYLON.Size(600, 600)
                , cachingStrategy: BABYLON.Canvas2D.CACHESTRATEGY_DONTCACHE
                , backgroundFill: BABYLON.Canvas2D.GetSolidColorBrushFromHex("#80808040")
                , backgroundRoundRadius: 10
                , backgroundBorder: BABYLON.Canvas2D.GetSolidColorBrushFromHex("#FFFFFFFF")
                , backgroundBorderThickNess: 2
            }
        );
    }

    start(){
        let canvas = this.screenSpace();
        return canvas;
    }

    loop(){
        let _items = [];
        let canvas = this.start()
        let items = function(){
            if(canvas.isDisposed) {
                clearInterval(timerId);
                return;
            }
            return this.items(canvas);
        }.bind(this);

        this.x = 0
        this.renderTimer = setInterval(function(){
            for (var i = _items.length - 1; i >= 0; i--) {
                _items[i].dispose();
            }

            _items=items()
        })

        return this
    }

    items(canvas){

        var rect = new BABYLON.Rectangle2D({
            parent: canvas
            , id: "Rect"
            , x: 150
            , y: 150
            , width: 150
            , height: 150
            , border: BABYLON.Canvas2D.GetSolidColorBrushFromHex("#404040FF")
            , fill: BABYLON.Canvas2D.GetGradientColorBrush(
                new BABYLON.Color4(0.9, 0.3, 0.9, 1)
                , new BABYLON.Color4(1.0, 1.0, 1.0, 1)
                )
            , borderThickness: 10
            , roundRadius: 10 });

        var text = new BABYLON.Text2D("Select a Primitive!",
            {
                parent: canvas
                , marginAlignment: "h:center, v:bottom"
                , fontName: "12pt Arial"
                , defaultFontColor: new BABYLON.Color4(1, 1, 1, 1)
                , x: this.x
            });

        return [rect, text]
    }
}
