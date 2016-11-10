;var WebGL = function(){
   
    this.gl = null;
    var parent = this;
    
    this.mvMatrix = null;//mat4.create();
    this.pMatrix = null;//mat4.create();
    
    this.sceneParams = {
        angle : 45.0,
        front : 0.1,
        back  : 100
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

        parent.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        parent.gl.enable(parent.gl.DEPTH_TEST);
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

    this.buffers = [];
    
    this.Buffer = new (function(){
        var Buffer = this;
        this.index = 0;
        this.Add = function(){
            var index = parent.buffers.length;
            var buffer_p = parent.gl.createBuffer();
            var buffer_c = parent.gl.createBuffer();
            parent.buffers[index] = {};
            parent.buffers[index].pos = buffer_p;
            parent.buffers[index].col = buffer_c;
            Buffer.index = index;
            return index;
        };
        
        /*
         * type = v/c    - vertices/colors
         */
        this.SetParams = function(index, itemSize, countItems, gl_type){
            parent.Buffer.SetCurrent(index);
            parent.buffers[index].pos.itemSize = itemSize;
            parent.buffers[index].col.itemSize = 4;
            
            
            parent.buffers[index].pos.numItems = countItems;
            parent.buffers[index].col.numItems = countItems;
            
            
            parent.buffers[index].pos.gl_type = gl_type;
            parent.buffers[index].col.gl_type = gl_type;
            
            parent.buffers[index].pos.first = 0;
            parent.buffers[index].col.first = 0;
        };
        
        /*
         * bufName = pos/col
         */
        this.SetCurrent = function(index, bufName){
            parent.gl.bindBuffer(parent.gl.ARRAY_BUFFER, 
                                parent.buffers[index][bufName]);
            Buffer.index = index;
        };
        
        this.GetCurrent = function(){
            return parent.buffers[Buffer.index];
        };
        
        this.SetData = function(index, vertices, colors){
            parent.buffers[index].vertices = vertices;
            parent.buffers[index].colors = colors;
            
            parent.Buffer.SetCurrent(index, 'pos');
            parent.gl.bufferData(parent.gl.ARRAY_BUFFER, 
                    new Float32Array(vertices), 
                    parent.gl.STATIC_DRAW);
                    
                    
            parent.Buffer.SetCurrent(index, 'col');
            parent.gl.bufferData(parent.gl.ARRAY_BUFFER, 
                    new Float32Array(colors), 
                    parent.gl.STATIC_DRAW);
                    
            
        };
        
        this.SetPosition = function(index, coords){
            parent.buffers[index].pos.coords = coords;
        };
        
        this.Draw = function(index){
            parent.Buffer.SetCurrent(index, 'pos');
            var curBuffer = parent.Buffer.GetCurrent();
            
            parent.m4.Translate(curBuffer.pos.coords);
            
            parent.gl.bindBuffer(parent.gl.ARRAY_BUFFER, curBuffer.pos);
            parent.gl.vertexAttribPointer(  parent.shaderProgram.vertexPositionAttribute, 
                                            3, 
                                            parent.gl.FLOAT, 
                                            false, 0, 0);
                                            
                                            
            parent.Buffer.SetCurrent(index, 'col');
            curBuffer = parent.Buffer.GetCurrent();
            
            parent.gl.bindBuffer(parent.gl.ARRAY_BUFFER, curBuffer.col);
            parent.gl.vertexAttribPointer(  parent.shaderProgram.vertexColorAttribute, 
                                            4, 
                                            parent.gl.FLOAT, 
                                            false, 0, 0);                           
                                         
            parent.setMatrixUniforms();
            
              
              
              
              
            //необязательная штука, но так как она возвращает в исходную позицию, то считать становится проще
            //parent.m4.Translate([-curBuffer.pos.coords[0], -curBuffer.pos.coords[1], -curBuffer.pos.coords[2]]); 
            
            
            
            
            parent.gl.drawArrays(   curBuffer.pos.gl_type, 
                                    0, 
                                    curBuffer.pos.numItems);
        };
    });

    
    this.Items = new (function(){
        /*
         * params = {
         *      vertices : float[],
         *      itemSize : int,
         *      translate: [0.0, 0.0, 0.0],
         *      type : gl.type (int),
         * }
         */
        this.Add = function(params){
            var index = parent.Buffer.Add();

            if(typeof params.translate !== 'undefined'){
                parent.Buffer.SetPosition(index, params.translate);
            }else{
                parent.Buffer.SetPosition(index, [0.0, 0.0, 0.0]);
            }
            if(typeof params.vertices !== 'undefined' &&
                    typeof params.gl_type !== 'undefined'){
                var countItem = parseInt(params.vertices.length / 3);
                parent.Buffer.SetParams(index, 3, countItem, params.gl_type);
                parent.Buffer.SetData(index, params.vertices, params.colors);
            }
            return index;
        };
        
        this.Set = function(index, params){
            if(typeof params.translate !== 'undefined'){
                parent.Buffer.SetPosition(index, params.translate);
            }
            if(typeof params.vertices !== 'undefined' &&
                    typeof params.gl_type !== 'undefined'){
                var countItem = parseInt(params.vertices.length / 3);
                parent.Buffer.SetParams(index, 3, countItem, params.gl_type);
                
                parent.Buffer.SetData(index, params.vertices, params.colors);
            }
            return index;           
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
            parent.gl.viewport(0, 0, 
                            parent.gl.viewportWidth, parent.gl.viewportHeight);
                            
            parent.gl.clear(parent.gl.COLOR_BUFFER_BIT | parent.gl.DEPTH_BUFFER_BIT);
            parent.m4.Start();
        };
        this.Exec = function(){
            parent.Draw.Start();
            for(var i in parent.buffers){
                parent.Buffer.Draw(i);
            }
        };
    });
    this.setMatrixUniforms = function() {
        parent.gl.uniformMatrix4fv(parent.shaderProgram.pMatrixUniform, false, parent.pMatrix);
        parent.gl.uniformMatrix4fv(parent.shaderProgram.mvMatrixUniform, false, parent.mvMatrix);
    }
};