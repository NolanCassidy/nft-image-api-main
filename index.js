const express = require('express')
const path = require('path')
const moment = require('moment')
const { HOST } = require('./src/constants')
const db = require('./src/database')
const axios = require('axios');

const PORT = process.env.PORT || 5000

const app = express()
  .set('port', PORT)
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')

// Static public files
app.use(express.static(path.join(__dirname, 'public')))

app.get('/', function(req, res) {
  res.send('Get ready for NFT!');
})

app.get('/api/token/:token_id', function(req, res, next) {
  const tokenId = parseInt(req.params.token_id).toString()
  axios.get('https://api.etherscan.io/api?module=stats&action=tokensupply&contractaddress=0xbad6186E92002E312078b5a1dAfd5ddf63d3f731&apikey=N5UZBNT4F5H5NDNXF7QYSSPUBZ3UIM9HS3')
  .then(function (response) {
    // handle success
    console.log(response.result);
    if(response.result >= tokenId){
      const nft = db[tokenId]
      const  Description = nft.Description
      const data = {
        'description' : Description,
        'image': `${HOST}/${tokenId}.png`,
        'name': nft.name
      }
      res.send(data)
    }else{
      next('Stop digging around, you have nothing to find here.');
    }
  })
  .catch(function (error) {
    // handle error
    console.log(error);
    next(error);
  });

})

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
})
