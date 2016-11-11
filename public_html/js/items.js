/*
 * объекты для отрисовки
 * таким образом с ними проще работать
 * лучше отдельно задавать свойства объекта, а потом внутри ядра их обрабатывать
 * чем париться со сложной логикой
 */
var GLItem = function(context){
    var Parent = this;
    this.gl = null;
    this.shaderProgram = null;
    this.Context = context;
    this.Draw = function(){


        Parent.Context.gl.bindBuffer(Parent.Context.gl.ARRAY_BUFFER, 
                                    Parent.Vertices.buffer);
                                    
        Parent.Context.gl.bufferData(Parent.Context.gl.ARRAY_BUFFER, 
                                    new Float32Array(Parent.Vertices.coords), 
                                    Parent.Context.gl.STATIC_DRAW);
                                    
        Parent.Vertices.buffer.itemSize = Parent.Vertices.itemSize;
        Parent.Vertices.buffer.numItems = Parent.Vertices.numItems;
             
             
        Parent.Context.gl.vertexAttribPointer(Parent.Context.shaderProgram.vertexPositionAttribute, 
                                        Parent.Vertices.buffer.itemSize, 
                                        Parent.Context.gl.FLOAT, false, 0, 0);
                                    
        //натягиваем цвет                             
        Parent.Context.gl.bindBuffer(Parent.Context.gl.ARRAY_BUFFER, 
                                Parent.Colors.buffer);  

        Parent.Context.gl.bufferData(Parent.Context.gl.ARRAY_BUFFER, 
                                new Float32Array(Parent.Colors.coords), 
                                Parent.Context.gl.STATIC_DRAW);
        Parent.Colors.buffer.itemSize = Parent.Colors.itemSize;
        Parent.Colors.buffer.numItems = Parent.Colors.numItems;


        Parent.Context.gl.vertexAttribPointer(  Parent.Context.shaderProgram.vertexColorAttribute, 
                                        Parent.Colors.buffer.itemSize, 
                                        Parent.Context.gl.FLOAT, 
                                        false, 0, 0);
                                        
        Parent.Context.setMatrixUniforms();                                
        Parent.Context.gl.drawArrays(Parent.Vertices.glType, 
                                0, 
                                Parent.Vertices.buffer.numItems);
    };
    this.Vertices = new (function(){
        var Vertices = this;
        this.coords = [];
        this.numItems = 0;
        this.itemSize = 3;
        this.buffer = context.gl.createBuffer();;
        this.glType = null;
        
        this.Set = function(coords, glType){
            Vertices.coords = coords;
            Vertices.numItems = parseInt(Vertices.coords.length / Vertices.itemSize);
            Vertices.glType = glType;
        };
    });
    this.Colors = new (function(){
        var Colors = this;
        this.coords = [];
        this.numItems = 0;
        this.itemSize = 4;
        this.buffer = context.gl.createBuffer();;
        this.Set = function(coords){
            Colors.coords = coords;
            Colors.numItems = parseInt(Colors.coords.length / Colors.itemSize);
        };
    });
    this.Position = new (function(){
        var Position = this;
        this.coords = [0.0, 0.0, 0.0];
        this.Set = function(coords){
            Position.coords = coords;
        };
    });
};