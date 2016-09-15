var apigeeRepo=require('./modularRealIndex');
var firebase=require('firebase/firebase-node');
var libApigee=require('./libApigee');
var _=require('underscore');
var async=require('async');
var config = {
      databaseURL: "https://LLLLL",
      serviceAccount:"LLLLLLLLLLL.json"
    };
firebase.initializeApp(config);
var db=firebase.database();
function getDataFirebase(request,response)
{

   obtainLastChildRawNode(function (res)
	{
   console.log("llame al firebase");
   response.json(res);
  libApigee.obtainMetaData('usergrid_proxy',function(res2)
	{
	var proxies=res2["proxies"];
  	var count=0;
  	var objToSave={"proxies":{}};
	for (var p in proxies)
 	{
     	var bs= proxies[p]["metaData"]["basePath"];
     	var flows=proxies[p]["metaData"]["flows"];
     	var flowsByProxy={};
    	for (f in flows)
    	{
     	console.log("rawFLow"+f);
     	var clean_f=f.replace(/["/","\[","\]"]/g,"_");
     	console.log("clean"+clean_f);
    	var condition=flows[f]["Condition"];
    	flowsByProxy[clean_f]=condition;
    	}
  		objToSave["proxies"]["proxy"+count++]=
		{
          "basePath":bs,
          "flows":flowsByProxy,
          "rawData":JSON.stringify(res2)
    	}
 }
//  console.log("toSave"+JSON.stringify(objToSave));
  if (res.hasOwnProperty("tigoid_orm"))
	{
 	 var targets=res["tigoid_orm"]["target"]
   	objToSave["targets"]=targets;

	} else
  	{
    objToSave["targets"]="none";
  	}

  console.log(JSON.stringify(
	{     "proxies":objToSave["proxies"],
      "targets":objToSave["targets"]
   }));
	db.ref("apis").child("tigoid_orm").update({
      "proxies":objToSave["proxies"],
      "targets":objToSave["targets"]
   });

});
})


}

function replaceKeysFlows(f)
{
var newFlow=_.reduce(f, function(result, value, key) {
    key=key.replace(/["/","\[","\]"]/g,"_");
    result[key] = value;
    return result;
}, {});

return newFlow;
}
function getSaveTargets(request,response)
{

   saveStaticTargets("Tigo_Lend_API",function()
	{
   	console.log("se ha guardado en el api");
	});
}

function saveStaticTargets(apiName,cb)
{
	 libApigee.obtainTarget(apiName,function(result)
	{
	console.log("before SAVE"+JSON.stringify(result));
	try
	{
    	db.ref("apis").child(apiName).update({
     	"staticTargets":result["staticTargets"]
  	},function(err)
	{
  	if (err){
  	console.log("error para "+apiName +err);
  	}
 	else cb();
	});

	}

	catch(e)
	{
  	console.log(e);
  	console.log("imposible agregar"+apiName+JSON.stringify(e));
	}

	});
}
function getApiToFireBase(req,resp)
{
	var noPush=[];
	obtainChildRaw(function (res)
	{
	console.log("before ASYNC");
	async.forEach(Object.keys(res), function (item, callback){
//    console.log(item+"objcet"+JSON.stringify(res[item])); // print the key
	libApigee.obtainMetaData(item,function (res2)
	{
  	console.log(JSON.stringify(res2));
  	var proxies=res2["proxies"];
  	var count=0;
  	var revision=res2["revision"];
 	console.log("revision"+JSON.stringify(res2));
  	var objToSave={"proxies":{}};
	for (var p in proxies)
 	{
    var bs= proxies[p]["metaData"]["basePath"];
    var nFlows=replaceKeysFlows(proxies[p]["metaData"]["flows"]);
	proxies[p]["metaData"]["flows"]=nFlows;
   	var flows=proxies[p]["metaData"]["flows"];
    var flowsByProxy={};
    for (f in flows)
    {
	    var clean_f=f.replace(/["/"]/,"_");
    	  console.log("clean"+clean_f);
	    var condition=flows[f]["Condition"];
    	flowsByProxy[clean_f]=condition;
   }
  objToSave["proxies"]["proxy"+count++]={
          "basePath":bs,
          "flows":flowsByProxy
         // "rawData":res2
    }
 }
  if (res.hasOwnProperty(item))
	{
 	 var targets=res[item]["target"]
   	objToSave["targets"]=targets;
 	} else
  	{
    objToSave["targets"]="none";
  	}
  console.log("inserting api"+JSON.stringify(
   {     "proxies":objToSave["proxies"],
	      "targets":objToSave["targets"]
   }));
	try
	{
    	db.ref("apis").child(item).update({
     	"proxies":objToSave["proxies"],
     	"targets":objToSave["targets"],
     	"rawData":res2,
     	"revision":revision
  	},function(err)
	{
  		if (err){
  		console.log("error para "+item +err);
  	}
	});

}
	catch(e)
	{
  	noPush.push(item);
  	console.log("imposible agregar"+item+JSON.stringify(e));
	}
	saveStaticTargets(item,function()
	{
 		console.log("Se ha almacenado staticTarget" + item);
	});
	console.log("before iterate");
 	callback();
});

}, function(err) {
  	console.log("FIN DE INSERTIONS!!!");
 	console.log('iterating done');
    resp.json({"end":true});
	console.log("no se pudo agregar"+JSON.stringify(noPush));

});





/*
processApis.obtainMetaData(api,function (res2)
{

console.log("luego del metada");
var proxies=res2["proxies"];
var count=0;
var objToSave={"proxies":{}};
for (var p in proxies)
 {
     var bs= proxies[p]["metaData"]["basePath"];
     var flows=proxies[p]["metaData"]["flows"];
     var flowsByProxy={};
    for (f in flows)
    {
    var condition=flows[f]["Condition"];
    flowsByProxy[f]=condition;
    }
  objToSave["proxies"]["proxy"+count++]={
          "basePath":bs,
          "flows":flowsByProxy,
          "rawData":res2
    }


 }
  console.log(JSON.stringify(objToSave));
  var targets=res[api]["target"]
   objToSave["targets"]=targets;
   db.ref("apis").child(fakeApiName).update({
     "proxies":objToSave["proxies"],
     "targets":objToSave["targets"]
  });



})
*/

});

}//end function

