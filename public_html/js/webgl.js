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
        this.program = null;
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
            var str = Shader.loadCode(path);
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
            Shader.program = parent.gl.createProgram();
            if(Shader.list.fragment === null) {//если шейдеры не заданы, то задаем стандартные
                Shader.list.fragment = {
                    "resources/shaders/fragment/shader-fs.sx" : false
                }
            }
            if(Shader.list.vertex === null) {//если шейдеры не заданы, то задаем стандартные
                Shader.list.vertex = {
                    "resources/shaders/vertex/shader-vs.sx" : false
                }
            }
            for(var type in Shader.list){
                for(var path in Shader.list[type]){
                    if(Shader.list[type][path] === false){
                        Shader.list[type][path] = Shader.Get(path, type);
                        parent.gl.attachShader(Shader.program, Shader.list[type][path]);
                    }
                }
            }
            parent.gl.linkProgram(Shader.program);
            if(!parent.gl.getProgramParameter(
                    Shader.program,
                    parent.gl.LINK_STATUS)){
                console.log("Could not initialise shaders for item:");
                console.log(parent);
                console.log('------------');
            }

            parent.gl.useProgram(Shader.program);
            for(var k in parent.Items.list){
                parent.Items.list[k].Shaders.Set(Shader.program);
            }
        };
        
        this.Init = function(){

            Shader.Load();
            parent.gl.useProgram(Shader.program);
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
            return Items.list[index];
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
                && Item.Texture.isSet) {
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
    
    this.Position = new(function(){
        this.coords = [0.0, 0.0, 0.0];
    });
    this.Textures = new (function(){
        var Textures = this;
        this.list = {};
        this.isLoaded = false;
        //проверку что все текстуры загрузились сделаем через счетчик
        //при каждой загрузке текстуры будем увеличивать счетчик, пока он не станет равен общему количеству текстур
        this.countLoaded = 0;
        this.count = 0;
        this.Add = function(path){
            this.list[path] = {
                isLoaded : false,
                texture : parent.gl.createTexture()
            };
            Textures.count = Object.keys(Textures.list).length;
            return Textures.list[path].texture;
            //console.log(Textures.count);
        };

        this.Load = function(callback){
            for(var k in Textures.list){
                console.log(k);
                var objTex = Textures.list[k];
                Textures.list[k].texture.image = new Image();
                Textures.list[k].texture.image.onload = function(){
                    Textures.list[k].isLoaded = true;
                    Textures.countLoaded++;

                    console.log('Texture "' + k + '" was loaded');
                    console.log('---------------');
                    if(Textures.countLoaded === Textures.count){
                        Textures.isLoaded = true;
                        console.log('All textures was loaded');
                        console.log('---------------');
                        callback();
                    }
                };
                Textures.list[k].texture.image.src = k;
            }
        };

        this.Exec = function(){
            for(var k in parent.Items.list){
                if(parent.Items.list[k].Texture.isSet) {
                    parent.Items.list[k].Texture.Bind();
                }
            }
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