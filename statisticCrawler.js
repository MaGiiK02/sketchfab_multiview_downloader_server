const http = require('axios');
const moment = require('moment');
const jStats = require('jstat');
const fs = require('fs');

const ClassStats = function (name) {
    return {
        "category" : name,

        "modelsCount" : 0,

        "likeAvg" : 0.0,
        "likeMedian": [],
        "likeMax" : 0,
        "likeMin" : 0,
        "likeTotal" : 0,

        "viewAvg" : 0.0,
        "viewMedian" : [],
        "viewMax" : 0,
        "viewMin" : 0,
        "viewTotal" : 0,

        "etaAvg" : 0.0,
        "etaMedian" : [],
        "etaMax" : 0,
        "etaMin" : 0,

        "avgVertex": 0.0,
        "avgfaces": 0.0,

    };
}

function urlFromSetting(settings, category) {
    return settings.baseUrl 
        + "search?type=models&processing_status=succeeded&animated=false&sound=false&categories=" 
        + category;
 }

function createStats(dataCollection, category){

    fs.writeFileSync( 
        path.join("./unprocesssed_statistics.json"), 
        JSON.stringify(dataCollection)
    );

    const stats = new ClassStats(category);
    stats.modelsCount = dataCollection.views.length;

    const likes = jStats(dataCollection.likes);
    stats.likeAvg = likes.mean();
    stats.likeMedian = likes.median();
    stats.likeMax = likes.max();
    stats.likeMin = likes.min();
    stats.likeTotal = likes.sum();

    const views = jStats(dataCollection.views);
    stats.viewAvg = views.mean();
    stats.viewMedian = views.median();
    stats.viewMax = views.max();
    stats.viewMin = views.min();
    stats.viewTotal = views.sum();

    const etas = jStats(dataCollection.etas);
        stats.etaAvg = etas.mean();
        stats.etaMedian = eta.median();
        stats.etaMax = eta.max();
        stats.etaMin = eta.min();
    
    const vertex = jStats(dataCollection.vertex);
    stats.avgVertex = vertex.mean();

    const faces = jStats(dataCollection.faces);
    stats.avgfaces = faces.mean();
    
    return stats;
}

function updateData(datas, elements) {
    for(var i=0; i<elements.length; i++){
        const el = elements[i];
        datas.views.push(el.viewCount);
        datas.likes.push(el.likeCount);
        datas.comments.push(el.commentCount);

        datas.vertex.push(el.vertexCount);
        datas.faces.push(el.faceCount);
        
        const now = new moment();
        const publishedAt = new moment(el.publishedAt);
        datas.etas.push(now.diff(publishedAt, 'days'));
    }
}

module.exports.getClassStats = (settings, category, onResult) => {

    const dataCollection = {
        "likes":[],
        "views":[],
        "vertex":[],
        "faces":[],
        //"annotations":[],  not provided by api
        "etas":[],
        "comments": []
    };
    var requestCount = 1;

    function manageResponse(response) {
        if(!response) {
            //some error
            onResult(null);
            return;
        }

        updateData(dataCollection, response.data.results);
        if(!response.data.next) {
            //all the data have been processed
            onResult(createStats(dataCollection, category));
            return;
        }

        setTimeout(() => {
            const url = response.data.next;
            requestCount++;
            console.log("RequestCount:", requestCount);
            http.get(url)
                .then(manageResponse)
                .catch(manageError);
        }, 100000);
 
    };

    function manageError(error) {
        console.log("TooMany Query at request:", requestCount);
        if (error.response.status == 429){
            setTimeout(() => {
                const url = error.response.config.url;
                http.get(url)
                    .then(manageResponse)
                    .catch(manageError);
            }, 3000);
            return;
        }
        onResult();
        console.log(error);
    }

    console.log("RequestCount:", requestCount);
    const url = urlFromSetting(settings, category);
    http.get(url)
        .then(manageResponse)
        .catch(manageError);
    
};