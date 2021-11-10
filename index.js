const express = require('express')
const path = require('path')
const moment = require('moment')
const { HOST } = require('./src/constants')
const db = require('./src/database')
const axios = require('axios');

const PORT = process.env.PORT || 5000
var supplyCache = 0;
var lastApiCall = new Date();

const app = express()
  .set('port', PORT)
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')

// Static public files
app.use(express.static(path.join(__dirname, 'public')))

app.get('/', function(req, res) {
  res.send('Meta Llama API');
})

app.get('/api/image/:token_id', function(req, res) {
  const tokenId = parseInt(req.params.token_id).toString();
  if(parseInt(supplyCache) >= parseInt(tokenId)){
    try{
      var base64Img = require('base64-img');
      var imageData1 = base64Img.base64Sync(`views/images/${tokenId}.png`);
      var base64Data = imageData1.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
      var img = Buffer.from(base64Data, 'base64');

      res.writeHead(200, {
        'Content-Type': 'image/png',
        'Content-Length': img.length
      });
      res.end(img);
    } catch (err){
      res.status(404).send('Please try again soon that token was not found yet.');
    }
  }else{
    res.status(404).send('This nft does not exist yet.');
  }
})

app.get('/api/token/:token_id', function(req, res, next) {
  const tokenId = parseInt(req.params.token_id).toString()
    // console.log(tokenId)
    // console.log(supplyCache)
  if(parseInt(supplyCache) < parseInt(tokenId)){
    let now = new Date();
    var seconds = (now.getTime() - lastApiCall.getTime()) / 1000;
    if(seconds >= 1){
      // console.log("Seconds: " + seconds);
      axios.get('https://api.etherscan.io/api?module=stats&action=tokensupply&contractaddress=0xbad6186E92002E312078b5a1dAfd5ddf63d3f731&apikey=N5UZBNT4F5H5NDNXF7QYSSPUBZ3UIM9HS3')
      .then(function (response) {
        // handle success
        // console.log('Not Cached')
        // console.log(response.data.result);
        lastApiCall = now;
        supplyCache = response.data.result;
        if(response.data.result >= tokenId){
          const nft = db[tokenId]
          const  Description = nft.Description
          const data = {
            'description' : Description,
            'image': `${HOST}/${tokenId}.png`,
            'name': nft.name
          }
          res.send(data)
        }else{
          res.status(404).send('Stop digging around, you have nothing to find here.');
        }
      })
      .catch(function (error) {
        // handle error
        // console.log(error);
        res.status(404).send('This contract or token does not exist.');
      });
    }else{
      res.status(404).send('Stop digging around, you have nothing to find here!');
    }
  }else{
    // console.log('Cached');
    const nft = db[tokenId]
    const  Description = nft.Description
    const data = {
      'description' : Description,
      'image': `${HOST}/${tokenId}.png`,
      'name': nft.name
    }
    res.send(data)
  }

})

app.listen(app.get('port'), function() {
  axios.get('https://api.etherscan.io/api?module=stats&action=tokensupply&contractaddress=0xbad6186E92002E312078b5a1dAfd5ddf63d3f731&apikey=N5UZBNT4F5H5NDNXF7QYSSPUBZ3UIM9HS3')
  .then(function (response) {
    supplyCache = response.data.result;
  })
  .catch(function (error) {
    console.error('This contract or token does not exist.');
  });
  console.log('Node app is running on port', app.get('port'));
})
