/*
 * объекты для отрисовки
 * таким образом с ними проще работать
 * лучше отдельно задавать свойства объекта, а потом внутри ядра их обрабатывать
 * чем париться со сложной логикой
 */
var GLItem = function(gl){
    var Parent = this;
    this.gl = gl;
    this.mvMatrix = mat4.create();
    this.pMatrix = mat4.create();
    this.Draw = function(){
    };
    this.Vertices = new (function(){
        var Vertices = this;
        this.coords = [];
        this.numItems = 0;
        this.itemSize = 3;
        this.buffer = Parent.gl.createBuffer();
        this.glType = null;
        
        this.Set = function(coords, glType){
            Vertices.coords = coords;
            Vertices.numItems = parseInt(Vertices.coords.length / Vertices.itemSize);
            
            Vertices.buffer.numItems = Vertices.numItems;
            Vertices.buffer.itemSize = Vertices.itemSize;
            
            Vertices.glType = glType;
        };
    });
    this.Colors = new (function(){
        var Colors = this;
        this.coords = [];
        this.numItems = 0;
        this.itemSize = 4;
        this.buffer = Parent.gl.createBuffer();
        
        this.Set = function(coords){
            Colors.coords = coords;
            Colors.numItems = parseInt(Colors.coords.length / Colors.itemSize);
            
            Colors.buffer.numItems = Colors.numItems;
            Colors.buffer.itemSize = Colors.itemSize;
        };
    });
    this.Position = new (function(){
        var Position = this;
        this.coords = [0.0, 0.0, 0.0];
        this.Set = function(coords){
            Position.coords = coords;
        };
    });
    
    this.Rotate = new (function(){
        var Rotate = this;
        this.matrix = mat4.create();
        mat4.identity(this.matrix);
        
        this.angle = 0;
        this.coords = [0, 0, 0];
        this.center = Parent.Position.coords;
        
        this.Set = function(angle, coords, center){
            Rotate.angle = angle;
            Rotate.coords = coords;
            if(typeof center !== 'undefined'){
                Rotate.center = center;
            }
        };
        
    });
};