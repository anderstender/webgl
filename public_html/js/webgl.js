;var WebGL = function(){
   
    this.gl = null;
    var parent = this;
    
    this.mvMatrix = null;//mat4.create();
    this.pMatrix = null;//mat4.create();
    this.firstDraw = false;
    this.sceneParams = {
        angle : 45.0,
        front : 0.1,
        back  : 200
    };
    this.setSceneParam = function(key, value){
        parent.sceneParams[key] = value;
        return parent;
    };

    this.startRenderTime = false;
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
            console.info('Correct initialise WebGL.');
            console.info('---------------');
        }else{
            console.error('Could not initialise WebGL.');
            console.error('---------------');
            th
        }
        return parent;
    };
    this.shaderProgram = null;
    this.needShowFPS = true;

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
            var shElement = false;
            try {
                shElement = document.querySelector(path);
            } catch (e){}
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
                console.error(parent.gl.getShaderInfoLog(shader));
                return null;
            }else{
                console.info("Shader: ");
                console.info('   type: "' + type + '"');
                console.info('   path: "' + path + '"');
                console.info("correct compile");
                console.info('---------------');
            }
            return shader;
        };
        
        this.Add = function(path, type){
            if(Shader.list[type] === null){
                Shader.list[type] = {};
            }
            Shader.list[type][path] = false;
            return Shader;
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
                console.error("Could not initialise shaders for item:");
                console.error(parent);
                console.error('------------');
            }

            parent.gl.useProgram(Shader.program);
            for(var k in parent.Items.list){
                parent.Items.list[k].Shaders.Set(Shader.program);
            }

            return Shader;
        };
        
        this.Init = function(){

            Shader.Load();
            //parent.gl.useProgram(Shader.program);
            for(var i in parent.Items.list) {
                var item = parent.Items.list[i];
                item.Shaders.Exec();
            }

            return Shader;
        };

        this.Instance = function(){
            return parent;
        }
    });

    this.Lighting = new(function(){
        var Lighting = this;
        this.params = {
            directed :{
                color :{
                    ambient : [0.2, 0.2, 0.2],
                    direction : [0.8, 0.8, 0.8]
                },
                vector : [-0.25, -0.25, -1]
            },
            point :{
                color :{
                    ambient : [0.2, 0.2, 0.2],
                    direction : [0.8, 0.8, 0.8]
                },
                coord :[0.5,-1,-4]

            }
        };

        this.Directed = new (function(){
            var Directed = this;
            this.AmbientColor = function (vectColor) {
                Lighting.params.directed.color.ambient = vectColor;
                return Directed;
            };
            this.DirectionColor = function (vectColor) {
                Lighting.params.directed.color.direction = vectColor;
                return Directed;
            };
            this.Vector = function (vect) {
                Lighting.params.directed.vector = vect;
                return Directed;
            };
            this.Parent = function(){
                return Lighting;
            };
        });

        this.Instance = function(){
            return parent;
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
            return Items;
        };
        
        this.Rotate = function(angle, coords){
            for(var i in parent.Items.list) {
                parent.Items.list[i].Rotate.Set(angle, coords);
            }
            return Items;
        };
        
        
        this.Translate = function(coords){
            for(var i in parent.Items.list) {
                parent.Items.list[i].Position.Translate(coords);
            }
            return Items;
        };
        
        this.Draw = function(Item){
            mat4.perspective(parent.sceneParams.angle, parent.gl.viewportWidth / parent.gl.viewportHeight,
                            parent.sceneParams.front, parent.sceneParams.back, Item.pMatrix);
            mat4.identity(Item.mvMatrix);


            Item.Matrix.Push();
            mat4.translate(Item.mvMatrix, Item.Position.coords);

            for(var i = 0; i <  Item.Rotate.rotates.length; i++) {
                mat4.rotate(Item.Rotate.matrix, Item.Rotate.rotates[i].angle, Item.Rotate.rotates[i].coords);
                mat4.multiply(Item.mvMatrix, Item.Rotate.matrix);
            }

            parent.gl.bindBuffer(parent.gl.ARRAY_BUFFER,Item.Vertices.buffer);
            parent.gl.vertexAttribPointer(Item.Shaders.program.vertexPositionAttribute, Item.Vertices.buffer.itemSize, parent.gl.FLOAT, false, 0, 0);


            if(Item.Shaders.params.enableColor) {
                //натягиваем цвет
                //console.log(Item.Colors.buffer);
                parent.gl.bindBuffer(parent.gl.ARRAY_BUFFER,
                    Item.Colors.buffer);

                parent.gl.vertexAttribPointer(Item.Shaders.program.vertexColorAttribute,
                    Item.Colors.buffer.itemSize,
                    parent.gl.FLOAT,
                    false, 0, 0);
            }
            parent.gl.uniform1i(Item.Shaders.program.useColorUniform, Item.Shaders.params.enableColor);





            if(Item.Shaders.params.enableTexture
                && Item.Texture.isSet) {
                parent.gl.bindBuffer(parent.gl.ARRAY_BUFFER, Item.Texture.buffer);//buffer
                parent.gl.vertexAttribPointer(Item.Shaders.program.textureCoordAttribute, Item.Texture.buffer.itemSize, parent.gl.FLOAT, false, 0, 0);

                parent.gl.activeTexture(parent.gl.TEXTURE0);
                parent.gl.bindTexture(parent.gl.TEXTURE_2D, Item.Texture.texture);
                parent.gl.uniform1i(Item.Shaders.program.samplerUniform, 0);
            }
            parent.gl.uniform1i(Item.Shaders.program.useTextureUniform, Item.Shaders.params.enableTexture
                && Item.Texture.isSet);




            if(Item.Shaders.params.enableLight) {

                parent.gl.bindBuffer(parent.gl.ARRAY_BUFFER, Item.Normal.buffer);
                parent.gl.vertexAttribPointer(Item.Shaders.program.vertexNormalAttribute,
                    Item.Normal.buffer.itemSize,
                    parent.gl.FLOAT,
                    false, 0, 0);


                parent.gl.uniform3f(
                    Item.Shaders.program.ambientColorUniform,
                    parent.Lighting.params.point.color.ambient[0],
                    parent.Lighting.params.point.color.ambient[1],
                    parent.Lighting.params.point.color.ambient[2]
                );



                var adjustedLD = vec3.create();
                vec3.normalize(parent.Lighting.params.directed.vector, adjustedLD);
                vec3.scale(adjustedLD, -1);
                parent.gl.uniform3fv(Item.Shaders.program.lightingDirectionUniform, adjustedLD);

                parent.gl.uniform3f(
                    Item.Shaders.program.pointLightingColorUniform,
                    parent.Lighting.params.point.color.direction[0],
                    parent.Lighting.params.point.color.direction[1],
                    parent.Lighting.params.point.color.direction[2]
                );

                parent.gl.uniform3f(
                    Item.Shaders.program.pointLightingLocationUniform,
                    parent.Lighting.params.point.coord[0],
                    parent.Lighting.params.point.coord[1],
                    parent.Lighting.params.point.coord[2]
                );
            }
            parent.gl.uniform1i(Item.Shaders.program.useLightingUniform, Item.Shaders.params.enableLight);
            parent.gl.blendFunc(parent.gl.SRC_ALPHA, parent.gl.ONE);
            if(Item.Parameters.Depth.params.enabled) {
                parent.gl.enable(parent.gl.DEPTH_TEST);
            }else{
                parent.gl.disable(parent.gl.DEPTH_TEST);
            }

            parent.gl.uniform1f(Item.Shaders.program.useBlendUniform, Item.Parameters.Blend.params.enabled);
            if(Item.Parameters.Blend.params.enabled) {

                parent.gl.enable(parent.gl.BLEND);
                parent.gl.uniform1f(Item.Shaders.program.alphaUniform, Item.Parameters.Blend.params.alpha);
            }else{
                parent.gl.disable(parent.gl.BLEND);
            }

            parent.gl.bindBuffer(parent.gl.ELEMENT_ARRAY_BUFFER, Item.Vertices.indexBuffer);
            parent.Items.setMatUniform(Item);




            parent.gl.drawElements(
                parent.gl.TRIANGLES,
                Item.Vertices.indexBuffer.numItems,
                parent.gl.UNSIGNED_SHORT,
                0);
            Item.Matrix.Pop();
            return Items;
        };

        this.setMatUniform = function(Item){
            parent.gl.uniformMatrix4fv(Item.Shaders.program.pMatrixUniform, false, Item.pMatrix);
            parent.gl.uniformMatrix4fv(Item.Shaders.program.mvMatrixUniform, false, Item.mvMatrix);
            Item.nMatrix = mat3.create();
            mat4.toInverseMat3(Item.mvMatrix, Item.nMatrix);
            mat3.transpose(Item.nMatrix);
            parent.gl.uniformMatrix3fv(Item.Shaders.program.nMatrixUniform, false, Item.nMatrix);



            return Items;
        };
        this.Instance = function(){
            return parent;
        }
    });
    
    this.Position = new(function(){
        this.coords = [0.0, 0.0, 0.0];

        this.Instance = function(){
            return parent;
        }
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
            return Textures;
        };

        this.Get = function (path) {
            return Textures.list[path].texture;
        }
        this.Load = function(callback){
            for(var k in Textures.list){
                Textures.list[k].texture.image = new Image();
                Textures.list[k].texture.image.onload = function(){
                    Textures.list[k].isLoaded = true;
                    Textures.countLoaded++;

                    console.info('Texture "' + k + '" was loaded');
                    console.info('---------------');
                    if(Textures.countLoaded === Textures.count){
                        Textures.isLoaded = true;
                        console.info('All textures was loaded');
                        console.info('---------------');
                        callback();
                    }
                };

                Textures.list[k].texture.image.onerror = function(){
                    Textures.list[k].isLoaded = false;
                    Textures.countLoaded++;

                    console.error('Texture "' + k + '" load error');
                    console.error('---------------');
                    if(Textures.countLoaded === Textures.count){
                        Textures.isLoaded = true;
                        console.info('All textures was loaded');
                        console.info('---------------');
                        callback();
                    }
                };

                Textures.list[k].texture.image.src = k;
            }

            return Textures;
        };

        this.Exec = function(){
            for(var k in parent.Items.list){
                if(parent.Items.list[k].Texture.isSet) {
                    parent.Items.list[k].Texture.Bind();
                }
            }
            return Textures;
        };

        this.Instance = function(){
            return parent;
        };
    });
    this.m4 = new (function(){
        var m4 = this;
        this.Translate = function(coords){
            mat4.translate(parent.mvMatrix, coords);
            return m4;
        };
        this.Percpective = function(){
            mat4.perspective(parent.sceneParams.angle, parent.gl.viewportWidth / parent.gl.viewportHeight,
                            parent.sceneParams.front, parent.sceneParams.back, parent.pMatrix);

            return m4;
        };
        this.Identity = function(){
            mat4.identity(parent.mvMatrix);

            return m4;
        };

        this.Start = function(){
            parent.m4.Percpective();
            parent.m4.Identity();

            return m4;
        };

        this.Instance = function(){
            return parent;
        }
    });
    this.Draw = new (function(){
        var Draw = this;
        this.Start =  function(){
            parent.gl.clearColor(0.0, 0.0, 0.0, 1.0);

            
            parent.gl.viewport(0, 0, 
                            parent.gl.viewportWidth, parent.gl.viewportHeight);
                            
            parent.gl.clear(parent.gl.COLOR_BUFFER_BIT | parent.gl.DEPTH_BUFFER_BIT);
            parent.m4.Start();
            return Draw;
        };
        this.Exec = function(){
            if(parent.startRenderTime === false){
                parent.startRenderTime = (new Date()).getMilliseconds();
            }


            parent.Draw.Start();
            for(var i in parent.Items.list){
                parent.Items.Draw(parent.Items.list[i]);
            }
            return Draw;
        };

        this.Instance = function(){
            return parent;
        }
    });

    this.Animate = new (function(){
        var Animate = this;

        this.Instance = function(){
            return parent;
        }
    });
    this.setMatrixUniforms = function() {
        parent.gl.uniformMatrix4fv(parent.shaderProgram.pMatrixUniform, false, parent.pMatrix);
        parent.gl.uniformMatrix4fv(parent.shaderProgram.mvMatrixUniform, false, parent.mvMatrix)
        return parent;
    }
};