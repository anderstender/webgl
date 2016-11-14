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
            console.log('Correct initialise WebGL.');
            console.log('---------------');
        }else{
            console.log('Could not initialise WebGL.');
            console.log('---------------');
            return null;
        }
        

    };
    this.shaderProgram = null;
    this.shadersList = null;
    this.Shader = new (function(){
        var Shader = this;

        /*
         * path - либо селектор узла с шейдером, либо путь к файлу
         * сначала чекается как селектор,
         * если элемент не найден по селектору, то синхронным запросом пытается скачать файл
         * */
        this.loadCode = function(path){
            if(typeof path == 'undefined'){
                return null;
            }
            var strCode = null;
            var shElement = document.querySelector(path);
            if(shElement){
                strCode = "";
                var k = shElement.firstChild;
                while (k) {
                    if (k.nodeType == 3) {
                        strCode += k.textContent;
                    }
                    k = k.nextSibling;
                }
            }else {
                $.ajax({
                    async: false,
                    url: path,
                    success: function (data) {
                        if (data) {
                            strCode = data;
                        }
                    }
                });
            }
            return strCode;
        };

        /*
        * path - либо селектор узла с шейдером, либо путь к файлу
        * сначала чекается как селектор,
        * если элемент не найден по селектору, то синхронным запросом пытается скачать файл
        * */
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
            }else{
                console.log("Shader: ");
                console.log('   type: "' + type + '"');
                console.log('   path: "' + path + '"');
                console.log("correct compile");
                console.log('---------------');
            }
            return shader;
        };
        
        this.Add = function(path, type){
            if(Shader.list[type] === null){
                Shader.list[type] = {};
            }
            Shader.list[type][path] = false;
        };

        this.list = {
            'fragment' : null,
            'vertex'   : null
        };
        /*
         метод загружает шейдеры и устанавливает их на каждый элемент в зависимости от его настроек
         */
        this.Load = function(){
            if(parent.Shader.list.fragment === null) {//если шейдеры не заданы, то задаем стандартные
                parent.Shader.list.fragment = {
                    "resources/shaders/fragment/shader-fs.sx" : false
                }
            }
            if(parent.Shader.list.vertex === null) {//если шейдеры не заданы, то задаем стандартные
                parent.Shader.list.vertex = {
                    "resources/shaders/vertex/shader-vs.sx" : false
                }
            }

            for(var type in parent.Shader.list){
                var list = parent.Shader.list[type];
                for(var path in list){
                    var shader = list[path];
                    if(shader === false){
                        parent.Shader.list[type][path] = parent.Shader.Get(path, type);
                    }
                }
            }
            var program = parent.gl.createProgram();
            for(var i in parent.Items.list){
                var item = parent.Items.list[i];
                if(item.Shaders.list === null){
                    item.Shaders.Set("resources/shaders/fragment/shader-fs.sx", "fragment");
                    item.Shaders.Set("resources/shaders/vertex/shader-vs.sx", "vertex");
                }

                for(var path in item.Shaders.list){
                    var type = item.Shaders.list[path];
                    item.Shaders.Attach(parent.Shader.list[type][path], program);
                }
            }

        };
        
        this.Init = function(){

            Shader.Load();
            
            for(var i in parent.Items.list) {
                var item = parent.Items.list[i];
                item.Shaders.Exec();
            }
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
        this.rDraw = function(Item){


            mat4.perspective(parent.sceneParams.angle, parent.gl.viewportWidth / parent.gl.viewportHeight,
                            parent.sceneParams.front, parent.sceneParams.back, Item.pMatrix);
            mat4.identity(Item.mvMatrix);


            Item.Matrix.Push();
            mat4.translate(Item.mvMatrix, Item.Position.coords);

            for(var i = 0; i <  Item.Rotate.rotates.length; i++) {
                mat4.rotate(Item.Rotate.matrix, Item.Rotate.rotates[i].angle, Item.Rotate.rotates[i].coords);
                mat4.multiply(Item.mvMatrix, Item.Rotate.matrix);
            }

            if(Item.Shaders.params.aVertexPosition) {
                //ставим координаты вершин
                parent.gl.bindBuffer(parent.gl.ARRAY_BUFFER,
                    Item.Vertices.buffer);

                parent.gl.bufferData(parent.gl.ARRAY_BUFFER,
                    new Float32Array(Item.Vertices.coords),
                    parent.gl.STATIC_DRAW);

                parent.gl.vertexAttribPointer(Item.Shaders.program.vertexPositionAttribute,
                    Item.Vertices.buffer.itemSize,
                    parent.gl.FLOAT, false, 0, 0);

            }
            if(Item.Shaders.params.aVertexColor) {
                //натягиваем цвет
                parent.gl.bindBuffer(parent.gl.ARRAY_BUFFER,
                    Item.Colors.buffer);

                parent.gl.bufferData(parent.gl.ARRAY_BUFFER,
                    new Float32Array(Item.Colors.coords),
                    parent.gl.STATIC_DRAW);


                parent.gl.vertexAttribPointer(Item.Shaders.program.vertexColorAttribute,
                    Item.Colors.buffer.itemSize,
                    parent.gl.FLOAT,
                    false, 0, 0);

            }

            if(Item.Shaders.params.aTextureCoord
                && Item.Shaders.params.uSampler
                && Item.Texture.isLoad
                && Item.Texture.isInit) {

                parent.gl.bindBuffer(
                    parent.gl.ARRAY_BUFFER,
                    Item.Texture.buffer);//buffer

                parent.gl.bufferData(
                    parent.gl.ARRAY_BUFFER,
                    new Float32Array(Item.Texture.coords),
                    parent.gl.STATIC_DRAW);

                parent.gl.vertexAttribPointer(
                    Item.Shaders.program.textureCoordAttribute,
                    Item.Texture.buffer.itemSize,
                    parent.gl.FLOAT, false, 0, 0);

                parent.gl.bindBuffer(
                    parent.gl.ELEMENT_ARRAY_BUFFER,
                    Item.Texture.indexBuffer);//indexBuffer

                parent.gl.bufferData(
                    parent.gl.ELEMENT_ARRAY_BUFFER,
                    new Uint16Array(Item.Texture.indexes),
                    parent.gl.STATIC_DRAW);

                parent.gl.activeTexture(parent.gl.TEXTURE0);

                parent.gl.bindTexture(
                    parent.gl.TEXTURE_2D,
                    Item.Texture.texture);
                parent.gl.uniform1i(
                    Item.Shaders.program.samplerUniform,
                    0);
            }
            parent.Items.setMatUniform(Item);
            if(Item.Shaders.params.aTextureCoord) {
                parent.gl.drawElements(
                    parent.gl.TRIANGLES,
                    Item.Texture.indexBuffer.numItems,
                    parent.gl.UNSIGNED_SHORT,
                    0);
            }else {
                parent.gl.drawArrays(
                    Item.Vertices.glType,
                    0,
                    Item.Vertices.buffer.numItems);
            }


            for(var i in Item.Childs.list){
                parent.Items.rDraw(Item.Childs.Get(i));
            }

            Item.Matrix.Pop();
        };
        
        this.Draw = function(index){
            var Item = parent.Items.Get(index);
            parent.Items.rDraw(Item);
        };
        
        this.setMatUniform = function(Item){
            //var Item = parent.Items.Get(index);
            parent.gl.uniformMatrix4fv(Item.Shaders.program.pMatrixUniform, false, Item.pMatrix);
            parent.gl.uniformMatrix4fv(Item.Shaders.program.mvMatrixUniform, false, Item.mvMatrix);
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