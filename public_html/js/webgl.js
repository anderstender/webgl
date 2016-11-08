;var WebGL = function(){
   
    this.gl = null;
    var parent = this;
    
    this.mvMatrix = mat4.create();
    this.pMatrix = mat4.create();
    
    this.init = function(id){
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
        }
        
        parent.initShaders();
        
        
        parent.initBuffers();
        
        parent.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        parent.gl.enable(parent.gl.DEPTH_TEST);

        parent.draw();
    };
    this.shaderProgram = null;
    this.initShaders = function(){
        var fShader = parent.getShader("shader-fs");
        var vShader = parent.getShader("shader-vs");
        
        parent.shaderProgram = parent.gl.createProgram();
        parent.gl.attachShader(parent.shaderProgram, vShader);
        parent.gl.attachShader(parent.shaderProgram, fShader);
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
    this.getShader = function(id){
        var shaderScript = document.getElementById(id);
        if(!shaderScript){
            return null;
        }
        var str = "";
        var k = shaderScript.firstChild;
        while(k){
            if(k.nodeType == 3){
                str += k.textContent;
            }
            k = k.nextSibling;
        }
        
        var shader;
        if(shaderScript.type == "x-shader/x-fragment"){
            shader = parent.gl.createShader(parent.gl.FRAGMENT_SHADER);
        }else if(shaderScript.type == "x-shader/x-vertex"){
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
    
    this.tVerPosBuffer = null;
    this.sVerPositionBuffer = null;
    this.initBuffers = function(){
        parent.tVerPosBuffer = parent.gl.createBuffer();
        parent.gl.bindBuffer(parent.gl.ARRAY_BUFFER, 
                                parent.tVerPosBuffer);
        
        var vertices = [
            0.0,  1.0,  0.0,
           -1.0, -1.0,  0.0,
            1.0, -1.0,  0.0
        ];
        
        parent.gl.bufferData(parent.gl.ARRAY_BUFFER, 
                                new Float32Array(vertices), 
                                parent.gl.STATIC_DRAW);
                                
        parent.tVerPosBuffer.itemSize = 3;
        parent.tVerPosBuffer.numItems = 3;                    
        
        parent.sVerPositionBuffer = parent.gl.createBuffer();
        parent.gl.bindBuffer(parent.gl.ARRAY_BUFFER, 
                                parent.sVerPositionBuffer);
                                
        vertices = [
            1.0,  1.0,  0.0,
           -1.0,  1.0,  0.0,
            1.0, -1.0,  0.0,
           -1.0, -1.0,  0.0
        ];
        
        parent.gl.bufferData(parent.gl.ARRAY_BUFFER, 
                        new Float32Array(vertices), 
                        parent.gl.STATIC_DRAW);
        parent.sVerPositionBuffer.itemSize = 3;
        parent.sVerPositionBuffer.numItems = 4;
    };
    
    this.draw = function(){
        parent.gl.viewport(0, 0, 
                            parent.gl.viewportWidth, parent.gl.viewportHeight);
                            
        parent.gl.clear(parent.gl.COLOR_BUFFER_BIT | parent.gl.DEPTH_BUFFER_BIT);
        
        mat4.perspective(45, parent.gl.viewportWidth / parent.gl.viewportHeight,
                            0.1, 100.0, parent.pMatrix);
                            
        mat4.identity(parent.mvMatrix);
        
        
        mat4.translate(parent.mvMatrix, [-1.5, 0.0, -7.0]);
        parent.gl.bindBuffer(parent.gl.ARRAY_BUFFER, parent.tVerPosBuffer);
        parent.gl.vertexAttribPointer(parent.shaderProgram.vertexPositionAttribute, parent.tVerPosBuffer.itemSize, parent.gl.FLOAT, false, 0, 0);
        parent.setMatrixUniforms();
        parent.gl.drawArrays(parent.gl.TRIANGLES, 0, parent.tVerPosBuffer.numItems);
        
        
        
        mat4.translate(parent.mvMatrix, [3.0, 0.0, 0.0]);
        parent.gl.bindBuffer(parent.gl.ARRAY_BUFFER, parent.sVerPositionBuffer);
        parent.gl.vertexAttribPointer(parent.shaderProgram.vertexPositionAttribute, parent.sVerPositionBuffer.itemSize, parent.gl.FLOAT, false, 0, 0);
        parent.setMatrixUniforms();
        parent.gl.drawArrays(parent.gl.TRIANGLE_STRIP, 0, parent.sVerPositionBuffer.numItems);
        
        
    };
    this.setMatrixUniforms = function() {
        parent.gl.uniformMatrix4fv(parent.shaderProgram.pMatrixUniform, false, parent.pMatrix);
        parent.gl.uniformMatrix4fv(parent.shaderProgram.mvMatrixUniform, false, parent.mvMatrix);
    }
};