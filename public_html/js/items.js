/*
 * объекты для отрисовки
 * таким образом с ними проще работать
 * лучше отдельно задавать свойства объекта, а потом внутри ядра их обрабатывать
 * чем париться со сложной логикой
 */
var GLItem = function(wGL){
    var Parent = this;
    this.context = wGL;
    this.gl = this.context.gl;
    this.mvMatrix = mat4.create();
    this.pMatrix = mat4.create();
    this.nMatrix = mat3.create();

    this.Instance = function () {
        return Parent;
    };

    this.Context = function () {
        return Parent.context;
    }

    this.Matrix = new(function () {
        var Matrix = this;
        this.stack = [];

        this.Push = function(){
            var matrixObj = {
                mvMatrix : mat4.create(),
                pMatrix  : mat4.create(),
                rotate   : mat4.create(),
                nMatrix  : mat3.create()
            };
            mat4.set(Parent.mvMatrix, matrixObj.mvMatrix);
            mat4.set(Parent.pMatrix, matrixObj.pMatrix);
            mat4.set(Parent.Rotate.matrix, matrixObj.rotate);
            mat4.set(Parent.nMatrix, matrixObj.nMatrix);

            Matrix.stack.push(matrixObj);
            return Matrix;
        };

        this.Pop = function(){
            if (Matrix.stack.length == 0) {
                throw "Error pop matrix";
            };

            var matrixObj = Matrix.stack.pop();
            Parent.mvMatrix = matrixObj.mvMatrix;
            Parent.pMatrix = matrixObj.pMatrix;
            Parent.Rotate.matrix = matrixObj.rotate;
            Parent.nMatrix = matrixObj.nMatrix;
            return Matrix;
        };

        this.Instance = function(){
            return Parent;
        };
    });



    this.Shaders = new (function () {
        var Shaders = this;
        this.program = null;
        this.isInit = false;
        this.params = {
            'aVertexPosition' : true,
            'enableColor'     : false,
            'enableTexture'   : true,
            'enableLight'     : true,
            'enableBlend'     : true
        };


        this.Set = function(program){
            Parent.Shaders.program = program;
            return Shaders;
        };
        this.Exec = function(){
            /*
            * чекаем что установлен список вершин
            * */
            if(Parent.Vertices.isInit) {
                Shaders.program.vertexPositionAttribute = Parent.gl.getAttribLocation(Shaders.program, "aVertexPosition");
                Parent.gl.enableVertexAttribArray(Shaders.program.vertexPositionAttribute);

                if (Shaders.params.enableColor) {
                    Shaders.program.vertexColorAttribute = Parent.gl.getAttribLocation(Shaders.program, "aVertexColor");
                    Parent.gl.enableVertexAttribArray(Shaders.program.vertexColorAttribute);
                }

                if (Shaders.params.enableTexture && Parent.Texture.isSet) {
                    Shaders.program.textureCoordAttribute = Parent.gl.getAttribLocation(Shaders.program, "aTextureCoord");
                    Parent.gl.enableVertexAttribArray(Shaders.program.textureCoordAttribute);
                }

                if(Shaders.params.enableLight){
                    Shaders.program.vertexNormalAttribute = Parent.gl.getAttribLocation(Shaders.program, "aVertexNormal");
                    Parent.gl.enableVertexAttribArray(Shaders.program.vertexNormalAttribute);
                }


                Shaders.program.useColorUniform = Parent.gl.getUniformLocation(Shaders.program, "uUseColor");

                Shaders.program.pMatrixUniform = Parent.gl.getUniformLocation(Shaders.program, "uPMatrix");
                Shaders.program.mvMatrixUniform = Parent.gl.getUniformLocation(Shaders.program, "uMVMatrix");

                Shaders.program.useTextureUniform = Parent.gl.getUniformLocation(Shaders.program, "uUseTexture");
                Shaders.program.samplerUniforms = Parent.gl.getUniformLocation(Shaders.program, "uSampler");

                Shaders.program.nMatrixUniform = Parent.gl.getUniformLocation(Shaders.program, "uNMatrix");
                Shaders.program.useLightingUniform = Parent.gl.getUniformLocation(Shaders.program, "uUseLighting");
                Shaders.program.ambientColorUniform = Parent.gl.getUniformLocation(Shaders.program, "uAmbientColor");
                Shaders.program.lightingDirectionUniform = Parent.gl.getUniformLocation(Shaders.program, "uLightingDirection");
                Shaders.program.directionalColorUniform = Parent.gl.getUniformLocation(Shaders.program, "uDirectionalColor");

                Shaders.program.useBlendUniform = Parent.gl.getUniformLocation(Shaders.program, "useBlend");
                Shaders.program.alphaUniform = Parent.gl.getUniformLocation(Shaders.program, "uAlpha");
            }
            Shaders.isInit = true;
            return Shaders;
        };
        this.Instance = function(){
            return Parent;
        };
    });

    this.Normal = new(function(){
        var Normal = this;
        this.coords = [];
        this.numItems = 0;
        this.itemSize = 3;
        this.buffer = Parent.gl.createBuffer();
        this.isSet = false;

        this.Set = function(coords){
            Normal.coords = coords;

            Normal.numItems = parseInt(Normal.coords.length / Normal.itemSize);
            Normal.buffer.numItems = Normal.numItems;
            Normal.buffer.itemSize = Normal.itemSize;

            if(Parent.Shaders.params.enableLight) {
                Parent.gl.bindBuffer(Parent.gl.ARRAY_BUFFER, Normal.buffer);
                Parent.gl.bufferData(Parent.gl.ARRAY_BUFFER, new Float32Array(Normal.coords), Parent.gl.STATIC_DRAW);
            }

            Normal.isSet = true;
            return Normal;
        };

        this.Instance = function(){
            return Parent;
        };
    });

    this.Texture = new (function () {
        var Texture = this;
        this.texture = null;

        this.coords = [];
        this.indexes = [];

        this.indexBuffer = Parent.gl.createBuffer();

        this.numItems = 0;
        this.itemSize = 2;
        this.buffer = Parent.gl.createBuffer();
        this.isSet = false;

        this.Bind = function(){
            if(Parent.Shaders.params.enableTexture) {
                Parent.gl.bindTexture(Parent.gl.TEXTURE_2D, Texture.texture);

                Parent.gl.pixelStorei(Parent.gl.UNPACK_FLIP_Y_WEBGL, true);

                Parent.gl.texImage2D(
                    Parent.gl.TEXTURE_2D,
                    0,
                    Parent.gl.RGBA,
                    Parent.gl.RGBA,
                    Parent.gl.UNSIGNED_BYTE,
                    Texture.texture.image);

                Parent.gl.texParameteri(
                    Parent.gl.TEXTURE_2D,
                    Parent.gl.TEXTURE_MAG_FILTER,
                    Parent.gl.NEAREST);

                Parent.gl.texParameteri(
                    Parent.gl.TEXTURE_2D,
                    Parent.gl.TEXTURE_MIN_FILTER,
                    Parent.gl.NEAREST);
                Parent.gl.generateMipmap(Parent.gl.TEXTURE_2D);
                Parent.gl.bindTexture(Parent.gl.TEXTURE_2D, null);
            }
            return Texture;
        };

        this.Set = function(coords, texture){

            Texture.coords = coords;

            Texture.numItems = parseInt(Texture.coords.length / Texture.itemSize);
            Texture.buffer.numItems = Texture.numItems;
            Texture.buffer.itemSize = Texture.itemSize;
            Texture.isInit = true;

            Texture.texture = texture;

            if(Parent.Shaders.params.enableTexture) {

                Parent.gl.bindBuffer(Parent.gl.ARRAY_BUFFER, Texture.buffer);//buffer
                Parent.gl.bufferData(Parent.gl.ARRAY_BUFFER, new Float32Array(Texture.coords),Parent.gl.STATIC_DRAW);
            }

            if(texture && coords){
                Texture.isSet = true;
            }
            //Texture.Bind();
            return Texture;
        };

        this.Instance = function(){
            return Parent;
        };
    });

    this.Vertices = new (function(){
        var Vertices = this;
        this.coords = [];
        this.numItems = 0;
        this.itemSize = 3;
        this.buffer = Parent.gl.createBuffer();
        this.indexes = [];
        this.indexBuffer = Parent.gl.createBuffer();

        this.glType = null;
        this.isInit = false;
        this.Set = function(coords, glType){
            Vertices.coords = coords;
            Vertices.numItems = parseInt(Vertices.coords.length / Vertices.itemSize);
            
            Vertices.buffer.numItems = Vertices.numItems;
            Vertices.buffer.itemSize = Vertices.itemSize;
            
            if(Parent.Colors.coords.length === 0){
                var colors = [];
                for(var i=0;i < Vertices.buffer.numItems; i++){
                    colors = colors.concat([1.0, 0.0, 0.0, 1.0]);
                }
                Parent.Colors.Set(colors);
            }

            Vertices.indexes = [];
            for(var i = 1; i < Vertices.buffer.numItems - 1; i++){
                Vertices.indexes[Vertices.indexes.length] = 0;
                Vertices.indexes[Vertices.indexes.length] = i;
                Vertices.indexes[Vertices.indexes.length] = i + 1;
            }
            Vertices.indexBuffer.numItems = Vertices.indexes.length;
            Vertices.indexBuffer.itemSize = 1;

            //ставим координаты вершин
            Parent.gl.bindBuffer(Parent.gl.ARRAY_BUFFER,
                Vertices.buffer);

            Parent.gl.bufferData(Parent.gl.ARRAY_BUFFER,
                new Float32Array(Vertices.coords),
                Parent.gl.STATIC_DRAW);


            Parent.gl.bindBuffer(Parent.gl.ELEMENT_ARRAY_BUFFER,
                Vertices.indexBuffer);
            Parent.gl.bufferData(Parent.gl.ELEMENT_ARRAY_BUFFER,
                new Uint16Array(Vertices.indexes),
                Parent.gl.STATIC_DRAW);

            Vertices.glType = glType;
            Vertices.isInit = true;
            return Vertices;
        };

        this.Instance = function(){
            return Parent;
        };
    });
    this.Parameters = new (function () {
        var Parameters = this;
        this.Depth = new(function () {
            var Depth = this;
            this.params = {
                enabled : false
            };
            this.Enable = function () {
                Depth.params.enabled = true;
                return Depth;
            };
            this.Disable = function () {
                Depth.params.enabled = false;
                return Depth;
            };
            this.Parent = function () {
                return Parameters;
            };
        });

        this.Blend = new (function () {
            var Blend = this;
            this.params = {
                enabled : false,
                alpha : 0.5
            };

            this.Enable = function () {
                Blend.params.enabled = true;
                return Blend;
            };
            this.Disable = function () {
                Blend.params.enabled = false;
                return Blend;
            };
            this.Parent = function () {
                return Parameters;
            };
        });


        this.Instance = function(){
            return Parent;
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

            if(Parent.Shaders.params.enableColor) {
                //натягиваем цвет
                Parent.gl.bindBuffer(Parent.gl.ARRAY_BUFFER, Colors.buffer);
                Parent.gl.bufferData(Parent.gl.ARRAY_BUFFER, new Float32Array(Colors.coords), Parent.gl.STATIC_DRAW);
            }

            return Colors;
        };
        this.Instance = function(){
            return Parent;
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
            Parent.Vertices.Set(Parent.Vertices.coords, Parent.Vertices.glType);
            return Position;
        };
        
        this.Set = function(coords){  
            Position.coords[0] += coords[0];
            Position.coords[1] += coords[1];
            Position.coords[2] += coords[2];
            
            for(var i in Parent.Childs.list){
                Parent.Childs.list[i].Position.Set(coords);
            }
            return Position;
        };
        this.Instance = function(){
            return Parent;
        };
    });
    
    this.Rotate = new (function(){
        var Rotate = this;
        this.matrix = mat4.create();
        mat4.identity(this.matrix);
        
        this.angle = 0;
        this.coords = [0.0, 0.0, 0.0];
        this.rotates = [
            {
                angle : 0,
                coords : [0.0, 0.0, 0.0]
            },
            {
                angle : 0,
                coords : [0.0, 0.0, 0.0]
            },
            {
                angle : 0,
                coords : [0.0, 0.0, 0.0]
            }
        ];

        this.Clear = function(){
            Rotate.rotates = [
                {
                    angle : 0,
                    coords : [0.0, 0.0, 0.0]
                },
                {
                    angle : 0,
                    coords : [0.0, 0.0, 0.0]
                },
                {
                    angle : 0,
                    coords : [0.0, 0.0, 0.0]
                }
            ];
            return Rotate;
        };

        this.Set = function(angle, coords){
            angle = angle * Math.PI / 180;
            Rotate.angle = angle;
            Rotate.coords = coords;

            for(var i = 0; i < Rotate.coords.length; i++){
                if(coords[i] > 0) {
                    Rotate.rotates[i].angle = angle;
                    Rotate.rotates[i].coords = [0.0, 0.0, 0.0];
                    Rotate.rotates[i].coords[i] = coords[i];
                }
            }
            return Rotate;
        };
        this.Instance = function(){
            return Parent;
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
        this.Instance = function(){
            return Parent;
        };
    });
    
};