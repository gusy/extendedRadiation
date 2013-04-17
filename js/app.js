     var map;
	  var map2;
	  var JsonCounties;
	  var markerArrays = new Array();
	  var cev=0;
	  var zev=0;
	  $(document).ready(function(){
	  	initialize()
	  });
      function initialize() {
        var mapOptions = {
          zoom: 4,
          center: new google.maps.LatLng(40.8,-95.3),
          mapTypeId: google.maps.MapTypeId.TERRAIN
        };
        map = new google.maps.Map(document.getElementById('map_canvas'),
              mapOptions);
       
	    map2 = new google.maps.Map(document.getElementById('map_canvas2'),
	          mapOptions);
	    google.maps.event.addListener(map2,'click',function(event) {
           findCounty(event.latLng.lat(), event.latLng.lng())
    	});
	    google.maps.event.addListener(map,'click',function(event) {
           findCounty(event.latLng.lat(), event.latLng.lng())
    	});
    	google.maps.event.addListener(map, 'center_changed', function() {
    		if(cev==0){
    			cev++;   	//Semaphores to avoid infinity recursion on changes
   				map2.setCenter(map.getCenter());
   				
   			}else{
   				cev--;
   			}	
  		});
  		google.maps.event.addListener(map2, 'center_changed', function() {
   			if(cev==0){
   					cev++;
   				map.setCenter(map2.getCenter());

   			
   			}else{
   				cev--;
   			}
  		});
  		google.maps.event.addListener(map, 'zoom_changed', function() {

    		if(zev==0){
    			zev++;
   				map2.setZoom(map.getZoom());
   				cev++;
   				map2.setCenter(map.getCenter());
   				
   			}else{
   				zev--;
   			}	
  		});
  		google.maps.event.addListener(map2, 'zoom_changed', function() {
   			if(zev==0){
   				zev++;
   				map.setZoom(map2.getZoom());
   				cev++;
   				map.setCenter(map2.getCenter());
   			
   			}else{
   				zev--;
   			}
  		});
		AddStates();		
		loadCounty();
      }
      function findCounty(lat,lng){
      	var lat=lat;
      	var lng=lng;
      	console.log(lat+","+lng);
      	$.ajax(
      		{
      		type:"GET",
      		url:"http://maps.googleapis.com/maps/api/geocode/json?language=en&latlng="+lat+","+lng+"&sensor=false",
      		dataType:"json",
      		success:function(data){
      			var x=data;
      			var state;
      			var county;
      			$.each(x.results,function(idx,val){
      				$.each(val.address_components,function(id,val2){
      					$.each(val2.types,function(i,type){
							if(type=="administrative_area_level_2"){
								county=val2.short_name;
							}
      						if(type=="administrative_area_level_1"){
								state=val2.short_name;
							}
      					});
      				});
      			});
      			var sid;
      			var snames=state_name_id;
      			$.each(snames,function(id,st){
      				if(st.Abbr==state){
      					sid=st.id;
      				}
      			});
      			console.log(county+","+state)

      			$("#StateList").val(sid);
      			loadCounty();
      			var cid;
      			var cnames=county_info;
      			$.each(cnames,function(id,ct){
      				if(ct.state==sid){
	      				if(ct.name==county){
	      					cid=ct.index;
	      					console.log(ct.name+","+cid);
	      				}
      				}
      			});
      			$("#CountyList").val(cid);
      			$("#display").html("<strong>Census data</strong> fluxes out of "+county+","+state);
      			$("#display2").html("<strong>Extended Radiation</strong> fluxes out of "+county+","+state);
      			displayData();
      		}
      	});
      		
      }
	  
	  function AddStates(){
	    for (var i=0;i<state_name_id.length;i++){
		  AddItem(state_name_id[i].Abbr,state_name_id[i].id,"StateList");
		}
	  }

      function AddItem(Text,Value,DropID)
      {
        // Create an Option object
        var opt = document.createElement("option");  
        // Add an Option object to Drop Down/List Box
        document.getElementById(DropID).options.add(opt);
        // Assign text and value to Option object
        opt.text = Text;
        opt.value = Value;        
      }
	  
	  function removeOptions(selectbox)
	    {
		  var i;
		  for(i=selectbox.options.length-1;i>=0;i--)
		  {
			selectbox.remove(i);
		  }
	    }

	  function loadCounty(){
	    var state_list=document.getElementById("StateList");
	    var state_id=state_list.options[state_list.selectedIndex].value;
		removeOptions(document.getElementById("CountyList"));
		for (var i=0;i<county_info.length;i++){
		  if (county_info[i].state==state_id){
		    AddItem(county_info[i].name,county_info[i].index,"CountyList");
		  }
		}
	  }
	  
	 /**   function ajaxLoad(url,callback,plain) {
			var http_request = false;
			if (window.XMLHttpRequest) { // Mozilla, Safari, ...
				http_request = new XMLHttpRequest();
				if (http_request.overrideMimeType && plain) {
					http_request.overrideMimeType('text/plain');
				}
			} else if (window.ActiveXObject) { // IE
				try {
					http_request = new ActiveXObject("Msxml2.XMLHTTP");
				} catch (e) {
					try {
						http_request = new ActiveXObject("Microsoft.XMLHTTP");
					} catch (e) {}
				}
			}
			if (!http_request) {
				alert('Giving up :( Cannot create an XMLHTTP instance');
				return false;
			}
			http_request.onreadystatechange =  function() {
				if (http_request.readyState == 4) {
					if (http_request.status == 200) {
						eval(callback(http_request));
					}
					else {
						alert('Request Failed: ' + http_request.status);
					}
				}
			};
			http_request.open('GET', url, true);
			http_request.send(null);
	    }
		**/
		function makePolygon(processedData,temp_color,input_map){
		  var first_lat=processedData[1];
		  var first_lng=processedData[0];
		  var data_length=processedData.length;
		  var path = []; 
		  var ll = new google.maps.LatLng(processedData[1],processedData[0]);
		  path.push(ll);
		  var bounds = new google.maps.LatLngBounds();
		  for (var j = 2; j < data_length; j=j+2){
            var ll = new google.maps.LatLng(processedData[j+1],processedData[j]);
			bounds.extend(ll);
		    path.push(ll);
			if (processedData[j+1]==first_lat&&processedData[j]==first_lng){// the end of one loop
		      if (j<processedData.length-5){
			    //var new_data=processedData.slice(j,data_length);
				//makePolygon(new_data);
				//break
			  }
			}
		  }
		  var poly = new google.maps.Polygon({ 
		    paths: path, 
		    strokeColor: poly_color[temp_color], 
		    strokeOpacity: 0.8, 
		    strokeWeight: 1, 
		    fillColor: poly_color[temp_color], 
		    fillOpacity: 0.75, 
		  }); 
		  poly.setMap( input_map );
		  if (Number(temp_color)==8){
		    input_map.setCenter(bounds.getCenter());
			input_map.setZoom(5);
		  }
		  markerArrays.push(poly);
		  return;
		}
		
		
		function MultiPolygon2Polygon(multipolygon,temp_color,input_map) {
			//alert(multipolygon.coordinates.length);
			for (var i=0; i<multipolygon.coordinates.length; i++) {
				var path = [];
				//alert(multipolygon.coordinates[i][0].length);
				var bounds = new google.maps.LatLngBounds();
				for (var j=0; j<multipolygon.coordinates[i][0].length; j++) {
				//alert(multipolygon.coordinates[i][0][j][1]);
					var point =new google.maps.LatLng(multipolygon.coordinates[i][0][j][1],multipolygon.coordinates[i][0][j][0]);
					bounds.extend(point);
					path.push(point);
				}
				var poly = new google.maps.Polygon({
					paths: path,
					strokeColor: poly_color[temp_color],
					strokeOpacity: 0.8,
					strokeWeight: 1,
					fillColor: poly_color[temp_color],
					fillOpacity: 0.75,
				});
				poly.setMap( input_map );
				markerArrays.push(poly);
				//var content = multipolygon.Message[i][0];
				//popupDirections(polygon,content);
			}
			if (Number(temp_color)==8){
		      input_map.setCenter(bounds.getCenter());
			  input_map.setZoom(5);
		    }
		}
	  
	  
	  function processAjaxResult(data) {
		//alert(request.responseText); //<---- your data is now here!
		var results = data;
		var result_length=results.features.length;
		//alert(results.features[5].geometry.coordinates);
		var county_list=document.getElementById("CountyList");
	    var county_id=county_list.options[county_list.selectedIndex].value;
		
		//get the flows for real od
		var i=Number(first_index[county_id-1]);
		var i_j_od=od_in_line[i].split(",");
		var temp_flow=new Array();
		var temp_flow_count=0;
		var max_flow=0;
		while (i_j_od[0]==county_id){
		  temp_flow[temp_flow_count]=Math.log(Number(i_j_od[2]));
		  if (Math.log(Number(i_j_od[2]))>max_flow&&i_j_od[1]!=county_id){
		    max_flow=Math.log(Number(i_j_od[2]));
		  }
		  if (i_j_od[1]==county_id){
		    temp_flow[temp_flow_count]=-1;
		  }
		  temp_flow_count=temp_flow_count+1;
		  if (i<od_in_line.length-1){
		    i=i+1;
		    i_j_od=od_in_line[i].split(",");
		  }
		  else{
		    break;
		  }
		}
		var temp_color=new Array();
		for (var i=0;i<temp_flow.length;i++){
		  if (temp_flow[i]>=0){
		    temp_color[i]=Math.floor(temp_flow[i]*7/max_flow);
		  }
		  else{
		    temp_color[i]=8;
		  }
		}
		var i=Number(first_index[county_id-1]);
		var i_j_od=od_in_line[i].split(",");
		temp_flow_count=0;
		while (i_j_od[0]==county_id){
		  //alert(i);
		  var coords = String(results.features[i_j_od[1]-1].geometry.coordinates);
		  //alert(coords);
		  if(results.features[i_j_od[1]-1].geometry.type=="Polygon"){
			var processedData = coords.split(",");
			//alert(processedData.slice(1,3));
			makePolygon(processedData,temp_color[temp_flow_count],map);
		  }
		  else{
		  //alert(results.features[i].geometry.coordinates.length);
			  MultiPolygon2Polygon(results.features[i_j_od[1]-1].geometry,temp_color[temp_flow_count],map);
			}
		  temp_flow_count=temp_flow_count+1;
		  if (i<od_in_line.length-1){
		    i=i+1;
		    i_j_od=od_in_line[i].split(",");
		  }
		  else{
		    break;
		  }
		}
		
		
		// for the rm data
		var i=Number(first_index_rm[county_id-1]);
		var i_j_od=od_in_line_rm[i].split(",");
		var temp_flow=new Array();
		var temp_flow_count=0;
		var max_flow=0;
		while (i_j_od[0]==county_id){
		  temp_flow[temp_flow_count]=Math.log(Number(i_j_od[2]));
		  if (Math.log(Number(i_j_od[2]))>max_flow&&i_j_od[1]!=county_id){
		    max_flow=Math.log(Number(i_j_od[2]));
		  }
		  if (i_j_od[1]==county_id){
		    temp_flow[temp_flow_count]=-1;
		  }
		  temp_flow_count=temp_flow_count+1;
		  if (i<od_in_line_rm.length-1){
		    i=i+1;
		    i_j_od=od_in_line_rm[i].split(",");
		  }
		  else{
		    break;
		  }
		}
		var temp_color=new Array();
		for (var i=0;i<temp_flow.length;i++){
		  if (temp_flow[i]>=0){
		    temp_color[i]=Math.floor(temp_flow[i]*7/max_flow);
		  }
		  else{
		    temp_color[i]=8;
		  }
		}
		var i=Number(first_index_rm[county_id-1]);
		var i_j_od=od_in_line_rm[i].split(",");
		temp_flow_count=0;
		while (i_j_od[0]==county_id){
		  //alert(i);
		  var coords = String(results.features[i_j_od[1]-1].geometry.coordinates);
		  //alert(coords);
		  if(results.features[i_j_od[1]-1].geometry.type=="Polygon"){
			var processedData = coords.split(",");
			//alert(processedData.slice(1,3));
			makePolygon(processedData,temp_color[temp_flow_count],map2);
		  }
		  else{
		  //alert(results.features[i].geometry.coordinates.length);
			  MultiPolygon2Polygon(results.features[i_j_od[1]-1].geometry,temp_color[temp_flow_count],map2);
			}
		  temp_flow_count=temp_flow_count+1;
		  if (i<od_in_line_rm.length-1){
		    i=i+1;
		    i_j_od=od_in_line_rm[i].split(",");
		  }
		  else{
		    break;
		  }
		}
	  }
	  
	  
	  function displayData()
	  {	  
	    while(markerArrays[0])
		{
		  markerArrays.pop().setMap(null);
		}
		  $.ajax({
		  	type: "GET",
		  	url: "tl_2010_us_county10.json",
		  	dataType: "json",
		  	success: function (data){
		  		var d=data;
		  		processAjaxResult(d);
		  	}
		  });
	  }