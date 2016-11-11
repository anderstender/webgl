;var WebGL = function(){
   
    this.gl = null;
    var parent = this;
    
    this.mvMatrix = null;//mat4.create();
    this.pMatrix = null;//mat4.create();
    
    this.sceneParams = {
        angle : 45.0,
        front : 0.1,
        back  : 200
    };
    this.setSceneParam = function(key, value){
        parent.sceneParams[key] = value;
    };
    
    this.init = function(id){
        parent.mvMatrix = mat4.create();
        parent.pMatrix = mat4.create();
        
        var canvas = document.getElementById(id);
        if(!canvas){
            return false;
        };
        var names = ["webgl", "experimental-webgl", "webkit-3d", "moz-webgl"];//хуита по-разному названа в браузерах
        for(var i in names){
            try{
                parent.gl = canvas.getContext(names[i]);
            }catch(e){}
            if(parent.gl){
                break;
            }
        };
        if(parent.gl){
            parent.gl.viewportWidth = canvas.width;
            parent.gl.viewportHeight = canvas.height;
        }else{
            console.log('Could not initialise WebGL.');
            return null;
        }
        
        parent.Shader.Init();
    };
    this.shaderProgram = null;
    this.shadersList = null;
    this.Shader = new (function(){
        var Shader = this;
        this.loadCode = function(path){
            if(typeof path == 'undefined'){
                return null;
            }
            var strCode = null;
            $.ajax({
                async : false,
                url   : path,
                success : function (data){
                    if(data){
                        strCode = data;
                    }
                }
            });
            return strCode;
        };
        
        this.Get = function(path, type){
            var str = parent.Shader.loadCode(path);
            if(str === null){
                return null;
            }
            var shader;
            if(type === "fragment"){
                shader = parent.gl.createShader(parent.gl.FRAGMENT_SHADER);
            }else if(type === "vertex"){
                shader = parent.gl.createShader(parent.gl.VERTEX_SHADER);
            }else{
                return null;
            }

            parent.gl.shaderSource(shader, str);
            parent.gl.compileShader(shader);

            if(!parent.gl.getShaderParameter(shader, parent.gl.COMPILE_STATUS)){
                console.log(parent.gl.getShaderInfoLog(shader));
                return null;
            }
            return shader;
        };
        
        this.Set = function(path, type){
            if(parent.shadersList === null){
                parent.shadersList = {};
            }
            if(type === false){
                delete parent.shadersList[path];
            }else{
                parent.shadersList[path] = type;
            }
        };
        
        
        this.Init = function(){
            if(parent.shadersList === null){//если шейдеры не заданы, то задаем стандартные
                parent.shadersList = {
                    "resources/shaders/fragment/shader-fs.sx"   : "fragment",
                    "resources/shaders/vertex/shader-vs.sx"     : "vertex"
                };
            }
            parent.shaderProgram = parent.gl.createProgram();
            for(var path in parent.shadersList){
                var type = parent.shadersList[path];
                var shader = parent.Shader.Get(path, type);
                parent.gl.attachShader(parent.shaderProgram, shader);
            }
            parent.gl.linkProgram(parent.shaderProgram);

            if(!parent.gl.getProgramParameter(parent.shaderProgram, 
                                                parent.gl.LINK_STATUS)){
                console.log("Could not initialise shaders");
            }
            parent.gl.useProgram(parent.shaderProgram);

            parent.shaderProgram.vertexPositionAttribute = parent.gl.getAttribLocation(parent.shaderProgram, "aVertexPosition");
            parent.gl.enableVertexAttribArray(parent.shaderProgram.vertexPositionAttribute);

            parent.shaderProgram.vertexColorAttribute = parent.gl.getAttribLocation(parent.shaderProgram, "aVertexColor");
            parent.gl.enableVertexAttribArray(parent.shaderProgram.vertexColorAttribute);

            parent.shaderProgram.pMatrixUniform = parent.gl.getUniformLocation(parent.shaderProgram, "uPMatrix");
            parent.shaderProgram.mvMatrixUniform = parent.gl.getUniformLocation(parent.shaderProgram, "uMVMatrix");
            
            
        };
    });

    this.Items = new (function(){
        var Items = this;
        this.list = [];
        this.Add = function(glItem){
            var index = Items.list.length;
            Items.list[index] = glItem;
            return index;
        };
        
        this.Get = function(index){
            return Items.list[index];
        };
        
        this.Remove = function(index){
            delete Items.list[index];
        };
        this.rDraw = function(Item, Parent){
            mat4.perspective(parent.sceneParams.angle, parent.gl.viewportWidth / parent.gl.viewportHeight,
                            parent.sceneParams.front, parent.sceneParams.back, Item.pMatrix);
            mat4.identity(Item.mvMatrix);
            
            
            
            mat4.translate(Item.mvMatrix, Item.Position.coords);
            mat4.rotate(Item.Rotate.matrix, Item.Rotate.angle, Item.Rotate.coords);
            mat4.multiply(Item.mvMatrix, Item.Rotate.matrix);
            
            
            //ставим координаты вершин
            parent.gl.bindBuffer(parent.gl.ARRAY_BUFFER, 
                                    Item.Vertices.buffer);
                                    
            parent.gl.bufferData(parent.gl.ARRAY_BUFFER, 
                                    new Float32Array(Item.Vertices.coords), 
                                    parent.gl.STATIC_DRAW);

            parent.gl.vertexAttribPointer(parent.shaderProgram.vertexPositionAttribute, 
                                            Item.Vertices.buffer.itemSize, 
                                            parent.gl.FLOAT, false, 0, 0);
                                    
            //натягиваем цвет                             
            parent.gl.bindBuffer(parent.gl.ARRAY_BUFFER, 
                                Item.Colors.buffer);  

            parent.gl.bufferData(parent.gl.ARRAY_BUFFER, 
                                new Float32Array(Item.Colors.coords), 
                                parent.gl.STATIC_DRAW);



            parent.gl.vertexAttribPointer(  parent.shaderProgram.vertexColorAttribute, 
                                            Item.Colors.buffer.itemSize, 
                                            parent.gl.FLOAT, 
                                            false, 0, 0);
                                      
            
            parent.Items.setMatUniform(Item);                                
            parent.gl.drawArrays(Item.Vertices.glType, 
                                    0, 
                                    Item.Vertices.buffer.numItems);
            
            
            mat4.rotate(Item.Rotate.matrix, 
                        -Item.Rotate.angle, 
                        [Item.Rotate.coords[0], Item.Rotate.coords[1], Item.Rotate.coords[2]]);
            mat4.multiply(Item.mvMatrix, Item.Rotate.matrix);
            
            mat4.translate(Item.mvMatrix, [   -Item.Position.coords[0], 
                                                -Item.Position.coords[1], 
                                                -Item.Position.coords[2]]);
             for(var i in Item.Childs.list){
                 parent.Items.rDraw(Item.Childs.Get(i));
             }
        };
        
        this.Draw = function(index){
            var Item = parent.Items.Get(index);
            parent.Items.rDraw(Item);
        };
        
        this.setMatUniform = function(Item){
            //var Item = parent.Items.Get(index);
            parent.gl.uniformMatrix4fv(parent.shaderProgram.pMatrixUniform, false, Item.pMatrix);
            parent.gl.uniformMatrix4fv(parent.shaderProgram.mvMatrixUniform, false, Item.mvMatrix);
        };
    });
    
    
    
    this.m4 = new (function(){
        this.Translate = function(coords){
            mat4.translate(parent.mvMatrix, coords);
        };
        this.Percpective = function(){
            mat4.perspective(parent.sceneParams.angle, parent.gl.viewportWidth / parent.gl.viewportHeight,
                            parent.sceneParams.front, parent.sceneParams.back, parent.pMatrix);
        };
        this.Identity = function(){
            mat4.identity(parent.mvMatrix);
        };
        
        this.Start = function(){
            parent.m4.Percpective();
            parent.m4.Identity();
        };
    });
    this.Draw = new (function(){
        this.Start =  function(){
            parent.gl.clearColor(0.0, 0.0, 0.0, 1.0);
            parent.gl.enable(parent.gl.DEPTH_TEST);
            
            parent.gl.viewport(0, 0, 
                            parent.gl.viewportWidth, parent.gl.viewportHeight);
                            
            parent.gl.clear(parent.gl.COLOR_BUFFER_BIT | parent.gl.DEPTH_BUFFER_BIT);
            parent.m4.Start();
        };
        this.Exec = function(){
            parent.Draw.Start();
            //parent.m4.Translate([0.0,0.0, -5]);
            
            
            for(var i in parent.Items.list){
                parent.Items.Draw(i);
            }
        };
    });
    
    
    this.setMatrixUniforms = function() {
        parent.gl.uniformMatrix4fv(parent.shaderProgram.pMatrixUniform, false, parent.pMatrix);
        parent.gl.uniformMatrix4fv(parent.shaderProgram.mvMatrixUniform, false, parent.mvMatrix);
    }
};