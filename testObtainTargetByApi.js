var libFirebase=require('./libFirebase');
var async=require('async');
var request=require('request');
var fs = require('fs');

var fileToWrite='write/checkTlsAllProductsTestParsingTab.txt';
 //testNoRegisteredApi('tigo_mobile_gt_atpa_v3');
obtainProducts();
function testNoRegisteredApi(apiName)
{
libFirebase.obtainApiById(apiName,function(err,result)
 {
  if (err) console.log("ERROR" + err);
  else
   console.log(result);
 });
}

function obtainProducts()
{

  libFirebase.obtainProductsFirebase(function  (result)
{
  var products=result;
  var arrayProducts=[products['ATPA - Arma tu plan'],products['drupal-proxy']];
   console.log(JSON.stringify(products));
   console.log(Object.keys(products));
  var nameProducts=Object.keys(products);
  async.eachSeries(nameProducts,function(item,callback)
  //async.eachSeries(arrayProducts,function(item,callback)
{
  console.log(item);
 // var productName=arrayProducts[item]["name"];
var productName=products[item]["name"]; 
var apis=products[item]["apis"]
 console.log("APIS"+JSON.stringify(apis));

/*
fs.appendFile(fileToWrite,'================================\nProduct: \t\n'+productName+'\napis:'+JSON.stringify(apis)+'\n-----------------------\n', function (err)
{
   
});
*/

  if (apis) 
 processApisByProducts(apis,callback,productName);
 else
  callback();

},function(err)
{
  console.log("procesado todos los productos");

});

  



});



}

function processApisByProducts(apis,cb,productName)
{
  console.log("allapis"+JSON.stringify(apis));
 // var apisFake=['tigo_mobile_gt_atpa_v2','tigo_mobile_gt_smartapps_v2','tigo_mobile_gt_crm_v2'];

  async.each(Object.keys(apis),function(item,callback)
{

   var api=apis[item];
  // var api=item;
   obtainInfoApi(api,callback,productName);
 


},function(err)
{
 console.log("TERMINADO EL PRODUCT["+productName+"]");
 cb();
});


}

function obtainInfoApi(apiName,cb,productName)
{

libFirebase.obtainApiById(apiName,function(err,result)
{

 //console.log(Object.keys(result['0']));

  if (err) {
    console.log("no traje el api"+apiName);
    cb();
}
  else
  {

 //fs.appendFile(fileToWrite,'\t'+apiName+'\n');
 async.each(Object.keys(result),function(item,callback)
{
 
    console.log(JSON.stringify(result[item]));	
    if (result[item].hasOwnProperty("wsdl"))
  {

//   console.log("Pedire WSDL"+result[item]["url"]);
    checkTslValid(result[item]["url"],callback,{"apiName":apiName ,"productName":productName,"country":result[item]["country"]});
}
else
{
 console.log("no hubo wsdl,no es soap call");
 callback();
}


},function (err)
{
  console.log("api %s analizado",apiName);
  cb();
}


);

 }
});
}

function checkTslValid(url,cb,obj)
{


 async.series({

   tls1_2:function(callback)
   {
   var statusCode=null;
   request
  .get('https://qa.api.tigo.com/v1/tigo/test/tls?url='+url+'&tls=1.2')
  .on('response', function(response) {
  //  console.log(response.statusCode) // 200
    statusCode=response.statusCode;
  })
  .on('end',function(){

    callback(null,statusCode);
});

 
  },
 tls1:function(callback)
{

var statusCode=null;
   request
  .get('https://qa.api.tigo.com/v1/tigo/test/tls?url='+url+'&tls=1')
  .on('response', function(response) {
  //  console.log(response.statusCode) // 200
    statusCode=response.statusCode;
  })  
  .on('end',function(){

    callback(null,statusCode);
});



},
  default:function(callback)
	{
   var statusCode=null;
  request
  .get('https://qa.api.tigo.com/v1/tigo/test/tls?url='+url)
  .on('response', function(response) {
  //  console.log(response.statusCode) // 200
	statusCode=response.statusCode;  
})  
  .on('end',function(){
  //  console.log("ya lo llamamos");
    callback(null,statusCode);
});
    
}

},function(err,result)
{
  console.log(JSON.stringify(result));

  for (var index in result)
  {

     fs.appendFile(fileToWrite,obj.productName+"\t"+obj.apiName+"\t"+obj.country+"\t"+url+"\t"+index+"\t"+result[index]+"\n");

  }
/*
  {
  "tls1":200,
  "tls2":500,
"default":500

 }
*/
//  fs.appendFile(fileToWrite,JSON.stringify({"url":url,"result":result})+'\n');
 
  console.log(JSON.stringify({"url":url,"result":result}));
  cb();
});


}
