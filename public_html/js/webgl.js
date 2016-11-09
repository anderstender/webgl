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
        
        
        parent.setShader("resources/shaders/fragment/shader-fs.sx", "fragment");
        parent.setShader("resources/shaders/vertex/shader-vs.sx", "vertex");
        parent.initShaders();

        parent.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        parent.gl.enable(parent.gl.DEPTH_TEST);
    };
    this.shaderProgram = null;
    this.shadersList = null;
    this.setShader = function(path, type){
        if(parent.shadersList === null){
           parent.shadersList = {};
        }
        if(type === false){
            delete parent.shadersList[path];
        }else{
            parent.shadersList[path] = type;
        }
    };
    this.initShaders = function(){
        if(parent.shadersList === null){//если шейдеры не заданы, то задаем стандартные
            parent.shadersList = {
                "resources/shaders/fragment/shader-fs.sx"   : "fragment",
                "resources/shaders/vertex/shader-vs.sx"     : "vertex"
            };
        }
        parent.shaderProgram = parent.gl.createProgram();
        for(var path in parent.shadersList){
            var type = parent.shadersList[path];
            var shader = parent.getShader(path, type);
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
        
        parent.shaderProgram.pMatrixUniform = parent.gl.getUniformLocation(parent.shaderProgram, "uPMatrix");
        parent.shaderProgram.mvMatrixUniform = parent.gl.getUniformLocation(parent.shaderProgram, "uMVMatrix");      
    };
    
    this.loadShaderCode = function(path){
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
    }
    
    this.getShader = function(path, type){
        var str = parent.loadShaderCode(path);
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
            console.log(parent.gl.getShadeInfoLog(shader));
            return null;
        }
        return shader;
    };

    this.buffers = [];
    
    this.Buffer = new (function(){
        this.index = 0;
        var Buffer = this;
        this.Add = function(){
            var index = parent.buffers.length;
            var buffer = parent.gl.createBuffer();
            parent.buffers[index] = buffer;
            Buffer.index = index;
            return index;
        };
        
        this.SetParams = function(index, itemSize, countItems, type){
            parent.Buffer.SetCurrent(index);
            parent.buffers[index].itemSize = itemSize;
            parent.buffers[index].numItems = countItems;
            parent.buffers[index].type = type;
            parent.buffers[index].first = 0;
        };
        
        this.SetCurrent = function(index){
            parent.gl.bindBuffer(parent.gl.ARRAY_BUFFER, 
                                parent.buffers[index]);
            Buffer.index = index;
        };
        
        this.GetCurrent = function(){
            return parent.buffers[Buffer.index];
        };
        
        this.SetData = function(index, vertices){
            parent.buffers[index].vertices = vertices;
            parent.Buffer.SetCurrent(index);
            parent.gl.bufferData(parent.gl.ARRAY_BUFFER, 
                    new Float32Array(vertices), 
                    parent.gl.STATIC_DRAW);
        };
        
        this.SetPosition = function(index, coords){
            parent.buffers[index].coords = coords;
        };
        
        this.Draw = function(index){
            parent.Buffer.SetCurrent(index);
            var curBuffer = parent.Buffer.GetCurrent();
            
            parent.m4.Translate(curBuffer.coords);
            parent.gl.vertexAttribPointer(  parent.shaderProgram.vertexPositionAttribute, 
                                            curBuffer.itemSize, 
                                            parent.gl.FLOAT, 
                                            false, 0, 0);
            parent.setMatrixUniforms();
            parent.gl.drawArrays(   curBuffer.type, 
                                    curBuffer.first, 
                                    curBuffer.numItems);
              
            //необязательная штука, но так как она возвращает в исходную позицию, то считать становится проще
            parent.m4.Translate([-curBuffer.coords[0], -curBuffer.coords[1], -curBuffer.coords[2]]); 
        };
    });
    this.initBuffers = function(){
        var bIndex = parent.Buffer.Add();
        parent.Buffer.SetParams(bIndex, 3, 3, parent.gl.TRIANGLE_STRIP);
        
        parent.Buffer.SetPosition(bIndex, [-1.5, 0.0, -17.0]);
        
        var vertices = [
            0.0,  1.0,  0.0,
           -1.0, -1.0,  0.0,
            1.0, -1.0,  0.0
        ];
        parent.Buffer.SetData(bIndex, vertices);
    };
    
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
                    typeof params.itemSize !== 'undefined' &&
                    typeof params.type !== 'undefined'){
                var countItem = parseInt(params.vertices.length / params.itemSize);
                parent.Buffer.SetParams(index, params.itemSize, countItem, params.type);
                
                parent.Buffer.SetData(index, params.vertices);
            }
            return index;
        };
        
        this.Set = function(index, params){
            if(typeof params.translate !== 'undefined'){
                parent.Buffer.SetPosition(index, params.translate);
            }
            if(typeof params.vertices !== 'undefined' &&
                    typeof params.itemSize !== 'undefined' &&
                    typeof params.type !== 'undefined'){
                var countItem = parseInt(params.vertices.length / params.itemSize);
                parent.Buffer.SetParams(index, params.itemSize, countItem, params.type);
                
                parent.Buffer.SetData(index, params.vertices);
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