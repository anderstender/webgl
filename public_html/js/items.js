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
    this.nMatrix = mat4.create();
    this.Set = function(params){
        if(typeof params.Vertices !== 'undefined'){
            Parent.Vertices.Set(params.Vertices[0], params.Vertices[1]);
        }
        
        if(typeof params.Colors !== 'undefined'){
            Parent.Colors.Set(params.Colors[0]);
        }
        
        if(typeof params.Position !== 'undefined'){
            Parent.Position.Set(params.Position[0]);
        }
        
        if(typeof params.Rotate !== 'undefined'){
            Parent.Rotate.Set(params.Rotate[0], params.Rotate[1]);
        }
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
            
            if(Parent.Colors.coords.length === 0){
                var colors = [];
                for(var i=0;i<Vertices.buffer.numItems; i++){
                    colors = colors.concat([1.0, 1.0, 1.0, 1.0]);
                }
                Parent.Colors.Set(colors);
            }
            
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
        this.translate = [0.0, 0.0, 0.0];
        this.Translate = function(coords){
            
            Parent.Position.translate[0] += coords[0];
            Parent.Position.translate[1] += coords[1];
            Parent.Position.translate[2] += coords[2];
            
            for(var i=0; i< Parent.Vertices.coords.length - 2; i+=3){
                Parent.Vertices.coords[i+0] += Parent.Position.translate[0];
                Parent.Vertices.coords[i+1] += Parent.Position.translate[1];
                Parent.Vertices.coords[i+2] += Parent.Position.translate[2];
            } 
            
            for(var i in Parent.Childs.list){
                Parent.Childs.list[i].Position.Translate(Parent.Position.translate);
            }
        }
        
        this.Set = function(coords){  
            Position.coords[0] += coords[0];
            Position.coords[1] += coords[1];
            Position.coords[2] += coords[2];
            
            for(var i in Parent.Childs.list){
                Parent.Childs.list[i].Position.Set(coords);
            }
        };
    });
    
    this.Rotate = new (function(){
        var Rotate = this;
        this.matrix = mat4.create();
        mat4.identity(this.matrix);
        
        this.angle = 0;
        this.coords = [0.0, 0.0, 0.0];
        //this.center = Parent.Position.coords;
        
        this.Set = function(angle, coords, center){

            Rotate.angle = angle;
            Rotate.coords = coords;
            Rotate.coords[0] += coords[0];
            Rotate.coords[1] += coords[1];
            Rotate.coords[2] += coords[2];
            
            if(typeof center !== 'undefined'){
                Rotate.center = center;
            }
        };
        
    });
    
    this.Childs = new(function(){
        var Childs = this;
        this.list =[];
        this.Add = function(glItem){
            var index = Childs.list.length;
            Childs.list[index] = glItem;
            
            Childs.list[index].mvMatrix = Parent.mvMatrix;
            Childs.list[index].pMatrix  = Parent.pMatrix;
            
            Childs.list[index].Position.Translate(Parent.Position.translate);
            Childs.list[index].Position.Set(Parent.Position.coords);
            Childs.list[index].Rotate.coords = Parent.Rotate.coords;
            
            return index;
        };
        
        
        this.Get = function(index){
            return Childs.list[index];
        };
    });
    
};