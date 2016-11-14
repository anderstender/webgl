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


    this.Matrix = new(function () {
        var Matrix = this;
        this.stack = [];

        this.Push = function(){
            var copy = mat4.create();

            var matrixObj = {
                mvMatrix : mat4.create(),
                pMatrix  : mat4.create(),
                rotate   : mat4.create()
            };
            mat4.set(Parent.mvMatrix, matrixObj.mvMatrix);
            mat4.set(Parent.pMatrix, matrixObj.pMatrix);

            mat4.set(Parent.Rotate.matrix, matrixObj.rotate);
            Matrix.stack.push(matrixObj);
        };

        this.Pop = function(){
            if (Matrix.stack.length == 0) {
                throw "Error pop matrix";
            };

            var matrixObj = Matrix.stack.pop();
            Parent.mvMatrix = matrixObj.mvMatrix;
            Parent.pMatrix = matrixObj.pMatrix;

            Parent.Rotate.matrix = matrixObj.rotate;
        };
    });



    this.Shaders = new (function () {
        var Shaders = this;
        this.program = Parent.gl.createProgram();

        this.list = null;
        this.Set = function(path, type, callback){
            if(Shaders.list === null){
                Shaders.list = {};
            }
            Shaders.list[path] = type;
            Shaders.isInit = true;

            if(typeof callback === "function"){
                callback();
            }
        };
        this.isInit = false;
        this.params = {
            //параметры для передачи вершин в шейдеры
            'aVertexPosition' : true,
            'aVertexColor'    : false,
            'aTextureCoord'   : true,

            //параметры для передачи матриц
            'uPMatrix'  : true,//
            'uMVMatrix' : true,
            'uSampler'  : true
        };


        this.Attach = function(shader, program){
            Shaders.program = program;
            Parent.gl.attachShader(Shaders.program, shader);
        };
        this.Exec = function(){
            Parent.gl.linkProgram(Shaders.program);
            if(!Parent.gl.getProgramParameter(
                    Shaders.program,
                    Parent.gl.LINK_STATUS)){
                console.log("Could not initialise shaders for item:");
                console.log(Parent);
                console.log('------------');
            }

            Parent.gl.useProgram(Shaders.program);
            /*
            * чекаем что установлен список вершин
            * */
            if(Parent.Vertices.isInit) {
                if (Shaders.params.aVertexPosition) {
                    Shaders.program.vertexPositionAttribute = Parent.gl.getAttribLocation(Shaders.program, "aVertexPosition");
                    Parent.gl.enableVertexAttribArray(Shaders.program.vertexPositionAttribute);
                }
                if (Shaders.params.aVertexColor) {
                    Shaders.program.vertexColorAttribute = Parent.gl.getAttribLocation(Shaders.program, "aVertexColor");
                    Parent.gl.enableVertexAttribArray(Shaders.program.vertexColorAttribute);
                }
                if (Shaders.params.aTextureCoord
                    && Shaders.params.uSampler
                    && Parent.Texture.isInit) {
                    Shaders.program.textureCoordAttribute = Parent.gl.getAttribLocation(Shaders.program, "aTextureCoord");
                    Parent.gl.enableVertexAttribArray(Shaders.program.textureCoordAttribute);
                }


                if (Shaders.params.uPMatrix) {
                    Shaders.program.pMatrixUniform = Parent.gl.getUniformLocation(Shaders.program, "uPMatrix");
                }

                if (Shaders.params.uMVMatrix) {
                    Shaders.program.mvMatrixUniform = Parent.gl.getUniformLocation(Shaders.program, "uMVMatrix");
                }

                if (Shaders.params.aTextureCoord
                    && Shaders.params.uSampler
                    && Parent.Texture.isInit) {
                    Shaders.program.samplerUniforms = Parent.gl.getUniformLocation(Shaders.program, "uSampler");
                }
            }
            Shaders.isInit = true;
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
        this.isInit = false;
        this.isLoad = false;
        this.Load = function (path, callback) {
            Texture.texture = Parent.gl.createTexture();
            Texture.texture.image = new Image();
            Texture.isLoad = false;
            Texture.texture.image.onload = function () {
                Texture.loadHandler();
                if(typeof callback === 'function') {
                    callback();
                };

                console.log('Texture "' + path + '" was loaded');
                console.log('---------------');
            }

            Texture.texture.image.src = path;
        };

        this.loadHandler = function(){
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

            Parent.gl.bindTexture(Parent.gl.TEXTURE_2D, null);
            Texture.isLoad = true;
        };

        this.Set = function(coords){
            Texture.coords = coords;
            Texture.numItems = parseInt(Texture.coords.length / Texture.itemSize);

            Texture.buffer.numItems = Texture.numItems;
            Texture.buffer.itemSize = Texture.itemSize;

            Texture.indexes = [];
            for(var i = 0; i < Texture.buffer.numItems - 1; i++){
                Texture.indexes[Texture.indexes.length] = 0;
                Texture.indexes[Texture.indexes.length] = i;
                Texture.indexes[Texture.indexes.length] = i + 1;
            }
            Texture.indexBuffer.numItems = Texture.indexes.length;
            Texture.indexBuffer.itemSize = 1;
            Texture.isInit = true;
        };
    });

    this.Vertices = new (function(){
        var Vertices = this;
        this.coords = [];
        this.numItems = 0;
        this.itemSize = 3;
        this.buffer = Parent.gl.createBuffer();
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
                    colors = colors.concat([1.0, 1.0, 1.0, 1.0]);
                }
                Parent.Colors.Set(colors);
            }
            
            Vertices.glType = glType;
            Vertices.isInit = true;
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