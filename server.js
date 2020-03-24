const settings = require('./settings')
  , express = require('express')
  , server = express()
  , cors = require('cors')
  , multer = require('multer')
  , path = require('path')
  , fs = require('fs')
  , storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(settings.dataPath, req.params.uid))
    },
    filename: function (req, file, cb) {
      cb(null, file.fieldname)
    }
  }) 
  , uploader = multer({ storage: storage });

server.use(cors())

//create a server object:
server.post('/', uploader.single('view'), (request, response) => {
    try {
        const elementInfo = request.body;
        console.log(elementInfo);
        fs.mkdirSync(
            path.join(settings.dataPath, elementInfo.uid), 
            { recursive: true } 
        );
        fs.writeFileSync( 
            path.join(settings.dataPath, elementInfo.uid, "data.json"), 
            JSON.stringify(elementInfo) 
        );

    } catch (err) {
        console.error(err);
        response.status(400);
    }

    response.send({});
});


//upload image to the folder of the uid:
server.post('/:uid', uploader.single('view'), (request, response, next) => {
    const fileBase64 = request.body.view;
    const name = request.body.name.concat(".png");
    const uid =  request.params.uid;
    console.log(uid, name);

    let base64Image = fileBase64.split(';base64,').pop();
    fs.writeFileSync( 
        path.join(settings.dataPath, uid, name), 
        base64Image, 
        {encoding: 'base64'},
    );

    response.send({});
});

server.listen(settings.port, () => {
    console.log("Server listen on port", settings.port);
});