function getInsertAllProducts(req,res)
{

   obtainAllProducts(function (results)
{

  
});


}

function callAppsByProduct(nameProduct,cb)
{

	libApigee.obtainProductById(nameProduct,function(result)
{
	
  

 	cb(result);



});	


}

function obtainAllApps(cb)
{

	libApigee.obtainAllApps(function (result)
{


  console.log(result);




});




}




function updateFireBaseProduct(product,ref)
{
  console.log(ref);
  console.log(JSON.stringify(product.name));
  ref.child(product.name).update({
     "name":product.data.name,
	 "createdBy":product.data.createdBy,
	 "apis":product.data.proxies

},function(err)
{
  if (err) console.log("error ingresar products"+err);
  console.log("agregado "+product.name);
});




}

function obtainAllProducts(cb)
{

  libApigee.obtainAllProducts(function (result)
{

  var refProducts=db.ref("products").push({"date":new Date().toString()});

  async.forEach(result,function(itemProduct,callback)
	{
	
        callAppsByProduct(itemProduct,function(result)
 	{

	    updateFireBaseProduct({"name":itemProduct,"data": result},refProducts,function(re)

{

	
     callback();

});


	});



	},function(err)
	{
     if (err) console.log("ocurió un error");
	else
	{
	console.log("iteracion concluida");


    }
}); 



});
}


function obtainChildRaw(cb)
{


/*
var ref = db.ref("rawNodeJS");
ref.once('value').then(function (snap)
{
  console.log("lei"+snap.numChildren());

});
  console.log("asdsa");
 cb({"a":"asdsa"});
*/
var ref=db.ref("rawNodeJS");
ref.orderByKey().limitToLast(1).once('value').then(function (snap)
{

 snap.forEach(function (child)
{
  apisObjects=child.exportVal();
  console.log("results");
  cb(apisObjects);

});

});
/*
ref.orderByKey().limitToLast(1).on("child_added", function(snap)
{
   console.log(snap.key);
});
*/
}

function testObtainRaw(cb)
{
var ref=db.ref("rawNodeJS");
ref.orderByKey().limitToLast(1).once('value').then(function (snap)
 {
console.log(snap.numChildren());
     snap.forEach(function (ch)
{
  console.log(ch.key);
});

});



}

function getObtainStats(req,resp)
{
  apigeeRepo.callStats(function (e,res)
  {
  	console.log(JSON.stringify(res));
	var pushRef=db.ref("rawNodeJS").push({"date":new Date().toString()});
   	console.log("ingresar al frebase");
    res.map(function (apiObject)
  	{
   	var obj=[];
   	apiObject["target"].map(function (t)
         {
            var c=t.country;
               console.log(c);
    		   obj.push({"country":c,"url":t.url});

        });
    if (Object.keys(obj).length <1)
    {
       obj.push({"country":"unknown","url":"empty"});
    }
     if (apiObject.api=="DisplayTransactionsVL1"){
  		console.log(JSON.stringify(apiObject));
		console.log("ingreso al firebase"+JSON.stringify(obj)+"-api:"+apiObject.api);
  	}
    pushRef.child(apiObject.api).set({
      target:obj

     }).then(function (snap)
    {
         console.log("agregado api rawNodeJS"+apiObject);
     }).catch(function (err)
      {
       console.log("error"+JSON.stringify(err) +"api"+apiObject);

       });
 });

//console.log("se ha agregado todos los request" +pushRef.key)
console.log("FIN-rawNodeJS");
 });



}




function mergeApisWithRawNode(apiName)
{

}




function obtainLastChildRawNode(cb)
{

db.ref('/rawNodeJS').orderByKey().limitToLast(1).once('value').then(function(snapshot) {

 snapshot.forEach(function (child)
{
  apisObjects=child.exportVal();
  console.log("results");
  cb(apisObjects);

});

});


}
module.exports=
{
	obtainLastChildFirebase:obtainLastChildRawNode,
	getDataFireBase:getDataFirebase,
	getStatsApigee:getObtainStats,
	getUploadApiData:getApiToFireBase,
	getSaveStaticTarget:getSaveTargets,
	getInsertProducts:getInsertAllProducts,
	obtainAllProducts:obtainAllProducts,
	obtainAllApps:obtainAllApps,
	obtainChildRaw:testObtainRaw
}






